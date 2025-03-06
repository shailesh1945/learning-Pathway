const mongoose = require('mongoose');

// Add logging to verify model creation
console.log('Category model registered');

const videoResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  description: String
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  engineeringField: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    required: true
  },
  topics: [String],
  recommendedDuration: Number,
  resourceUrl: String,
  videoResources: [videoResourceSchema]
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category; 