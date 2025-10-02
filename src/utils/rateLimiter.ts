// Client-side rate limiting using localStorage
// Limits: 15 requests per 6 hours per device/user

interface RateLimitInfo {
  requests: number[];
  lastReset: number;
}

const RATE_LIMIT_KEY = 'latinium_rate_limit';
const MAX_REQUESTS = 15;
const TIME_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Generates a unique device/user identifier for rate limiting
 */
function getDeviceId(): string {
  // Try to use a persistent identifier first
  let deviceId = localStorage.getItem('latinium_device_id');

  if (!deviceId) {
    // Generate a fingerprint based on browser characteristics
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.indexedDB,
      !!window.localStorage,
      !!window.sessionStorage
    ].join('|');

    // Create a simple hash of the fingerprint
    deviceId = btoa(fingerprint).slice(0, 16);
    localStorage.setItem('latinium_device_id', deviceId);
  }

  return deviceId;
}

/**
 * Gets current rate limit information from localStorage
 */
function getRateLimitInfo(): RateLimitInfo {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RateLimitInfo;
      // Clean up old requests outside the time window
      const now = Date.now();
      const validRequests = parsed.requests.filter(time => now - time < TIME_WINDOW_MS);

      return {
        requests: validRequests,
        lastReset: parsed.lastReset || now
      };
    }
  } catch (error) {
    console.warn('Failed to load rate limit info from localStorage:', error);
  }

  return { requests: [], lastReset: Date.now() };
}

/**
 * Saves rate limit information to localStorage
 */
function saveRateLimitInfo(info: RateLimitInfo): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(info));
  } catch (error) {
    console.warn('Failed to save rate limit info to localStorage:', error);
  }
}

/**
 * Checks if the current device/user is rate limited
 */
export function checkRateLimit(): {
  isLimited: boolean;
  remainingRequests: number;
  resetTime: number;
  timeUntilReset: number;
} {
  const info = getRateLimitInfo();
  const now = Date.now();

  // Clean up old requests
  const validRequests = info.requests.filter(time => now - time < TIME_WINDOW_MS);

  const isLimited = validRequests.length >= MAX_REQUESTS;
  const remainingRequests = Math.max(0, MAX_REQUESTS - validRequests.length);
  const timeUntilReset = validRequests.length > 0
    ? Math.max(0, TIME_WINDOW_MS - (now - Math.min(...validRequests)))
    : 0;

  return {
    isLimited,
    remainingRequests,
    resetTime: validRequests.length > 0 ? Math.min(...validRequests) + TIME_WINDOW_MS : now,
    timeUntilReset
  };
}

/**
 * Records an analysis request for rate limiting
 */
export function recordAnalysisRequest(): void {
  const info = getRateLimitInfo();
  const now = Date.now();

  // Add current request timestamp
  info.requests.push(now);

  // Clean up old requests outside the time window
  info.requests = info.requests.filter(time => now - time < TIME_WINDOW_MS);

  saveRateLimitInfo(info);
}

/**
 * Gets formatted time until reset for display
 */
export function getTimeUntilResetFormatted(): string {
  const { timeUntilReset } = checkRateLimit();

  if (timeUntilReset === 0) return 'Ready';

  const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
  const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Gets rate limit status for UI display
 */
export function getRateLimitStatus(): {
  remaining: number;
  total: number;
  percentage: number;
  timeUntilReset: string;
  isLimited: boolean;
} {
  const { isLimited, remainingRequests, timeUntilReset } = checkRateLimit();

  return {
    remaining: remainingRequests,
    total: MAX_REQUESTS,
    percentage: Math.round((remainingRequests / MAX_REQUESTS) * 100),
    timeUntilReset: getTimeUntilResetFormatted(),
    isLimited
  };
}
