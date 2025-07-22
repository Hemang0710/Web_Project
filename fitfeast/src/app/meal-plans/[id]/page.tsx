"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import FitFeastLayout from "../../components/layout/FitFeastLayout";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";

interface Meal {
  name: string;
  ingredients: string[];
  calories: number;
  cost: number;
}

interface DayPlan {
  day: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snacks?: Meal[];
}

interface MealPlan {
  _id: string;
  title: string;
  description?: string;
  totalCost: number;
  totalCalories: number;
  startDate: string;
  endDate: string;
  meals: DayPlan[];
}

export default function MealPlanDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params && Array.isArray(params.id) ? params.id[0] : params?.id;
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const fetchMealPlan = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/savedmealplans/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch meal plan");
        const data = await res.json();
        setMealPlan(data);
      } catch (err) {
        setError("Could not load meal plan details.");
      } finally {
        setLoading(false);
      }
    };
    fetchMealPlan();
  }, [id]);

  if (loading) {
    return (
      <FitFeastLayout>
        <div className="max-w-3xl mx-auto py-12 text-center text-gray-500">Loading...</div>
      </FitFeastLayout>
    );
  }

  if (error || !mealPlan) {
    return (
      <FitFeastLayout>
        <div className="max-w-3xl mx-auto py-12 text-center text-red-500">{error || "Meal plan not found."}</div>
      </FitFeastLayout>
    );
  }

  const handleSaveToHealthRecords = async (meal: Meal, day: string, mealType: string) => {
    try {
      const res = await fetch("/api/health-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          mealType,
          name: meal.name,
          calories: meal.calories,
          ingredients: meal.ingredients,
          cost: meal.cost,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save to health records");
      toast.success("Saved to Health Records!");
    } catch (err) {
      toast.error("Could not save to Health Records.");
    }
  };

  const handleDeleteRecipe = async (dayIdx: number, mealType: keyof DayPlan, snackIdx?: number) => {
    if (!mealPlan) return;
    const updatedMeals = mealPlan.meals.map((day, idx) => {
      if (idx !== dayIdx) return day;
      if (mealType === "snacks" && Array.isArray(day.snacks)) {
        return { ...day, snacks: day.snacks.filter((_, i) => i !== snackIdx) };
      }
      const newDay = { ...day };
      delete newDay[mealType];
      return newDay;
    });
    try {
      const res = await fetch(`/api/savedmealplans/${mealPlan._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mealPlan, meals: updatedMeals }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete recipe");
      setMealPlan({ ...mealPlan, meals: updatedMeals });
      toast.success("Recipe deleted from plan!");
    } catch (err) {
      toast.error("Could not delete recipe.");
    }
  };

  return (
    <FitFeastLayout>
      <Toaster position="top-right" />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <button
          className="mb-6 text-emerald-700 hover:underline"
          onClick={() => router.back()}
        >
          ← Back to My Plans
        </button>
        <h1 className="text-3xl font-bold text-emerald-800 mb-2">{mealPlan.title}</h1>
        <p className="text-gray-600 mb-4">{mealPlan.description}</p>
        <div className="flex flex-wrap gap-6 mb-6">
          <div>
            <div className="text-xs text-gray-400">Total Cost</div>
            <div className="font-bold text-emerald-700">${mealPlan.totalCost?.toFixed(2) ?? "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Calories</div>
            <div className="font-bold text-emerald-700">{mealPlan.totalCalories?.toLocaleString() ?? "N/A"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Date Range</div>
            <div className="font-bold text-emerald-700">
              {mealPlan.startDate ? new Date(mealPlan.startDate).toLocaleDateString() : "-"} - {mealPlan.endDate ? new Date(mealPlan.endDate).toLocaleDateString() : "-"}
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-emerald-700 mb-4">Meals</h2>
        {Array.isArray(mealPlan.meals) && mealPlan.meals.length > 0 ? (
          <div className="space-y-6">
            {mealPlan.meals.map((day, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur rounded-2xl shadow-lg p-6 border border-emerald-100">
                <h3 className="text-lg font-bold text-emerald-800 mb-4">{day.day || `Day ${idx + 1}`}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {(['breakfast', 'lunch', 'dinner', 'snacks'] as (keyof DayPlan)[]).map((mealType) => {
                    const meal = day[mealType];
                    if (!meal || (Array.isArray(meal) && meal.length === 0)) return null;
                    if (Array.isArray(meal)) {
                      // For snacks (array)
                      return meal.map((snack, snackIdx) => (
                        <div key={snackIdx} className="glass-card relative flex flex-col items-start p-4 rounded-xl shadow border border-emerald-200 bg-gradient-to-br from-white/80 to-emerald-50 hover:shadow-xl transition">
                          {/* Optionally add an image here if available */}
                          <div className="font-semibold capitalize text-emerald-700 mb-1">Snack</div>
                          <div className="text-lg font-bold text-emerald-900 mb-1">{snack.name}</div>
                          <div className="text-xs text-gray-500 mb-1">Calories: {snack.calories}, Cost: ${snack.cost?.toFixed(2)}</div>
                          <div className="text-xs text-gray-400 mb-2">Ingredients: {Array.isArray(snack.ingredients) ? snack.ingredients.join(", ") : "-"}</div>
                          <div className="flex gap-2 mt-auto">
                            <button
                              className="px-3 py-1 rounded bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition"
                              onClick={() => handleSaveToHealthRecords(snack, day.day, "snack")}
                            >
                              Save
                            </button>
                            <button
                              className="px-3 py-1 rounded bg-red-400 text-white text-xs font-semibold hover:bg-red-500 transition"
                              onClick={() => handleDeleteRecipe(idx, "snacks", snackIdx)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ));
                    }
                    return (
                      <div key={mealType} className="glass-card relative flex flex-col items-start p-4 rounded-xl shadow border border-emerald-200 bg-gradient-to-br from-white/80 to-emerald-50 hover:shadow-xl transition">
                        {/* Optionally add an image here if available */}
                        <div className="font-semibold capitalize text-emerald-700 mb-1">{mealType}</div>
                        <div className="text-lg font-bold text-emerald-900 mb-1">{(meal as Meal).name}</div>
                        <div className="text-xs text-gray-500 mb-1">Calories: {(meal as Meal).calories}, Cost: ${(meal as Meal).cost?.toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mb-2">Ingredients: {Array.isArray((meal as Meal).ingredients) ? (meal as Meal).ingredients.join(", ") : "-"}</div>
                        <div className="flex gap-2 mt-auto">
                          <button
                            className="px-3 py-1 rounded bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition"
                            onClick={() => handleSaveToHealthRecords(meal as Meal, day.day, mealType)}
                          >
                            Save
                          </button>
                          <button
                            className="px-3 py-1 rounded bg-red-400 text-white text-xs font-semibold hover:bg-red-500 transition"
                            onClick={() => handleDeleteRecipe(idx, mealType)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No meals found for this plan.</div>
        )}
      </div>
    </FitFeastLayout>
  );
} 