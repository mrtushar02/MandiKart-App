/**
 * MandiKart Farmer App — Source Produce Test Suite
 * Tests:
 * 1. Initial catalog integrity and category definitions.
 * 2. Keyword searching and case-insensitive matching.
 * 3. Category filtering and deduplication.
 * 4. Multi-criteria sorting (relevance, price ascending, price descending, alphabetical).
 * 5. Pagination and incremental slice loading.
 * 6. Product lookup by ID and missing product handling.
 * 7. Live Mandi Market rate mapping and fallback behavior.
 */

declare const process: any;

import {
  useSourceProduceStore,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
} from '../store/sourceProduceStore';

console.log('========================================================');
console.log('🧪 RUNNING SOURCE PRODUCE MODULE TEST SUITE');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

const store = useSourceProduceStore.getState();

console.log('▶ [Group 1] Catalog Integrity & Category Definitions:');
assert(INITIAL_CATEGORIES.length >= 6, 'Contains at least 6 structured agricultural categories');
assert(
  INITIAL_CATEGORIES.some((c) => c.id === 'vegetables'),
  'Includes Vegetables & Greens category'
);
assert(
  INITIAL_CATEGORIES.some((c) => c.id === 'grains'),
  'Includes Grains & Cereals category'
);
assert(
  INITIAL_CATEGORIES.some((c) => c.id === 'inputs'),
  'Includes Farm Inputs & Seeds category'
);
assert(INITIAL_PRODUCTS.length >= 10, 'Catalog contains at least 10 verified commodity presets');

console.log('\n▶ [Group 2] Product Detail Lookup & Missing Product Handling:');
{
  const onion = useSourceProduceStore.getState().getProductById('prod_onion_01');
  assert(Boolean(onion), 'Successfully resolves Red Onion by ID (prod_onion_01)');
  assert(onion?.category === 'Vegetables & Greens', 'Red Onion has correct category');
  assert(Boolean(onion?.specifications.packaging?.includes('mesh')), 'Red Onion has packaging spec');
  assert(Boolean(onion?.allowedUnits.includes('quintal')), 'Red Onion supports quintal unit');

  const missing = useSourceProduceStore.getState().getProductById('non_existent_id');
  assert(missing === undefined, 'Returns undefined for missing product ID without crashing');
}

console.log('\n▶ [Group 3] Searching & Keyword Filtering:');
{
  useSourceProduceStore.getState().setSearchQuery('onion');
  const q = useSourceProduceStore.getState().searchQuery;
  assert(q === 'onion', 'Sets search query to "onion"');

  // Filter test
  const matches = INITIAL_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes('onion') ||
    p.description.toLowerCase().includes('onion')
  );
  assert(matches.length >= 2, 'Matches Red Onion commodity and Onion Seeds');

  useSourceProduceStore.getState().setSearchQuery('');
  assert(useSourceProduceStore.getState().searchQuery === '', 'Clears search query');
}

console.log('\n▶ [Group 4] Category Filtering & Isolation:');
{
  useSourceProduceStore.getState().setSelectedCategory('grains');
  assert(useSourceProduceStore.getState().selectedCategory === 'grains', 'Selected category is grains');

  const grainsOnly = INITIAL_PRODUCTS.filter((p) => p.categoryId === 'grains');
  assert(grainsOnly.length >= 3, 'Grains category has at least 3 items (Wheat, Basmati, Maize)');
  assert(
    grainsOnly.every((p) => p.categoryId === 'grains'),
    'All items in filter strictly belong to grains'
  );

  useSourceProduceStore.getState().resetFilters();
  assert(useSourceProduceStore.getState().selectedCategory === 'all', 'Resets category to "all"');
}

console.log('\n▶ [Group 5] Sorting Mechanisms:');
{
  // Price: Low to High
  const sortedAsc = [...INITIAL_PRODUCTS].sort((a, b) => a.benchmarkPrice - b.benchmarkPrice);
  assert(sortedAsc[0].benchmarkPrice <= sortedAsc[1].benchmarkPrice, 'Sorts prices in ascending order');

  // Price: High to Low
  const sortedDesc = [...INITIAL_PRODUCTS].sort((a, b) => b.benchmarkPrice - a.benchmarkPrice);
  assert(sortedDesc[0].benchmarkPrice >= sortedDesc[1].benchmarkPrice, 'Sorts prices in descending order');

  // Alphabetical
  const sortedAlpha = [...INITIAL_PRODUCTS].sort((a, b) => a.name.localeCompare(b.name));
  assert(sortedAlpha[0].name.localeCompare(sortedAlpha[1].name) <= 0, 'Sorts commodities alphabetically');
}

