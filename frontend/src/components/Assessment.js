import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Assessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startTime] = useState(Date.now());

  const handleSubmitAssessment = async () => {
    try {
      const token = localStorage.getItem('token');
      const timeSpent = Math.round((Date.now() - startTime) / 1000); // Convert to seconds

      const response = await axios.post(
        `http://localhost:5000/api/student/assessments/${id}/submit`,
        {
          answers,
          timeSpent,
          isAutoSubmit: false
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        navigate('/student-dashboard', {
          state: { 
            message: 'Assessment submitted successfully!',
            score: response.data.score
          }
        });
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Failed to submit assessment');
    }
  };

  // ... rest of the component code ...
};

export default Assessment; 