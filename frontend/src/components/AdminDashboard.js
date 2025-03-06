import React, { useState, useEffect, useCallback } from 'react';
import { FaUsers, FaBookOpen, FaChartLine } from 'react-icons/fa';
import axios from 'axios';
import StudentManagement from './StudentManagement';
import AssessmentManagement from './AssessmentManagement';
import LearningPaths from './LearningPaths';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddAssessmentModal, setShowAddAssessmentModal] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        window.location.href = '/login';
        return;
      }

      // Create axios instance with JWT token
      const instance = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Use the same instance for the requests
      const [statsResponse, overviewResponse] = await Promise.all([
        instance.get('/dashboard/stats'),
        instance.get('/dashboard/overview')
      ]);

      setStats(statsResponse.data);
      setOverview(overviewResponse.data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Update the stats cards section
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-500 bg-opacity-10">
            <FaUsers className="h-8 w-8 text-blue-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-semibold text-gray-700">
              {loading ? 'Loading...' : stats?.totalStudents}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-500 bg-opacity-10">
            <FaBookOpen className="h-8 w-8 text-green-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Active Courses</p>
            <p className="text-2xl font-semibold text-gray-700">
              {loading ? 'Loading...' : stats?.activeCourses}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-500 bg-opacity-10">
            <FaChartLine className="h-8 w-8 text-purple-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Completion Rate</p>
            <div className="flex flex-col">
              <p className="text-2xl font-semibold text-gray-700">
                {loading ? 'Loading...' : stats?.completionRate}
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-500 rounded-full h-2 transition-all duration-500"
                  style={{ 
                    width: loading ? '0%' : stats?.completionRate.replace('%', '') + '%'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-yellow-500 bg-opacity-10">
            <FaUsers className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-500">Active Users</p>
            <p className="text-2xl font-semibold text-gray-700">
              {loading ? 'Loading...' : stats?.activeUsers}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-2">Admin</span>
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
        {error && (
          <div className="mb-4 bg-red-100 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {renderStatsCards()}

        {/* Main Content Area */}
        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'students'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('assessments')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'assessments'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Assessments
              </button>
              <button
                onClick={() => setActiveTab('paths')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'paths'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Learning Paths
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-6">Assessment Overview</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Total Submissions</p>
                    <p className="text-2xl font-semibold text-gray-900">{overview?.totalSubmissions}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Average Score</p>
                    <p className="text-2xl font-semibold text-green-600">{overview?.averageScore}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Highest Score</p>
                    <p className="text-2xl font-semibold text-blue-600">{overview?.highestScore}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-sm text-gray-500">Lowest Score</p>
                    <p className="text-2xl font-semibold text-red-600">{overview?.lowestScore}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {overview?.assessmentStats.map((stat) => (
                        <tr key={stat._id || `assessment-${stat.title}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.submissions}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{stat.averageScore}%</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-500">{stat.passRate}%</span>
                              <div className="ml-4 flex-1 max-w-xs">
                                <div className="h-2 bg-gray-200 rounded-full">
                                  <div 
                                    className="h-2 bg-green-500 rounded-full" 
                                    style={{ width: `${stat.passRate}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeTab === 'students' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Students Management</h3>
                <StudentManagement />
              </div>
            )}
            {activeTab === 'assessments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Assessment Management</h3>
                  <button
                    onClick={() => setShowAddAssessmentModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add New Assessment
                  </button>
                </div>
                <AssessmentManagement 
                  showModal={showAddAssessmentModal}
                  setShowModal={setShowAddAssessmentModal}
                />
              </div>
            )}
            {activeTab === 'paths' && (
              <div>
                <LearningPaths />
              </div>
            )}
            {activeTab === 'settings' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                <p className="mt-4 text-gray-500">No settings available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 