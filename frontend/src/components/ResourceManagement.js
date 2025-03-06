import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaVideo, FaBook, FaNewspaper, FaPlus, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

const ResourceManagement = ({ assessmentId }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'video',
    link: '',
    description: '',
    author: '',
    thumbnail: ''
  });

  const fetchResources = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/dashboard/assessments/${assessmentId}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResources(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch resources');
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/dashboard/assessments/${assessmentId}/resources`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      fetchResources();
      setFormData({
        title: '',
        type: 'video',
        link: '',
        description: '',
        author: '',
        thumbnail: ''
      });
    } catch (err) {
      setError('Failed to add resource');
    }
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/dashboard/resources/${resourceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchResources();
      } catch (err) {
        setError('Failed to delete resource');
      }
    }
  };

  return (
    <div className="mt-6">
      {/* Show error message if there is one */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recommended Resources</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="inline-block mr-2" />
          Add Resource
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading resources...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource._id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {resource.type === 'video' && <FaVideo className="text-red-500 mr-2" />}
                  {resource.type === 'book' && <FaBook className="text-blue-500 mr-2" />}
                  {resource.type === 'article' && <FaNewspaper className="text-green-500 mr-2" />}
                  <h4 className="font-medium text-gray-900">{resource.title}</h4>
                </div>
                <button
                  onClick={() => handleDelete(resource._id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTrash className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">{resource.description}</p>
              
              {resource.author && (
                <p className="text-sm text-gray-600 mt-2">By {resource.author}</p>
              )}
              
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-700"
              >
                View Resource
                <FaExternalLinkAlt className="ml-1 h-3 w-3" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Resource</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="video">Video</option>
                    <option value="book">Book</option>
                    <option value="article">Article</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Link</label>
                  <input
                    type="url"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagement; 