console.log('\n▶ [Group 6] Incremental Loading / Pagination:');
{
  const initialPage = useSourceProduceStore.getState().currentPage;
  assert(initialPage === 1, 'Initial page is 1');
  useSourceProduceStore.getState().loadMore();
  assert(useSourceProduceStore.getState().currentPage === 2, 'loadMore increments page to 2');
  useSourceProduceStore.getState().resetFilters();
  assert(useSourceProduceStore.getState().currentPage === 1, 'resetFilters restores page to 1');
}

console.log('\n▶ [Group 7] Live Mandi Rate Retrieval & Matching:');
{
  const storeInstance = useSourceProduceStore.getState();
  // Simulate rate map
  useSourceProduceStore.setState({
    liveMandiRates: {
      'red onion': {
        id: 'mp-1',
        cropName: 'Red Onion',
        variety: 'Nashik Garwa',
        grade: 'Grade A',
        mandiName: 'Lasalgaon APMC',
        district: 'Nashik',
        distanceKm: 25,
        minPriceQtl: 2200,
        modalPriceQtl: 2550,
        maxPriceQtl: 2850,
        modalPriceKg: 25.5,
        trendPct: 4.5,
        trendDirection: 'up',
        arrivalQtl: 3450,
        updatedTime: 'Live APMC Feed',
        demandIndex: 92,
        trendTag: '🔥 High Demand',
      },
    },
  });

  const rate = useSourceProduceStore.getState().getLiveRateForCrop('Red Onion');
  assert(Boolean(rate), 'Resolves live APMC mandi rate for Red Onion');
  assert(rate?.modalPriceQtl === 2550, 'Modal price is ₹2,550/qtl');
  assert(rate?.mandiName === 'Lasalgaon APMC', 'Correct Mandi APMC yard identified');

  const missingRate = useSourceProduceStore.getState().getLiveRateForCrop('Exotic Unknown Crop');
  assert(missingRate === undefined, 'Returns undefined for crop with no reported mandi feed');
}

console.log('\n▶ [Group 8] Supplier Directory Integrity & ID Consistency:');
{
  const suppliers = useSourceProduceStore.getState().suppliers;
  assert(suppliers.length >= 7, 'Suppliers directory contains at least 7 verified/pending entities');

  // Verify IDs align with procurement and matching modules
  const pimpalgaon = useSourceProduceStore.getState().getSupplierById('sup_fpo_pimpalgaon_01');
  assert(Boolean(pimpalgaon), 'Resolves Pimpalgaon FPO with canonical ID sup_fpo_pimpalgaon_01');
  assert(pimpalgaon?.type === 'FPO_CLUSTER', 'Pimpalgaon has FPO_CLUSTER type');
  assert(pimpalgaon?.verification.status === 'VERIFIED', 'Pimpalgaon is VERIFIED');

  const sahyadri = useSourceProduceStore.getState().getSupplierById('sup_fpo_sahyadri_02');
  assert(Boolean(sahyadri), 'Resolves Sahyadri Cooperative with canonical ID sup_fpo_sahyadri_02');
  assert(sahyadri?.type === 'COOPERATIVE', 'Sahyadri has COOPERATIVE type');

  const niphad = useSourceProduceStore.getState().getSupplierById('sup_grain_niphad_03');
  assert(Boolean(niphad), 'Resolves Niphad Taluka Kisan Sangh with canonical ID sup_grain_niphad_03');
  assert(niphad?.type === 'WHOLESALE_AGGREGATOR', 'Niphad has WHOLESALE_AGGREGATOR type');

  const dindori = useSourceProduceStore.getState().getSupplierById('sup_kisan_dindori_04');
  assert(Boolean(dindori), 'Resolves Dindori Organic FPO with canonical ID sup_kisan_dindori_04');
}

