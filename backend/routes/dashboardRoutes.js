const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');
const Assessment = require('../models/Assessment');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const Resource = require('../models/Resource');
const Category = require('../models/Category');
const AssessmentResult = require('../models/AssessmentResult');

// Apply protect middleware to all routes
router.use(protect);

// Public routes (accessible to both admin and students)
router.get('/recommendations', async (req, res) => {
  try {
    console.log('Fetching recommendations for user:', req.user._id);
    
    const submissions = await AssessmentSubmission.find({ 
      userId: req.user._id,
      status: 'completed'
    })
    .populate('assessmentId')
    .sort({ createdAt: -1 });

    if (!submissions.length) {
      return res.json({
        success: true,
        message: 'Complete some assessments to get recommendations.',
        recommendations: []
      });
    }

    // Separate high and low score submissions
    const highScores = submissions.filter(sub => sub.score >= 70);
    const lowScores = submissions.filter(sub => sub.score < 70);

    console.log('Scores analysis:', {
      high: highScores.length,
      low: lowScores.length
    });

    let recommendationCriteria = [];

    // For high scores (≥70%), suggest next level
    highScores.forEach(submission => {
      const currentLevel = submission.assessmentId.level;
      const nextLevel = getNextLevel(currentLevel);
      if (nextLevel) {
        recommendationCriteria.push({
          field: submission.assessmentId.engineeringField,
          level: nextLevel,
          reason: `Based on your excellent score of ${submission.score}% in ${currentLevel} level`
        });
      }
    });

    // For low scores (<70%), suggest same level
    lowScores.forEach(submission => {
      recommendationCriteria.push({
        field: submission.assessmentId.engineeringField,
        level: submission.assessmentId.level,
        reason: `To improve your score of ${submission.score}%`
      });
    });

    console.log('Recommendation criteria:', recommendationCriteria);

    // Find matching categories
    let recommendedCategories = [];
    for (const criteria of recommendationCriteria) {
      const matches = await Category.find({
        $and: [
          { name: new RegExp(criteria.field, 'i') },
          { level: criteria.level }
        ]
      });
      
      matches.forEach(match => {
        recommendedCategories.push({
          ...match.toObject(),
          reason: criteria.reason
        });
      });
    }

    // Transform categories into recommendations
    const recommendations = recommendedCategories.map(category => ({
      _id: category._id,
      title: category.name,
      description: category.description,
      engineeringField: category.name.split('(')[0].trim(),
      level: category.level,
      topics: category.topics,
      duration: category.recommendedDuration,
      videoResources: category.videoResources || [],
      reason: category.reason
    }));

    console.log('Final recommendations:', {
      count: recommendations.length,
      fields: recommendations.map(r => r.engineeringField),
      levels: recommendations.map(r => r.level)
    });

    res.json({
      success: true,
      message: 'Here are your personalized learning recommendations:',
      recommendations
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

// Helper function to determine next level
function getNextLevel(currentLevel) {
  const levels = ['beginner', 'intermediate', 'expert'];
  const currentIndex = levels.indexOf(currentLevel.toLowerCase());
  if (currentIndex >= 0 && currentIndex < levels.length - 1) {
    return levels[currentIndex + 1];
  }
  return null; // Return null if already at expert level
}

// Add check-categories and initialize-categories before admin middleware
router.get('/check-categories', async (req, res) => {
  try {
    const categories = await Category.find({});
    console.log('All categories in DB:', categories.map(cat => ({
      name: cat.name,
      field: cat.engineeringField,
      level: cat.level,
      videosCount: cat.videoResources?.length || 0
    })));
    res.json({ count: categories.length, categories });
  } catch (error) {
    console.error('Error checking categories:', error);
    res.status(500).json({ message: 'Error checking categories' });
  }
});

router.post('/initialize-categories', async (req, res) => {
  try {
    // First check if categories exist
    const count = await Category.countDocuments();
    console.log('Current category count:', count);

    if (count === 0) {
      // Initialize categories
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
              url: 'https://www.youtube.com/watch?v=zOjov-2OZ0E',
              description: 'Learn programming basics'
            },
            {
              title: 'Data Structures Explained',
              url: 'https://www.youtube.com/watch?v=RBSGKlAvoiM',
              description: 'Understanding data structures'
            }
          ]
        },
        {
          name: 'Advanced Programming',
          description: 'Advanced programming concepts and techniques',
          engineeringField: 'Computer Science',
          level: 'intermediate',
          topics: ['Object-Oriented Programming', 'Design Patterns', 'Software Architecture'],
          recommendedDuration: 6,
          videoResources: [
            {
              title: 'Advanced Programming Concepts',
              url: 'https://www.youtube.com/watch?v=Mus_vwhTCq0',
              description: 'Learn advanced programming'
            }
          ]
        }
      ];

      const result = await Category.insertMany(categories);
      console.log('Categories initialized:', result.length);
      
      res.json({ 
        message: 'Categories initialized successfully',
        count: result.length,
        categories: result
      });
    } else {
      res.json({ 
        message: 'Categories already exist',
        count: count
      });
    }
  } catch (error) {
    console.error('Error initializing categories:', error);
    res.status(500).json({ 
      message: 'Error initializing categories',
      error: error.message
    });
  }
});

// Then apply admin middleware for admin-only routes
router.use(admin);

router.get('/categories/beginner-courses', async (req, res) => {
  try {
    const fields = req.query.fields.split(',');
    const beginnerCourses = await Category.find({
      level: 'beginner',
      name: { 
        $regex: new RegExp(fields.join('|'), 'i')
      }
    }).select('name description recommendedDuration videoResources');

    res.json(beginnerCourses);
  } catch (error) {
    console.error('Error fetching beginner courses:', error);
    res.status(500).json({ message: 'Error fetching beginner courses' });
  }
});

// Get Dashboard Stats (admin only)
router.get('/stats', async (req, res) => {
  try {
    // Verify admin role again for extra security
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }

    // Get total students
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // Get active courses (categories)
    const activeCourses = await Category.countDocuments();
    
    // Calculate completion rate from submissions
    const submissions = await AssessmentSubmission.find();
    const completedSubmissions = submissions.filter(sub => sub.score >= 70).length;
    const completionRate = submissions.length > 0 
      ? Math.round((completedSubmissions / submissions.length) * 100) 
      : 0;

    // Get active users (users who submitted in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: thirtyDaysAgo }
    });

    res.json({
      totalStudents,
      activeCourses,
      completionRate: `${completionRate}%`,
      activeUsers
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Get all students (admin only)
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// Delete student
router.delete('/students/:id', async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Can only delete student accounts' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

// Add or update the assessment creation route
router.post('/assessments', async (req, res) => {
  try {
    const { title, level, engineeringField, duration, questions } = req.body;

    // Validate engineering field
    const validFields = [
      'Civil Engineering',
      'Mechanical Engineering',
      'Electrical Engineering',
      'Electronics and Communication',
      'Computer Science',
      'Information Technology',
      'Chemical Engineering'
    ];

    if (!validFields.includes(engineeringField)) {
      return res.status(400).json({ 
        message: 'Invalid engineering field' 
      });
    }

    // Validate level
    const validLevels = ['beginner', 'intermediate', 'expert'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ 
        message: 'Invalid level' 
      });
    }

    // Create new assessment
    const assessment = await Assessment.create({
      title,
      level,
      engineeringField,
      duration,
      questions,
      createdBy: req.user._id
    });

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ message: 'Error creating assessment' });
  }
});

