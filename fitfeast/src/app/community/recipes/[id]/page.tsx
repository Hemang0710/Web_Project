"use client";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface Recipe {
  _id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  photoUrl?: string;
  ingredients: string[];
  steps: string[];
  likes?: string[];
  comments?: Comment[];
  [key: string]: unknown;
}

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: session } = useSession();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    title: "",
    description: "",
    ingredients: [""],
    steps: [""],
    photoUrl: ""
  });

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`/api/community/recipes?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch recipe");
        const data = await res.json();
        let found = data;
        if (Array.isArray(data)) found = data.find((r: Recipe) => r._id === id) || null;
        setRecipe(found);
        if (found && session?.user && found.userId === session.user.email) {
          setEditFields({
            title: found.title,
            description: found.description,
            ingredients: found.ingredients,
            steps: found.steps,
            photoUrl: found.photoUrl || ""
          });
        }
      } catch (err) {
        setError((err instanceof Error ? err.message : 'Failed to fetch recipe'));
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id, session?.user]);

  const handleLike = async () => {
    if (!session?.user || !recipe) return;
    try {
      const res = await fetch("/api/community/recipes/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe._id, userId: session.user?.email as string })
      });
      if (!res.ok) throw new Error("Failed to like recipe");
      const data = await res.json();
      setRecipe(r => r ? {
        ...r,
        likes: (data.liked
          ? [...(r.likes || []), session.user?.email as string]
          : (r.likes || []).filter((id: string) => id !== session.user?.email))
          .filter((id): id is string => typeof id === 'string' && !!id)
      } : r);
    } catch (err) {
      // Optionally show error
    }
  };

  const handleAddComment = async () => {
    if (!session?.user || !recipe || !commentText.trim()) return;
    setCommentLoading(true);
    try {
      const res = await fetch("/api/community/recipes/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe._id, userId: session.user.email, userName: session.user.name, text: commentText })
      });
      if (!res.ok) throw new Error("Failed to add comment");
      const data = await res.json();
      setRecipe(r => r ? { ...r, comments: data.comments } : r);
      setCommentText("");
    } catch (err) {
      // Optionally show error
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user || !recipe) return;
    try {
      const res = await fetch("/api/community/recipes/comment-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe._id, commentId, userId: session.user.email })
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      const data = await res.json();
      setRecipe(r => r ? { ...r, comments: data.comments } : r);
    } catch (err) {
      // Optionally show error
    }
  };

  const handleEditChange = (field: string, value: any) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleEditIngredient = (idx: number, value: string) => {
    setEditFields(prev => ({ ...prev, ingredients: prev.ingredients.map((ing, i) => i === idx ? value : ing) }));
  };
  const handleEditStep = (idx: number, value: string) => {
    setEditFields(prev => ({ ...prev, steps: prev.steps.map((step, i) => i === idx ? value : step) }));
  };
  const addEditIngredient = () => setEditFields(prev => ({ ...prev, ingredients: [...prev.ingredients, ""] }));
  const addEditStep = () => setEditFields(prev => ({ ...prev, steps: [...prev.steps, ""] }));
  const removeEditIngredient = (idx: number) => setEditFields(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== idx) }));
  const removeEditStep = (idx: number) => setEditFields(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== idx) }));

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !recipe) return;
    try {
      const res = await fetch("/api/community/recipes/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: recipe._id,
          userId: session.user.email,
          title: editFields.title,
          description: editFields.description,
          ingredients: editFields.ingredients,
          steps: editFields.steps,
          photoUrl: editFields.photoUrl
        })
      });
      if (!res.ok) throw new Error("Failed to update recipe");
      const data = await res.json();
      setRecipe(data);
      setEditing(false);
    } catch (err) {
      // Optionally show error
    }
  };

  const handleDelete = async () => {
    if (!session?.user || !recipe) return;
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    try {
      const res = await fetch("/api/community/recipes/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe._id, userId: session.user.email })
      });
      if (!res.ok) throw new Error("Failed to delete recipe");
      // router.push("/community"); // This line was removed as per the new_code, as the router object is no longer imported.
    } catch (err) {
      // Optionally show error
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto py-10 px-4">Loading...</div>;
  if (error || !recipe) return <div className="max-w-2xl mx-auto py-10 px-4 text-red-500">{error || "Recipe not found"}</div>;

  const liked = session?.user && recipe.likes && recipe.likes.includes(session.user?.email as string);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4 text-emerald-700">{recipe.title}</h1>
      <div className="mb-2 text-gray-600">By {recipe.userName}</div>
      {recipe.photoUrl && (
        <img src={recipe.photoUrl} alt={recipe.title} className="w-full h-64 object-cover rounded-xl mb-6" />
      )}
      <div className="mb-4 text-lg text-gray-800">{recipe.description}</div>
      <div className="mb-4">
        <h2 className="font-semibold text-emerald-700 mb-2">Ingredients</h2>
        <ul className="list-disc list-inside space-y-1">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx}>{ing}</li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold text-emerald-700 mb-2">Steps</h2>
        <ol className="list-decimal list-inside space-y-1">
          {recipe.steps.map((step, idx) => (
            <li key={idx}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="flex items-center gap-4 mt-6">
        <button
          className={`flex items-center gap-1 text-lg ${liked ? 'text-emerald-600' : 'text-gray-500'}`}
          onClick={handleLike}
          disabled={!session?.user}
        >
          <span>{liked ? '💚' : '🤍'}</span>
          <span>{recipe.likes ? recipe.likes.length : 0}</span>
        </button>
        {session?.user && recipe.userId === (session.user?.email as string) && !editing && (
          <>
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setEditing(true)}>Edit</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDelete}>Delete</button>
          </>
        )}
      </div>
      {editing && (
        <form onSubmit={handleUpdate} className="bg-slate-100 rounded-xl p-6 mt-6 space-y-4">
          <div>
            <label className="block font-medium mb-2">Title</label>
            <input type="text" className="w-full border rounded px-3 py-2" value={editFields.title} onChange={e => handleEditChange("title", e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-2">Description</label>
            <textarea className="w-full border rounded px-3 py-2" value={editFields.description} onChange={e => handleEditChange("description", e.target.value)} required />
          </div>
          <div>
            <label className="block font-medium mb-2">Ingredients</label>
            {editFields.ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" className="flex-1 border rounded px-3 py-2" value={ing} onChange={e => handleEditIngredient(idx, e.target.value)} required />
                {editFields.ingredients.length > 1 && <button type="button" onClick={() => removeEditIngredient(idx)} className="text-red-500">Remove</button>}
              </div>
            ))}
            <button type="button" onClick={addEditIngredient} className="text-emerald-600 mt-1">+ Add Ingredient</button>
          </div>
          <div>
            <label className="block font-medium mb-2">Steps</label>
            {editFields.steps.map((step, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input type="text" className="flex-1 border rounded px-3 py-2" value={step} onChange={e => handleEditStep(idx, e.target.value)} required />
                {editFields.steps.length > 1 && <button type="button" onClick={() => removeEditStep(idx)} className="text-red-500">Remove</button>}
              </div>
            ))}
            <button type="button" onClick={addEditStep} className="text-emerald-600 mt-1">+ Add Step</button>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded">Save</button>
            <button type="button" className="bg-gray-400 text-white px-6 py-2 rounded" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}
      {/* Comments Section */}
      <div className="mt-10">
        <h2 className="font-semibold text-emerald-700 mb-2">Comments</h2>
        {session?.user && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="flex-1 border rounded px-3 py-2"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={commentLoading}
            />
            <button
              className="bg-emerald-600 text-white px-4 py-2 rounded"
              onClick={handleAddComment}
              disabled={commentLoading || !commentText.trim()}
            >
              {commentLoading ? "Adding..." : "Add"}
            </button>
          </div>
        )}
        <div className="space-y-4">
          {recipe.comments && recipe.comments.length > 0 ? (
            recipe.comments.map(comment => (
              <div key={comment._id} className="bg-slate-100 rounded p-3 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-emerald-700">{comment.userName}</div>
                  <div className="text-gray-700 text-sm mb-1">{comment.text}</div>
                  <div className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</div>
                </div>
                {session?.user && comment.userId === (session.user?.email as string) && (
                  <button
                    className="text-red-500 text-xs ml-2"
                    onClick={() => handleDeleteComment(comment._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-400">No comments yet.</div>
          )}
        </div>
      </div>
    </div>
  );
} 