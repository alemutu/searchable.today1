import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore, useNotificationStore } from '../lib/store';
import { Activity, Lock, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { isStrongPassword } from '../lib/security';

const PasswordChange: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  });

  // Check if this is a first login
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    // Check if user is logged in and if this is their first login
    const checkFirstLogin = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_login')
            .eq('id', user.id)
            .single();
            
          if (error) throw error;
          
          // If first_login is true or null (not set yet), consider it a first login
          setIsFirstLogin(data?.first_login !== false);
        } catch (error) {
          console.error('Error checking first login status:', error);
          // Default to false if there's an error
          setIsFirstLogin(false);
        }
      }
    };
    
    checkFirstLogin();
    
    // If user is not logged in and not loading, redirect to login
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Check password strength as user types
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate password
    if (!isStrongPassword(password)) {
      setError('Please ensure your password meets all the requirements');
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password
      });
      
      if (updateError) throw updateError;
      
      // If this is a first login, update the first_login flag
      if (isFirstLogin && user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ first_login: false })
          .eq('id', user.id);
          
        if (profileError) {
          console.error('Error updating first login status:', profileError);
          // Non-critical error, continue
        }
      }
      
      addNotification({
        message: 'Password changed successfully',
        type: 'success'
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // If still checking auth status, show loading
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-fade py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <Activity className="h-12 w-12 text-primary-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            {isFirstLogin ? 'Set Your Password' : 'Change Your Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isFirstLogin 
              ? 'You need to set a new password before continuing' 
              : 'Enter your new password below'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-error-400 mt-0.5 mr-3" />
              <span>{error}</span>
            </div>
          )}
          
          {isFirstLogin && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <span>For security reasons, you must change your password before accessing the system.</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10 pr-10"
                  placeholder="Enter new password"
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
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input pl-10 pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Password Requirements</h3>
            <ul className="space-y-1">
              <li className="flex items-center text-sm">
                {passwordStrength.hasMinLength ? (
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                )}
                <span className={passwordStrength.hasMinLength ? 'text-gray-700' : 'text-gray-500'}>
                  At least 8 characters
                </span>
              </li>
              <li className="flex items-center text-sm">
                {passwordStrength.hasUppercase ? (
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                )}
                <span className={passwordStrength.hasUppercase ? 'text-gray-700' : 'text-gray-500'}>
                  At least one uppercase letter
                </span>
              </li>
              <li className="flex items-center text-sm">
                {passwordStrength.hasLowercase ? (
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                )}
                <span className={passwordStrength.hasLowercase ? 'text-gray-700' : 'text-gray-500'}>
                  At least one lowercase letter
                </span>
              </li>
              <li className="flex items-center text-sm">
                {passwordStrength.hasNumber ? (
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                )}
                <span className={passwordStrength.hasNumber ? 'text-gray-700' : 'text-gray-500'}>
                  At least one number
                </span>
              </li>
              <li className="flex items-center text-sm">
                {passwordStrength.hasSpecial ? (
                  <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300 mr-2" />
                )}
                <span className={passwordStrength.hasSpecial ? 'text-gray-700' : 'text-gray-500'}>
                  At least one special character
                </span>
              </li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              ) : null}
              {isFirstLogin ? 'Set Password & Continue' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordChange;