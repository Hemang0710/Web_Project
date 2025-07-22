import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cuisine: {
    type: String,
    required: true
  },
  region: {
    type: String,
    required: true
  },
  dietType: {
    type: [String],
    enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'high-protein'],
    default: []
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    unit: {
      type: String,
      required: true
    },
    estimatedCost: {
      type: Number,
      required: true
    }
  }],
  instructions: [{
    step: {
      type: Number,
      required: true
    },
    instruction: {
      type: String,
      required: true
    }
  }],
  nutrition: {
    calories: {
      type: Number,
      required: true
    },
    protein: {
      type: Number,
      required: true
    },
    carbs: {
      type: Number,
      required: true
    },
    fats: {
      type: Number,
      required: true
    },
    fiber: {
      type: Number,
      default: 0
    },
    sugar: {
      type: Number,
      default: 0
    },
    sodium: {
      type: Number,
      default: 0
    }
  },
  servings: {
    type: Number,
    required: true,
    default: 1
  },
  prepTime: {
    type: Number, // in minutes
    required: true
  },
  cookTime: {
    type: Number, // in minutes
    required: true
  },
  totalTime: {
    type: Number, // in minutes
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  tags: [String],
  imageUrl: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['user-generated', 'api-imported', 'admin-curated'],
    default: 'api-imported'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate total time before saving
recipeSchema.pre('save', function(next) {
  this.totalTime = this.prepTime + this.cookTime;
  next();
});

// Index for search functionality
recipeSchema.index({ name: 'text', description: 'text', cuisine: 'text', tags: 'text' });
recipeSchema.index({ cuisine: 1, region: 1 });
recipeSchema.index({ dietType: 1 });
recipeSchema.index({ 'nutrition.calories': 1 });

const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);

export default Recipe;

