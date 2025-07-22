import FitFeastLayout from '../components/layout/FitFeastLayout';

export default function PrivacyPolicyPage() {
  return (
    <FitFeastLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-16 px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-10 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold text-emerald-700 mb-4 text-center">Privacy Policy</h1>
          <p className="text-gray-700 mb-4">Your privacy is important to us. This page explains how we collect, use, and protect your information.</p>
          <p className="text-gray-600">[]</p>
        </div>
      </div>
    </FitFeastLayout>
  );
} 