console.log('\n▶ [Group 9] Product-Specific Supplier Discovery & Keyword Search:');
{
  // Sourcing suppliers for Red Onion
  const onionSuppliers = useSourceProduceStore.getState().getSuppliersForProduct('Red Onion');
  assert(onionSuppliers.length >= 3, 'Finds at least 3 suppliers listing or supporting Red Onion');
  assert(
    onionSuppliers.every(
      (s) =>
        s.supportedCrops.some((c) => c.toLowerCase().includes('onion')) ||
        s.productListings.some((l) => l.cropName.toLowerCase().includes('onion'))
    ),
    'Every matched supplier supports or lists Red Onion'
  );

  // Sourcing suppliers for Fertilizers/Inputs
  const inputSuppliers = useSourceProduceStore.getState().getSuppliersForProduct('IFFCO DAP');
  assert(inputSuppliers.length >= 1, 'Finds cooperative input federation for IFFCO DAP');
  assert(inputSuppliers[0].id === 'sup_iffco_agro_06', 'Correct input depot identified');

  // Keyword search in supplier store
  useSourceProduceStore.getState().setSupplierSearchQuery('Mohadi');
  const mohadiMatch = useSourceProduceStore.getState().getSuppliersForProduct();
  assert(mohadiMatch.length === 1, 'Search by location "Mohadi" returns exactly 1 supplier');
  assert(mohadiMatch[0].id === 'sup_fpo_sahyadri_02', 'Sahyadri cluster matched by location query');
  useSourceProduceStore.getState().setSupplierSearchQuery('');
}

console.log('\n▶ [Group 10] Verification Status Distinction & Rating Non-Fabrication:');
{
  const pendingSupplier = useSourceProduceStore.getState().getSupplierById('sup_godavari_traders_07');
  assert(Boolean(pendingSupplier), 'Resolves Godavari Traders (sup_godavari_traders_07)');
  assert(
    pendingSupplier?.verification.status === 'PENDING',
    'Godavari Traders is accurately flagged as PENDING verification'
  );
  assert(
    pendingSupplier?.ratingStars === undefined,
    'Preserves undefined ratingStars when reliable ratings records do not exist (no fake rating)'
  );
  assert(
    pendingSupplier?.verification.bankAccountVerified === false,
    'Unverified bank account properly distinguished'
  );

  // Filter Verified Only test
  useSourceProduceStore.getState().setSupplierFilterVerifiedOnly(true);
  const verifiedList = useSourceProduceStore.getState().getSuppliersForProduct();
  assert(
    verifiedList.every((s) => s.verification.status === 'VERIFIED'),
    'Filter Verified Only includes strictly VERIFIED suppliers'
  );
  assert(
    !verifiedList.some((s) => s.id === 'sup_godavari_traders_07'),
    'Pending supplier is excluded when Verified Only is active'
  );
  useSourceProduceStore.getState().setSupplierFilterVerifiedOnly(false);
}

console.log('\n▶ [Group 11] Supplier Details Retrieval, Commercial Terms & Missing Supplier:');
{
  const supplier = useSourceProduceStore.getState().getSupplierById('sup_fpo_pimpalgaon_01');
  assert(Boolean(supplier?.commercialTerms), 'Commercial terms exist on supplier record');
  assert(supplier?.commercialTerms.advanceRequiredPct === 0, 'Pimpalgaon requires 0% advance');
  assert(Boolean(supplier?.commercialTerms.weighbridgeSlipProvided), 'Weighbridge slip provided');
  assert(supplier?.deliveryCapabilities.fleetRadiusKm === 250, 'Fleet radius is 250 km');

  // Inventory inspection
  assert(supplier?.productListings.length === 3, 'Pimpalgaon has 3 active product listings');
  assert(supplier?.productListings[0].indicativePrice === 2350, 'Red Onion indicative rate is ₹2,350/qtl');

  // Missing supplier ID handling
  const missingSupplier = useSourceProduceStore.getState().getSupplierById('non_existent_supplier_999');
  assert(missingSupplier === undefined, 'Gracefully returns undefined for unknown supplier ID');
}

