"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ShareRecipePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  const handleIngredientChange = (idx: number, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => (i === idx ? value : ing)));
  };
  const handleStepChange = (idx: number, value: string) => {
    setSteps((prev) => prev.map((step, i) => (i === idx ? value : step)));
  };
  const addIngredient = () => setIngredients([...ingredients, ""]);
  const addStep = () => setSteps([...steps, ""]);
  const removeIngredient = (idx: number) => setIngredients(ingredients.filter((_, i) => i !== idx));
  const removeStep = (idx: number) => setSteps(steps.filter((_, i) => i !== idx));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!session?.user) throw new Error("You must be logged in to share a recipe");
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("ingredients", JSON.stringify(ingredients.filter(Boolean)));
      formData.append("steps", JSON.stringify(steps.filter(Boolean)));
      if (photo) formData.append("photo", photo);
      formData.append("userId", session.user.email || "");
      formData.append("userName", session.user.name || session.user.email || "");
      const res = await fetch("/api/community/recipes", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to share recipe");
      setSuccess("Recipe shared successfully!");
      setTimeout(() => router.push("/community"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to share recipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-emerald-700">Share a Recipe</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow p-8">
        <div>
          <label className="block font-medium mb-2">Title</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-2">Description</label>
          <textarea className="w-full border rounded px-3 py-2" value={description} onChange={e => setDescription(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-2">Ingredients</label>
          {ingredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input type="text" className="flex-1 border rounded px-3 py-2" value={ing} onChange={e => handleIngredientChange(idx, e.target.value)} required />
              {ingredients.length > 1 && <button type="button" onClick={() => removeIngredient(idx)} className="text-red-500">Remove</button>}
            </div>
          ))}
          <button type="button" onClick={addIngredient} className="text-emerald-600 mt-1">+ Add Ingredient</button>
        </div>
        <div>
          <label className="block font-medium mb-2">Steps</label>
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input type="text" className="flex-1 border rounded px-3 py-2" value={step} onChange={e => handleStepChange(idx, e.target.value)} required />
              {steps.length > 1 && <button type="button" onClick={() => removeStep(idx)} className="text-red-500">Remove</button>}
            </div>
          ))}
          <button type="button" onClick={addStep} className="text-emerald-600 mt-1">+ Add Step</button>
        </div>
        <div>
          <label className="block font-medium mb-2">Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>
        {error && <div className="text-red-500">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded" disabled={loading}>{loading ? "Sharing..." : "Share Recipe"}</button>
      </form>
    </div>
  );
} 