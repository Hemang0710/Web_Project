import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { sendMail } from '@/app/lib/email';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Name cannot be empty or just spaces' });
  }
  const trimmedName = name.trim();
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  await dbConnect();
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ message: 'User already exists' });
  }
  // const hashed = await bcrypt.hash(password, 10); // Remove manual hashing
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
  const user = new User({email: email.toLowerCase(), password, name: trimmedName, verificationToken, verificationTokenExpires });
  await user.save();
  // Send verification email
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  await sendMail({
    to: email,
    subject: 'Verify your email for FitFeast',
    html: `<h2>Welcome to FitFeast!</h2><p>Click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link will expire in 24 hours.</p>`
  });
  return res.status(201).json({ message: 'User created. Please check your email to verify your account.' });
} 