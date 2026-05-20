// backend/src/models/Evaluation.js - Mock Evaluation Model
const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  batch: {
    type: String, // Reference to Batch.batchId
    required: [true, 'Batch is required'],
    ref: 'Batch'
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: [true, 'Participant is required']
  },
  evaluator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Evaluator is required']
  },
  technology: {
    type: String, // Reference to Technology.technologyId
    required: [true, 'Technology is required'],
    ref: 'Technology'
  },
  round: {
    type: Number,
    required: [true, 'Round number is required'],
    min: [1, 'Round must be at least 1'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v);
      },
      message: 'Round must be a whole number'
    }
  },
  scores: [{
    criteriaName: {
      type: String,
      required: true,
      trim: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1
    },
    comments: String
  }],
  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'in-progress', 'completed'],
      message: 'Status must be pending, in-progress, or completed'
    },
    default: 'pending'
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
evaluationSchema.index({ batch: 1, participant: 1, round: 1, technology: 1 }, { unique: true });
evaluationSchema.index({ evaluator: 1, status: 1 });
evaluationSchema.index({ participant: 1 });
evaluationSchema.index({ batch: 1 });
evaluationSchema.index({ technology: 1 });

// Virtual to check if evaluation is completed
evaluationSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Method to calculate total score
evaluationSchema.methods.calculateTotalScore = function() {
  if (this.scores && this.scores.length > 0) {
    this.totalScore = this.scores.reduce((sum, s) => sum + (s.score || 0), 0);
  }
  return this.totalScore;
};

// Pre-save hook to calculate total score
evaluationSchema.pre('save', function(next) {
  if (this.isModified('scores')) {
    this.calculateTotalScore();
  }
  
  // Set completed date when status changes to completed
  if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
    this.completedDate = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Evaluation', evaluationSchema);