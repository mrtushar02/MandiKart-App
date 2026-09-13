/**
 * MandiKart — Market Intelligence Routes
 * Proxies to shared MarketPriceService with in-memory caching.
 */

import { Router, Request, Response } from 'express';
import { MarketRatesQuerySchema } from '@mandikart/shared-types';
import { MarketPriceService, geminiAiService } from '@mandikart/shared-core';

export const marketRouter = Router();

const handleMarketRates = async (req: Request, res: Response): Promise<void> => {
  const parse = MarketRatesQuerySchema.safeParse(req.query);
  const params = parse.success ? parse.data : {};

  try {
    const rates = await MarketPriceService.getRates(params);
    res.status(200).json({
      data: rates,
      meta: { total: rates.length, timestamp: new Date().toISOString() },
      error: null,
    });
  } catch (err) {
    res.status(500).json({
      data: null,
      meta: null,
      error: { code: 'MARKET_RATES_ERROR', message: (err as Error).message },
    });
  }
};

/**
 * GET /api/v1/market/live-rates
 * Real-time APMC Mandi rates powered by Google Gemini AI
 */
marketRouter.get('/live-rates', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;
    const district = (req.query.district as string | undefined) || 'Nashik';
    const rates = await geminiAiService.getLiveMandiPrices(q, district);
    res.status(200).json({
      success: true,
      data: rates,
      meta: {
        total: rates.length,
        district,
        timestamp: new Date().toISOString(),
        source: 'Gemini-2.5-Flash Live Intelligence',
      },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      data: [],
      error: { code: 'GEMINI_RATES_ERROR', message: err.message },
    });
  }
});

/**
 * GET /api/v1/market/advisory
 * Actionable strategic farmer improvement advice: Arbitrage, Harvest Timing, Grading
 */
marketRouter.get('/advisory', async (req: Request, res: Response): Promise<void> => {
  try {
    const district = (req.query.district as string | undefined) || 'Nashik';
    const crop = req.query.crop as string | undefined;
    const advisories = await geminiAiService.getFarmerAdvisories(district, crop);
    res.status(200).json({
      success: true,
      data: advisories,
      meta: {
        total: advisories.length,
        district,
        timestamp: new Date().toISOString(),
        source: 'Gemini-2.5-Flash Strategic Grounding',
      },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      data: [],
      error: { code: 'GEMINI_ADVISORY_ERROR', message: err.message },
    });
  }
});

/**
 * GET /api/v1/market/trends
 * Real-time agricultural price momentum and farmer strategic advisory powered by Gemini
 */
marketRouter.get('/trends', async (_req: Request, res: Response): Promise<void> => {
  try {
    const trends = await geminiAiService.getLiveMarketTrends();
    res.status(200).json({
      success: true,
      data: trends,
      meta: { total: trends.length, timestamp: new Date().toISOString(), source: 'Gemini-2.5-Flash Live Intelligence' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      data: [],
      error: { code: 'GEMINI_TRENDS_ERROR', message: err.message },
    });
  }
});

marketRouter.get('/rates', handleMarketRates);
marketRouter.get('/prices', handleMarketRates);
