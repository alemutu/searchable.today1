import DOMPurify from 'dompurify';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html);
};

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generate a secure random ID
 */
export const generateSecureId = (): string => {
  return uuidv4();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requires at least 8 characters, one uppercase, one lowercase, one number, and one special character
 */
export const isStrongPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Generate a secure random password
 * Creates a password with at least 12 characters including uppercase, lowercase, numbers, and special characters
 */
export const generateSecurePassword = (): string => {
  const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluding I and O which can be confused
  const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // Excluding l which can be confused
  const numberChars = '23456789'; // Excluding 0 and 1 which can be confused
  const specialChars = '@#$%^&*!-_=+';
  
  // Ensure at least one character from each category
  let password = '';
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length));
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length));
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Add 8 more random characters for a total of 12
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Validate phone number format
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{8,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Check for SQL injection patterns
 */
export const hasSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|CREATE|WHERE)(\s|$)/i,
    /(\s|^)(OR|AND)(\s+)(['"]?\d+['"]?\s*=\s*['"]?\d+['"]?)/i,
    /--/,
    /;.*/,
    /\/\*.+\*\//
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Encode URI component safely
 */
export const safeEncodeURIComponent = (str: string): string => {
  return encodeURIComponent(str)
    .replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
};

/**
 * Generate a CSRF token
 */
export const generateCsrfToken = (): string => {
  return uuidv4();
};

/**
 * Store CSRF token in session storage
 */
export const storeCsrfToken = (token: string): void => {
  sessionStorage.setItem('csrfToken', token);
};

/**
 * Validate CSRF token
 */
export const validateCsrfToken = (token: string): boolean => {
  const storedToken = sessionStorage.getItem('csrfToken');
  return token === storedToken;
};

/**
 * Clear sensitive data from storage
 */
export const clearSensitiveData = (): void => {
  // Clear auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Clear session storage
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
};

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private attempts: Map<string, number> = new Map();
  private timestamps: Map<string, number> = new Map();
  private readonly maxAttempts: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxAttempts: number, timeWindowSeconds: number) {
    this.maxAttempts = maxAttempts;
    this.timeWindow = timeWindowSeconds * 1000;
  }

  public attempt(key: string): boolean {
    const now = Date.now();
    const timestamp = this.timestamps.get(key) || 0;
    
    // Reset if outside time window
    if (now - timestamp > this.timeWindow) {
      this.attempts.set(key, 1);
      this.timestamps.set(key, now);
      return true;
    }
    
    // Increment attempts
    const attempts = (this.attempts.get(key) || 0) + 1;
    this.attempts.set(key, attempts);
    
    // Check if rate limit exceeded
    if (attempts > this.maxAttempts) {
      return false;
    }
    
    return true;
  }

  public getRemainingAttempts(key: string): number {
    const attempts = this.attempts.get(key) || 0;
    return Math.max(0, this.maxAttempts - attempts);
  }

  public getTimeToReset(key: string): number {
    const now = Date.now();
    const timestamp = this.timestamps.get(key) || 0;
    return Math.max(0, this.timeWindow - (now - timestamp));
  }
}

// Create a global rate limiter instance
export const apiRateLimiter = new RateLimiter(100, 60); // 100 requests per minute