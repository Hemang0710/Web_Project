import FitFeastLayout from '../components/layout/FitFeastLayout';

export default function HelpCenterPage() {
  return (
    <FitFeastLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-16 px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-10 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold text-emerald-700 mb-4 text-center">Help Center</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">How can we help you? Browse our FAQs or reach out for support.</p>
          <ul className="space-y-4">
            <li className="bg-emerald-50 rounded-xl p-4 text-emerald-800 font-semibold">How do I reset my password?</li>
            <li className="bg-emerald-50 rounded-xl p-4 text-emerald-800 font-semibold">How do I update my profile?</li>
            <li className="bg-emerald-50 rounded-xl p-4 text-emerald-800 font-semibold">How do I contact support?</li>
            <li className="bg-emerald-50 rounded-xl p-4 text-emerald-800 font-semibold">How do I delete my account?</li>
          </ul>
        </div>
      </div>
    </FitFeastLayout>
  );
} 