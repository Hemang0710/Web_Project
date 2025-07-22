"use client";

import React, { useState, useEffect } from 'react';
import FitFeastLayout from '../components/layout/FitFeastLayout';
import MealPlansManager from '../components/meal-plans/MealPlansManager';
import MealSuggestionGrid from '../components/meal-suggestions/MealSuggestionGrid';
import GroceryListView from '../components/grocery-list/GroceryListView';

export default function MealPlansPage() {
  const [activeTab, setActiveTab] = useState('meal-suggestions');

  const tabs = [
    { id: 'meal-suggestions', name: 'AI Suggestions', icon: '🤖', description: 'Get personalized meal recommendations' },
    { id: 'meal-plans', name: 'My Plans', icon: '📋', description: 'Manage your saved meal plans' },
    { id: 'recipes', name: 'Recipe Library', icon: '🍽️', description: 'Browse our recipe collection' },
    { id: 'grocery-list', name: 'Grocery List', icon: '🛒', description: 'Organize your shopping list' },
  ];

  // Listen for the custom event to switch to grocery list tab
  useEffect(() => {
    const handleSwitchToGroceryList = (event: CustomEvent) => {
      setActiveTab('grocery-list');
    };

    const handleSwitchToMealSuggestions = (event: CustomEvent) => {
      setActiveTab('meal-suggestions');
    };

    window.addEventListener('switchToGroceryList', handleSwitchToGroceryList as EventListener);
    window.addEventListener('switchToMealSuggestions', handleSwitchToMealSuggestions as EventListener);
    
    return () => {
      window.removeEventListener('switchToGroceryList', handleSwitchToGroceryList as EventListener);
      window.removeEventListener('switchToMealSuggestions', handleSwitchToMealSuggestions as EventListener);
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'meal-plans':
        return <MealPlansManager />;
      case 'meal-suggestions':
        return <MealSuggestionGrid />;
      case 'recipes':
        return (
          <div className="p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🍽️</div>
              <h2 className="text-3xl font-bold text-emerald-700 mb-4">Recipe Library</h2>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Discover thousands of delicious, budget-friendly recipes from around the world. 
                Filter by cuisine, diet type, cooking time, and more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="text-3xl mb-3">🌍</div>
                  <h3 className="font-semibold text-lg mb-2">Global Cuisines</h3>
                  <p className="text-gray-600 text-sm">Explore recipes from Italian, Mexican, Indian, Chinese, and more</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="text-3xl mb-3">🥗</div>
                  <h3 className="font-semibold text-lg mb-2">Diet Options</h3>
                  <p className="text-gray-600 text-sm">Vegetarian, vegan, low-carb, high-protein, and balanced meals</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="text-3xl mb-3">⏱️</div>
                  <h3 className="font-semibold text-lg mb-2">Quick & Easy</h3>
                  <p className="text-gray-600 text-sm">Find recipes that fit your schedule and cooking skills</p>
                </div>
              </div>
              <a 
                href="/recipes" 
                className="inline-block bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
              >
                Browse Recipe Library
              </a>
            </div>
          </div>
        );
      case 'grocery-list':
        return <GroceryListView />;
      default:
        return <MealSuggestionGrid />;
    }
  };

  return (
    <FitFeastLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-screen-2xl mx-auto py-10 px-4 sm:px-8 lg:px-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-emerald-700 mb-4 tracking-tight animate-fade-in">
              Meal Planning Hub
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto animate-fade-in-up">
              Plan, discover, and organize your meals with AI-powered suggestions and smart grocery management
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-10">
            {/* Desktop Tabs */}
            <div className="hidden md:flex justify-center gap-4 mb-6">
              {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center space-y-2 px-8 py-5 rounded-2xl font-medium transition-all duration-300 min-w-[160px] shadow-sm border-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 transform scale-105 border-emerald-400'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-emerald-200 hover:shadow-md'}
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="font-semibold">{tab.name}</span>
                  <span className="text-xs opacity-80">{tab.description}</span>
                </button>
              ))}
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium"
                aria-label="Select meal planner tab"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.icon} {tab.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up">
            {renderTabContent()}
          </div>

          {/* Quick Stats */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex flex-col items-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-lg text-gray-800 mb-1">Smart Planning</h3>
              <p className="text-gray-600 text-sm text-center">AI-powered meal suggestions based on your preferences and budget</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex flex-col items-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-lg text-gray-800 mb-1">Budget Friendly</h3>
              <p className="text-gray-600 text-sm text-center">Cost-effective meal plans that fit your daily budget</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 flex flex-col items-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold text-lg text-gray-800 mb-1">Nutrition Focused</h3>
              <p className="text-gray-600 text-sm text-center">Balanced meals with detailed nutrition information</p>
            </div>
          </div>
        </div>
      </div>
    </FitFeastLayout>
  );
}
