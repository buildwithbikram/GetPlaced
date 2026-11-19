import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = {
  student: '/student/dashboard',
  admin: '/admin/dashboard',
  recruiter: '/recruiter/dashboard',
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  // User is not logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have the required role
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <Navigate
        to={roleHome[user?.role] || '/'}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
