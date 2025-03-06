const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number,  // Index of correct option
    required: true
  }
});

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  engineeringField: {
    type: String,
    required: true,
    enum: [
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical Engineering',
      'Electronics and Communication',
      'Computer Science',
      'Information Technology',
      'Chemical Engineering'
    ]
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    required: true
  },
  duration: {
    type: Number,  // in minutes
    required: true
  },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema); 