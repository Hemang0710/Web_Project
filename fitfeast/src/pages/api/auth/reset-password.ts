import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email, token, password } = req.body;
  if (!email || !token || !password) {
    return res.status(400).json({ message: 'Invalid request' });
  }
  await dbConnect();
  const user = await User.findOne({ email, resetPasswordToken: token });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset link' });
  }
  if (user.resetPasswordTokenExpires < new Date()) {
    return res.status(400).json({ message: 'Reset link expired' });
  }
  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpires = undefined;
  await user.save();
  return res.status(200).json({ message: 'Password reset successfully' });
} 