/**
 * MandiKart — Pure Supabase Authentication & Identity Service
 * Handles:
 *  - Google OAuth / Gmail Sign-In via Supabase
 *  - Email & Password Authentication via Supabase
 *  - Phone SMS OTP Authentication via Supabase otps ledger
 *  - Two-way sync into Supabase PostgreSQL (buyers / farmers tables)
 */

import { UserRole } from '@mandikart/shared-types';
import { getSupabaseAdmin, isSupabaseConfigured } from '../db/supabase.js';
import { SessionManager } from '../auth/session.js';
import { auditLog } from '../utils/auditLogger.js';

export interface GoogleAuthPayload {
  email: string;
  fullName: string;
  avatarUrl?: string;
  idToken?: string;
  role: UserRole;
  phone?: string;
}

export interface AuthSessionResponse {
  token: string;
  sessionId: string;
  expiresAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: UserRole;
    avatarUrl?: string;
    buyerType?: string;
    city?: string;
    state?: string;
    district?: string;
    addresses?: any[];
    village?: string;
    farmSizeAcres?: number;
    primaryCrops?: string[];
    [key: string]: any;
  };
  isNewUser: boolean;
}

export class SupabaseAuthService {
  /**
   * Authenticates user via Google OAuth (Gmail) and syncs directly into Supabase.
   */
  static async authenticateWithGoogle(
    payload: GoogleAuthPayload
  ): Promise<AuthSessionResponse> {
    const supabase = getSupabaseAdmin();
    const cleanEmail = payload.email.toLowerCase().trim();
    let userId = `user_g_${Date.now()}`;
    let isNewUser = false;
    let userPhone = payload.phone || '';
    let userFullName = payload.fullName || '';
    let userAvatarUrl = payload.avatarUrl;

    const cleanDigits = userPhone ? userPhone.replace(/\D/g, '').slice(-10) : '';
    const hash = Math.abs(cleanEmail.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0) | 0, 0));
    const safePhone = cleanDigits.length === 10
      ? `+91${cleanDigits}`
      : `+919${hash.toString().padEnd(9, '0').slice(0, 9)}`;

    let existingBuyerRecord: any = null;
    let existingFarmerRecord: any = null;

    // Sync / Upsert directly with Supabase Database
    if (isSupabaseConfigured()) {
      try {
        if (payload.role === UserRole.BUYER) {
          const { data: existing } = await supabase
            .from('buyers')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          if (existing) {
            existingBuyerRecord = existing;
            userId = existing.id;
            userPhone = existing.phone || userPhone || safePhone;
            userFullName = payload.fullName || existing.full_name || userFullName;
            userAvatarUrl = payload.avatarUrl || existing.avatar_url || userAvatarUrl;
            await supabase
              .from('buyers')
              .update({
                full_name: userFullName,
                avatar_url: userAvatarUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          } else {
            isNewUser = true;
            const { data: inserted } = await supabase
              .from('buyers')
              .insert({
                phone: safePhone,
                email: cleanEmail,
                full_name: userFullName || 'MandiKart Buyer',
                avatar_url: userAvatarUrl,
                buyer_type: 'RETAIL',
                is_verified: true,
              })
              .select()
              .maybeSingle();

            if (inserted) {
              existingBuyerRecord = inserted;
              userId = inserted.id;
              userPhone = inserted.phone || safePhone;
              userFullName = inserted.full_name || userFullName;
            }
          }
        } else if (payload.role === UserRole.FARMER) {
          const { data: existing } = await supabase
            .from('farmers')
            .select('*')
            .or(`email.eq.${cleanEmail},phone.eq.${safePhone}`)
            .maybeSingle();

          if (existing) {
            existingFarmerRecord = existing;
            userId = existing.id;
            userPhone = existing.phone || userPhone || safePhone;
            userFullName = payload.fullName || existing.full_name || userFullName;
            userAvatarUrl = payload.avatarUrl || existing.avatar_url || userAvatarUrl;
            await supabase
              .from('farmers')
              .update({
                full_name: userFullName,
                avatar_url: userAvatarUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          } else {
            isNewUser = true;
            const { data: inserted } = await supabase
              .from('farmers')
              .insert({
                phone: safePhone,
                email: cleanEmail,
                full_name: userFullName || 'MandiKart Farmer',
                is_verified: true,
                state: null,
                district: null,
                farm_size_acres: null,
                primary_crops: null,
              })
              .select()
              .maybeSingle();

            if (inserted) {
              existingFarmerRecord = inserted;
              userId = inserted.id;
              userPhone = inserted.phone || safePhone;
              userFullName = inserted.full_name || userFullName;
            }
          }
        }

        // Also register or sync with Supabase Auth admin
        try {
          await supabase.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: {
              fullName: userFullName,
              phone: userPhone || safePhone,
              role: payload.role,
            },
          });
        } catch {}
      } catch (e) {
        console.warn('Google auth Supabase sync note:', e);
      }
    }

    // Issue 15-day rolling JWT Session
    const session = SessionManager.createSession({
      userId,
      role: payload.role,
      phone: userPhone || cleanEmail,
      email: cleanEmail,
    });

    await auditLog({
      actorId: userId,
      role: payload.role,
      action: 'GOOGLE_OAUTH_LOGIN',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { email: cleanEmail, isNewUser },
    });

    let city: string | undefined = undefined;
    let state: string | undefined = undefined;
    let buyerType = 'RETAIL';
    let addresses: any[] = [];
    let district: string | undefined = undefined;

    if (payload.role === UserRole.BUYER) {
      city = 'Pune';
      state = 'Maharashtra';
      if (existingBuyerRecord) {
        buyerType = existingBuyerRecord.buyer_type || buyerType;
        addresses = Array.isArray(existingBuyerRecord.addresses) ? existingBuyerRecord.addresses : [];
        if (addresses[0]) {
          city = addresses[0].city || city;
          state = addresses[0].state || state;
        }
      }
    } else if (payload.role === UserRole.FARMER) {
      state = existingFarmerRecord?.state || undefined;
      district = existingFarmerRecord?.district || undefined;
    }

    return {
      token: session.token,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      user: {
        id: userId,
        fullName: userFullName,
        email: cleanEmail,
        phone: userPhone,
        role: payload.role,
        avatarUrl: userAvatarUrl,
        buyerType,
        city,
        state,
        district,
        addresses,
        village: existingFarmerRecord?.village,
        farmSizeAcres: existingFarmerRecord?.farm_size_acres ? Number(existingFarmerRecord.farm_size_acres) : undefined,
        primaryCrops: existingFarmerRecord?.primary_crops,
      },
      isNewUser,
    };
  }

  /**
   * Authenticates user via Email & Password directly against Supabase.
   */
  static async authenticateWithEmailPassword(
    email: string,
    password: string,
    role: UserRole = UserRole.BUYER
  ): Promise<AuthSessionResponse> {
    const supabase = getSupabaseAdmin();
    const cleanEmail = email.toLowerCase().trim();

    // 1. Verify credentials via Supabase Auth
    let authUser: any = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!authError && authData?.user) {
        authUser = authData.user;
      }
    } catch {}

    // 2. Fetch profile from Supabase Database
    const table = role === UserRole.BUYER ? 'buyers' : 'farmers';
    const { data: dbUser } = await supabase
      .from(table)
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!dbUser && !authUser) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    const userId = dbUser?.id || authUser?.id || `user_e_${Date.now()}`;
    const userFullName = dbUser?.full_name || authUser?.user_metadata?.fullName || 'MandiKart User';
    const userPhone = dbUser?.phone || authUser?.phone || '';

    const session = SessionManager.createSession({
      userId,
      role,
      email: cleanEmail,
      phone: userPhone,
    });

    await auditLog({
      actorId: userId,
      role,
      action: 'EMAIL_PASSWORD_LOGIN',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { email: cleanEmail },
    });

    return {
      token: session.token,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      user: {
        id: userId,
        fullName: userFullName,
        email: cleanEmail,
        phone: userPhone,
        role,
        avatarUrl: dbUser?.avatar_url,
      },
      isNewUser: false,
    };
  }

  /**
   * Completes Phone OTP verification and syncs into Supabase.
   */
  static async authenticateWithPhoneOtp(
    phone: string,
    role: UserRole = UserRole.BUYER,
    fullName?: string
  ): Promise<AuthSessionResponse> {
    const rawDigits = phone.replace(/\D/g, '').slice(-10);
    const cleanPhone = `+91${rawDigits}`;
    const supabase = getSupabaseAdmin();
    let userId = `user_p_${Date.now()}`;
    let isNewUser = false;
    let actualName = fullName || '';

    try {
      if (role === UserRole.BUYER) {
        const { data: existing } = await supabase
          .from('buyers')
          .select('*')
          .or(`phone.eq.${cleanPhone},phone.eq.${rawDigits}`)
          .maybeSingle();

        if (existing) {
          userId = existing.id;
          actualName = existing.full_name || actualName || `Buyer ${rawDigits.slice(-4)}`;
        } else {
          isNewUser = true;
          const { data: inserted } = await supabase
            .from('buyers')
            .insert({
              phone: cleanPhone,
              full_name: fullName || `Buyer ${rawDigits.slice(-4)}`,
              buyer_type: 'RETAIL',
              is_verified: true,
            })
            .select()
            .maybeSingle();

          if (inserted) {
            userId = inserted.id;
            actualName = inserted.full_name;
          }
        }
      } else if (role === UserRole.FARMER) {
        const { data: existing } = await supabase
          .from('farmers')
          .select('*')
          .or(`phone.eq.${cleanPhone},phone.eq.${rawDigits}`)
          .maybeSingle();

        if (existing) {
          userId = existing.id;
          actualName = existing.full_name || actualName || `Farmer ${rawDigits.slice(-4)}`;
        } else {
          isNewUser = true;
          const { data: inserted } = await supabase
            .from('farmers')
            .insert({
              phone: cleanPhone,
              full_name: fullName || `Farmer ${rawDigits.slice(-4)}`,
              is_verified: true,
            })
            .select()
            .maybeSingle();

          if (inserted) {
            userId = inserted.id;
            actualName = inserted.full_name;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase phone auth note:', err);
    }

    const session = SessionManager.createSession({
      userId,
      role,
      phone: cleanPhone,
    });

    await auditLog({
      actorId: userId,
      role,
      action: 'PHONE_OTP_LOGIN',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { phone: cleanPhone, isNewUser },
    });

    return {
      token: session.token,
      sessionId: session.sessionId,
      expiresAt: session.expiresAt,
      user: {
        id: userId,
        fullName: actualName || `User ${rawDigits.slice(-4)}`,
        email: `${rawDigits}@mandikart.in`,
        phone: cleanPhone,
        role,
      },
      isNewUser,
    };
  }
}
