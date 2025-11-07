// Lightweight client-side input validation mirroring backend patterns

const WHITELIST_PATTERNS = {
  alphanumeric: /^[a-zA-Z0-9_-]+$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  idNumber: /^[0-9]{5,20}$/,
  accountNumber: /^[0-9]{8,18}$/,
  address: /^[a-zA-Z0-9\s,.'-]{5,100}$/,
  fullname: /^[a-zA-Z\s.'-]{2,50}$/
};

const INJECTION_PATTERNS = [
  /(;|\b(SELECT|UPDATE|DELETE|INSERT|DROP|ALTER|CREATE|TRUNCATE)\b)/i, // SQL
  /(\$where|\$regex|\$gt|\$lt|\$ne|\$in|\$nin|\$or|\$and)/i, // NoSQL
  /<script[^>]*>|onerror=|onload=|javascript:/i, // XSS
  /(&&|\|\||\b(cat|ls|rm|touch|curl|wget)\b)/i, // Command injection
  /(\.\.\/|\.\.\\|\/[A-Za-z0-9_-]+\/)/, // Path traversal
  /\0/ // Null byte
];

export function validateAgainstWhitelist(value, type) {
  const str = String(value || '').trim();
  let regex;

  switch (type) {
    case 'alphanumeric':
      regex = WHITELIST_PATTERNS.alphanumeric;
      break;
    case 'username':
      regex = WHITELIST_PATTERNS.username;
      break;
    case 'email':
      regex = WHITELIST_PATTERNS.email;
      break;
    case 'idNumber':
      regex = WHITELIST_PATTERNS.idNumber;
      break;
    case 'accountNumber':
      regex = WHITELIST_PATTERNS.accountNumber;
      break;
    case 'address':
      regex = WHITELIST_PATTERNS.address;
      break;
    case 'fullname':
      regex = WHITELIST_PATTERNS.fullname;
      break;
    default:
      return { isValid: false, error: `Unknown whitelist type: ${type}` };
  }

  const isValid = regex.test(str);
  return { isValid, error: isValid ? null : `Invalid ${type}` };
}

export function checkForInjectionPatterns(value) {
  const str = String(value || '');
  const threats = INJECTION_PATTERNS.filter((r) => r.test(str)).map((r) => r.source);
  return { isSafe: threats.length === 0, threats };
}

export function sanitizeInput(value) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .replace(/\0/g, '')
    .trim();
}