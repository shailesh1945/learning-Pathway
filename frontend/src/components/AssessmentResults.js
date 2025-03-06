import React, { useEffect, useState, useCallback } from 'react';
import { FaCheckCircle, FaClock, FaMedal, FaYoutube, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';

const getYouTubeVideoId = (url) => {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  } catch (error) {
    console.error('Error extracting YouTube video ID:', error);
    return null;
  }
};

const AssessmentResults = ({ submissions }) => {
  const [suggestedCourses, setSuggestedCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestedCourses = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/dashboard/recommendations', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Recommendations response:', response.data);
      if (response.data.recommendations) {
        setSuggestedCourses(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setSuggestedCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (submissions && submissions.length > 0) {
      console.log('Triggering recommendations fetch for', submissions.length, 'submissions');
      fetchSuggestedCourses();
    }
  }, [fetchSuggestedCourses, submissions]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (score) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getLevelBadgeStyle = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'expert':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Assessment Results Section */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Assessment History</h2>
          
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assessment history available
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission) => (
                <div 
                  key={submission._id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Title and Score */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-medium text-gray-900 truncate pr-2">
                      {submission.assessment?.title || 'Deleted Assessment'}
                    </h3>
                    <div className={`text-lg font-semibold ${getStatusColor(submission.score)}`}>
                      {submission.score}%
                    </div>
                  </div>

                  {/* Level Badge and Field */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getLevelBadgeStyle(submission.assessment?.level)
                    }`}>
                      {submission.assessment?.level || 'Unknown Level'}
                    </span>
                    {submission.assessment?.engineeringField && (
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {submission.assessment.engineeringField}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressBarColor(submission.score)}`}
                        style={{ width: `${submission.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <FaClock className="mr-1.5 h-3 w-3 text-gray-400" />
                      {Math.round(submission.timeSpent / 60)}m
                    </div>
                    <div className="flex items-center justify-end">
                      {submission.correctAnswers}/{submission.totalQuestions} correct
                    </div>
                    <div>Attempt #{submission.attemptNumber || 1}</div>
                    <div className="text-right">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Learning Recommendations Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">
          Learning Recommendations
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : suggestedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestedCourses.map((course, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                {/* Course Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-medium text-gray-900 truncate pr-2">
                    {course.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                    course.level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {course.level}
                  </span>
                </div>

                {/* Recommendation Reason */}
                <div className="mb-3 text-sm text-blue-600 bg-blue-50 rounded-md p-2">
                  {course.reason}
                </div>

                {/* Course Description */}
                <p className="text-sm text-gray-600 mb-3">
                  {course.description}
                </p>

                {/* Topics */}
                {course.topics && course.topics.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {course.topics.map((topic, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Resources */}
                {course.videoResources && course.videoResources.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {course.duration} weeks
                      </span>
                      <a
                        href={course.videoResources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                      >
                        Start Learning
                        <FaArrowRight className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Complete assessments to get personalized learning recommendations
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentResults; 