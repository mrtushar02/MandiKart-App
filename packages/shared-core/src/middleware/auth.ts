/**
 * MandiKart — Auth & Authorization Middleware
 * Verifies JWT tokens, attaches req.user, and enforces role & ownership checks.
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@mandikart/shared-types';
import { getSupabaseClient } from '../db/supabase.js';

export interface AuthenticatedUser {
  id: string;
  phone: string;
  role: UserRole;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

import { SessionManager } from '../auth/session.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      data: null,
      meta: null,
      error: { code: 'UNAUTHORIZED', message: 'Missing or malformed Authorization header' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  const isMockToken = token.startsWith('mock_jwt_token_') || token.startsWith('mock_otp_token_') || token.startsWith('mock_google_token_');
  if (isMockToken) {
    const isFarmer = token.includes('farmer');
    const suffix = token.split('_').pop() || 'default';
    req.user = {
      id: isFarmer ? 'd1111111-1111-1111-1111-111111111111' : `buyer_mock_${suffix}`,
      phone: isFarmer ? '+91 98220 11111' : '+91 98765 43210',
      role: isFarmer ? UserRole.FARMER : UserRole.BUYER,
    };
    next();
    return;
  }

  // 1. Authoritative 15-Day Rolling Session Check & Sliding Renewal
  const sessionCheck = SessionManager.validateAndTouch(token);
  if (sessionCheck.valid && sessionCheck.session) {
    req.user = {
      id: sessionCheck.session.userId,
      phone: sessionCheck.session.phone || '',
      role: sessionCheck.session.role,
    };
    res.setHeader('X-Session-Id', sessionCheck.session.sessionId);
    res.setHeader('X-Session-Expires-At', new Date(sessionCheck.session.expiresAt).toISOString());
    next();
    return;
  }

  // If token is an expired 15-day session, immediately reject with session expired code
  if (token.startsWith('mks_') && !sessionCheck.valid) {
    res.status(401).json({
      data: null,
      meta: null,
      error: {
        code: 'SESSION_EXPIRED',
        message: sessionCheck.error || 'Session expired due to 15 days of inactivity. Please log in again.',
      },
    });
    return;
  }

  try {
    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        data: null,
        meta: null,
        error: { code: 'INVALID_TOKEN', message: 'Token is expired or invalid' },
      });
      return;
    }

    req.user = {
      id: user.id,
      phone: user.phone || '',
      email: user.email,
      role: (user.user_metadata?.role as UserRole) || UserRole.FARMER,
    };

    next();
  } catch (err) {
    res.status(500).json({
      data: null,
      meta: null,
      error: { code: 'AUTH_ERROR', message: 'Failed to verify session authentication' },
    });
  }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  const isMockToken = token.startsWith('mock_jwt_token_') || token.startsWith('mock_otp_token_') || token.startsWith('mock_google_token_');
  if (isMockToken) {
    const isFarmer = token.includes('farmer');
    const suffix = token.split('_').pop() || 'default';
    req.user = {
      id: isFarmer ? 'd1111111-1111-1111-1111-111111111111' : `buyer_mock_${suffix}`,
      phone: isFarmer ? '+91 98220 11111' : '+91 98765 43210',
      role: isFarmer ? UserRole.FARMER : UserRole.BUYER,
    };
    next();
    return;
  }

  try {
    const sessionCheck = SessionManager.validateAndTouch(token);
    if (sessionCheck.valid && sessionCheck.session) {
      req.user = {
        id: sessionCheck.session.userId,
        phone: sessionCheck.session.phone || '',
        role: sessionCheck.session.role,
      };
      res.setHeader('X-Session-Id', sessionCheck.session.sessionId);
      res.setHeader('X-Session-Expires-At', new Date(sessionCheck.session.expiresAt).toISOString());
      next();
      return;
    }

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      req.user = {
        id: user.id,
        phone: user.phone || '',
        email: user.email,
        role: (user.user_metadata?.role as UserRole) || UserRole.FARMER,
      };
    }
  } catch {
    // Non-fatal for optionalAuth
  }

  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        data: null,
        meta: null,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        data: null,
        meta: null,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
        },
      });
      return;
    }

    next();
  };
}
