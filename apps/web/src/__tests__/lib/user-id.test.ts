import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getUserId, clearUserId, hasUserId } from '@/lib/user-id';

describe('User ID Module', () => {
  let mockCookies: Record<string, string>;
  let originalDocument: Document;
  let originalCrypto: Crypto;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockCookies = {};

    // Mock document.cookie
    originalDocument = global.document;
    Object.defineProperty(document, 'cookie', {
      get: () => {
        return Object.entries(mockCookies)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join('; ');
      },
      set: (value: string) => {
        const [nameValue] = value.split(';');
        const [name, val] = nameValue.split('=');
        if (value.includes('Max-Age=0')) {
          delete mockCookies[name.trim()];
        } else if (val !== undefined) {
          mockCookies[name.trim()] = decodeURIComponent(val);
        }
      },
      configurable: true,
    });

    // Mock crypto.randomUUID
    originalCrypto = global.crypto;
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: vi.fn(() => '12345678-1234-4567-89ab-123456789abc'),
        getRandomValues: vi.fn(),
      },
      configurable: true,
    });

    // Mock window.location.protocol
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:' },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  describe('getUserId', () => {
    it('should return ID from cookie if present', () => {
      const existingId = '87654321-4321-4567-89ab-987654321abc';
      mockCookies['vnetplanner_user_id'] = existingId;

      const userId = getUserId();
      expect(userId).toBe(existingId);
    });

    it('should return ID from localStorage if cookie not present', () => {
      const existingId = 'abcdefab-1234-4567-89ab-abcdefabcdef';
      localStorage.setItem('vnetplanner_user_id', existingId);

      const userId = getUserId();
      expect(userId).toBe(existingId);
    });

    it('should generate new UUID if no ID exists', () => {
      const userId = getUserId();
      expect(userId).toBe('12345678-1234-4567-89ab-123456789abc');
    });

    it('should persist new ID to localStorage', () => {
      getUserId();
      expect(localStorage.getItem('vnetplanner_user_id')).toBe(
        '12345678-1234-4567-89ab-123456789abc'
      );
    });

    it('should sync localStorage when cookie exists', () => {
      const existingId = '87654321-4321-4567-89ab-987654321abc';
      mockCookies['vnetplanner_user_id'] = existingId;

      getUserId();
      expect(localStorage.getItem('vnetplanner_user_id')).toBe(existingId);
    });

    it('should restore cookie from localStorage if cookie missing', () => {
      const existingId = 'abcdefab-1234-4567-89ab-abcdefabcdef';
      localStorage.setItem('vnetplanner_user_id', existingId);

      getUserId();
      expect(mockCookies['vnetplanner_user_id']).toBe(existingId);
    });

    it('should reject invalid UUID in cookie', () => {
      mockCookies['vnetplanner_user_id'] = 'invalid-uuid';

      const userId = getUserId();
      // Should generate new ID since cookie is invalid
      expect(userId).toBe('12345678-1234-4567-89ab-123456789abc');
    });

    it('should reject invalid UUID in localStorage', () => {
      localStorage.setItem('vnetplanner_user_id', 'not-a-valid-uuid');

      const userId = getUserId();
      // Should generate new ID since localStorage is invalid
      expect(userId).toBe('12345678-1234-4567-89ab-123456789abc');
    });
  });

  describe('clearUserId', () => {
    it('should remove ID from localStorage', () => {
      localStorage.setItem('vnetplanner_user_id', 'some-id');

      clearUserId();
      expect(localStorage.getItem('vnetplanner_user_id')).toBeNull();
    });

    it('should clear cookie', () => {
      mockCookies['vnetplanner_user_id'] = 'some-id';

      clearUserId();
      expect(mockCookies['vnetplanner_user_id']).toBeUndefined();
    });
  });

  describe('hasUserId', () => {
    it('should return true when cookie exists with valid UUID', () => {
      mockCookies['vnetplanner_user_id'] = '87654321-4321-4567-89ab-987654321abc';

      expect(hasUserId()).toBe(true);
    });

    it('should return true when localStorage has valid UUID', () => {
      localStorage.setItem(
        'vnetplanner_user_id',
        'abcdefab-1234-4567-89ab-abcdefabcdef'
      );

      expect(hasUserId()).toBe(true);
    });

    it('should return false when no ID exists', () => {
      expect(hasUserId()).toBe(false);
    });

    it('should return false when cookie has invalid UUID', () => {
      mockCookies['vnetplanner_user_id'] = 'invalid';

      expect(hasUserId()).toBe(false);
    });

    it('should return false when localStorage has invalid UUID', () => {
      localStorage.setItem('vnetplanner_user_id', 'not-valid');

      expect(hasUserId()).toBe(false);
    });
  });
});
