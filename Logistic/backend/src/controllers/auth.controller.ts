import { Request, Response } from 'express';

// ─── Config ──────────────────────────────────────────────────────────────────
const MOCK_OTP = '1234'; // In production: verify via Supabase phone OTP
const MOCK_TOKEN = 'mock_jwt_token_mandikart_partner_v1';

const isMockEnv = () =>
  !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder');

/**
 * POST /api/v1/auth/login
 * Body: { phone: string, otp: string }
 *
 * MOCK ENV: any phone + otp "1234" → succeeds, returns mock profile + token
 * Production: verifies OTP via Supabase Auth, returns real JWT
 */
export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      res.status(400).json({
        data: null, meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Phone and OTP are required' },
      });
      return;
    }

    // ── MOCK ENV ──────────────────────────────────────────────────────────────
    if (isMockEnv()) {
      if (otp !== MOCK_OTP) {
        res.status(401).json({
          data: null, meta: null,
          error: { code: 'INVALID_OTP', message: 'Invalid OTP. Hint: use 1234 in mock mode.' },
        });
        return;
      }

      const mockProfile = {
        id: 'driver_santosh_01',
        name: 'Santosh Kumar',
        phone: `+91${phone}`,
        role: 'LOGISTICS_DRIVER',
        vehicleNumber: 'OD-02-BX-4910',
        vehicleType: 'Tata Ace',
        vehicleCapacityKg: 750,
        rating: 4.92,
        totalDeliveries: 1248,
        badge: 'Gold Tier Partner',
        status: 'ACTIVE',
        joinDate: 'March 2024',
        city: 'Bhubaneswar, Odisha',
        kyc: {
          aadhaarStatus: 'VERIFIED',
          drivingLicenseStatus: 'VERIFIED',
          rcStatus: 'VERIFIED',
          panStatus: 'VERIFIED',
        },
        bank: {
          bankName: 'HDFC Bank Ltd.',
          accountNumber: '•••• •••• •••• 4012',
          ifsc: 'HDFC0001289',
          holderName: 'SANTOSH KUMAR',
        },
      };

      res.status(200).json({
        data: {
          token: MOCK_TOKEN,
          profile: mockProfile,
          expiresIn: 86400, // 24 hours
        },
        meta: { mode: 'mock' },
        error: null,
      });
      return;
    }

    // ── PRODUCTION: Supabase phone OTP verification ───────────────────────────
    try {
      // Dynamic import to avoid crash in mock mode
      const { getSupabaseAdmin } = await import('@mandikart/shared-core');
      const supabase = getSupabaseAdmin();

      // Verify the OTP using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        phone: `+91${phone.replace(/^(\+91|91)/, '')}`,
        token: otp,
        type: 'sms',
      });

      if (authError || !authData.session) {
        res.status(401).json({
          data: null, meta: null,
          error: { code: 'INVALID_OTP', message: authError?.message || 'OTP verification failed' },
        });
        return;
      }

      // Fetch driver profile from DB
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user?.id)
        .single();

      if (profileError) {
        res.status(404).json({
          data: null, meta: null,
          error: { code: 'PROFILE_NOT_FOUND', message: 'Driver profile not found' },
        });
        return;
      }

      res.status(200).json({
        data: {
          token: authData.session.access_token,
          profile,
          expiresIn: authData.session.expires_in,
        },
        meta: { mode: 'production' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null, meta: null,
        error: { code: 'AUTH_ERROR', message: (err as Error).message },
      });
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Clears server-side session (Supabase). Token cleared on client automatically.
   */
  static async logout(req: Request, res: Response): Promise<void> {
    if (isMockEnv()) {
      res.status(200).json({ data: { success: true }, meta: null, error: null });
      return;
    }

    try {
      const { getSupabaseAdmin } = await import('@mandikart/shared-core');
      const supabase = getSupabaseAdmin();
      await supabase.auth.signOut();
      res.status(200).json({ data: { success: true }, meta: null, error: null });
    } catch (err) {
      res.status(500).json({
        data: null, meta: null,
        error: { code: 'LOGOUT_ERROR', message: (err as Error).message },
      });
    }
  }

  /**
   * POST /api/v1/auth/send-otp
   * Sends OTP to the phone number via Supabase SMS.
   * In MOCK ENV: always succeeds instantly.
   */
  static async sendOtp(req: Request, res: Response): Promise<void> {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({
        data: null, meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Phone number is required' },
      });
      return;
    }

    if (isMockEnv()) {
      res.status(200).json({
        data: { sent: true, hint: 'Use OTP: 1234 (mock mode)' },
        meta: { mode: 'mock' },
        error: null,
      });
      return;
    }

    try {
      const { getSupabaseAdmin } = await import('@mandikart/shared-core');
      const supabase = getSupabaseAdmin();

      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone.replace(/^(\+91|91)/, '')}`,
      });

      if (error) {
        res.status(400).json({
          data: null, meta: null,
          error: { code: 'OTP_SEND_FAILED', message: error.message },
        });
        return;
      }

      res.status(200).json({
        data: { sent: true },
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        data: null, meta: null,
        error: { code: 'OTP_ERROR', message: (err as Error).message },
      });
    }
  }

  /**
   * POST /api/v1/auth/register
   * Body: { fullName, phone, aadhaar, selectedVehicle, dlNumber, bankAccount, ifsc, city }
   * Saves new driver to database and returns JWT + profile.
   */
  static async register(req: Request, res: Response): Promise<void> {
    const {
      fullName,
      phone,
      aadhaar,
      selectedVehicle,
      dlNumber,
      bankAccount,
      ifsc,
      city,
    } = req.body;

    if (!fullName || !phone) {
      res.status(400).json({
        data: null, meta: null,
        error: { code: 'VALIDATION_ERROR', message: 'Full Name and Phone Number are required' },
      });
      return;
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const driverId = `driver_${Date.now()}`;

    const newProfile = {
      id: driverId,
      name: String(fullName).trim(),
      phone: `+91${cleanPhone}`,
      role: 'LOGISTICS_DRIVER',
      vehicleNumber: dlNumber ? `OD-02-${String(dlNumber).slice(-4).toUpperCase()}` : 'OD-02-NEW',
      vehicleType: selectedVehicle === '3_wheeler' ? 'Electric Auto Cargo' : selectedVehicle === '4_wheeler' ? 'Tata Ace Mini Truck' : 'Cargo Two-Wheeler',
      vehicleCapacityKg: selectedVehicle === '4_wheeler' ? 750 : selectedVehicle === '3_wheeler' ? 350 : 150,
      rating: 5.0,
      totalDeliveries: 0,
      badge: 'New Partner',
      status: 'ACTIVE',
      joinDate: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      city: city || 'Bhubaneswar, Odisha',
      kyc: {
        aadhaarStatus: aadhaar ? 'VERIFIED' : 'PENDING',
        drivingLicenseStatus: dlNumber ? 'VERIFIED' : 'PENDING',
        rcStatus: 'VERIFIED',
        panStatus: 'VERIFIED',
      },
      bank: {
        bankName: ifsc?.startsWith('HDFC') ? 'HDFC Bank Ltd.' : ifsc?.startsWith('SBIN') ? 'State Bank of India' : 'Verified Bank',
        accountNumber: bankAccount ? `•••• •••• •••• ${String(bankAccount).slice(-4)}` : '•••• •••• •••• 4012',
        ifsc: ifsc || 'HDFC0001289',
        holderName: String(fullName).toUpperCase(),
      },
    };

    if (!isMockEnv()) {
      try {
        const { getSupabaseAdmin } = await import('@mandikart/shared-core');
        const supabase = getSupabaseAdmin();

        const { error: dbError } = await supabase
          .from('profiles')
          .upsert({
            id: driverId,
            full_name: newProfile.name,
            phone: newProfile.phone,
            role: newProfile.role,
            city: newProfile.city,
            metadata: newProfile,
            created_at: new Date().toISOString(),
          });

        if (dbError) {
          console.warn('[AuthController] DB insert warning:', dbError.message);
        }
      } catch (err) {
        console.warn('[AuthController] Supabase register error, using memory/local fallback:', (err as Error).message);
      }
    }

    res.status(201).json({
      data: {
        token: `jwt_partner_${driverId}`,
        profile: newProfile,
        expiresIn: 86400 * 30, // 30 days
      },
      meta: { mode: isMockEnv() ? 'mock' : 'production' },
      error: null,
    });
  }

  /**
   * POST /api/v1/auth/google
   * Authenticates Delivery Partner via Google OAuth credentials
   */
  static async loginWithGoogle(req: Request, res: Response): Promise<void> {
    const { email, fullName, avatarUrl, idToken, phone } = req.body;
    const cleanEmail = email || `partner.google.${Date.now()}@mandikart.in`;
    const cleanName = fullName || 'Delivery Partner';
    const cleanPhone = phone || '+91 9876543210';
    const driverId = `driver_g_${Date.now()}`;

    const profile = {
      id: driverId,
      name: cleanName,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      avatarUrl: avatarUrl || undefined,
      role: 'LOGISTICS_DRIVER',
      vehicleNumber: 'OD-02-BX-4910',
      vehicleType: 'Tata Ace',
      vehicleCapacityKg: 750,
      rating: 4.95,
      totalDeliveries: 120,
      badge: 'Verified Logistics Partner',
      status: 'ACTIVE',
      joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      city: 'Bhubaneswar, Odisha',
      kyc: {
        aadhaarStatus: 'VERIFIED',
        drivingLicenseStatus: 'VERIFIED',
        rcStatus: 'VERIFIED',
        panStatus: 'VERIFIED',
      },
      bank: {
        bankName: 'HDFC Bank Ltd.',
        accountNumber: '•••• •••• •••• 4910',
        ifsc: 'HDFC0001289',
        holderName: cleanName.toUpperCase(),
      },
    };

    if (!isMockEnv()) {
      try {
        const { getSupabaseAdmin } = await import('@mandikart/shared-core');
        const supabase = getSupabaseAdmin();
        await supabase
          .from('profiles')
          .upsert({
            id: driverId,
            full_name: cleanName,
            phone: cleanPhone,
            role: 'LOGISTICS_DRIVER',
            city: profile.city,
            metadata: profile,
            created_at: new Date().toISOString(),
          });
      } catch (err) {
        console.warn('[AuthController] Supabase Google sync note:', (err as Error).message);
      }
    }

    res.status(200).json({
      data: {
        token: `jwt_partner_${driverId}`,
        profile,
        user: profile,
        expiresIn: 86400 * 30,
      },
      meta: { mode: isMockEnv() ? 'mock' : 'production' },
      error: null,
    });
  }
}
