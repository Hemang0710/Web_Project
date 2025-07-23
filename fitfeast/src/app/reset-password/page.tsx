'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import ResetPasswordForm from './ResetPasswordForm';

function ResetPasswordFormWrapper() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const email = searchParams?.get('email') || '';
  
  return <ResetPasswordForm token={token} email={email} />;
}

export default function ResetPasswordPage() {
  return (
    <FitFeastLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <div className="text-2xl font-bold text-gray-700 mb-2">Loading...</div>
            <p className="text-gray-500">Preparing your password reset</p>
          </div>
        </div>
      }>
        <ResetPasswordFormWrapper />
      </Suspense>
    </FitFeastLayout>
  );
}