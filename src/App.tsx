import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './router/AppRouter';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;