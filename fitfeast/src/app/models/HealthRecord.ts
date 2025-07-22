import mongoose from 'mongoose';

const healthRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  bmi: {
    type: Number,
    required: true
  },
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
    }
  },
  notes: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  }
}, {
  timestamps: true
});

// Calculate BMI before saving
healthRecordSchema.pre('save', function(next) {
  if (this.isModified('weight') || this.isModified('height')) {
    // BMI = weight (kg) / (height (m) * height (m))
    const heightInMeters = this.height / 100;
    this.bmi = Number((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

const HealthRecord = mongoose.models.HealthRecord || mongoose.model('HealthRecord', healthRecordSchema);

export default HealthRecord; 