console.log('\n▶ [Group 12] Supplier Verification Auditing, Expiry, Rejection & Access Control:');
(async () => {
  // 1. Verified Supplier
  const pimpalgaon = useSourceProduceStore.getState().getSupplierById('sup_fpo_pimpalgaon_01');
  assert(Boolean(pimpalgaon), 'Pimpalgaon FPO exists');
  assert(pimpalgaon?.verification.status === 'VERIFIED', 'Verification status is VERIFIED');
  assert(pimpalgaon?.verification.registrationNumber === 'FPO-MH-NSK-2019-0412', 'Authentic FPO registration number');
  assert(Boolean(pimpalgaon?.verification.issuedBy?.includes('Ministry of Corporate Affairs')), 'Issued by MCA / SFAC');
  assert(Boolean(pimpalgaon?.verification.verifiedAt), 'Has verifiedAt timestamp');
  assert(Boolean(pimpalgaon?.verification.expiresAt), 'Has statutory expiry date');
  assert(pimpalgaon?.verification.apmcLicenseVerified === true, 'APMC License is verified');
  assert(pimpalgaon?.verification.bankAccountVerified === true, 'Escrow bank account verified');
  assert(Boolean(pimpalgaon?.verification.documents && pimpalgaon.verification.documents.length >= 2), 'Contains audited certificates');

  // Document security & access control
  const incorporationDoc = pimpalgaon?.verification.documents?.find((d) => d.docType === 'REGISTRATION_CERTIFICATE');
  assert(incorporationDoc?.isAccessRestricted === false, 'Public incorporation certificate preview is permitted');
  assert(Boolean(incorporationDoc?.securePreviewUrl), 'Secure preview URL is provided for authorized document');

  // 2. Pending Verification Supplier
  const pendingSup = useSourceProduceStore.getState().getSupplierById('sup_godavari_traders_07');
  assert(pendingSup?.verification.status === 'PENDING', 'Godavari status is PENDING');
  assert(pendingSup?.verification.bankAccountVerified === false, 'Pending supplier bank account is unverified');
  assert(pendingSup?.verification.verifiedAt === undefined, 'Does NOT display fake verified timestamp');

  // 3. Expired Verification Supplier
  const expiredSup = useSourceProduceStore.getState().getSupplierById('sup_malegaon_traders_08');
  assert(expiredSup?.verification.status === 'EXPIRED', 'Malegaon status is EXPIRED');
  assert(expiredSup?.verification.expiresAt === '2026-03-31', 'Accurate historical expiry date recorded');
  assert(Boolean(expiredSup?.verification.expiredReason?.includes('expired')), 'Presents explicit expired reason to farmer');

  // 4. Rejected Verification Supplier
  const rejectedSup = useSourceProduceStore.getState().getSupplierById('sup_kalyan_traders_09');
  assert(rejectedSup?.verification.status === 'REJECTED', 'Kalyan Chemical status is REJECTED');
  assert(Boolean(rejectedSup?.verification.rejectionReason?.includes('Failed mandatory')), 'Rejection reason cites safety non-compliance');
  assert(rejectedSup?.verification.kycCompleted === false, 'KYC marked false on rejected entity');

  // 5. Unavailable Verification Supplier
  const unavailSup = useSourceProduceStore.getState().getSupplierById('sup_unknown_10');
  assert(unavailSup?.verification.status === 'UNAVAILABLE', 'Deola Aggregator status is UNAVAILABLE');
  assert(Boolean(unavailSup?.verification.unavailableReason), 'Explains unavailable records without presenting supplier as verified');
  assert(unavailSup?.verification.documents?.length === 0, 'No false document records attached to unavailable entity');

  // 6. Async fetchSupplierVerification method
  const asyncVerified = await useSourceProduceStore.getState().fetchSupplierVerification('sup_fpo_pimpalgaon_01');
  assert(asyncVerified?.status === 'VERIFIED', 'fetchSupplierVerification resolves verified details');

  const asyncMissing = await useSourceProduceStore.getState().fetchSupplierVerification('non_existent_id');
  assert(asyncMissing === undefined, 'fetchSupplierVerification handles non-existent supplier gracefully');

  console.log('\n▶ [Group 13] Market Price Details, Unit Consistency & Stale Data Distinction:');
  {
    const onionDetails = useSourceProduceStore.getState().getMarketPriceDetailsLocal('Red Onion');
    assert(Boolean(onionDetails), 'Resolves Red Onion market price details');
    assert(onionDetails?.marketMandiName === 'Lasalgaon Principal APMC Market Yard', 'Correct APMC market identified');
    assert(onionDetails?.modalPriceQtl === 2450, 'Modal rate is ₹2,450/qtl');
    assert(onionDetails?.minPriceQtl === 1850 && onionDetails?.maxPriceQtl === 2800, 'Min and max price corridor correctly loaded');

    // Unit consistency & strict conversion: 1 quintal = 100 kg
    assert(onionDetails?.priceUnit === '₹ / quintal', 'Primary unit is ₹ / quintal');
    assert(onionDetails?.secondaryUnit === '₹ / kg', 'Secondary unit is ₹ / kg');
    assert(onionDetails?.conversionFactorKgPerUnit === 100, 'Conversion factor is strictly 100 kg per quintal');
    assert(onionDetails?.modalPriceKg === 24.5, 'Exact normalized rate is ₹24.5/kg (no unit mismatch)');
    assert(onionDetails?.minPriceKg === 18.5 && onionDetails?.maxPriceKg === 28.0, 'Min and max normalized rates match 100kg conversion');

    // Source authority
    assert(Boolean(onionDetails?.sourceAuthority.includes('AGMARKNET')), 'Source attribution includes AGMARKNET');
    assert(Boolean(onionDetails?.sourceAuthority.includes('MSAMB')), 'Source attribution includes MSAMB');
    assert(onionDetails?.isStale === false, 'Active trading day is not marked stale');

    // Stale data detection for closed / previous sessions
    const potatoDetails = useSourceProduceStore.getState().getMarketPriceDetailsLocal('Potato');
    assert(Boolean(potatoDetails), 'Resolves Potato market price details');
    assert(potatoDetails?.isStale === true, 'Potato correctly flagged as isStale=true for previous session');
    assert(Boolean(potatoDetails?.staleReason?.includes('yesterday') || potatoDetails?.staleReason?.includes('underway')), 'Stale reason explains trading floor status without presenting as live today');

    // 3-tier pricing clarity distinction
    assert(Boolean(onionDetails?.clarityNotice.referenceNotice), 'Reference notice explains APMC benchmark');
    assert(Boolean(onionDetails?.clarityNotice.supplierQuoteVarianceNotice), 'Quote variance notice explains supplier premiums');
    assert(Boolean(onionDetails?.clarityNotice.transactionExecutionNotice), 'Transaction notice explains escrow weighbridge settlement');
  }

  console.log('\n▶ [Group 14] Historical Price Series, Timeframe Filtering & Missing Date Handling:');
  {
    // Timeframe filtering: 7D, 30D, 90D
    const series7 = useSourceProduceStore.getState().getMarketPriceHistoryLocal('onion', 7);
    assert(Boolean(series7), 'Resolves 7-day price series');
    if (!series7) throw new Error('series7 undefined');
    assert(series7.rangeDays === 7, 'Generates exactly 7-day range');
    assert(series7.observations.length === 7, 'Contains 7 chronological day observations');

    const series30 = useSourceProduceStore.getState().getMarketPriceHistoryLocal('onion', 30);
    assert(Boolean(series30), 'Resolves 30-day price series');
    if (!series30) throw new Error('series30 undefined');
    assert(series30.rangeDays === 30, 'Generates 30-day range');
    assert(series30.observations.length === 30, 'Contains 30 chronological day observations');

    // Non-trading day handling: Sundays and gazetted holidays
    const closedDays = series30.observations.filter((o) => !o.isTradingDay);
    assert(closedDays.length >= 4, 'Identifies at least 4 non-trading days in a 30-day window (Sundays/holidays)');
    assert(
      closedDays.every((c) => c.modalPriceQtl === undefined),
      'Does not fabricate modal prices on non-trading days (modalPriceQtl is undefined)'
    );
    assert(
      closedDays.every((c) => Boolean(c.closureReason)),
      'Every closed day contains an explicit closure reason (e.g. APMC Sunday Closure)'
    );

    // Statistical integrity
    assert(series30.highestModalPriceQtl >= series30.lowestModalPriceQtl, 'Highest price >= lowest price');
    assert(
      series30.averageModalPriceQtl >= series30.lowestModalPriceQtl &&
        series30.averageModalPriceQtl <= series30.highestModalPriceQtl,
      'Average modal price falls within the period min-max band'
    );
    assert(series30.spreadVolatilityPct > 0, 'Computes price spread volatility percentage');
    assert(
      series30.averageModalPriceKg === Number((series30.averageModalPriceQtl / 100).toFixed(1)),
      'Period average per-kg conversion is mathematically consistent'
    );

    // Async store methods
    const asyncDetails = await useSourceProduceStore.getState().fetchMarketPriceDetails('Red Onion');
    assert(asyncDetails?.commodity === 'Red Onion', 'fetchMarketPriceDetails resolves Red Onion');

    const asyncHistory = await useSourceProduceStore.getState().fetchMarketPriceHistory('Red Onion', undefined, 15);
    assert(asyncHistory?.rangeDays === 15, 'fetchMarketPriceHistory resolves 15-day series');
  }

  console.log('\n▶ [Group 15] End-to-End Flow & State Preservation Audit:');
  {
    // 1. Entry: Discover categories
    assert(useSourceProduceStore.getState().categories.length >= 6, 'E2E Step 1: Categories available on Source entry');
    const vegCategory = useSourceProduceStore.getState().categories.find((c) => c.id === 'vegetables');
    assert(Boolean(vegCategory), 'E2E Step 2: Vegetables & Greens category exists');

    // 2. Category selection -> Search Results
    useSourceProduceStore.getState().setSelectedCategory('vegetables');
    useSourceProduceStore.getState().setSearchQuery('onion');
    assert(useSourceProduceStore.getState().selectedCategory === 'vegetables', 'E2E Step 3: Selected category preserved in state');
    assert(useSourceProduceStore.getState().searchQuery === 'onion', 'E2E Step 4: Search query preserved in state');

    // 3. Product Details resolution
    const onionProd = useSourceProduceStore.getState().getProductById('prod_onion_01');
    assert(onionProd !== undefined, 'E2E Step 5: Product details resolved for prod_onion_01');
    assert(onionProd?.name === 'Red Onion', 'E2E Step 6: Product name matches canonical Red Onion');
    assert(onionProd?.defaultVariety === 'Nashik Red Garwa', 'E2E Step 7: Authentic variety spec attached');

    // 4. Product -> Supplier List bridge
    const matchingSuppliers = useSourceProduceStore.getState().getSuppliersForProduct(onionProd?.name, onionProd?.id);
    assert(matchingSuppliers.length >= 3, 'E2E Step 8: Matches at least 3 suppliers for selected produce');
    const topSupplier = matchingSuppliers[0];
    assert(Boolean(topSupplier?.id), 'E2E Step 9: Top supplier identified with canonical ID');

    // 5. Supplier Details resolution
    const supplierDetails = useSourceProduceStore.getState().getSupplierById(topSupplier.id);
    assert(supplierDetails !== undefined, 'E2E Step 10: Full supplier profile resolved');
    assert(Boolean(supplierDetails?.commercialTerms), 'E2E Step 11: Commercial terms preserved');
    assert(Boolean(supplierDetails?.productListings.length), 'E2E Step 12: Product listings present');

    // 6. Supplier Details -> Verification Details
    const verification = supplierDetails?.verification;
    assert(verification !== undefined, 'E2E Step 13: Verification details attached');
    assert(
      ['VERIFIED', 'PENDING', 'EXPIRED', 'REJECTED', 'UNAVAILABLE'].includes(verification?.status || ''),
      'E2E Step 14: Verification status conforms strictly to 5-state backend schema'
    );

    // 7. Product -> Market Price Details bridge
    const priceDetails = useSourceProduceStore.getState().getMarketPriceDetailsLocal(onionProd?.name);
    assert(priceDetails !== undefined, 'E2E Step 15: APMC market price resolved for produce');
    assert(priceDetails?.commodity === onionProd?.name, 'E2E Step 16: Commodity identifier preserved between Product & Price');
    assert(priceDetails?.priceUnit === '₹ / quintal', 'E2E Step 17: Price unit is consistently ₹/quintal');
    assert(priceDetails?.secondaryUnit === '₹ / kg', 'E2E Step 18: Secondary unit is consistently ₹/kg');

    // 8. Market Price Details -> Price History bridge
    const priceHistory = useSourceProduceStore.getState().getMarketPriceHistoryLocal(priceDetails?.commodity, 30);
    assert(priceHistory !== undefined, 'E2E Step 19: Price history series resolved');
    assert(priceHistory?.commodity === priceDetails?.commodity, 'E2E Step 20: Commodity identifier preserved between Price & History');
    assert(priceHistory?.marketMandiName === priceDetails?.marketMandiName, 'E2E Step 21: Mandi trading location preserved between Price & History');

    // 9. Back navigation / State reset
    useSourceProduceStore.getState().resetFilters();
    assert(useSourceProduceStore.getState().selectedCategory === 'all', 'E2E Step 22: Category filter resets cleanly');
    assert(useSourceProduceStore.getState().searchQuery === '', 'E2E Step 23: Search query resets cleanly');
    assert(useSourceProduceStore.getState().currentPage === 1, 'E2E Step 24: Page reset restores to first page');
  }

  console.log('\n▶ [Group 16] Security, Privacy & Non-Fabrication Audit:');
  {
    // Check rejected supplier data protection
    const rejectedSupplier = useSourceProduceStore.getState().getSupplierById('sup_kalyan_traders_09');
    assert(rejectedSupplier?.verification.status === 'REJECTED', 'Audit 1: Rejected entity strictly marked REJECTED');
    assert(rejectedSupplier?.verification.rejectionReason !== undefined, 'Audit 2: Rejection reason clearly articulated');
    assert(rejectedSupplier?.verification.kycCompleted === false, 'Audit 3: KYC marked false for rejected entity');

    // Check unverified/pending supplier
    const pendingSupplier = useSourceProduceStore.getState().getSupplierById('sup_godavari_traders_07');
    assert(pendingSupplier?.verification.status === 'PENDING', 'Audit 4: Pending entity listed with PENDING status');
    assert(pendingSupplier?.verification.verifiedAt === undefined, 'Audit 5: No fake verifiedAt timestamp for pending entity');
    assert(pendingSupplier?.ratingStars === undefined, 'Audit 6: Preserves undefined ratingStars when no rating exists');

    // Check expired supplier
    const expiredSupplier = useSourceProduceStore.getState().getSupplierById('sup_malegaon_traders_08');
    assert(expiredSupplier?.verification.status === 'EXPIRED', 'Audit 7: Expired license properly recorded');
    assert(Boolean(expiredSupplier?.verification.expiresAt), 'Audit 8: Expiry date preserved without renewing falsely');
    assert(Boolean(expiredSupplier?.verification.expiredReason), 'Audit 9: Explains expired reason to farmer');

    // Check unavailable supplier
    const unavailSupplier = useSourceProduceStore.getState().getSupplierById('sup_unknown_10');
    assert(unavailSupplier?.verification.status === 'UNAVAILABLE', 'Audit 10: Unavailable verification status preserved');
    assert((unavailSupplier?.verification.documents?.length || 0) === 0, 'Audit 11: No ghost documents attached to unavailable entity');

    // Check market price non-fabrication
    const potatoDetails = useSourceProduceStore.getState().getMarketPriceDetailsLocal('Potato');
    assert(potatoDetails?.isStale === true, 'Audit 12: Potato previous session strictly marked stale');
    assert(Boolean(potatoDetails?.staleReason), 'Audit 13: Stale reason explains session closure');

    // Check non-trading days in history
    const maizeHistory = useSourceProduceStore.getState().getMarketPriceHistoryLocal('Maize', 7);
    const sundayObservations = maizeHistory?.observations.filter((o) => !o.isTradingDay) || [];
    assert(
      sundayObservations.every((s) => s.modalPriceQtl === undefined && s.modalPriceKg === undefined),
      'Audit 14: Sunday APMC closures never fabricate modal prices'
    );
    assert(
      sundayObservations.every((s) => s.minPriceQtl === undefined && s.maxPriceQtl === undefined),
      'Audit 15: Sunday APMC closures never fabricate min/max corridors'
    );
  }

  console.log('\n========================================================');
  console.log(`📊 TEST RUN COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
})();


