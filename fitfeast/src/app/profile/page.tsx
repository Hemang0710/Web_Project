import React from 'react';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import ProfileForm from '../components/profile/ProfileForm';

export default function ProfilePage() {
  return (
    <FitFeastLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-10 px-4 sm:px-8 lg:px-12">
        <div className="max-w-xl w-full mx-auto bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-emerald-700 mb-2 tracking-tight">Your Profile</h1>
            <p className="text-gray-600 text-base">Update your personal information and preferences to get the best FitFeast experience.</p>
          </div>
          <ProfileForm />
        </div>
      </div>
    </FitFeastLayout>
  );
} 