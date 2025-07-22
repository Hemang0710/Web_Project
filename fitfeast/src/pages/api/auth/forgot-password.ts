import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { sendMail } from '@/app/lib/email';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  await dbConnect();
  const user = await User.findOne({ email });
  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpires = resetTokenExpires;
    await user.save();
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await sendMail({
      to: email,
      subject: 'Reset your password for FitFeast',
      html: `<h2>Reset your password</h2><p>Click the link below to set a new password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in 1 hour.</p>`
    });
  }
  // Always return success for security
  return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
} 