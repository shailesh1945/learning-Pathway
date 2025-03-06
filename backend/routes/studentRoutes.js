const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/authMiddleware');
const AssessmentSubmission = require('../models/AssessmentSubmission');
const User = require('../models/User');
const Category = require('../models/Category');

// Apply middleware to all routes
router.use(protect);

// Get all available assessments for student
router.get('/assessments', async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .select('-questions.correctAnswer') // Don't send correct answers to client
      .sort({ createdAt: -1 });
    res.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ message: 'Error fetching assessments' });
  }
});

// Get student stats
router.get('/stats', async (req, res) => {
  try {
    const submissions = await AssessmentSubmission.find({ 
      userId: req.user._id 
    });

    const stats = {
      totalAssessments: await Assessment.countDocuments(),
      completedAssessments: submissions.length,
      averageScore: submissions.length > 0 
        ? Math.round(submissions.reduce((acc, sub) => acc + sub.score, 0) / submissions.length) 
        : 0,
      timeSpent: Math.round(submissions.reduce((acc, sub) => acc + sub.timeSpent, 0) / 3600) // Convert to hours
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// Start assessment
router.get('/assessments/:id/start', async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .select('-questions.correctAnswer');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (error) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ message: 'Error starting assessment' });
  }
});

// Submit assessment
router.post('/assessments/:id/submit', async (req, res) => {
  try {
    const { answers, timeSpent, isAutoSubmit } = req.body;
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    let totalQuestions = assessment.questions.length;
    
    assessment.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    console.log('Assessment submission score:', score);

    // Create assessment submission
    const submission = await AssessmentSubmission.create({
      assessmentId: assessment._id,
      userId: req.user._id,
      answers,
      score,
      timeSpent,
      totalQuestions,
      correctAnswers,
      status: isAutoSubmit ? 'auto_submitted' : 'completed'
    });

    // If score is below 70%, find relevant learning resources
    if (score < 70) {
      console.log('Low score detected, finding recommendations for:', {
        field: assessment.engineeringField,
        level: assessment.level
      });

      // Find matching categories based on engineering field and level
      const recommendedCategories = await Category.find({
        engineeringField: assessment.engineeringField,
        level: assessment.level,
        videoResources: { $exists: true, $ne: [] }
      });

      console.log('Found recommended categories:', 
        recommendedCategories.map(cat => ({
          name: cat.name,
          videosCount: cat.videoResources.length
        }))
      );
    }

    // Update user's last assessment date
    await User.findByIdAndUpdate(req.user._id, {
      lastAssessmentDate: new Date(),
      $inc: { totalAssessments: 1 }
    });

    res.json({
      success: true,
      message: 'Assessment submitted successfully',
      score,
      status: submission.status,
      details: {
        totalQuestions,
        correctAnswers,
        timeSpent,
        submissionId: submission._id
      }
    });

  } catch (error) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error submitting assessment',
      error: error.message 
    });
  }
});

// Get student's submissions
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await AssessmentSubmission.find({ 
      userId: req.user._id 
    })
    .populate('assessmentId')
    .sort({ createdAt: -1 });

    // Transform submissions to match the database structure
    const transformedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      assessment: sub.assessmentId, // Change assessmentId to assessment to match frontend
      score: sub.score,
      status: sub.status,
      timeSpent: sub.timeSpent,
      createdAt: sub.createdAt,
      correctAnswers: sub.correctAnswers,
      totalQuestions: sub.totalQuestions,
      attemptNumber: sub.attemptNumber || 1
    }));

    console.log('Transformed submissions:', transformedSubmissions);
    res.json(transformedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

module.exports = router; 