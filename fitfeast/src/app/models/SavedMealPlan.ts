import mongoose from 'mongoose';

const savedMealPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  selectedMeals: {
    type: [mongoose.Schema.Types.Mixed], // Array of meal objects
    required: true
  },
  groceryList: {
    type: [mongoose.Schema.Types.Mixed], // Array of grocery items
    default: []
  },
  totalCost: {
    type: Number,
    default: 0
  },
  totalCalories: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['ai', 'local', 'manual'],
    default: 'local'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.SavedMealPlan || mongoose.model('SavedMealPlan', savedMealPlanSchema); 