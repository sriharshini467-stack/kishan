import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../server/db';
import { SupportedLanguage } from '../src/i18n/translations';

export const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kisansetu_secure_jwt_secret_key_2026';

// Helper to generate JWT token
export function generateToken(user: { id: string; phone: string; primaryRole: string }): string {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      primaryRole: user.primaryRole,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Authentication Middleware
export function authenticateToken(req: Request, res: Response, next: () => void): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.users.get(decoded.id);
    if (!user) {
      res.status(404).json({ message: 'User not found or token invalid' });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}

/**
 * POST /api/auth/signup
 * Registration Form Fields: Full Name, Phone Number, Password, Retype Password, Location, Preferred Language
 */
authRouter.post('/signup', (req: Request, res: Response): void => {
  try {
    const { name, phone, password, confirmPassword, location, preferredLanguage } = req.body;

    // Validation
    if (!name || !phone || !password || !location) {
      res.status(400).json({ message: 'All fields (Name, Phone, Password, Location) are required.' });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match.' });
      return;
    }

    // Check if phone already registered
    for (const u of db.users.values()) {
      if (u.phone === cleanPhone) {
        res.status(409).json({ message: 'A user with this mobile number already exists. Please sign in.' });
        return;
      }
    }

    // Hash password with bcryptjs
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUserId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const validLang: SupportedLanguage = ['en', 'hi', 'te', 'ta', 'kn', 'mr'].includes(preferredLanguage)
      ? preferredLanguage
      : 'en';

    const newUser = {
      id: newUserId,
      name: name.trim(),
      phone: cleanPhone,
      location: location.trim(),
      preferredLanguage: validLang,
      primaryRole: 'unassigned' as const,
      subRole: undefined,
      createdAt: new Date().toISOString(),
    };

    db.users.set(newUser.id, newUser);
    db.userPasswords.set(newUser.phone, passwordHash);

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully! Please select your role.',
      token,
      user: newUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error during registration.' });
  }
});

/**
 * POST /api/auth/login
 * Login Form Fields: Phone Number and Password
 */
authRouter.post('/login', (req: Request, res: Response): void => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ message: 'Phone number and password are required.' });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    let matchedUser = null;
    for (const u of db.users.values()) {
      if (u.phone === cleanPhone) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      res.status(401).json({ message: 'No account found with this phone number. Please register.' });
      return;
    }

    const storedHash = db.userPasswords.get(cleanPhone);
    if (!storedHash || !bcrypt.compareSync(password, storedHash)) {
      res.status(401).json({ message: 'Incorrect password. Please verify and try again.' });
      return;
    }

    const token = generateToken(matchedUser);

    res.json({
      message: 'Logged in successfully',
      token,
      user: matchedUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error during sign in.' });
  }
});

/**
 * PATCH /api/auth/select-role
 * Updates role and subRole for logged-in user
 */
authRouter.patch('/select-role', authenticateToken, (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { primaryRole, subRole } = req.body;

    if (!['supplier', 'buyer'].includes(primaryRole)) {
      res.status(400).json({ message: "Invalid role. Must be 'supplier' or 'buyer'." });
      return;
    }

    user.primaryRole = primaryRole;
    user.subRole = subRole || (primaryRole === 'supplier' ? 'farmer' : 'grocer');
    db.users.set(user.id, user);

    const token = generateToken(user);

    res.json({
      message: 'Role updated successfully',
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error updating role.' });
  }
});

/**
 * GET /api/auth/me
 * Returns authenticated user info
 */
authRouter.get('/me', authenticateToken, (req: Request, res: Response): void => {
  const user = (req as any).user;
  res.json({ user });
});

/**
 * PATCH /api/auth/language
 * Update user preferred language
 */
authRouter.patch('/language', authenticateToken, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { language } = req.body;
  if (['en', 'hi', 'te', 'ta', 'kn', 'mr'].includes(language)) {
    user.preferredLanguage = language;
    db.users.set(user.id, user);
    res.json({ message: 'Language updated', user });
  } else {
    res.status(400).json({ message: 'Unsupported language' });
  }
});
