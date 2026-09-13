/**
 * MandiKart — Farmer Producer Organization (FPO) Controller
 * Manages FPO organization profiles, member rosters, collective procurement, and bulk lots.
 */

import { Request, Response } from 'express';
import { getSupabaseAdmin, auditLog } from '@mandikart/shared-core';
import { UserRole } from '@mandikart/shared-types';

interface StoredFPODetails {
  fpoId: string;
  fpoName: string;
  registrationNumber?: string;
  registrationType?: string;
  fpoJoinCode?: string;
  yearOfFormation?: number;
  nabardPromoted?: boolean;
  promoterName?: string;
  state?: string;
  district?: string;
  block?: string;
  headquartersVillage?: string;
  villagesCovered?: string[];
  memberCount?: number;
  femaleMemberPercent?: number;
  primaryCrops?: string[];
  annualTurnoverBracket?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountType?: string;
  representativeName?: string;
  designation?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StoredMember {
  id: string;
  fpoId: string;
  farmerId?: string;
  fullName: string;
  phone: string;
  village: string;
  district?: string;
  landAcres: number;
  crops: string[];
  kccLimit?: number;
  kccBank?: string;
  status: 'ACTIVE' | 'PENDING' | 'REJECTED';
  totalEarningsViaFPO?: number;
  totalDeliveredMT?: number;
  joinedAt: string;
}

interface StoredLot {
  id: string;
  fpoId: string;
  cropName: string;
  grade: 'A' | 'B' | 'C' | 'UNGRADED';
  estimatedQtyMT: number;
  availableFromDate?: string;
  availableToDate?: string;
  storageLocation: string;
  askPricePerKg: number;
  minimumBidPerKg: number;
  status: 'DRAFT' | 'GRADING' | 'LIVE' | 'CONTRACTED' | 'SOLD';
  highestBidPerKg?: number;
  highestBidBuyer?: string;
  totalBids?: number;
  contributingMembers?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory backing registry with initial sensible seed
const fpoRegistry = new Map<string, StoredFPODetails>();
const membersRegistry = new Map<string, StoredMember[]>();
const lotsRegistry = new Map<string, StoredLot[]>();

// Initialize default FPO entry for backward compatibility
fpoRegistry.set('fpo_mandikart_01', {
  fpoId: 'fpo_mandikart_01',
  fpoName: 'Bareilly Kisan Producer Co.',
  registrationNumber: 'BAREILLY-882',
  fpoJoinCode: 'BAREILLY-882',
  registrationType: 'FPC',
  state: 'Uttar Pradesh',
  district: 'Bareilly',
  headquartersVillage: 'Bilaspur',
  memberCount: 185,
  primaryCrops: ['Wheat', 'Basmati Rice', 'Mustard'],
  annualTurnoverBracket: '₹74.5L',
  representativeName: 'Ramesh Patel',
  designation: 'CEO',
  createdAt: new Date().toISOString(),
});

export class FPOController {
  /**
   * GET /api/v1/fpo/details
   * Retrieve FPO details for current user or given fpoId
   */
  static async getDetails(req: Request, res: Response): Promise<void> {
    try {
      const fpoId = String(req.query.fpoId || (req as any).user?.fpoId || 'fpo_mandikart_01');
      let details = fpoRegistry.get(fpoId);

      if (!details) {
        // Look up by prefix or first available
        const allFpos = Array.from(fpoRegistry.values());
        details = allFpos[0];
      }

      res.status(200).json({
        data: details || null,
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  /**
   * POST / PUT /api/v1/fpo/details
   * Save or update FPO organizational profile
   */
  static async saveDetails(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const fpoId = body.fpoId || body.fpoJoinCode || `fpo_${Date.now().toString(36)}`;
      const existing = fpoRegistry.get(fpoId) || ({} as StoredFPODetails);

      const updated: StoredFPODetails = {
        ...existing,
        ...body,
        fpoId,
        fpoName: body.fpoName || existing.fpoName || 'Kisan Producer Company',
        fpoJoinCode: body.fpoJoinCode || body.registrationNumber || existing.fpoJoinCode || `MK-FPO-${fpoId.slice(-4).toUpperCase()}`,
        updatedAt: new Date().toISOString(),
      };

      fpoRegistry.set(fpoId, updated);

      // Also index by join code for fast scanner lookup
      if (updated.fpoJoinCode) {
        fpoRegistry.set(updated.fpoJoinCode.toUpperCase(), updated);
      }
      if (updated.registrationNumber) {
        fpoRegistry.set(updated.registrationNumber.toUpperCase(), updated);
      }

      res.status(200).json({
        data: updated,
        meta: { message: 'FPO details saved successfully' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  /**
   * GET /api/v1/fpo/by-code/:code
   * Look up FPO profile by join code or registration number (used by QR scanner)
   */
  static async getByCode(req: Request, res: Response): Promise<void> {
    try {
      const rawCode = String(req.params.code || '').trim().toUpperCase();
      let found: StoredFPODetails | undefined = fpoRegistry.get(rawCode);

      if (!found) {
        // Search values
        for (const val of fpoRegistry.values()) {
          if (
            (val.fpoJoinCode && val.fpoJoinCode.toUpperCase() === rawCode) ||
            (val.registrationNumber && val.registrationNumber.toUpperCase() === rawCode) ||
            (val.fpoId && val.fpoId.toUpperCase() === rawCode)
          ) {
            found = val;
            break;
          }
        }
      }

      if (!found) {
        // Return a dynamic constructed FPO record so new custom codes always work
        found = {
          fpoId: `fpo_${rawCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          fpoName: `${rawCode} Producer Company`,
          fpoJoinCode: rawCode,
          registrationNumber: rawCode,
          registrationType: 'FPC',
          state: 'Maharashtra',
          district: 'Nashik',
          headquartersVillage: 'Central Hub',
          memberCount: 50,
          promoterName: 'NABARD Promoted Entity',
        };
        fpoRegistry.set(rawCode, found);
      }

      res.status(200).json({
        data: found,
        meta: null,
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  /**
   * GET /api/v1/fpo/members
   * List members registered under this FPO
   */
  static async getMembers(req: Request, res: Response): Promise<void> {
    try {
      const fpoId = String(req.query.fpoId || 'default');
      const list = membersRegistry.get(fpoId) || membersRegistry.get('default') || [];

      res.status(200).json({
        data: list,
        meta: { total: list.length },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  /**
   * POST /api/v1/fpo/members
   * Enroll a farmer into the FPO
   */
  static async addMember(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const fpoId = body.fpoId || 'default';
      const list = membersRegistry.get(fpoId) || [];

      const newMember: StoredMember = {
        id: `mem_${Date.now().toString(36)}`,
        fpoId,
        farmerId: body.farmerId,
        fullName: body.fullName || body.farmerName || 'Enrolled Farmer',
        phone: body.phone || '+91 98000 00000',
        village: body.village || 'Rural Cluster',
        district: body.district || 'Local District',
        landAcres: Number(body.landAcres || 3),
        crops: Array.isArray(body.crops) ? body.crops : ['Wheat', 'Mustard'],
        kccBank: body.kccBank || 'State Bank of India',
        kccLimit: Number(body.kccLimit || 250000),
        status: body.status || 'ACTIVE',
        totalEarningsViaFPO: 0,
        totalDeliveredMT: 0,
        joinedAt: new Date().toISOString().split('T')[0],
      };

      list.unshift(newMember);
      membersRegistry.set(fpoId, list);
      if (fpoId !== 'default') {
        membersRegistry.set('default', [...(membersRegistry.get('default') || []), newMember]);
      }

      // Update FPO member count
      const fpo = fpoRegistry.get(fpoId);
      if (fpo) {
        fpo.memberCount = (fpo.memberCount || 0) + 1;
        fpoRegistry.set(fpoId, fpo);
      }

      res.status(201).json({
        data: newMember,
        meta: { message: 'Farmer enrolled in FPO successfully' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  /**
   * PUT /api/v1/fpo/members/:id/status
   */
  static async updateMemberStatus(req: Request, res: Response): Promise<void> {
    try {
      const memberId = String(req.params.id);
      const { status } = req.body;

      for (const [key, members] of membersRegistry.entries()) {
        const found = members.find((m) => m.id === memberId);
        if (found) {
          found.status = status;
          membersRegistry.set(key, members);
        }
      }

      res.status(200).json({
        data: { id: memberId, status },
        meta: { message: 'Member status updated' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  /**
   * GET /api/v1/fpo/lots
   */
  static async getLots(req: Request, res: Response): Promise<void> {
    try {
      const fpoId = String(req.query.fpoId || 'default');
      const lots = lotsRegistry.get(fpoId) || lotsRegistry.get('default') || [];

      res.status(200).json({
        data: lots,
        meta: { total: lots.length },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }

  /**
   * POST /api/v1/fpo/lots
   */
  static async createLot(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const fpoId = body.fpoId || 'default';
      const list = lotsRegistry.get(fpoId) || [];

      const newLot: StoredLot = {
        id: `lot_${Date.now().toString(36)}`,
        fpoId,
        cropName: body.cropName || 'Fresh Farm Produce',
        grade: body.grade || 'A',
        estimatedQtyMT: Number(body.estimatedQtyMT || 25),
        availableFromDate: body.availableFromDate || new Date().toISOString().split('T')[0],
        availableToDate: body.availableToDate,
        storageLocation: body.storageLocation || 'FPO Central Warehouse',
        askPricePerKg: Number(body.askPricePerKg || 35),
        minimumBidPerKg: Number(body.minimumBidPerKg || 32),
        status: 'LIVE',
        totalBids: 0,
        contributingMembers: Number(body.contributingMembers || 12),
        notes: body.notes || 'Aggregated member produce lot.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      list.unshift(newLot);
      lotsRegistry.set(fpoId, list);

      res.status(201).json({
        data: newLot,
        meta: { message: 'Bulk produce lot registered successfully' },
        error: null,
      });
    } catch (err) {
      res.status(500).json({ data: null, error: { message: (err as Error).message } });
    }
  }
}
