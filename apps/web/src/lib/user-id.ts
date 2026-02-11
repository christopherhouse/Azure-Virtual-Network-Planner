// User ID Generation and Persistence
// Provides stable user identification across sessions using cookie-first with localStorage fallback

const USER_ID_COOKIE_NAME = 'vnetplanner_user_id';
const USER_ID_STORAGE_KEY = 'vnetplanner_user_id';
const USER_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // 2 years in seconds

/**
 * Generate a RFC 4122 v4 compliant UUID
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(nameEQ)) {
      return decodeURIComponent(trimmed.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Set a cookie with the given name, value, and max age
 */
function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  const encodedValue = encodeURIComponent(value);
  // SameSite=Lax for security, Secure only in production (HTTPS)
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodedValue}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Get value from localStorage
 */
function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage might be blocked or full
    return null;
  }
}

/**
 * Set value in localStorage
 */
function setLocalStorage(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage might be blocked or full - silently fail
    console.warn('Failed to persist user ID to localStorage');
  }
}

/**
 * Validate that a string is a valid UUID v4
 */
function isValidUUID(str: string): boolean {
  const uuidv4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidv4Regex.test(str);
}

/**
 * Get or create a stable user ID
 *
 * Priority:
 * 1. Check cookie (preferred for cross-tab consistency)
 * 2. Check localStorage (fallback if cookies blocked)
 * 3. Generate new ID and persist to both
 *
 * @returns The user's stable unique identifier
 */
export function getUserId(): string {
  // Server-side rendering guard
  if (typeof window === 'undefined') {
    return '';
  }

  // Try cookie first
  const cookieId = getCookie(USER_ID_COOKIE_NAME);
  if (cookieId && isValidUUID(cookieId)) {
    // Ensure localStorage is in sync
    const storageId = getLocalStorage(USER_ID_STORAGE_KEY);
    if (storageId !== cookieId) {
      setLocalStorage(USER_ID_STORAGE_KEY, cookieId);
    }
    return cookieId;
  }

  // Try localStorage as fallback
  const storageId = getLocalStorage(USER_ID_STORAGE_KEY);
  if (storageId && isValidUUID(storageId)) {
    // Restore cookie from localStorage
    setCookie(USER_ID_COOKIE_NAME, storageId, USER_ID_COOKIE_MAX_AGE);
    return storageId;
  }

  // Generate new ID
  const newId = generateUUID();

  // Persist to both cookie and localStorage
  setCookie(USER_ID_COOKIE_NAME, newId, USER_ID_COOKIE_MAX_AGE);
  setLocalStorage(USER_ID_STORAGE_KEY, newId);

  return newId;
}

/**
 * Clear the user ID from all storage
 * Useful for testing or allowing users to start fresh
 */
export function clearUserId(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${USER_ID_COOKIE_NAME}=; Max-Age=0; Path=/`;
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(USER_ID_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Check if a user ID exists (user has visited before)
 */
export function hasUserId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const cookieId = getCookie(USER_ID_COOKIE_NAME);
  if (cookieId && isValidUUID(cookieId)) {
    return true;
  }

  const storageId = getLocalStorage(USER_ID_STORAGE_KEY);
  return storageId !== null && isValidUUID(storageId);
}
