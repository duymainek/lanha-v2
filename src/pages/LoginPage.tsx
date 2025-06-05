import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';

export const LoginPage: React.FC = () => {
  const { login, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@lanha.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setError(''); 
    setIsSubmitting(true);

    try {
      const { error: loginError } = await login(email, password);

      if (loginError) {
        setError(loginError.message);
      } else {
        // Successful login: onAuthStateChange in AuthContext will update the user state.
        // ProtectedRoute will then allow navigation to '/'.
        navigate('/'); 
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentIsLoading = authIsLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-4xl font-extrabold text-primary">Là Nhà Apartment</h1>
          <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-text-main">
            Admin Portal
          </h2>
        </div>
        <Card className="mt-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Email address"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={currentIsLoading}
            />
            <Input
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={currentIsLoading}
            />
            {error && <p className="mt-1 text-sm text-red-600 text-center">{error}</p>}
            <div>
              <Button type="submit" className="w-full" disabled={currentIsLoading}>
                {currentIsLoading ? <Spinner size="sm" color="text-white"/> : 'Sign In'}
              </Button>
            </div>
             <div className="text-sm text-center">
              <a href="#" className="font-medium text-primary hover:text-primary-hover">
                Forgot your password?
              </a>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};