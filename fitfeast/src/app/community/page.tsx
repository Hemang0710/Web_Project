'use client';

import FitFeastLayout from '../components/layout/FitFeastLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

interface Comment {
  _id?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt?: string;
}

interface CommunityRecipe {
  _id: string;
  userId: string | { toString(): string }; // allow for both string and object
  userName: string;
  title: string;
  description: string;
  photoUrl?: string;
  likes?: string[];
  comments?: Comment[];
}

export default function CommunityPage() {
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [challenges, setChallenges] = useState<any[]>([]);
  const [joining, setJoining] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [postText, setPostText] = useState("");
  const [joinError, setJoinError] = useState("");
  const [copiedRecipeId, setCopiedRecipeId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [commentLoading, setCommentLoading] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const userId = user?._id || user?.id; // Support both _id and id

  useEffect(() => {
    console.log("Auth user in CommunityPage:", user);
  }, [user]);

  // Share handler: copy link to clipboard
  const handleShare = async (recipeId: string) => {
    const url = `${window.location.origin}/community/recipes/${recipeId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedRecipeId(recipeId);
      setTimeout(() => setCopiedRecipeId(null), 1500);
    } catch {
      alert('Failed to copy link');
    }
  };

  // Fetch recipes and challenges on mount
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch("/api/community/recipes");
        if (!res.ok) throw new Error("Failed to fetch recipes");
        const data = await res.json();
        setRecipes(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch recipes");
      } finally {
        setLoading(false);
      }
    };
    fetchRecipes();

    const fetchChallenges = async () => {
      try {
        const res = await fetch("/api/community/challenges");
        if (!res.ok) throw new Error("Failed to fetch challenges");
        const data = await res.json();
        // If no challenges, use mock data
        if (Array.isArray(data) && data.length === 0) {
          setChallenges([
            {
              _id: "mock1",
              title: "Eat 5 Veggies a Day",
              description: "Log at least 5 servings of vegetables every day for a week.",
              isActive: true,
              participants: [],
              progress: 0,
            },
            {
              _id: "mock2",
              title: "Budget Meal Master",
              description: "Stay under $40 for your weekly meal plan.",
              isActive: true,
              participants: [],
              progress: 0,
            },
            {
              _id: "mock3",
              title: "10,000 Steps Challenge",
              description: "Walk at least 10,000 steps every day for 10 days.",
              isActive: true,
              participants: [],
              progress: 0,
            },
          ]);
        } else {
          setChallenges(data);
        }
      } catch {
        // On error, also use mock data
        setChallenges([
          {
            _id: "mock1",
            title: "Eat 5 Veggies a Day",
            description: "Log at least 5 servings of vegetables every day for a week.",
            isActive: true,
            participants: [],
            progress: 0,
          },
          {
            _id: "mock2",
            title: "Budget Meal Master",
            description: "Stay under $40 for your weekly meal plan.",
            isActive: true,
            participants: [],
            progress: 0,
          },
          {
            _id: "mock3",
            title: "10,000 Steps Challenge",
            description: "Walk at least 10,000 steps every day for 10 days.",
            isActive: true,
            participants: [],
            progress: 0,
          },
        ]);
      }
    };
    fetchChallenges();
  }, []);

  // Like handler
  const handleLike = async (recipeId: string) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/community/recipes/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, userId }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error("Failed to like recipe");
      const data = await res.json();
      setRecipes(recipes => recipes.map(r => r._id === recipeId ? {
        ...r,
        likes: data.liked
          ? [...(r.likes || []), userId]
          : (r.likes || []).filter((id: string) => id !== userId)
      } : r));
    } catch (err) {
      // Optionally show error
    }
  };

  // Split challenges into available and active for the current user
  const availableChallenges = user
    ? challenges.filter(
        (challenge) =>
          !challenge.participants ||
          !challenge.participants.some((p: any) => p.userId === userId)
      )
    : challenges;
  const activeChallenges = user
    ? challenges.filter(
        (challenge) =>
          challenge.participants &&
          challenge.participants.some((p: any) => p.userId === userId)
      )
    : [];

  // Update UI after joining a challenge
  const handleJoinChallenge = async (challengeId: string) => {
    if (!userId) return;
    setJoining(challengeId);
    setJoinError("");
    try {
      let realChallengeId = challengeId;
      // If this is a mock challenge, create it in the backend first
      const challenge = challenges.find((c) => c._id === challengeId);
      if (challenge && challengeId.startsWith('mock')) {
        const res = await fetch('/api/community/challenges/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: challenge.title,
            description: challenge.description,
            type: 'community',
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            goal: challenge.title,
            maxParticipants: 100,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create challenge');
        }
        const created = await res.json();
        realChallengeId = created._id || created.challenge?._id;
        setChallenges((prev) =>
          prev.map((c) =>
            c._id === challengeId ? { ...created, participants: [] } : c
          )
        );
      }
      // Now join the challenge (real or just created)
      const joinRes = await fetch('/api/community/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: realChallengeId }),
        credentials: 'include', // Ensure session cookie is sent
      });
      if (!joinRes.ok) {
        const err = await joinRes.json();
        throw new Error(err.error || 'Failed to join challenge');
      }
      // Refetch challenges from backend to sync state
      const refetch = await fetch('/api/community/challenges');
      if (refetch.ok) {
        const data = await refetch.json();
        setChallenges(data);
      }
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join challenge');
    } finally {
      setJoining(null);
    }
  };

  // Post to community feed with photo
  const handlePost = async () => {
    if (!user || !user.email) {
      alert("You must be logged in to post.");
      return;
    }
    const formData = new FormData();
    formData.append("userId", user.email);
    formData.append("userName", user.name);
    formData.append("title", "Community Post");
    formData.append("description", postText);
    if (photo) formData.append("photo", photo);
    try {
      const res = await fetch("/api/community/recipes", {
        method: "POST",
        body: formData,
        credentials: 'include', // Ensure session cookie is sent
      });
      if (!res.ok) throw new Error("Failed to post");
      setPostText("");
      setPhoto(null);
      // Immediately fetch and update recipes after posting
      const recipesRes = await fetch("/api/community/recipes");
      if (recipesRes.ok) {
        const data = await recipesRes.json();
        setRecipes(data);
      }
    } catch (err) {
      // Optionally show error
    }
  };

  // Add comment handler
  const handleAddComment = async (recipeId: string) => {
    if (!userId) return;
    const text = commentInputs[recipeId]?.trim();
    if (!text) return;
    setCommentLoading((prev: { [key: string]: boolean }) => ({ ...prev, [recipeId]: true }));
    try {
      const res = await fetch('/api/community/recipes/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, userId, userName: user.name, text }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to add comment');
      const data = await res.json();
      setRecipes((prev: CommunityRecipe[]) => prev.map((r: CommunityRecipe) => r._id === recipeId ? { ...r, comments: data.comments } : r));
      setCommentInputs((prev: { [key: string]: string }) => ({ ...prev, [recipeId]: '' }));
    } catch {
      // Optionally show error
    } finally {
      setCommentLoading((prev: { [key: string]: boolean }) => ({ ...prev, [recipeId]: false }));
    }
  };

  return (
    <ProtectedRoute>
      <FitFeastLayout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="max-w-screen-2xl mx-auto px-4 py-10 sm:px-8 lg:px-12">
            {/* Header Section */}
            <div className="text-center mb-10">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-emerald-700 mb-4 tracking-tight animate-fade-in">
                FitFeast <span className="text-transparent bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text">Community</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up">
                Connect with fellow health enthusiasts, share recipes, and join challenges together
              </p>
            </div>

            <div className="space-y-10">
              {/* Active Challenges Section */}
              <div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                  <div className="flex items-center mb-4 lg:mb-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4">
                      <span className="text-2xl">🔥</span>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-700">Active Challenges</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                  {activeChallenges.length === 0 ? (
                    <div className="text-gray-400 col-span-full">You have not joined any challenges yet.</div>
                  ) : (
                    activeChallenges.map((challenge) => (
                      <div key={challenge._id} className="group bg-white/90 border border-emerald-200 rounded-3xl p-6 hover:border-emerald-400 transition-all duration-300 hover:scale-105 shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-emerald-700">{challenge.title}</h3>
                            <p className="text-sm text-gray-600">{challenge.description}</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                            {challenge.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full bg-emerald-50 rounded-full h-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: `${challenge.progress || 0}%` }}></div>
                          </div>
                          <p className="text-sm text-gray-500">Participants: {challenge.participants.length}</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-emerald-700 font-semibold">Joined</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Available Challenges Section */}
              <div>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 mt-12">
                  <div className="flex items-center mb-4 lg:mb-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mr-4">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-700">Available Challenges</h2>
                  </div>
                </div>
                <div className="mb-4">
                  {joinError && (
                    <div className="text-red-500 font-semibold mb-2">{joinError}</div>
                  )}
                  <p className="text-emerald-700 text-lg font-semibold bg-emerald-50 rounded-xl px-4 py-2 shadow border border-emerald-200">
                    <span className="mr-2">👉</span>Click <span className="font-bold">Join Challenge</span> below to participate in a challenge!
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                  {availableChallenges.length === 0 ? (
                    <div className="text-gray-400 col-span-full">No more challenges to join. 🎉</div>
                  ) : (
                    availableChallenges.map((challenge) => (
                      <div key={challenge._id} className="group bg-white/90 border border-emerald-200 rounded-3xl p-6 hover:border-emerald-400 transition-all duration-300 hover:scale-105 shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-emerald-700">{challenge.title}</h3>
                            <p className="text-sm text-gray-600">{challenge.description}</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
                            {challenge.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full bg-emerald-50 rounded-full h-2">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: `${challenge.progress || 0}%` }}></div>
                          </div>
                          <p className="text-sm text-gray-500">Participants: {challenge.participants.length}</p>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                          <button
                            className={
                              `px-8 py-3 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-extrabold shadow-lg shadow-emerald-500/30 border-4 border-transparent 
                              group-hover:border-emerald-400 group-hover:shadow-emerald-400/40 transition-all duration-300 transform hover:scale-110 hover:animate-bounce`
                            }
                            style={{ boxShadow: '0 4px 24px 0 rgba(16, 185, 129, 0.25)' }}
                            disabled={joining === challenge._id}
                            onClick={() => handleJoinChallenge(challenge._id)}
                          >
                            {joining === challenge._id ? (
                              <span className="flex items-center"><span className="animate-spin mr-2">⏳</span>Joining...</span>
                            ) : (
                              <span className="flex items-center"><span className="mr-2">🚀</span>Join Challenge</span>
                            )}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Community Feed */}
              <div className="bg-white/90 border border-blue-100 rounded-3xl p-8 shadow animate-fade-in-up">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h2 className="text-2xl font-bold text-blue-700">Community Feed</h2>
                </div>
                
                {/* Post Creation */}
                <div className="mb-8">
                  <textarea
                    className="w-full p-4 border border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition-all duration-300"
                    rows={3}
                    placeholder="Share your progress or recipe..."
                    value={postText}
                    onChange={e => setPostText(e.target.value)}
                  ></textarea>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-3 block text-gray-700"
                    onChange={e => setPhoto(e.target.files?.[0] || null)}
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                      onClick={handlePost}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">Add</span>
                        Post
                      </span>
                    </button>
                  </div>
                </div>

                {/* Feed Posts */}
                <div className="space-y-6">
                </div>
              </div>

              {/* Recipe Sharing */}
              <div className="bg-white/90 border border-purple-100 rounded-3xl p-8 shadow animate-fade-in-up">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-purple-700">Shared Recipes</h2>
                </div>
                
                <div className="flex justify-between items-center mb-8">
                  <h1 className="text-3xl font-bold text-emerald-700">Community Recipes</h1>
                  <Link href="/community/share" className="bg-emerald-600 text-white px-4 py-2 rounded font-semibold hover:bg-emerald-700 transition">Share a Recipe</Link>
                </div>

                {loading ? (
                  <div>Loading...</div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : recipes.length === 0 ? (
                  <div>No recipes shared yet. Be the first to <Link href="/community/share" className="text-emerald-600 underline">share a recipe</Link>!</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recipes.map(recipe => {
                      const liked = user && recipe.likes && recipe.likes.includes(user._id);
                      let recipeUserId = '';
                      if (typeof recipe.userId === 'string') recipeUserId = recipe.userId;
                      else if (recipe.userId && typeof recipe.userId === 'object' && 'toString' in recipe.userId) recipeUserId = recipe.userId.toString();
                      const isOwner = user && recipeUserId === user._id;
                      return (
                        <div key={recipe._id} className="block bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden border border-emerald-100">
                          <Link href={`/community/recipes/${recipe._id}`}>
                            {recipe.photoUrl && (
                              <img src={recipe.photoUrl} alt={recipe.title} className="w-full h-48 object-cover" />
                            )}
                            <div className="p-4">
                              <h2 className="text-xl font-bold text-emerald-700 mb-2">{recipe.title}</h2>
                              <div className="text-gray-600 mb-1">By {recipe.userName}</div>
                              <p className="text-gray-700 line-clamp-2">{recipe.description}</p>
                            </div>
                          </Link>
                          <div className="flex flex-col gap-2 px-4 pb-4">
                            <div className="flex items-center gap-4">
                              {/* Like button always visible */}
                              <button
                                className={`flex items-center gap-1 text-sm ${liked ? 'text-emerald-600' : 'text-gray-500'}`}
                                onClick={() => handleLike(recipe._id)}
                                disabled={!user}
                              >
                                <span>{liked ? '💚' : '🤍'}</span>
                                <span>{recipe.likes ? recipe.likes.length : 0}</span>
                              </button>
                              <button
                                className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700"
                                onClick={() => handleShare(recipe._id)}
                              >
                                <span>🔗</span>
                                <span>{copiedRecipeId === recipe._id ? 'Link Copied!' : 'Share'}</span>
                              </button>
                              {isOwner && (
                                <button
                                  className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 ml-auto"
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this post?')) return;
                                    try {
                                      const res = await fetch('/api/community/recipes/delete', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ recipeId: recipe._id, userId: userId }),
                                        credentials: 'include',
                                      });
                                      if (!res.ok) {
                                        const data = await res.json();
                                        alert(data.error || 'Failed to delete post');
                                      } else {
                                        setRecipes(prev => prev.filter(r => r._id !== recipe._id));
                                      }
                                    } catch (err) {
                                      alert('Failed to delete post');
                                    }
                                  }}
                                >
                                  <span>🗑️</span>
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                            {/* Comments Section */}
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 font-semibold mb-1">Comments:</div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {recipe.comments && recipe.comments.length > 0 ? (
                                  recipe.comments.slice(-3).map((c, idx) => (
                                    <div key={c._id || idx} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1 mb-1">
                                      <span className="font-semibold text-emerald-700">{c.userName}:</span> {c.text}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-gray-400 italic">No comments yet.</div>
                                )}
                              </div>
                              {user && (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    type="text"
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                                    placeholder="Add a comment..."
                                    value={commentInputs[recipe._id] || ''}
                                    onChange={e => setCommentInputs((prev: { [key: string]: string }) => ({ ...prev, [recipe._id]: e.target.value }))}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAddComment(recipe._id); }}
                                    disabled={commentLoading[recipe._id]}
                                  />
                                  <button
                                    className="text-xs bg-emerald-500 text-white rounded px-2 py-1 font-semibold disabled:opacity-50"
                                    onClick={() => handleAddComment(recipe._id)}
                                    disabled={commentLoading[recipe._id] || !(commentInputs[recipe._id]?.trim())}
                                  >
                                    {commentLoading[recipe._id] ? '...' : 'Post'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </FitFeastLayout>
    </ProtectedRoute>
  );
}