import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  // User preferences for meal planning
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN']
  },
  location: {
    type: String,
    default: 'United States'
  },
  budgetWeekly: {
    type: Number,
    default: 100,
    min: 10,
    max: 10000
  },
  preferredCuisine: [{
    type: String,
    enum: ['Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese', 'Thai', 'Mediterranean', 'American', 'French', 'Greek', 'Spanish', 'Korean', 'Vietnamese', 'Middle Eastern', 'African', 'Caribbean', 'Latin American']
  }],
  dietType: {
    type: String,
    default: 'balanced',
    enum: ['balanced', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'low-carb', 'high-protein', 'gluten-free', 'dairy-free']
  },
  // New fields for advanced meal planning
  allergies: [{
    type: String
  }],
  numberOfPeople: {
    type: Number,
    default: 1,
    min: 1,
    max: 20
  },
  minDailyBudget: {
    type: Number,
    default: 5,
    min: 1
  },
  maxDailyBudget: {
    type: Number,
    default: 30,
    min: 1
  },
  preferredMealTypes: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  }],
  height: {
    type: Number, // in cm
    min: 100,
    max: 250
  },
  weight: {
    type: Number, // in kg
    min: 30,
    max: 300
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
  },
  verificationTokenExpires: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordTokenExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bmiLogs: [
    {
      date: Date,
      weight: Number, // in kg
      height: Number, // in cm
      bmi: Number
    }
  ],
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check if password matches
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 