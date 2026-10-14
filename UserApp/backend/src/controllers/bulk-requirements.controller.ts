/**
 * MandiKart — UserApp Bulk Requirements Controller
 * Allows commercial buyers (Hotels, Institutions, Wholesalers) to post large-scale demand
 * and discover AI-matched farmers and FPO clusters.
 */

import { Request, Response } from 'express';
import { UserRole } from '@mandikart/shared-types';
import { auditLog, NegotiationRegistryService, NegotiationMessageItem } from '@mandikart/shared-core';

interface BulkRequirement {
  id: string;
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  cropName: string;
  grade: 'A' | 'B' | 'C';
  requiredQuantity: number;
  quantityUnit: 'kg' | 'quintal' | 'tonne';
  maxTargetPricePerUnit: number;
  deliveryLocation: string;
  requiredByDate: string;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  matchedSupplierCount: number;
  createdAt: string;
}

const mockBulkRequirements: BulkRequirement[] = [];

export class BulkRequirementsController {
  static async listRequirements(req: Request, res: Response): Promise<void> {
    const buyerId = req.user?.id || 'buyer_default_01';
    const items = mockBulkRequirements.filter((r) => r.buyerId === buyerId);

    res.status(200).json({
      data: items,
      meta: { total: items.length },
      error: null,
    });
  }

