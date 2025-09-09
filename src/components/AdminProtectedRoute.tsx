import React from 'react';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const adminSession = localStorage.getItem('admin_session');
  
  if (!adminSession) {
    return <Navigate to="/admin-scc/login" replace />;
  }

  try {
    const session = JSON.parse(adminSession);
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

    // Session expires after 24 hours
    if (hoursSinceLogin > 24) {
      localStorage.removeItem('admin_session');
      return <Navigate to="/admin-scc/login" replace />;
    }
  } catch (error) {
    localStorage.removeItem('admin_session');
    return <Navigate to="/admin-scc/login" replace />;
  }

  return <>{children}</>;
};