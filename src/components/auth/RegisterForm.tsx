import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { Activity, WifiOff } from 'lucide-react';
import { useOfflineStatus } from '../../lib/hooks/useOfflineStatus';
import { isValidEmail, isStrongPassword, generateCsrfToken, storeCsrfToken } from '../../lib/security';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

const RegisterForm: React.FC = () => {
  const { signup, isLoading, error } = useAuthStore();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();
  const navigate = useNavigate();
  const { isOffline } = useOfflineStatus();
  const [offlineError, setOfflineError] = useState<string | null>(null);
  
  const password = watch('password');
  
  // Password validation regex
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  useEffect(() => {
    // Generate and store CSRF token
    const csrfToken = generateCsrfToken();
    storeCsrfToken(csrfToken);
  }, []);
  
  const onSubmit = async (data: RegisterFormData) => {
    if (isOffline) {
      setOfflineError("Can't register while offline. Please check your internet connection.");
      return;
    }
    
    // Validate email format
    if (!isValidEmail(data.email)) {
      return;
    }
    
    // Validate password strength
    if (!isStrongPassword(data.password)) {
      return;
    }
    
    const { email, password, firstName, lastName } = data;
    
    try {
      await signup(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: 'visitor', // Default role, can be changed by admin later
      });
      
      // Save user data to local storage for offline access
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_firstName', firstName);
      localStorage.setItem('user_lastName', lastName);
      
      // Show success message
      alert('Registration successful! Please log in with your credentials.');
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-fade py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Activity className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your account
            </Link>
          </p>
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
              You are currently offline. Registration requires an internet connection.
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  {...register('firstName', { 
                    required: 'First name is required',
                  })}
                  className={`form-input ${errors.firstName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  {...register('lastName', { 
                    required: 'Last name is required',
                  })}
                  className={`form-input ${errors.lastName ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
                )}
              </div>
            </div>
            
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
                {...register('password', { 
                  required: 'Password is required',
                  pattern: {
                    value: passwordRegex,
                    message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character'
                  }
                })}
                className={`form-input ${errors.password ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters and include uppercase, lowercase, number and special character
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className={`form-input ${errors.confirmPassword ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
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
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;