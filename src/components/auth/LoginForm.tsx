import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { Activity, WifiOff, Code } from 'lucide-react';
import { useOfflineStatus } from '../../lib/hooks/useOfflineStatus';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const { login, isLoading, error, toggleDevMode, devMode } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { isOffline } = useOfflineStatus();
  const navigate = useNavigate();
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [showDevOptions, setShowDevOptions] = useState(false);
  
  const onSubmit = async (data: LoginFormData) => {
    if (isOffline) {
      setOfflineError("Can't log in while offline. Please check your internet connection.");
      return;
    }
    
    // Special dev login
    if (data.email === 'dev@hms.dev' && data.password === 'dev123') {
      toggleDevMode();
      // Use regular login with default credentials
      await login('searchabletoday@gmail.com', '@devtoday1030');
      return;
    }
    
    await login(data.email, data.password);
  };

  // Secret key sequence to show dev options (triple click on logo)
  const handleLogoClick = () => {
    const now = Date.now();
    const clickTimes: number[] = JSON.parse(localStorage.getItem('logoClickTimes') || '[]');
    
    // Add current click time
    clickTimes.push(now);
    
    // Only keep the last 3 clicks
    while (clickTimes.length > 3) {
      clickTimes.shift();
    }
    
    localStorage.setItem('logoClickTimes', JSON.stringify(clickTimes));
    
    // Check if we have 3 clicks within 1.5 seconds
    if (clickTimes.length === 3 && (clickTimes[2] - clickTimes[0]) < 1500) {
      setShowDevOptions(true);
      localStorage.setItem('logoClickTimes', '[]');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-fade py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Activity className="h-12 w-12 text-primary-500 cursor-pointer" onClick={handleLogoClick} />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome back to Searchable</h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              {error}
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
          
          {showDevOptions && (
            <div className="bg-primary-50 border border-primary-200 text-primary-700 px-4 py-3 rounded-md flex items-center">
              <Code className="h-5 w-5 mr-2 text-primary-500" />
              Developer options enabled. Use dev@hms.dev / dev123 to login with dev rights.
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
      </div>
    </div>
  );
};

export default LoginForm;