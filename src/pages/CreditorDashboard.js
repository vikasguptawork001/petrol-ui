import React from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import '../styles/petrolpump-theme.css';

const CreditorDashboard = () => {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role !== 'super_admin') {
    return (
      <Layout>
        <div style={{ padding: '20px', textAlign: 'center', color: '#dc3545' }}>
          Access denied. Due Sheet is visible only to Super Admin.
        </div>
      </Layout>
    );
  }

  return <Navigate to="/due-sheet" replace />;
};

export default CreditorDashboard;
