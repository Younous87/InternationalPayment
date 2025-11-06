import { validateEmail, validateUsername, validateAccountNumber } from '../utils/inputValidation.js';

describe('Input Validation Utils', () => {
  describe('validateEmail', () => {
    test('should accept valid email', () => {
      expect(validateEmail('test@example.com').isValid).toBe(true);
    });

    test('should reject invalid email', () => {
      expect(validateEmail('invalid-email').isValid).toBe(false);
    });
  });

  describe('validateUsername', () => {
    test('should accept valid username', () => {
      expect(validateUsername('testuser123').isValid).toBe(true);
    });

    test('should reject invalid username', () => {
      expect(validateUsername('us').isValid).toBe(false); // too short
    });
  });

  describe('validateAccountNumber', () => {
    test('should accept valid account number', () => {
      expect(validateAccountNumber('123456').isValid).toBe(true);
    });

    test('should reject invalid account number', () => {
      expect(validateAccountNumber('012345').isValid).toBe(false); // starts with 0
    });
  });
});