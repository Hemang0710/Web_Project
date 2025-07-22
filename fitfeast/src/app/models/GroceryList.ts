import mongoose from 'mongoose';

const groceryListSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mealPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Produce', 'Dairy', 'Meat & Seafood', 'Pantry', 'Frozen', 'Bakery', 'Beverages', 'Other']
    },
    quantity: {
      type: String,
      required: true
    },
    estimatedCost: {
      type: Number,
      required: true
    },
    isPurchased: {
      type: Boolean,
      default: false
    },
    actualCost: {
      type: Number,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  totalEstimatedCost: {
    type: Number,
    required: true
  },
  totalActualCost: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Calculate total estimated cost before saving
groceryListSchema.pre('save', function(next) {
  let totalEstimated = 0;
  let totalActual = 0;
  
  this.items.forEach(item => {
    totalEstimated += item.estimatedCost || 0;
    totalActual += item.actualCost || 0;
  });
  
  this.totalEstimatedCost = Number(totalEstimated.toFixed(2));
  this.totalActualCost = Number(totalActual.toFixed(2));
  
  // Check if all items are purchased
  const allPurchased = this.items.every(item => item.isPurchased);
  if (allPurchased && this.items.length > 0) {
    this.isCompleted = true;
    if (!this.completedDate) {
      this.completedDate = new Date();
    }
  } else {
    this.isCompleted = false;
    this.completedDate = undefined;
  }
  
  next();
});

const GroceryList = mongoose.models.GroceryList || mongoose.model('GroceryList', groceryListSchema);

export default GroceryList;

