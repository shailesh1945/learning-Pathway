const mongoose = require('mongoose');

const assessmentSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  answers: {
    type: Map,
    of: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'completed', 'in_progress', 'auto_submitted'],
    default: 'not_started'
  },
  timeSpent: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Add index for querying submissions efficiently
assessmentSubmissionSchema.index({ userId: 1, assessmentId: 1, createdAt: -1 });

module.exports = mongoose.model('AssessmentSubmission', assessmentSubmissionSchema); 