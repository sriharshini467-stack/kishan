/**
 * Express Auth Controllers & API Routes (routes/auth.js)
 * Implements signup with bcryptjs hashing, login with JWT issuance, and select-role patch
 */
export { authRouter, authenticateToken, generateToken } from './auth.ts';
