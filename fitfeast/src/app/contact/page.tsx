import FitFeastLayout from '../components/layout/FitFeastLayout';

export default function ContactPage() {
  return (
    <FitFeastLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-16 px-4">
        <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-emerald-100 p-10 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold text-emerald-700 mb-4 text-center">Contact Us</h1>
          <p className="text-lg text-gray-600 mb-8 text-center">Have a question or need support? Fill out the form below and our team will get back to you soon.</p>
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Name</label>
              <input type="text" className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300" placeholder="Your Name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Email</label>
              <input type="email" className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300" placeholder="you@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-2">Message</label>
              <textarea className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-2xl text-black placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all duration-300" rows={4} placeholder="How can we help you?" required />
            </div>
            <button type="submit" className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg shadow-emerald-500/25">Send Message</button>
          </form>
        </div>
      </div>
    </FitFeastLayout>
  );
} 