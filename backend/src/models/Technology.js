// backend/src/models/Technology.js - Mock Evaluation Technology Model
const mongoose = require('mongoose');

const technologySchema = new mongoose.Schema({
  technologyId: {
    type: String,
    required: [true, 'Technology ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^TECH\d{3}$/.test(v);
      },
      message: 'Technology ID must be in format TECH001, TECH002, etc.'
    }
  },
  name: {
    type: String,
    required: [true, 'Technology name is required'],
    trim: true,
    unique: true,
    minlength: [2, 'Technology name must be at least 2 characters'],
    maxlength: [50, 'Technology name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['Programming', 'Framework', 'Database', 'Cloud', 'DevOps', 'Data Science', 'Mobile', 'Other'],
      message: 'Invalid category'
    },
    default: 'Other'
  },
  // Number of rounds configured for this technology
  rounds: {
    type: Number,
    required: [true, 'Number of rounds is required'],
    min: [1, 'At least 1 round is required'],
    max: [5, 'Maximum 5 rounds allowed'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Number of rounds must be a whole number'
    },
    default: 1
  },
  // Evaluation criteria for each round (optional, can be customized)
  evaluationCriteria: [{
    roundNumber: {
      type: Number,
      required: true,
      min: 1
    },
    criteriaName: {
      type: String,
      required: true,
      trim: true
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    },
    description: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
technologySchema.index({ technologyId: 1 });
technologySchema.index({ name: 1 });
technologySchema.index({ category: 1 });
technologySchema.index({ isActive: 1 });

module.exports = mongoose.model('Technology', technologySchema);