const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // Node.js built-in module

const JWT_SECRET = process.env.JWT_SECRET || '417283f471707f1a9615a50950bc43825f4a2b7309bbd18315f34df858dcbe1d4f760d94a676b72db6dd8dd70788513d81feb79e8315d0823d4a56fe52adf8a9';
const JWT_EXPIRES_IN = '24h';

class AuthService {
  // Hash password using crypto
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  // Verify password
  comparePasswords(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === calculatedHash;
  }

  generateToken(user) { // Generate a JWT token for the user
    const payload = {
      userId: user.user_id,
      email: user.email,
      username: user.username
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }); // Sign the payload with the JWT secret and return the token
  }

  verifyToken(token) { // Verify a JWT token
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = new AuthService(); 