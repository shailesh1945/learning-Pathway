import { FaVideo, FaNewspaper, FaBook, FaBookOpen } from 'react-icons/fa';
import React from 'react';

export const getResourceIcon = (type) => {
  switch (type) {
    case 'video':
      return <FaVideo className="h-5 w-5 text-blue-500" />;
    case 'article':
      return <FaNewspaper className="h-5 w-5 text-green-500" />;
    case 'book':
      return <FaBook className="h-5 w-5 text-purple-500" />;
    case 'course':
      return <FaBookOpen className="h-5 w-5 text-yellow-500" />;
    default:
      return null;
  }
};

export const getDifficultyLabel = (difficulty) => {
  switch (difficulty) {
    case 1:
      return 'Beginner';
    case 2:
      return 'Easy';
    case 3:
      return 'Intermediate';
    case 4:
      return 'Advanced';
    case 5:
      return 'Expert';
    default:
      return 'Unknown';
  }
}; 