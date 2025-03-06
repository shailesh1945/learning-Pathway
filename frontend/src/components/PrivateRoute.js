import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" />;
  }

  // Check for admin routes
  if (window.location.pathname === '/admin-dashboard' && user.role !== 'admin') {
    return <Navigate to="/student-dashboard" />;
  }

  // Check for student routes
  if (window.location.pathname === '/student-dashboard' && user.role === 'admin') {
    return <Navigate to="/admin-dashboard" />;
  }

  return children;
};

export default PrivateRoute; 