import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import db from './db.ts';

const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  return process.env.SESSION_SECRET || EPHEMERAL_FALLBACK_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (derivedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derivedBuf, expectedBuf);
}

export interface AuthPayload {
  userId: number;
  role: 'job_seeker' | 'employer' | 'mentor' | 'admin';
  email: string;
  exp: number;
}

export function signToken(payload: Omit<AuthPayload, 'exp'>): string {
  const fullPayload: AuthPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getSigningSecret())
      .update(encoded)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as AuthPayload;
    if (!decoded || typeof decoded.userId !== 'number' || decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: 'job_seeker' | 'employer' | 'mentor' | 'admin';
    email: string;
  };
}

function extractBearer(req: Request): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return verifyToken(token);
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const payload = extractBearer(req);
  if (payload) {
    const userRow = db
      .prepare('SELECT id, role, email FROM users WHERE id = ? AND is_sample = 0')
      .get(payload.userId) as { id: number; role: AuthPayload['role']; email: string } | undefined;
    if (userRow) {
      req.user = userRow;
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const payload = extractBearer(req);
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const userRow = db
    .prepare('SELECT id, role, email FROM users WHERE id = ? AND is_sample = 0')
    .get(payload.userId) as { id: number; role: AuthPayload['role']; email: string } | undefined;
  if (!userRow) {
    return res.status(401).json({ error: 'Session invalid or expired. Please sign in again.' });
  }
  req.user = userRow;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator privileges required.' });
    }
    next();
  });
}
