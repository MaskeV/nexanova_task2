// backend/src/models/Batch.js - Mock Evaluation Batch Model
const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: [true, 'Batch ID is required'],
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^BATCH\d{3}$/.test(v);
      },
      message: 'Batch ID must be in format BATCH001, BATCH002, etc.'
    }
  },
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true,
    minlength: [3, 'Batch name must be at least 3 characters'],
    maxlength: [100, 'Batch name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(v) {
        return v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  technology: {
    type: String, // Reference to Technology.technologyId
    required: [true, 'Technology is required'],
    ref: 'Technology'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant' // References students
  }],
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      message: 'Status must be scheduled, ongoing, completed, or cancelled'
    },
    default: 'scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
batchSchema.index({ batchId: 1 });
batchSchema.index({ technology: 1 });
batchSchema.index({ status: 1 });
batchSchema.index({ startDate: 1, endDate: 1 });

// Virtual to get participant count
batchSchema.virtual('participantCount').get(function() {
  return this.participants ? this.participants.length : 0;
});

// Method to check if batch is active based on dates
batchSchema.methods.checkStatus = function() {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'scheduled';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'ongoing';
  } else if (now > this.endDate && this.status !== 'cancelled') {
    this.status = 'completed';
  }
  return this.status;
};

module.exports = mongoose.model('Batch', batchSchema);