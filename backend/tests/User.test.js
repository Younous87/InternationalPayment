import { jest } from '@jest/globals';
import User from '../models/User.js';

describe('User Model', () => {
  describe('addToPasswordHistory', () => {
    test('should add password to history', async () => {
      const user = new User({
        username: 'test',
        fullname: 'Test User',
        idNumber: '123456',
        accountNumber: 123456,
        email: 'test@example.com',
        password: 'hashedpassword'
      });

      // Mock save
      user.save = jest.fn().mockResolvedValue(user);

      await user.addToPasswordHistory('newhash');

      expect(user.passwordHistory).toContain('newhash');
      expect(user.save).toHaveBeenCalled();
    });
  });
});