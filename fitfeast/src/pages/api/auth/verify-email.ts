import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { token, email } = req.query;
  if (!token || !email) {
    return res.status(400).json({ message: 'Invalid verification link' });
  }
  await dbConnect();
  const user = await User.findOne({ email, verificationToken: token });
  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification link' });
  }
  if (user.isVerified) {
    return res.status(200).json({ message: 'Email already verified' });
  }
  if (user.verificationTokenExpires < new Date()) {
    return res.status(400).json({ message: 'Verification link expired' });
  }
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  return res.status(200).json({ message: 'Email verified successfully' });
} 