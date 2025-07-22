import mongoose from 'mongoose';

interface IMealPlan extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  budget: number;
  location: string;
  startDate: Date;
  endDate: Date;
  meals: Array<{
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    breakfast?: {
      name: string;
      ingredients: string[];
      calories: number;
      cost: number;
      nutrition: {
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
      };
    };
    lunch?: {
      name: string;
      ingredients: string[];
      calories: number;
      cost: number;
      nutrition: {
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
      };
    };
    dinner?: {
      name: string;
      ingredients: string[];
      calories: number;
      cost: number;
      nutrition: {
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
      };
    };
    snacks?: Array<{
      name: string;
      ingredients: string[];
      calories: number;
      cost: number;
      nutrition: {
        protein: number;
        carbs: number;
        fats: number;
        fiber: number;
      };
    }>;
  }>;
  totalCost: number;
  totalCalories: number;
  isActive: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mealPlanSchema = new mongoose.Schema({
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
  budget: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  meals: [{
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    breakfast: {
      name: String,
      ingredients: [String],
      calories: Number,
      cost: Number,
      nutrition: {
        protein: Number,
        carbs: Number,
        fats: Number,
        fiber: Number
      }
    },
    lunch: {
      name: String,
      ingredients: [String],
      calories: Number,
      cost: Number,
      nutrition: {
        protein: Number,
        carbs: Number,
        fats: Number,
        fiber: Number
      }
    },
    dinner: {
      name: String,
      ingredients: [String],
      calories: Number,
      cost: Number,
      nutrition: {
        protein: Number,
        carbs: Number,
        fats: Number,
        fiber: Number
      }
    },
    snacks: [{
      name: String,
      ingredients: [String],
      calories: Number,
      cost: Number,
      nutrition: {
        protein: Number,
        carbs: Number,
        fats: Number,
        fiber: Number
      }
    }]
  }],
  totalCost: {
    type: Number,
    required: true
  },
  totalCalories: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate total cost and calories before saving
mealPlanSchema.pre('save', function(next) {
  let totalCost = 0;
  let totalCalories = 0;
  
  this.meals.forEach(meal => {
    if (meal.breakfast) {
      totalCost += meal.breakfast.cost || 0;
      totalCalories += meal.breakfast.calories || 0;
    }
    if (meal.lunch) {
      totalCost += meal.lunch.cost || 0;
      totalCalories += meal.lunch.calories || 0;
    }
    if (meal.dinner) {
      totalCost += meal.dinner.cost || 0;
      totalCalories += meal.dinner.calories || 0;
    }
    if (meal.snacks) {
      meal.snacks.forEach(snack => {
        totalCost += snack.cost || 0;
        totalCalories += snack.calories || 0;
      });
    }
  });
  
  this.totalCost = Number(totalCost.toFixed(2));
  this.totalCalories = Math.round(totalCalories);
  next();
});

const MealPlan = mongoose.models.MealPlan || mongoose.model<IMealPlan>('MealPlan', mealPlanSchema);

export default MealPlan;

