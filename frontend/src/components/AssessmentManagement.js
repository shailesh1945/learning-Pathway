import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaSearch, FaTimes, FaPlus } from 'react-icons/fa';
import ResourceManagement from './ResourceManagement';

const AssessmentManagement = ({ showModal, setShowModal }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    level: 'beginner',
    duration: 30,
    questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });

  // Add filter options
  const filterOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' }
  ];

  // Add these arrays for the dropdowns
  const engineeringFields = [
    'Civil Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Electronics and Communication',
    'Computer Science',
    'Information Technology',
    'Chemical Engineering'
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' }
  ];

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    if (selectedAssessment) {
      setFormData({
        title: selectedAssessment.title,
        level: selectedAssessment.level,
        duration: selectedAssessment.duration,
        questions: selectedAssessment.questions
      });
    } else {
      setFormData({
        title: '',
        level: 'beginner',
        duration: 30,
        questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]
      });
    }
  }, [selectedAssessment]);

  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/dashboard/assessments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssessments(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch assessments');
      setLoading(false);
    }
  };

  const handleDelete = async (assessmentId) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/dashboard/assessments/${assessmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAssessments();
      } catch (err) {
        setError('Failed to delete assessment');
      }
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    if (field === 'option') {
      const [optionIndex, optionValue] = value;
      newQuestions[index].options[optionIndex] = optionValue;
    } else {
      newQuestions[index][field] = value;
    }
    setFormData({ ...formData, questions: newQuestions });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, { questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  // Filter and search assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter(assessment => {
      const matchesSearch = assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          assessment.level.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterLevel === 'all' || assessment.level === filterLevel;
      return matchesSearch && matchesFilter;
    });
  }, [assessments, searchTerm, filterLevel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.level || !formData.duration) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate questions
    for (const question of formData.questions) {
      if (!question.questionText || question.options.some(opt => !opt)) {
        setError('Please fill in all question fields and options');
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const method = selectedAssessment ? 'put' : 'post';
      const url = selectedAssessment 
        ? `/api/dashboard/assessments/${selectedAssessment._id}`
        : '/api/dashboard/assessments';

      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form and refresh list
      setFormData({
        title: '',
        level: 'beginner',
        duration: 30,
        questions: [{ questionText: '', options: ['', '', '', ''], correctAnswer: 0 }]
      });
      setShowModal(false);
      fetchAssessments();
    } catch (err) {
      setError('Failed to save assessment');
    }
  };

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search assessments..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <div className="sm:w-48">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-4">Loading assessments...</div>
      ) : (
        /* Assessments Table */
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAssessments.map((assessment) => (
                <tr key={assessment._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {assessment.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${assessment.level === 'beginner' ? 'bg-green-100 text-green-800' :
                        assessment.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {assessment.level.charAt(0).toUpperCase() + assessment.level.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.duration} mins
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {assessment.questions.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedAssessment(assessment);
                        setShowModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <FaEdit className="inline-block" />
                    </button>
                    <button
                      onClick={() => handleDelete(assessment._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAssessments.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No assessments found
            </div>
          )}
        </div>
      )}

      {/* Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-3xl shadow-xl rounded-xl bg-white">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-2">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedAssessment ? 'Edit Assessment' : 'Create New Assessment'}
              </h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Basic Info Section */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Assessment title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Engineering Field</label>
                    <select
                      value={formData.engineeringField}
                      onChange={(e) => setFormData({ ...formData, engineeringField: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Engineering Field</option>
                      {engineeringFields.map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Level</option>
                      {levels.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Questions Section */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium text-gray-900">Questions</h4>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaPlus className="mr-1.5 h-3 w-3" />
                      Add Question
                    </button>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3">
                    {formData.questions.map((question, qIndex) => (
                      <div key={qIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="text-sm font-medium text-gray-900">Question {qIndex + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-red-600 hover:text-red-700 focus:outline-none"
                          >
                            <FaTimes className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <textarea
                              value={question.questionText}
                              onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              rows="2"
                              placeholder="Enter your question here"
                            />
                          </div>

                          <div className="space-y-2">
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  name={`correct-${qIndex}`}
                                  checked={question.correctAnswer === oIndex}
                                  onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleQuestionChange(qIndex, 'option', [oIndex, e.target.value])}
                                  className="flex-1 px-3 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Assessment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedAssessment && (
        <ResourceManagement assessmentId={selectedAssessment._id} />
      )}
    </div>
  );
};

export default AssessmentManagement; 