import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaClock } from 'react-icons/fa';

const AssessmentTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (!assessment) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Validate if all questions are answered
      const unansweredQuestions = assessment.questions.length - Object.keys(answers).length;
      if (!isAutoSubmit && unansweredQuestions > 0) {
        if (!window.confirm(`You have ${unansweredQuestions} unanswered questions. Are you sure you want to submit?`)) {
          return;
        }
      }

      const response = await axios.post(`/api/student/assessments/${id}/submit`, {
        answers,
        timeSpent: assessment.duration * 60 - timeLeft,
        isAutoSubmit
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Show score before redirecting
      const score = response.data.score;
      alert(`Your score: ${score}%`);

      navigate('/student-dashboard', { 
        state: { 
          message: 'Assessment submitted successfully', 
          score,
          submissionId: response.data.details.submissionId
        }
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit assessment');
    }
  }, [assessment, answers, id, navigate, timeLeft]);

  const fetchAssessment = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/student/assessments/${id}/start`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssessment(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch assessment');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  useEffect(() => {
    if (assessment) {
      setTimeLeft(assessment.duration * 60); // Convert minutes to seconds
    }
  }, [assessment]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true); // Pass true for auto-submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, handleSubmit]);

  const handleAnswer = (questionIndex, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedOption
    }));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmitClick = () => {
    handleSubmit(false); // Pass false for manual submit
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/student-dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">{assessment?.title}</h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <FaClock className="h-5 w-5" />
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm text-gray-500">
            <span>Question {currentQuestion + 1} of {assessment?.questions.length}</span>
            <span>{assessment?.level}</span>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {assessment?.questions[currentQuestion].questionText}
            </h2>
            <div className="space-y-3">
              {assessment?.questions[currentQuestion].options.map((option, index) => (
                <label
                  key={index}
                  className={`block p-4 rounded-lg border cursor-pointer transition-colors duration-200 
                    ${answers[currentQuestion] === index 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      checked={answers[currentQuestion] === index}
                      onChange={() => handleAnswer(currentQuestion, index)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3">{option}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className={`px-4 py-2 rounded-md ${
              currentQuestion === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Previous
          </button>
          {currentQuestion === assessment?.questions.length - 1 ? (
            <button
              onClick={handleSubmitClick}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(prev => Math.min(assessment.questions.length - 1, prev + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentTaking; 