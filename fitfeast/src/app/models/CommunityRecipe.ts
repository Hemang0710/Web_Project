import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const CommunityRecipeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    required: false
  },
  ingredients: [{
    type: String,
    required: true
  }],
  steps: [{
    type: String,
    required: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.CommunityRecipe || mongoose.model('CommunityRecipe', CommunityRecipeSchema); 