/**
 * MandiKart Farmer App — Automated Unit & Regression Test Suite
 *
 * Tests:
 * 1. A/B Testing & Telemetry Service
 * 2. Kisan AI Saathi Advisory Engine across all categories & 5 languages
 * 3. Text-to-Speech (TTS) Engine configurations & language code mappings
 */

import { abTestService, getExperimentVariant, EXPERIMENTS } from '../services/abTestService';
import {
  generateHeuristicAdvisory,
  FarmerContextData,
  AI_LANG_LABELS,
} from '../services/farmerAiService';
import { SupportedLanguage } from '../services/ttsService';

let totalPass = 0;
let totalFail = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    totalPass++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    totalFail++;
  }
}

async function runAllTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING MANDIKART FARMER SERVICES TEST SUITE');
  console.log('========================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. A/B TEST SERVICE TESTS
  // ─────────────────────────────────────────────────────────────
  console.log('▶ [Group 1] A/B Testing & Telemetry Service:');

  const expConfig = EXPERIMENTS.EXP_FARMER_SEARCH_VS_AI_V1;
  assert(expConfig !== undefined, 'Experiment configuration exists and is defined');
  assert(expConfig.isLocked === true, 'Experiment hypothesis is locked per A/B gate requirements');
  assert(expConfig.trafficAllocation === 0.5, 'Traffic allocation is configured to 50/50 split');

  // Test deterministic assignment for consistent users
  const variantUser1_run1 = getExperimentVariant('EXP_FARMER_SEARCH_VS_AI_V1', 'farmer_101');
  const variantUser1_run2 = getExperimentVariant('EXP_FARMER_SEARCH_VS_AI_V1', 'farmer_101');
  assert(variantUser1_run1 === variantUser1_run2, 'Variant assignment is deterministic for the same farmer ID');

  const variantUser2 = getExperimentVariant('EXP_FARMER_SEARCH_VS_AI_V1', 'farmer_9999');
  assert(typeof variantUser2 === 'string', 'Variant assignment returns a valid string variant');

  // Test event tracking and metric aggregation
  abTestService.clearEvents();
  abTestService.trackEvent('EXP_FARMER_SEARCH_VS_AI_V1', 'control_search_first', 'farmer_1', 'view');
  abTestService.trackEvent('EXP_FARMER_SEARCH_VS_AI_V1', 'control_search_first', 'farmer_1', 'trade_intent');
  abTestService.trackEvent('EXP_FARMER_SEARCH_VS_AI_V1', 'variant_ai_first', 'farmer_2', 'view');
  abTestService.trackEvent('EXP_FARMER_SEARCH_VS_AI_V1', 'variant_ai_first', 'farmer_3', 'view');
  abTestService.trackEvent('EXP_FARMER_SEARCH_VS_AI_V1', 'variant_ai_first', 'farmer_2', 'trade_intent');

  const summary = abTestService.computeExperimentSummary('EXP_FARMER_SEARCH_VS_AI_V1');
  assert(summary.control_search_first.views === 1, 'Control views calculated correctly');
  assert(summary.control_search_first.tradeIntents === 1, 'Control trade intents calculated correctly');
  assert(summary.control_search_first.conversionRate === 100, 'Control conversion rate calculated correctly (100%)');

  assert(summary.variant_ai_first.views === 2, 'Variant views calculated correctly');
  assert(summary.variant_ai_first.tradeIntents === 1, 'Variant trade intents calculated correctly');
  assert(summary.variant_ai_first.conversionRate === 50, 'Variant conversion rate calculated correctly (50%)');

  // ─────────────────────────────────────────────────────────────
  // 2. KISAN AI SAATHI AGROMARKET ENGINE TESTS
  // ─────────────────────────────────────────────────────────────
  console.log('\n▶ [Group 2] Kisan AI Saathi Advisory Engine:');

  const mockContext: FarmerContextData = {
    farmerName: 'Ramesh Patel',
    phone: '9876543210',
    role: 'INDIVIDUAL',
    farmSize: '5 Acres',
    district: 'Bargarh',
    state: 'Odisha',
    cropsCount: 2,
    crops: [
      {
        name: 'Paddy Basmati',
        variety: 'PB 1121',
        totalKg: 3000,
        availableKg: 2500,
        grade: 'Grade A',
        condition: 'Good',
        shelfLifeDays: 90,
        expectedPrice: 38,
        marketPrice: 39,
      },
      {
        name: 'Hybrid Tomato',
        variety: 'Abhinav',
        totalKg: 800,
        availableKg: 800,
        grade: 'Grade A',
        condition: 'Needs Attention',
        shelfLifeDays: 5,
        expectedPrice: 22,
        marketPrice: 24,
      },
    ],
    totalInventoryKg: 3300,
    estimatedStockValue: 116700,
    totalOrdersCount: 4,
    completedOrdersCount: 3,
    totalEarnedRevenue: 85000,
  };

  // Test languages
  const testLanguages: SupportedLanguage[] = ['hi', 'or', 'te', 'bn', 'en'];
  for (const lang of testLanguages) {
    const config = AI_LANG_LABELS[lang];
    assert(config !== undefined, `Language dictionary exists for '${lang}'`);
    assert(config.quickPrompts.length === 5, `Language '${lang}' has 5 quick prompt chips`);
    assert(config.greeting.length > 0, `Language '${lang}' has a non-empty greeting`);
  }

  // Test Crop Analysis Query in Hindi & Odia
  const cropReplyHi = generateHeuristicAdvisory('Analyze my crops and income', mockContext, 'hi');
  assert(cropReplyHi.category === 'crop_analysis', 'Crop analysis query correctly categorized in Hindi');
  assert(cropReplyHi.text.includes('Ramesh Patel'), 'Farmer name included in crop analysis response');
  assert(cropReplyHi.actionButton?.route === '/(tabs)/produce', 'Crop analysis links to /(tabs)/produce');

  const cropReplyOr = generateHeuristicAdvisory('ମୋ ଫସଲ ଓ ଆୟ ବିଶ୍ଳେଷଣ', mockContext, 'or');
  assert(cropReplyOr.category === 'crop_analysis', 'Odia query correctly mapped to crop_analysis category');
  assert(cropReplyOr.text.includes('ଫସଲ ଓ ଆୟ'), 'Odia response contains native Odia script');

  // Test Next Crop Recommendation Query
  const nextCropReply = generateHeuristicAdvisory('Which crop should I sow next?', mockContext, 'en');
  assert(nextCropReply.category === 'next_crop', 'Next crop query categorized correctly');
  assert(nextCropReply.text.includes('Rabi Onion'), 'Recommends high margin Rabi Onion');
  assert(nextCropReply.actionButton?.route === '/market-trends', 'Next crop links to /market-trends');

  // Test Disaster & Weather Warning Query
  const disasterReply = generateHeuristicAdvisory('Check disaster warnings and rain forecast', mockContext, 'hi');
  assert(disasterReply.category === 'disaster', 'Disaster query categorized correctly');
  assert(disasterReply.text.includes('PMFBY') || disasterReply.text.includes('14447'), 'Includes PMFBY crop insurance helpline');

  // Test Profit Maximization Query
  const profitReply = generateHeuristicAdvisory('How can I increase profit and reduce loss?', mockContext, 'en');
  assert(profitReply.category === 'profit', 'Profit maximization query categorized correctly');
  assert(profitReply.text.includes('Sorting & Grading'), 'Suggests pre-harvest grading');
  assert(profitReply.actionButton?.route === '/sell/requests', 'Profit tips link to /sell/requests');

  // Test Government Scheme Query
  const schemeReply = generateHeuristicAdvisory('PM-KISAN status and government subsidy guide', mockContext, 'hi');
  assert(schemeReply.category === 'govt_scheme', 'Government scheme query categorized correctly');
  assert(schemeReply.text.includes('पीएम-किसान सम्मान निधि'), 'Includes PM-KISAN details in Hindi');

  console.log('\n========================================================');
  console.log(`TEST RESULTS: ${totalPass} PASSED, ${totalFail} FAILED`);
  console.log('========================================================\n');

  if (totalFail > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
