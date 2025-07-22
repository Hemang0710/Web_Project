import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true }, // e.g., 'meal-plan', 'health-metrics', 'grocery-list'
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Activity || mongoose.model('Activity', activitySchema); 