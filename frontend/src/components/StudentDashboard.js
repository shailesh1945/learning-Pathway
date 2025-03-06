import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaBook, 
  FaCertificate, 
  FaChartLine, 
  FaCalendar, 
  FaClock, 
  FaGraduationCap 
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import AssessmentResults from './AssessmentResults';
import { getResourceIcon, getDifficultyLabel } from '../utils/resourceIcons';

const AssessmentCard = ({ assessment, submissions }) => {
  const navigate = useNavigate();
  const submission = submissions[assessment._id];

  const getStatusDisplay = () => {
    if (!submission) {
      return { text: 'Not Started', color: 'yellow' };
    }

    switch (submission.status) {
      case 'completed':
        return { 
          text: `Score: ${submission.score}%`, 
          color: submission.score >= 70 ? 'green' : 'orange' 
        };
      case 'auto_submitted':
        return { 
          text: `Auto-Submitted (${submission.score}%)`, 
          color: 'orange' 
        };
      case 'in_progress':
        return { text: 'In Progress', color: 'blue' };
      default:
        return { text: 'Not Started', color: 'yellow' };
    }
  };

  const handleStartAssessment = () => {
    if (submission) {
      const confirmRetake = window.confirm(
        'You have already completed this assessment. Would you like to retake it? Your previous score will be kept in history.'
      );
      if (!confirmRetake) return;
    }
    navigate(`/assessment/${assessment._id}`);
  };

  const status = getStatusDisplay();

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              assessment.level === 'beginner' ? 'bg-green-100 text-green-800' :
              assessment.level === 'intermediate' ? 'bg-blue-100 text-blue-800' : 
              'bg-purple-100 text-purple-800'
            }`}>
              {assessment.level.charAt(0).toUpperCase() + assessment.level.slice(1)}
            </span>
            <span className="flex items-center">
              <FaClock className="mr-1.5 h-4 w-4 text-gray-400" />
              {assessment.duration} mins
            </span>
            <span>{assessment.questions.length} questions</span>
          </div>
        </div>
        <button
          onClick={handleStartAssessment}
          className={`px-4 py-2 text-sm rounded-md transition-colors duration-200 ${
            submission 
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {submission ? 'Retake Assessment' : 'Start Assessment'}
        </button>
      </div>

      {/* Engineering Field */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Engineering Field</h4>
        <div className="flex items-center text-gray-600">
          <FaGraduationCap className="h-4 w-4 mr-2" />
          <span>{assessment.engineeringField}</span>
        </div>
      </div>

      {/* Assessment Details */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Difficulty Level</span>
          <span className="font-medium">{assessment.level}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Time Limit</span>
          <span className="font-medium">{assessment.duration} minutes</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Questions</span>
          <span className="font-medium">{assessment.questions.length}</span>
        </div>
      </div>

      {/* Status Section */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <span className={`font-medium text-${status.color}-600`}>
            {status.text}
          </span>
        </div>
        {submission && (
          <>
            <div className="mt-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Last Attempt</span>
                <span>{new Date(submission.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Spent</span>
                <span>{Math.round(submission.timeSpent / 60)} minutes</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    submission.score >= 70 ? 'bg-green-500' :
                    submission.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${submission.score}%` }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StudentDashboard = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    completedAssessments: 0,
    averageScore: 0,
    timeSpent: 0
  });
  const [submissions, setSubmissions] = useState({});
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weakAreas, setWeakAreas] = useState([]);
  const location = useLocation();

  const fetchRecommendations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/dashboard/recommendations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Recommendations response:', response.data); // Debug log

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        setWeakAreas(response.data.weakAreas || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssessments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/assessments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssessments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch assessments');
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/student/submissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Create a map of submissions by assessment ID
      const submissionsMap = {};
      response.data.forEach(submission => {
        // Fix: Use the assessment._id from the submission
        const assessmentId = submission.assessment._id;
        if (!submissionsMap[assessmentId] || 
            new Date(submission.createdAt) > new Date(submissionsMap[assessmentId].createdAt)) {
          submissionsMap[assessmentId] = submission;
        }
      });
      
      console.log('Submissions map:', submissionsMap); // Debug log
      setSubmissions(submissionsMap);
      setAllSubmissions(response.data);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  }, []);

  const handleAssessmentComplete = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAssessments(),
        fetchStats(),
        fetchSubmissions(),
        fetchRecommendations()
      ]);
    } catch (error) {
      console.error('Error updating dashboard:', error);
      setError('Failed to update dashboard');
    } finally {
      setLoading(false);
    }
  }, [fetchAssessments, fetchStats, fetchSubmissions, fetchRecommendations]);

  const initializeCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // First check existing categories
      const checkResponse = await axios.get('http://localhost:5000/api/dashboard/check-categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Existing categories:', checkResponse.data);

      // Initialize if needed
      const initResponse = await axios.post('http://localhost:5000/api/dashboard/initialize-categories', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Initialization response:', initResponse.data);

      // Refresh recommendations using the existing fetchRecommendations function
      fetchRecommendations();
    } catch (error) {
      console.error('Error initializing categories:', error);
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      // Show success message with score if available
      const message = location.state.score 
        ? `${location.state.message} Score: ${location.state.score}%`
        : location.state.message;
      
      alert(message);
      
      // Clear the message from history
      window.history.replaceState({}, document.title);
      
      // Refresh the dashboard data
      handleAssessmentComplete();
    }
  }, [location, handleAssessmentComplete]);

  useEffect(() => {
    // Initial data fetch
    handleAssessmentComplete();
  }, [handleAssessmentComplete]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-2">
                {localStorage.getItem('userName')}
              </span>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add this button */}
        <button
          onClick={initializeCategories}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Initialize Learning Resources
        </button>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
                <FaBook className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Assessments</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.totalAssessments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
                <FaCertificate className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.completedAssessments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-500 bg-opacity-10">
                <FaChartLine className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-500 bg-opacity-10">
                <FaCalendar className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Time Spent</p>
                <p className="text-2xl font-semibold text-gray-700">{stats.timeSpent}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Personalized Learning Recommendations
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your recommendations...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <>
              {weakAreas.length > 0 && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-sm text-blue-700">
                    Based on your assessment results, we recommend focusing on:
                    {weakAreas.map((area, index) => (
                      <span key={area.field} className="font-medium">
                        {index > 0 ? ', ' : ' '}
                        {area.field} ({area.levels.join(', ')})
                      </span>
                    ))}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map(resource => (
                  <div key={resource._id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center mb-4">
                      {getResourceIcon(resource.type)}
                      <h3 className="ml-3 text-lg font-medium text-gray-900">{resource.title}</h3>
                    </div>
                    <p className="text-gray-600 mb-4">{resource.description}</p>
                    {resource.topics && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Key Topics:</p>
                        <div className="flex flex-wrap gap-2">
                          {resource.topics.slice(0, 3).map((topic, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                              {topic}
                            </span>
                          ))}
                          {resource.topics.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                              +{resource.topics.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          Difficulty: {getDifficultyLabel(resource.difficulty)}
                        </span>
                        {resource.duration && (
                          <span className="text-sm text-gray-500">
                            {resource.duration} weeks
                          </span>
                        )}
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Start Learning
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Complete some assessments to get personalized learning recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Assessments Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Available Assessments</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assessments.map((assessment) => (
                  <AssessmentCard 
                    key={assessment._id} 
                    assessment={assessment}
                    submissions={submissions}
                  />
                ))}
                {assessments.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No assessments available at the moment
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <AssessmentResults submissions={allSubmissions} />
      </div>
    </div>
  );
};

export default StudentDashboard; 