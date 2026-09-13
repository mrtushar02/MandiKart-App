/**
 * MandiKart Farmer App — Search Service Unit Test Suite
 * Tests:
 * 1. Vernacular synonym mapping across Hindi, Odia, Telugu, Bengali, and English.
 * 2. Text mismatch & "Did you mean?" autocorrect suggestions.
 * 3. Scored multi-source agricultural search with category filtering.
 */

import {
  executeAgriculturalSearch,
  resolveSynonymsAndSuggestions,
} from '../services/searchService';

console.log('========================================================');
console.log('🧪 RUNNING MANDIKART SEARCH INTELLIGENCE TEST SUITE');
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

console.log('▶ [Group 1] Vernacular Synonym & Text Mismatch Resolution:');

{
  const res = resolveSynonymsAndSuggestions('pyaj');
  assert(res.targetCanonical === 'Onion', 'Resolves Hindi "pyaj" to Onion');
  assert(res.expandedTokens.includes('onion'), 'Expanded tokens include "onion"');
  assert(Boolean(res.didYouMeanSuggestion?.includes('Onion')), 'Provides Did You Mean suggestion for Onion');
}

{
  const res = resolveSynonymsAndSuggestions('tamatar');
  assert(res.targetCanonical === 'Tomato', 'Resolves Odia/Hindi "tamatar" to Tomato');
  assert(res.expandedTokens.includes('tomato'), 'Expanded tokens include "tomato"');
  assert(Boolean(res.didYouMeanSuggestion?.includes('Tomato')), 'Provides Did You Mean suggestion for Tomato');
}

{
  const res = resolveSynonymsAndSuggestions('batata');
  assert(res.targetCanonical === 'Potato', 'Resolves Marathi/Gujarati "batata" to Potato');
  assert(res.expandedTokens.includes('potato'), 'Expanded tokens include "potato"');
}

{
  const res = resolveSynonymsAndSuggestions('dhan');
  assert(res.targetCanonical === 'Paddy / Rice', 'Resolves "dhan" to Paddy / Rice');
  assert(res.expandedTokens.includes('paddy'), 'Expanded tokens include "paddy"');
}

{
  const res = resolveSynonymsAndSuggestions('kalia');
  assert(res.targetCanonical === 'Government Schemes', 'Resolves "kalia" to Government Schemes');
  assert(Boolean(res.didYouMeanSuggestion?.includes('Government Schemes')), 'Provides Did You Mean for Government Schemes');
}

console.log('\n▶ [Group 2] Multi-Source Agricultural Search Engine:');

{
  const res = executeAgriculturalSearch('');
  assert(res.totalCount > 10, 'Returns all items when query is empty');
  assert(res.didYouMean === null, 'No Did You Mean when query is empty');
}

{
  const res = executeAgriculturalSearch('tamatar');
  assert(res.results.length > 0, 'Searches Tomato by Hindi alias "tamatar" and returns results');
  assert(
    res.results.some((r) => r.title.toLowerCase().includes('tomato')),
    'Matches canonical Tomato item'
  );
  assert(res.didYouMean !== null, 'Provides Did You Mean suggestion for tamatar');
}

{
  const res = executeAgriculturalSearch('pyaaz');
  assert(res.results.length > 0, 'Searches Onion by vernacular "pyaaz"');
  assert(res.results[0].title.toLowerCase().includes('onion'), 'Ranks Onion with highest relevance');
}

{
  const res = executeAgriculturalSearch('bima', 'schemes');
  assert(res.results.length > 0, 'Finds crop insurance schemes');
  assert(res.results.every((r) => r.category === 'schemes'), 'Filters by category "schemes" correctly');
}

{
  const res = executeAgriculturalSearch('armyworm', 'pest');
  assert(res.results.length > 0, 'Finds armyworm pest doctor guide');
  assert(res.results[0].category === 'pest', 'Category is pest');
  assert(res.results[0].actionRoute === '/ai-assistant', 'Routes to /ai-assistant for remedy');
}

{
  const res = executeAgriculturalSearch('reliance', 'buyers');
  assert(res.results.length > 0, 'Searches verified buyer requests');
  assert(res.results.some((r) => r.title.toLowerCase().includes('reliance')), 'Finds Reliance Fresh wholesale hub');
}

console.log('\n========================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
}
