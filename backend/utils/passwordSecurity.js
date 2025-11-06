import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";

// Ensure environment variables are loaded before reading PASSWORD_PEPPER
dotenv.config();

/**
 * Password Security Utility
 * 
 * Features:
 * - bcrypt hashing with salt (automatic)
 * - Pepper (additional secret key) for defense in depth
 * - Password strength validation
 * - Password history prevention
 */

// Pepper: A secret key stored separately from the database
const envPepper = process.env.PASSWORD_PEPPER ? process.env.PASSWORD_PEPPER.trim() : "";

if (!envPepper) {
    console.warn("PASSWORD_PEPPER is missing. Generating a temporary value. Passwords will break after restart.");
}

const PEPPER = envPepper || crypto.randomBytes(32).toString('hex');

/**
 * bcrypt salt rounds
 * Higher = more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt with pepper
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
    try {
        // Add pepper before hashing
        const pepperedPassword = password + PEPPER;
        
        // Hash with bcrypt (salt is generated automatically)
        const hash = await bcrypt.hash(pepperedPassword, SALT_ROUNDS);
        
        return hash;
    } catch (error) {
        console.error('Error hashing password:', error);
        throw new Error('Password hashing failed');
    }
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored hash to compare against
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, hash) {
    try {
        // Add pepper before verification
        const pepperedPassword = password + PEPPER;
        
        // bcrypt.compare uses timing-safe comparison
        const isValid = await bcrypt.compare(pepperedPassword, hash);
        
        return isValid;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not a common password
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password) {
    const errors = [];
    
    // Check minimum length
    if (!password || password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    
    // Check maximum length (prevent DoS attacks)
    if (password && password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }
    
    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for number
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
    }
    
    // Check for common passwords
    const commonPasswords = [
        'password', 'password123', '12345678', 'qwerty', 'abc123',
        'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
        'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
        'bailey', 'passw0rd', 'shadow', '123123', '654321'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common. Please choose a more secure password');
    }
    
    // Check for sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
        errors.push('Password should not contain sequential characters');
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Password should not contain repeated characters (e.g., "aaa", "111")');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        strength: calculatePasswordStrength(password)
    };
}

/**
 * Calculate password strength score
 * @param {string} password 
 * @returns {string} - 'weak', 'medium', 'strong', or 'very-strong'
 */
function calculatePasswordStrength(password) {
    if (!password) return 'weak';
    
    let score = 0;
    
    // Length score
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    
    // Additional complexity
    if (password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score += 1;
    }
    
    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    if (score <= 6) return 'strong';
    return 'very-strong';
}

/**
 * Check if new password is different from previous passwords
 * Prevents password reuse
 * @param {string} newPassword - New password to check
 * @param {Array<string>} passwordHistory - Array of previous password hashes
 * @returns {Promise<boolean>} - True if password is unique
 */
export async function isPasswordUnique(newPassword, passwordHistory = []) {
    if (!passwordHistory || passwordHistory.length === 0) {
        return true;
    }
    
    // Check against each previous password
    for (const oldHash of passwordHistory) {
        const matches = await verifyPassword(newPassword, oldHash);
        if (matches) {
            return false;
        }
    }
    
    return true;
}

export default {
    hashPassword,
    verifyPassword,
    validatePasswordStrength,
    isPasswordUnique
};
