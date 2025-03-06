const mongoose = require('mongoose');
const Category = require('../models/Category');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await initializeCategories();
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const initializeCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      const categories = [
        {
          name: 'Computer Science Fundamentals',
          description: 'Core computer science concepts and principles',
          engineeringField: 'Computer Science',
          level: 'beginner',
          topics: ['Algorithms', 'Data Structures', 'Programming Basics'],
          recommendedDuration: 4,
          videoResources: [
            {
              title: 'Introduction to Programming',
              url: 'https://www.youtube.com/watch?v=example1',
              description: 'Learn programming basics'
            },
            {
              title: 'Data Structures Explained',
              url: 'https://www.youtube.com/watch?v=example2',
              description: 'Understanding data structures'
            }
          ]
        },
        {
          name: 'Advanced Programming Concepts',
          description: 'Advanced programming and software design',
          engineeringField: 'Computer Science',
          level: 'intermediate',
          topics: ['Object-Oriented Programming', 'Design Patterns'],
          recommendedDuration: 6,
          videoResources: [
            {
              title: 'Object-Oriented Programming',
              url: 'https://www.youtube.com/watch?v=example3',
              description: 'Learn OOP concepts'
            }
          ]
        }
        // Add more categories as needed
      ];

      await Category.insertMany(categories);
      console.log('Categories initialized with video resources');
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

module.exports = connectDB; 