  static async createRequirement(req: Request, res: Response): Promise<void> {
    const buyerId = req.user?.id || 'buyer_default_01';
    const buyerName = req.body?.buyerName || (req.user as any)?.fullName || 'Verified Bulk Buyer';
    const buyerPhone = req.body?.buyerPhone || (req.user as any)?.phone || '+91 98765 43210';
    const { cropName, grade, requiredQuantity, quantityUnit, maxTargetPricePerUnit, deliveryLocation, requiredByDate, items: rawItems } = req.body;

    const items = Array.isArray(rawItems) && rawItems.length > 0
      ? rawItems.map((item: any, idx: number) => ({
          id: item.id || `item_${Date.now()}_${idx}`,
          cropName: item.cropName || 'Specialty Produce',
          variety: item.variety || 'Standard Selected',
          category: item.category || 'Exotic Produce',
          grade: item.grade || 'A',
          quantity: Number(item.quantity || item.requiredQuantity || 10),
          unit: item.unit || item.quantityUnit || 'kg',
          targetPrice: Number(item.targetPrice || item.maxTargetPricePerUnit || 100),
          selectedByFarmer: true,
          farmerPrice: Number(item.targetPrice || item.maxTargetPricePerUnit || 100),
        }))
      : [
          {
            id: `item_${Date.now()}_0`,
            cropName: cropName || 'Produce',
            variety: req.body?.variety || 'Standard Selected',
            category: req.body?.category || 'Exotic Produce',
            grade: grade || 'A',
            quantity: Number(requiredQuantity || 10),
            unit: quantityUnit || 'kg',
            targetPrice: Number(maxTargetPricePerUnit || 100),
            selectedByFarmer: true,
            farmerPrice: Number(maxTargetPricePerUnit || 100),
          },
        ];

    const primaryCropName = items.length === 1 
      ? items[0].cropName 
      : `${items[0].cropName} + ${items.length - 1} other products (${items.map((i: any) => i.cropName).join(', ')})`;

    const totalQty = items.reduce((acc: number, cur: any) => acc + cur.quantity, 0);
    const totalAmount = items.reduce((acc: number, cur: any) => acc + (cur.quantity * cur.targetPrice), 0);
    const primaryUnit = items[0].unit;
    const avgPrice = Math.round(totalAmount / (totalQty || 1));

    const newReq: BulkRequirement = {
      id: `breq_${Date.now()}`,
      buyerId,
      buyerName,
      buyerPhone,
      cropName: primaryCropName,
      grade: grade || 'A',
      requiredQuantity: totalQty,
      quantityUnit: primaryUnit,
      maxTargetPricePerUnit: avgPrice,
      deliveryLocation: deliveryLocation || 'Pune Wholesale Mandi',
      requiredByDate: requiredByDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      status: 'MATCHED',
      matchedSupplierCount: 2,
      createdAt: new Date().toISOString(),
    };

    mockBulkRequirements.unshift(newReq);

    // Register Direct FPO Bulk Procurement request in shared NegotiationRegistryService
    const negotiationId = newReq.id;
    const now = new Date().toISOString();
    const currentDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const currentTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const itemsSummaryText = items.map((i: any, idx: number) => 
      `  ${idx + 1}. ${i.cropName} (${i.variety || 'Grade ' + i.grade}): ${i.quantity} ${i.unit} @ target ₹${i.targetPrice}/${i.unit}`
    ).join('\n');

    const initialMessages: NegotiationMessageItem[] = [
      {
        id: `msg_breq_init_${Date.now()}`,
        negotiationId,
        senderId: buyerId,
        senderRole: 'BUYER',
        senderName: buyerName,
        messageType: 'OFFER',
        text: items.length > 1 
          ? `Direct FPO Multi-Product Procurement Demand (${items.length} Products):\n${itemsSummaryText}\nTotal Target Budget: ₹${totalAmount.toLocaleString()}`
          : `Direct FPO Procurement Requirement: ₹${items[0].targetPrice}/${items[0].unit} for ${items[0].quantity} ${items[0].unit}`,
        price: items.length === 1 ? items[0].targetPrice : avgPrice,
        quantity: totalQty,
        unit: primaryUnit,
        totalAmount: totalAmount,
        offerStatus: 'PENDING',
        timestamp: now,
      },
      {
        id: `msg_breq_txt_${Date.now() + 1}`,
        negotiationId,
        senderId: buyerId,
        senderRole: 'BUYER',
        senderName: buyerName,
        messageType: 'TEXT',
        text: `[Direct FPO Procurement Demand • Posted ${currentDateStr} at ${currentTimeStr}]\nRequired Delivery Date: ${requiredByDate}\nDelivery Depot: ${deliveryLocation}\nQuality Grade: Grade ${grade || 'A'}\nFarmer Note: Please select the products you have available and counter with your pricing!`,
        timestamp: new Date(Date.now() + 50).toISOString(),
      },
    ];

    const newNeg = {
      id: negotiationId,
      productId: `bulk_prod_${Date.now()}`,
      cropName: primaryCropName,
      grade: grade || 'A',
      items,
      farmerId: 'd1111111-1111-1111-1111-111111111111',
      farmerName: 'Ramesh Patel',
      buyerId,
      buyerName,
      buyerPhone,
      buyerCompany: 'Direct FPO Procurement Buyer',
      originalPrice: items.length === 1 ? items[0].targetPrice : avgPrice,
      offeredPrice: items.length === 1 ? items[0].targetPrice : avgPrice,
      counterPrice: null,
      quantity: totalQty,
      unit: primaryUnit,
      status: 'PENDING_FARMER' as const,
      remarks: `Delivery Depot: ${deliveryLocation} • Required By: ${requiredByDate}`,
      messages: initialMessages,
      history: [
        {
          id: `hist_breq_${Date.now()}`,
          sender: 'BUYER' as const,
          senderName: buyerName,
          price: items.length === 1 ? items[0].targetPrice : avgPrice,
          pricePerKg: items.length === 1 ? items[0].targetPrice : avgPrice,
          quantityKg: totalQty,
          text: `[Direct FPO Procurement] Target Budget: ₹${totalAmount.toLocaleString()}. Delivery: ${deliveryLocation} by ${requiredByDate}.`,
          message: `[Direct FPO Procurement] Target Budget: ₹${totalAmount.toLocaleString()}. Delivery: ${deliveryLocation} by ${requiredByDate}.`,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    NegotiationRegistryService.registerNegotiation(newNeg as any);

    await auditLog({
      actorId: buyerId,
      role: UserRole.BUYER,
      action: 'CREATE_BULK_REQUIREMENT',
      resourceType: 'PRODUCT',
      resourceId: newReq.id,
      metadata: { cropName, requiredQuantity, quantityUnit },
    });

    res.status(201).json({
      data: newReq,
      meta: null,
      error: null,
    });
  }

  static async getMatches(req: Request, res: Response): Promise<void> {
    const reqId = String(req.params.id);
    const requirement = mockBulkRequirements.find((r) => r.id === reqId);

    // AI-driven matching algorithm output
    const matches = [
      {
        supplierId: 'farmer_ramesh_01',
        supplierName: 'Ramesh Patil (Nashik Kisan FPO)',
        type: 'FPO_CLUSTER',
        cropName: requirement ? requirement.cropName : 'Red Onion',
        grade: 'A',
        availableCapacity: 40,
        capacityUnit: requirement?.quantityUnit || 'quintal',
        askingPricePerUnit: requirement ? requirement.maxTargetPricePerUnit * 0.98 : 2350,
        distanceKm: 42,
        aiMatchScore: 96,
        isVerified: true,
        fulfillmentPurity: '99.2%',
        location: 'Niphad, Nashik',
      },
      {
        supplierId: 'farmer_priya_02',
        supplierName: 'Priya Devi Organics',
        type: 'FARMER',
        cropName: requirement ? requirement.cropName : 'Red Onion',
        grade: 'A',
        availableCapacity: 15,
        capacityUnit: requirement?.quantityUnit || 'quintal',
        askingPricePerUnit: requirement ? requirement.maxTargetPricePerUnit * 1.02 : 2450,
        distanceKm: 85,
        aiMatchScore: 89,
        isVerified: true,
        fulfillmentPurity: '98.5%',
        location: 'Satara Agri Cluster',
      },
    ];

    res.status(200).json({
      data: {
        requirementId: reqId,
        requirement,
        matches,
      },
      meta: { total: matches.length },
      error: null,
    });
  }
}