// Get all assessments
router.get('/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Error fetching assessments' });
  }
});

// Update assessment
router.put('/assessments/:id', async (req, res) => {
  try {
    const { title, level, duration, questions } = req.body;

    // Validate input
    if (!title || !level || !duration || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      { title, level, duration, questions },
      { new: true }
    );

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ message: 'Error updating assessment' });
  }
});

// Delete assessment
router.delete('/assessments/:id', async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ message: 'Error deleting assessment' });
  }
});

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    const submissions = await AssessmentSubmission.find()
      .populate('assessment', 'title');

    const totalSubmissions = submissions.length;
    const scores = submissions.map(s => s.score);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b) / scores.length) 
      : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Get stats per assessment
    const assessmentStats = await Assessment.aggregate([
      {
        $lookup: {
          from: 'assessmentsubmissions',
          localField: '_id',
          foreignField: 'assessment',
          as: 'submissions'
        }
      },
      {
        $project: {
          title: 1,
          submissions: { $size: '$submissions' },
          averageScore: {
            $round: [
              { $avg: '$submissions.score' },
              0
            ]
          },
          passRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$submissions',
                            as: 'sub',
                            cond: { $gte: ['$$sub.score', 70] }
                          }
                        }
                      },
                      { $max: [{ $size: '$submissions' }, 1] }
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ]);

    res.json({
      totalSubmissions,
      averageScore,
      highestScore,
      lowestScore,
      assessmentStats
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ message: 'Error fetching overview' });
  }
});

// Add resource to assessment
router.post('/assessments/:id/resources', async (req, res) => {
  try {
    const { title, type, link, description, author, thumbnail } = req.body;
    const assessment = await Assessment.findById(req.params.id);
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const resource = await Resource.create({
      title,
      type,
      link,
      description,
      author,
      thumbnail,
      assessment: assessment._id,
      createdBy: req.user._id
    });

    res.status(201).json(resource);
  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({ message: 'Error adding resource' });
  }
});

// Get resources for assessment
router.get('/assessments/:id/resources', async (req, res) => {
  try {
    const resources = await Resource.find({ assessment: req.params.id })
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

// Get all resources
router.get('/resources', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    const resources = await Resource.find()
      .populate('assessment', 'title')
      .sort({ createdAt: -1 })
      .limit(9);
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  console.log('GET /categories request received');
  try {
    const categories = await Category.find().sort({ level: 1 });
    console.log('Categories retrieval details:', {
      total: categories.length,
      names: categories.map(cat => cat.name),
      levels: categories.map(cat => cat.level)
    });
    res.json(categories);
  } catch (error) {
    console.error('Error in GET /categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Add this temporary debug route
router.get('/debug-categories', async (req, res) => {
  try {
    const categories = await Category.find({});
    console.log('Category fields:', categories.map(cat => ({
      name: cat.name,
      engineeringField: cat.engineeringField,
      level: cat.level,
      hasVideos: cat.videoResources?.length > 0
    })));
    res.json({ 
      count: categories.length,
      sample: categories[0],
      fields: [...new Set(categories.map(c => c.engineeringField))],
      levels: [...new Set(categories.map(c => c.level))]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 