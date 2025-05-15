import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../lib/store';
import { Activity, WifiOff, Shield, Eye, EyeOff } from 'lucide-react';
import { useOfflineStatus } from '../../lib/hooks/useOfflineStatus';
import { isValidEmail, generateCsrfToken, storeCsrfToken } from '../../lib/security';
import { supabase } from '../../lib/supabase';

interface AdminLoginFormData {
  email: string;
  password: string;
}

const AdminLoginForm: React.FC = () => {
  const { login, isLoading, error, isAdmin } = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<AdminLoginFormData>();
  const { isOffline } = useOfflineStatus();
  const navigate = useNavigate();
  const location = useLocation();
  const [offlineError, setOfflineError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    const { user, isAdmin } = useAuthStore.getState();
    if (user && isAdmin) {
      navigate('/super-admin');
    }
    
    // Check for lockout in localStorage
    const storedLockout = localStorage.getItem('adminLoginLockout');
    if (storedLockout) {
      const lockoutTime = new Date(storedLockout);
      if (lockoutTime > new Date()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('adminLoginLockout');
      }
    }
    
    // Get stored login attempts
    const storedAttempts = localStorage.getItem('adminLoginAttempts');
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts, 10));
    }
    
    // Generate and store CSRF token
    const csrfToken = generateCsrfToken();
    storeCsrfToken(csrfToken);
  }, [navigate]);
  
  const handlePasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/change-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setResetEmailSent(true);
    } catch (error: any) {
      console.error('Password reset error:', error.message);
      setRoleError(`Error sending password reset: ${error.message}`);
    }
  };
  
  const onSubmit = async (data: AdminLoginFormData) => {
    if (isOffline) {
      setOfflineError("Can't log in while offline. Please check your internet connection.");
      return;
    }
    
    // Check if account is locked out
    if (lockoutUntil && lockoutUntil > new Date()) {
      const timeLeft = Math.ceil((lockoutUntil.getTime() - new Date().getTime()) / 60000);
      setRoleError(`Too many failed attempts. Please try again in ${timeLeft} minutes.`);
      return;
    }
    
    // Validate email format
    if (!isValidEmail(data.email)) {
      setRoleError("Please enter a valid email address.");
      return;
    }
    
    setRoleError(null);
    
    try {
      await login(data.email, data.password);
      
      // Check if the user is a super_admin
      const { isAdmin } = useAuthStore.getState();
      
      if (!isAdmin) {
        setRoleError("This login is for Super Admin only.");
        // Logout the user since they're not a super_admin
        await useAuthStore.getState().logout();
        return;
      }
      
      // Reset login attempts on successful login
      setLoginAttempts(0);
      localStorage.removeItem('adminLoginAttempts');
      localStorage.removeItem('adminLoginLockout');
      
      // Redirect to the super admin dashboard
      navigate('/super-admin');
    } catch (error) {
      console.error('Login error:', error);
      
      // Increment login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('adminLoginAttempts', newAttempts.toString());
      
      // Implement lockout after 3 failed attempts (stricter for admin)
      if (newAttempts >= 3) {
        const lockoutTime = new Date();
        lockoutTime.setMinutes(lockoutTime.getMinutes() + 30); // 30 minute lockout
        setLockoutUntil(lockoutTime);
        localStorage.setItem('adminLoginLockout', lockoutTime.toISOString());
        setRoleError(`Too many failed attempts. Account locked for 30 minutes.`);
      }
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-fade py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Shield className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Super Admin Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            This portal is for Super Admins only.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              The email or password you entered is incorrect. Please try again or reset your password.
            </div>
          )}
          
          {roleError && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md">
              {roleError}
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
          
          {resetEmailSent && (
            <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-md">
              Password reset instructions have been sent to your email address.
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register('password', { 
                    required: 'Password is required'
                  })}
                  className={`form-input pr-10 ${errors.password ? 'border-error-300 focus:ring-error-500 focus:border-error-500' : ''}`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
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
              <button
                type="button"
                onClick={() => {
                  const email = (document.getElementById('email') as HTMLInputElement)?.value;
                  if (email && isValidEmail(email)) {
                    handlePasswordReset(email);
                  } else {
                    setRoleError("Please enter a valid email address to reset your password.");
                  }
                }}
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isOffline || (lockoutUntil && lockoutUntil > new Date())}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Sign in as Super Admin
            </button>
          </div>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Not an admin?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Go to regular login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginForm;