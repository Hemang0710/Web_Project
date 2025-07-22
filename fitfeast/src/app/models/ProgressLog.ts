import mongoose from 'mongoose';

const progressLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  weight: {
    type: Number, // in kg
    min: 30,
    max: 300
  },
  bmi: {
    type: Number,
    min: 10,
    max: 60
  },
  meals: [{
    recipeId: {
      type: String,
      required: true
    },
    recipeName: {
      type: String,
      required: true
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      min: 0
    },
    carbs: {
      type: Number,
      min: 0
    },
    fats: {
      type: Number,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    },
    consumedAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalCalories: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProtein: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCarbs: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFats: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFiber: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Calculate totals before saving
progressLogSchema.pre('save', function(next) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  let totalFiber = 0;
  
  this.meals.forEach(meal => {
    totalCalories += meal.calories || 0;
    totalProtein += meal.protein || 0;
    totalCarbs += meal.carbs || 0;
    totalFats += meal.fats || 0;
    totalFiber += meal.fiber || 0;
  });
  
  this.totalCalories = Math.round(totalCalories);
  this.totalProtein = Number(totalProtein.toFixed(1));
  this.totalCarbs = Number(totalCarbs.toFixed(1));
  this.totalFats = Number(totalFats.toFixed(1));
  this.totalFiber = Number(totalFiber.toFixed(1));
  
  next();
});

// Create compound index for efficient queries
progressLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const ProgressLog = mongoose.models.ProgressLog || mongoose.model('ProgressLog', progressLogSchema);

export default ProgressLog; 