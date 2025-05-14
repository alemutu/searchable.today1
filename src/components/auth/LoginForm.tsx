import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { Activity, WifiOff } from 'lucide-react';
import { useOfflineStatus } from '../../lib/hooks/useOfflineStatus';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const { login, isLoading, error, isAdmin } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { isOffline } = useOfflineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  
  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const { user, isAdmin } = useAuthStore.getState();
    if (user) {
      if (isAdmin) {
        navigate('/super-admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);
  
  const onSubmit = async (data: LoginFormData) => {
    if (isOffline) {
      setOfflineError("Can't log in while offline. Please check your internet connection.");
      return;
    }
    
    setRoleError(null);
    
    try {
      await login(data.email, data.password);
      
      // Check if the user is a super_admin
      const { isAdmin } = useAuthStore.getState();
      
      if (isAdmin) {
        setRoleError("Use the admin login portal.");
        // Logout the user since they should use the admin login
        await useAuthStore.getState().logout();
        return;
      }
      
      // Redirect to the dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-fade py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Activity className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome back to Searchable</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {roleError && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              {roleError} <Link to="/admin-login" className="font-medium underline">Go to admin login</Link>
            </div>
          )}
          
          {offlineError && (
            <div className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-md flex items-center">
              <WifiOff className="h-5 w-5 mr-2 text-warning-500" />
              {offlineError}
            </div>
          )}
          
          {isOffline && !offlineError && (
            <div className="bg-warning-50 border border-warning-200 text-warning-700 px-4 py-3 rounded-md flex items-center">
              <WifiOff className="h-5 w-5 mr-2 text-warning-500" />
              You are currently offline. Login requires an internet connection.
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`form-input ${errors.email ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className={`form-input ${errors.password ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isOffline}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Sign in
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Are you a Super Admin?{' '}
            <Link to="/admin-login" className="font-medium text-primary-600 hover:text-primary-500">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;