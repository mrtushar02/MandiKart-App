/**
 * MandiKart — UserApp Auth Controller (Buyers)
 * Enforces real user data verification and persistent database integrity in Supabase.
 */

import { Request, Response } from 'express';
import { UserRole } from '@mandikart/shared-types';
import {
  auditLog,
  SessionManager,
  SupabaseAuthService,
  getSupabaseAdmin,
  OtpService,
} from '@mandikart/shared-core';

export class BuyerAuthController {
  /**
   * Register a new Buyer account with their actual original details in Supabase.
   */
  static async register(req: Request, res: Response): Promise<void> {
    const { phone, fullName, email, buyerType = 'RETAIL', city = 'Pune', state = 'Maharashtra', preferredLanguage = 'en' } = req.body;

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'A valid 10-digit mobile number is required.' },
      });
      return;
    }

    if (!fullName || String(fullName).trim().length < 2) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Full name is required.' },
      });
      return;
    }

    const rawDigits = String(phone).replace(/\D/g, '').slice(-10);
    const cleanPhone = `+91${rawDigits}`;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    const supabase = getSupabaseAdmin();

    try {
      // 1. Check if user already exists
      const { data: existing } = await supabase
        .from('buyers')
        .select('id, phone, email')
        .or(`phone.eq.${cleanPhone},phone.eq.${rawDigits}`)
        .maybeSingle();

      if (existing) {
        res.status(409).json({
          data: null,
          meta: null,
          error: {
            code: 'ACCOUNT_EXISTS',
            message: 'An account with this mobile number already exists. Please sign in.',
          },
        });
        return;
      }

      // 2. Insert original buyer data into Supabase
      const { data: newBuyer, error: insErr } = await supabase
        .from('buyers')
        .insert({
          phone: cleanPhone,
          full_name: String(fullName).trim(),
          email: cleanEmail,
          buyer_type: buyerType === 'BULK' ? 'BULK' : 'RETAIL',
          preferred_language: preferredLanguage,
          is_verified: true,
          addresses: [
            {
              id: `addr_${Date.now()}`,
              label: 'Default',
              city,
              state,
              isDefault: true,
            },
          ],
        })
        .select()
        .single();

      if (insErr || !newBuyer) {
        throw new Error(insErr?.message || 'Failed to create buyer account in database.');
      }

      // 3. Register user in Supabase Auth if email and password are provided
      if (cleanEmail && req.body.password) {
        try {
          await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: String(req.body.password),
            email_confirm: true,
            user_metadata: {
              fullName: String(fullName).trim(),
              phone: cleanPhone,
              role: UserRole.BUYER,
            },
          });
        } catch (authErr: any) {
          console.warn('[BuyerRegister] Supabase auth.users sync note:', authErr?.message);
        }
      }

      // 4. Create Session
      const session = SessionManager.createSession({
        userId: newBuyer.id,
        role: UserRole.BUYER,
        phone: cleanPhone,
        email: cleanEmail || undefined,
      });

      await auditLog({
        actorId: newBuyer.id,
        role: UserRole.BUYER,
        action: 'BUYER_REGISTER',
        resourceType: 'USER',
        resourceId: newBuyer.id,
        metadata: { phone: cleanPhone, fullName: newBuyer.full_name },
      });

      res.status(201).json({
        data: {
          token: session.token,
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
          buyer: {
            id: newBuyer.id,
            fullName: newBuyer.full_name,
            phone: newBuyer.phone,
            email: newBuyer.email,
            buyerType: newBuyer.buyer_type,
            city,
            state,
            role: 'BUYER',
          },
        },
        meta: null,
        error: null,
      });
    } catch (err: any) {
      console.error('[BuyerAuthController.register] Error:', err);
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'REGISTRATION_ERROR', message: err?.message || 'Registration failed.' },
      });
    }
  }

  /**
   * Log in an existing buyer. Strictly verifies account existence in Supabase.
   */
  static async login(req: Request, res: Response): Promise<void> {
    const { phone, email, password } = req.body;

    const rawInput = String(phone || email || '').trim();
    const isEmailInput = rawInput.includes('@');
    const targetEmail = isEmailInput ? rawInput.toLowerCase() : (email ? String(email).trim().toLowerCase() : '');

    if (!rawInput && !email && !phone) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Phone number or email is required.' },
      });
      return;
    }

    // Direct Supabase Email/Password authentication
    if (targetEmail && password) {
      try {
        const session = await SupabaseAuthService.authenticateWithEmailPassword(
          targetEmail,
          password,
          UserRole.BUYER
        );
        res.status(200).json({
          data: {
            token: session.token,
            sessionId: session.sessionId,
            expiresAt: session.expiresAt,
            buyer: {
              id: session.user.id,
              fullName: session.user.fullName,
              phone: session.user.phone,
              email: session.user.email,
              buyerType: (session.user as any).buyerType || 'RETAIL',
              city: (session.user as any).city || 'Pune',
              state: (session.user as any).state || 'Maharashtra',
              role: 'BUYER',
            },
          },
          meta: null,
          error: null,
        });
        return;
      } catch (authErr: any) {
        res.status(401).json({
          data: null,
          meta: null,
          error: { code: 'AUTHENTICATION_FAILED', message: authErr?.message || 'Invalid email or password.' },
        });
        return;
      }
    }

    const rawDigits = !isEmailInput && phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
    const cleanPhone = rawDigits ? `+91${rawDigits}` : '';
    const cleanEmail = targetEmail;

    const supabase = getSupabaseAdmin();

    try {
      let query = supabase.from('buyers').select('*');
      if (cleanPhone && cleanEmail) {
        query = query.or(`phone.eq.${cleanPhone},phone.eq.${rawDigits},email.eq.${cleanEmail}`);
      } else if (cleanPhone) {
        query = query.or(`phone.eq.${cleanPhone},phone.eq.${rawDigits}`);
      } else {
        query = query.eq('email', cleanEmail);
      }
      const { data: dbBuyer, error } = await query.maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!dbBuyer) {
        res.status(404).json({
          data: null,
          meta: null,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'No buyer account found with these credentials. Please register first.',
          },
        });
        return;
      }

      let city = 'Pune';
      let state = 'Maharashtra';
      if (Array.isArray(dbBuyer.addresses) && dbBuyer.addresses[0]) {
        city = dbBuyer.addresses[0].city || city;
        state = dbBuyer.addresses[0].state || state;
      }

      // Issue 15-day rolling session
      const session = SessionManager.createSession({
        userId: dbBuyer.id,
        role: UserRole.BUYER,
        phone: dbBuyer.phone,
        email: dbBuyer.email || undefined,
      });

      await auditLog({
        actorId: dbBuyer.id,
        role: UserRole.BUYER,
        action: 'BUYER_LOGIN',
        resourceType: 'USER',
        resourceId: dbBuyer.id,
      });

      res.status(200).json({
        data: {
          token: session.token,
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
          buyer: {
            id: dbBuyer.id,
            fullName: dbBuyer.full_name,
            phone: dbBuyer.phone,
            email: dbBuyer.email,
            buyerType: dbBuyer.buyer_type || 'RETAIL',
            city,
            state,
            role: 'BUYER',
          },
        },
        meta: null,
        error: null,
      });
    } catch (e: any) {
      console.error('[BuyerAuthController.login] Error:', e);
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'DATABASE_ERROR', message: e?.message || 'Database connection error.' },
      });
    }
  }

  /**
   * Dispatches OTP via SMS Gateway and records it into Supabase otps table.
   */
  static async sendOtp(req: Request, res: Response): Promise<void> {
    const { phone, channel = 'SMS' } = req.body;

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      res.status(400).json({
        data: null,
        meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Valid 10-digit mobile number required.' },
      });
      return;
    }

    try {
      const result = await OtpService.sendOtp(phone, channel);
      res.status(200).json({
        data: result,
        meta: null,
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'OTP_SEND_ERROR', message: err?.message || 'Failed to dispatch OTP.' },
      });
    }
  }

  /**
   * Log in / authenticate with phone OTP. Strictly verifies OTP against Supabase.
   */
  static async loginWithPhoneOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, fullName } = req.body;
      const code = req.body.code || req.body.otp;

      if (!phone || !code) {
        res.status(400).json({
          data: null,
          meta: null,
          error: { code: 'VALIDATION_ERROR', message: 'Phone and OTP code are required' },
        });
        return;
      }

      const rawDigits = String(phone).replace(/\D/g, '').slice(-10);
      const cleanPhone = `+91${rawDigits}`;

      // 1. Verify OTP with OtpService
      const verification = await OtpService.verifyOtp(cleanPhone, String(code));
      if (!verification.success) {
        res.status(400).json({
          data: null,
          meta: null,
          error: { code: 'INVALID_OTP', message: verification.message },
        });
        return;
      }

      // 2. Authenticate or create user in Supabase
      const session = await SupabaseAuthService.authenticateWithPhoneOtp(
        cleanPhone,
        UserRole.BUYER,
        fullName
      );

      res.status(200).json({
        data: {
          ...session,
          buyer: {
            id: session.user.id,
            fullName: session.user.fullName,
            phone: session.user.phone,
            email: session.user.email,
            buyerType: 'RETAIL',
            city: 'Bhubaneswar',
            state: 'Odisha',
            role: 'BUYER',
          },
        },
        meta: null,
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'PHONE_AUTH_ERROR', message: err?.message || 'Phone OTP login failed' },
      });
    }
  }

  /**
   * Log in with Google OAuth / Gmail and sync details into Supabase.
   */
  static async loginWithGoogle(req: Request, res: Response): Promise<void> {
    try {
      const { email, fullName, avatarUrl, idToken, phone } = req.body;
      const targetEmail = email || `google.buyer.${Date.now()}@mandikart.in`;
      const targetName = fullName || 'Google Buyer';

      const session = await SupabaseAuthService.authenticateWithGoogle({
        email: targetEmail,
        fullName: targetName,
        avatarUrl,
        idToken,
        phone,
        role: UserRole.BUYER,
      });

      res.status(200).json({
        data: {
          ...session,
          buyer: {
            id: session.user.id,
            fullName: session.user.fullName,
            phone: session.user.phone,
            email: session.user.email,
            avatarUrl: session.user.avatarUrl || avatarUrl,
            buyerType: (session.user as any).buyerType || 'RETAIL',
            city: (session.user as any).city || 'Pune',
            state: (session.user as any).state || 'Maharashtra',
            role: 'BUYER',
          },
        },
        meta: null,
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'GOOGLE_AUTH_ERROR', message: err?.message || 'Google Sign-In failed' },
      });
    }
  }

  /**
   * Updates buyer profile details in Supabase.
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    const authUser = (req as any).user;
    const buyerId = authUser?.userId || authUser?.id || req.body.buyerId;

    if (!buyerId) {
      res.status(401).json({
        data: null,
        meta: null,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to update profile' },
      });
      return;
    }

    const { fullName, email, phone, avatarUrl, city, state, preferredLanguage } = req.body;

    const supabase = getSupabaseAdmin();
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      if (fullName) updateData.full_name = fullName;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`;
      if (avatarUrl) updateData.avatar_url = avatarUrl;
      if (preferredLanguage) updateData.preferred_language = preferredLanguage;

      if (city || state) {
        updateData.addresses = [
          {
            id: `addr_${Date.now()}`,
            label: 'Default',
            city: city || 'Pune',
            state: state || 'Maharashtra',
            isDefault: true,
          },
        ];
      }

      const { data: updated, error } = await supabase
        .from('buyers')
        .update(updateData)
        .eq('id', buyerId)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({
        data: {
          buyer: updated,
          message: 'Profile updated successfully',
        },
        meta: null,
        error: null,
      });
    } catch (err: any) {
      res.status(500).json({
        data: null,
        meta: null,
        error: { code: 'UPDATE_ERROR', message: err?.message || 'Failed to update profile' },
      });
    }
  }

  static async refreshSession(req: Request, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        data: null,
        meta: null,
        error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' },
      });
      return;
    }
    const token = authHeader.split(' ')[1];
    const result = SessionManager.refreshSession(token);
    if (!result.success) {
      res.status(401).json({
        data: null,
        meta: null,
        error: { code: 'SESSION_EXPIRED', message: result.error || 'Session expired. Please log in again.' },
      });
      return;
    }
    res.status(200).json({
      data: {
        token: result.token,
        expiresAt: result.expiresAt,
        message: '15-day session successfully extended.',
      },
      meta: null,
      error: null,
    });
  }
}
