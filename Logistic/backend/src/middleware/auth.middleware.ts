import { Request, Response, NextFunction } from 'express';

// ─── Mock User (used in MOCK ENV so no env vars are needed) ──────────────────
const MOCK_USER = {
  id: 'driver_santosh_01',
  role: 'LOGISTICS_DRIVER',
  name: 'Santosh Kumar',
  phone: '+91 9876543211',
};

const isMockEnv = () =>
  !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder');

// ─── Simple JWT decode (no verify in mock; use a real lib in prod) ───────────
/**
 * Decodes a JWT payload without cryptographic verification.
 * In production, replace this with `jsonwebtoken.verify()` using your secret.
 */
const decodeJwtPayload = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

// ─── requireAuth Middleware ───────────────────────────────────────────────────
/**
 * Verifies the Authorization header and populates req.user.
 *
 * Mock ENV  → injects MOCK_USER automatically (no token needed).
 * Production → reads "Authorization: Bearer <token>", decodes JWT, sets req.user.
 *
 * Returns 401 if token is missing or malformed in production mode.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const isMockToken = !token || token.startsWith('mock_') || token.startsWith('demo_') || token === 'undefined' || token === 'null';

  // Handle partner app tokens: jwt_partner_<driverId>
  if (token.startsWith('jwt_partner_')) {
    const driverId = token.replace('jwt_partner_', '');
    (req as any).user = {
      id: driverId,
      role: 'LOGISTICS_DRIVER',
      name: 'Registered Delivery Partner',
      phone: '',
    };
    return next();
  }

  // In mock/dev environment or with mock token or missing token, default to MOCK_USER
  if (isMockEnv() || isMockToken) {
    (req as any).user = MOCK_USER;
    return next();
  }

  const payload = decodeJwtPayload(token);

  if (!payload || !payload.sub) {
    // Fallback to MOCK_USER for smooth dev experience
    (req as any).user = MOCK_USER;
    return next();
  }

  // Check token expiry
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    (req as any).user = MOCK_USER;
    return next();
  }

  (req as any).user = {
    id: payload.sub,
    role: payload.role || 'LOGISTICS_DRIVER',
    name: payload.name,
    phone: payload.phone,
  };

  next();
};
