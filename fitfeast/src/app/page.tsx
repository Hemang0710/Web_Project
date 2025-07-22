"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "./components/layout/PageLayout";
import { useSession } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignIn = () => {
    router.push("/signin");
  };

  const handleGetStarted = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/signin");
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="relative z-10 max-w-screen-2xl mx-auto px-4 py-20 lg:py-32 sm:px-8 lg:px-12">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in">
                <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                AI-Powered Nutrition Platform
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold mb-8 bg-gradient-to-r from-emerald-700 via-emerald-400 to-teal-400 bg-clip-text text-transparent leading-tight animate-fade-in">
                Transform Your
                <span className="block text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">
                  Health Journey
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up">
                Personalized meal plans that adapt to your budget and lifestyle. 
                Track progress, build healthy habits, and achieve your fitness goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up">
                <button 
                  onClick={handleGetStarted}
                  className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/25"
                >
                  <span className="relative z-10 flex items-center">
                    <span className="mr-2">🚀</span>
                    Start Your Journey
                  </span>
                </button>
                <button 
                  onClick={handleSignIn}
                  className="px-8 py-4 border-2 border-emerald-500/30 text-emerald-500 rounded-2xl font-semibold text-lg hover:bg-emerald-100 transition-all duration-300 backdrop-blur-sm"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-32">
          <div className="max-w-screen-2xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-emerald-700 mb-6 animate-fade-in">
                Why Choose <span className="text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">FitFeast</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up">
                Cutting-edge technology meets personalized nutrition science
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-in-up">
              {/* Feature Card 1 */}
              <div className="group relative bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 hover:border-emerald-400 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-4">Smart Budget Planning</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI-powered meal plans that adapt to your actual budget and local food prices, not just ideal nutrition goals.
                </p>
              </div>
              {/* Feature Card 2 */}
              <div className="group relative bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 hover:border-emerald-400 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-4">Advanced Analytics</h3>
                <p className="text-gray-600 leading-relaxed">
                  Comprehensive BMI tracking, nutrition analytics, and progress visualization to monitor your health journey.
                </p>
              </div>
              {/* Feature Card 3 */}
              <div className="group relative bg-white rounded-2xl shadow-lg border border-emerald-100 p-8 hover:border-emerald-400 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🌍</span>
                </div>
                <h3 className="text-2xl font-bold text-emerald-700 mb-4">Local Intelligence</h3>
                <p className="text-gray-600 leading-relaxed">
                  Recipes adapted to your local cuisine and regional food availability for authentic, accessible meals.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-32">
          <div className="max-w-screen-2xl mx-auto px-4 text-center sm:px-8 lg:px-12">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-emerald-700 mb-8 animate-fade-in">
                Ready to Transform Your <span className="text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">Health Journey</span>?
              </h2>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto animate-fade-in-up">
                Join thousands of users who have already achieved their fitness goals with FitFeast
              </p>
              <button 
                onClick={handleGetStarted}
                className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-3xl font-bold text-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/25"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="mr-3">🏆</span>
                  Get Started Today
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
} 