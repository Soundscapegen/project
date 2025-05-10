import React from 'react';
import { useAuth } from './AuthContext';

// User debug component
const UserDebug = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) { // If the loading is true
    return <div>Loading authentication status...</div>;
  }

  return (
    <div style={{ 
      padding: '10px', 
      margin: '10px', 
      border: '1px solid #ccc',
      backgroundColor: '#f5f5f5'
    }}>
      <h3>Authentication Debug</h3>
      <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
      <p><strong>User Data:</strong></p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
};

export default UserDebug; 