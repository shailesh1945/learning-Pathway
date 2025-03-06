import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaGraduationCap, FaCode, FaBrain, FaCog, FaIndustry, FaPlane, FaRobot, FaMicrochip, FaBuilding, FaFlask, FaYoutube, FaPlayCircle } from 'react-icons/fa';

// YouTube video ID extractor function
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

const LearningPaths = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [initializationStatus, setInitializationStatus] = useState('');

  // Define fetchCategories using useCallback
  const fetchCategories = useCallback(async () => {
    console.log('=== FETCH CATEGORIES START ===');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Auth Token:', token ? 'Present' : 'Missing');

      const response = await axios.get('/api/dashboard/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📊 Response Data:', {
        totalCategories: response.data.length,
        categories: response.data.map(cat => ({
          name: cat.name,
          level: cat.level,
          topicsCount: cat.topics.length,
          videosCount: cat.videoResources?.length || 0,
          hasVideos: Boolean(cat.videoResources?.length)
        }))
      });

      // Detailed logging for each category
      response.data.forEach((category, index) => {
        console.log(`\n🎓 Category ${index + 1}: ${category.name}`);
        console.log({
          id: category._id,
          name: category.name,
          level: category.level,
          description: category.description,
          duration: category.recommendedDuration,
          topics: category.topics,
          videoResources: category.videoResources?.map(video => ({
            title: video.title,
            url: video.url,
            videoId: getYouTubeVideoId(video.url),
            description: video.description
          }))
        });
      });

      if (response.data.length === 0) {
        console.log('⚠️ No categories found');
        setInitializationStatus('No categories found. Click to initialize.');
      } else {
        console.log('✅ Categories fetched successfully');
        setCategories(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching categories:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
      setLoading(false);
      setInitializationStatus('Error loading categories');
    }
    console.log('=== FETCH CATEGORIES END ===');
  }, []);

  const initializeCategories = async () => {
    console.log('=== INITIALIZE CATEGORIES START ===');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Auth Token:', token ? 'Present' : 'Missing');

      const response = await axios.post('/api/dashboard/categories/init', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📝 Initialization Response:', {
        message: response.data.message,
        categoriesCount: response.data.count
      });

      console.log('🔄 Fetching updated categories...');
      await fetchCategories();
      
      console.log('✅ Categories initialized successfully');
    } catch (err) {
      console.error('❌ Error in initialization:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack
      });
      setInitializationStatus('Failed to initialize categories');
    }
    console.log('=== INITIALIZE CATEGORIES END ===');
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = selectedLevel === 'all' 
    ? categories 
    : categories.filter(cat => cat.level === selectedLevel);

  const getLevelIcon = (name, level) => {
    // First check the engineering discipline
    if (name.includes('Mechanical')) return <FaCog className="h-6 w-6 text-gray-600" />;
    if (name.includes('Electrical')) return <FaIndustry className="h-6 w-6 text-yellow-600" />;
    if (name.includes('Aerospace')) return <FaPlane className="h-6 w-6 text-blue-600" />;
    if (name.includes('Robotics')) return <FaRobot className="h-6 w-6 text-red-600" />;
    if (name.includes('Electronics')) return <FaMicrochip className="h-6 w-6 text-purple-600" />;
    if (name.includes('Civil')) return <FaBuilding className="h-6 w-6 text-orange-600" />;
    if (name.includes('Chemical')) return <FaFlask className="h-6 w-6 text-green-600" />;
    
    // Default to the level icons if no specific engineering icon matches
    switch (level) {
      case 'beginner':
        return <FaGraduationCap className="h-6 w-6 text-green-500" />;
      case 'intermediate':
        return <FaCode className="h-6 w-6 text-blue-500" />;
      case 'expert':
        return <FaBrain className="h-6 w-6 text-purple-500" />;
      default:
        return null;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
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

  const groupCategories = (categories) => {
    const groups = {
      'Computer & Software': [],
      'Mechanical & Robotics': [],
      'Electrical & Electronics': [],
      'Civil & Construction': [],
      'Chemical & Process': [],
      'Aerospace & Aviation': [],
      'Other Engineering': []
    };

    categories.forEach(category => {
      if (category.name.includes('Computer') || category.name.includes('Software')) {
        groups['Computer & Software'].push(category);
      } else if (category.name.includes('Mechanical') || category.name.includes('Robotics')) {
        groups['Mechanical & Robotics'].push(category);
      } else if (category.name.includes('Electrical') || category.name.includes('Electronics')) {
        groups['Electrical & Electronics'].push(category);
      } else if (category.name.includes('Civil')) {
        groups['Civil & Construction'].push(category);
      } else if (category.name.includes('Chemical')) {
        groups['Chemical & Process'].push(category);
      } else if (category.name.includes('Aerospace')) {
        groups['Aerospace & Aviation'].push(category);
      } else {
        groups['Other Engineering'].push(category);
      }
    });

    return groups;
  };

  const groupedCategories = groupCategories(filteredCategories);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Learning Paths</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-4 py-2 rounded-md ${
              selectedLevel === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {['beginner', 'intermediate', 'expert'].map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-md ${
                selectedLevel === level
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading learning paths...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">{initializationStatus}</p>
          <button
            onClick={initializeCategories}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Initialize Categories
          </button>
        </div>
      ) : (
        Object.entries(groupedCategories).map(([groupName, categories]) => (
          categories.length > 0 && (
            <div key={groupName} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{groupName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category._id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {getLevelIcon(category.name, category.level)}
                        <h4 className="ml-3 text-lg font-medium text-gray-900">
                          {category.name}
                        </h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(category.level)}`}>
                        {category.level}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Key Topics:</h5>
                      <ul className="space-y-2">
                        {category.topics.map((topic, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Video Resources Section */}
                    {category.videoResources && category.videoResources.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <FaYoutube className="h-5 w-5 text-red-600 mr-2" />
                          Learning Resources
                        </h5>
                        <div className="space-y-3">
                          {category.videoResources.map((video, index) => (
                            <div key={index} className="group">
                              <a
                                href={video.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden relative">
                                    {/* YouTube thumbnail */}
                                    <img
                                      src={`https://img.youtube.com/vi/${getYouTubeVideoId(video.url)}/mqdefault.jpg`}
                                      alt={video.title}
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-0 transition-opacity duration-200" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <FaPlayCircle className="h-8 w-8 text-white group-hover:text-red-600 transition-colors duration-200" />
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-4 flex-1">
                                  <p className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors duration-200 line-clamp-1">
                                    {video.title}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                    {video.description}
                                  </p>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Recommended Duration: {category.recommendedDuration} weeks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))
      )}

      {/* Add an initialization button if no categories or videos exist */}
      {(categories.length === 0 || categories.every(cat => !cat.videoResources?.length)) && (
        <div className="text-center py-8">
          <button
            onClick={initializeCategories}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Initialize Categories
          </button>
        </div>
      )}
    </div>
  );
};

export default LearningPaths; 