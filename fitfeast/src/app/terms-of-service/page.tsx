import FitFeastLayout from '../components/layout/FitFeastLayout';

export default function TermsOfServicePage() {
  return (
    <FitFeastLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-16 px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-10 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold text-emerald-700 mb-4 text-center">Terms of Service</h1>
          <p className="text-gray-700 mb-4">Please read these terms and conditions carefully before using FitFeast.</p>
          <p className="text-gray-600">[Insert your terms of service details here.]</p>
        </div>
      </div>
    </FitFeastLayout>
  );
} 