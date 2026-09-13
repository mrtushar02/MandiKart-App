/**
 * MandiKart Farmer App — A/B Experimentation & Telemetry Service
 *
 * Implements statistical experimentation framework with deterministic variant assignment:
 * - Variant A (Control): Standard Search Screen First
 * - Variant B (Variant): Kisan AI Saathi First with Predictive Sowing & Weather Alert Hero
 *
 * Tracks:
 * - Primary Metric: Conversion Rate of trade intent (Sell lot listed / Buyer offer sent)
 * - Secondary Metrics: AI session duration, Search query depth, Audio listen rate
 * - Guardrails: Error rate (< 0.1%), Bounce rate (< 15%), P95 search latency (< 500ms)
 */

export type ExperimentId = 'EXP_FARMER_SEARCH_VS_AI_V1';
export type VariantId = 'control_search_first' | 'variant_ai_first';

export interface ExperimentConfig {
  id: ExperimentId;
  name: string;
  description: string;
  variants: VariantId[];
  trafficAllocation: number; // 0.0 to 1.0 (e.g. 0.5 for 50/50 split)
  isLocked: boolean;
  primaryMetric: string;
  guardrails: string[];
}

export interface MetricEvent {
  experimentId: ExperimentId;
  variantId: VariantId;
  userId: string;
  eventType: 'view' | 'click' | 'query' | 'tts_listen' | 'trade_intent' | 'error';
  timestamp: string;
  metadata?: Record<string, any>;
}

export const EXPERIMENTS: Record<ExperimentId, ExperimentConfig> = {
  EXP_FARMER_SEARCH_VS_AI_V1: {
    id: 'EXP_FARMER_SEARCH_VS_AI_V1',
    name: 'Kisan AI Saathi vs Classical Search Dominance',
    description: 'Evaluate whether prominent Kisan AI Saathi placement increases high-value trade conversions over classical search bar alone.',
    variants: ['control_search_first', 'variant_ai_first'],
    trafficAllocation: 0.5,
    isLocked: true,
    primaryMetric: 'farmer_trade_intent_conversion_rate',
    guardrails: ['app_crash_rate < 0.1%', 'dashboard_bounce_rate < 15%', 'search_latency_p95 < 500ms'],
  },
};

/**
 * Deterministic hash-based variant assignment ensuring user consistency
 */
export function getExperimentVariant(experimentId: ExperimentId, userId: string = 'anonymous_farmer'): VariantId {
  const config = EXPERIMENTS[experimentId];
  if (!config) return 'control_search_first';

  let hash = 0;
  const key = `${experimentId}:${userId}`;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  const normalized = Math.abs(hash) % 100;
  return normalized < config.trafficAllocation * 100 ? 'variant_ai_first' : 'control_search_first';
}

class AbTestService {
  private loggedEvents: MetricEvent[] = [];

  public trackEvent(
    experimentId: ExperimentId,
    variantId: VariantId,
    userId: string,
    eventType: MetricEvent['eventType'],
    metadata?: Record<string, any>
  ): MetricEvent {
    const event: MetricEvent = {
      experimentId,
      variantId,
      userId,
      eventType,
      timestamp: new Date().toISOString(),
      metadata,
    };
    this.loggedEvents.push(event);
    return event;
  }

  public getLoggedEvents(): MetricEvent[] {
    return [...this.loggedEvents];
  }

  public clearEvents(): void {
    this.loggedEvents = [];
  }

  public computeExperimentSummary(experimentId: ExperimentId) {
    const relevant = this.loggedEvents.filter((e) => e.experimentId === experimentId);
    const summary: Record<VariantId, { views: number; tradeIntents: number; conversionRate: number }> = {
      control_search_first: { views: 0, tradeIntents: 0, conversionRate: 0 },
      variant_ai_first: { views: 0, tradeIntents: 0, conversionRate: 0 },
    };

    relevant.forEach((e) => {
      if (e.eventType === 'view') {
        summary[e.variantId].views++;
      } else if (e.eventType === 'trade_intent') {
        summary[e.variantId].tradeIntents++;
      }
    });

    for (const v of Object.keys(summary) as VariantId[]) {
      const vObj = summary[v];
      vObj.conversionRate = vObj.views > 0 ? (vObj.tradeIntents / vObj.views) * 100 : 0;
    }

    return summary;
  }
}

export const abTestService = new AbTestService();
