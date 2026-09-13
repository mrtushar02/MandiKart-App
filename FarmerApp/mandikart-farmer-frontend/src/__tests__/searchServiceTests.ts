/**
 * MandiKart Farmer App — Search Service Unit Test Suite
 * Tests:
 * 1. Vernacular synonym mapping across Hindi, Odia, Telugu, Bengali, and English.
 * 2. Text mismatch & "Did you mean?" autocorrect suggestions.
 * 3. Scored multi-source agricultural search with category filtering.
 */

import assert from 'assert';
import {
  executeAgriculturalSearch,
  resolveSynonymsAndSuggestions,
  getAllRealtimeSearchItems,
} from '../services/searchService';

console.log('========================================================');
console.log('🧪 RUNNING MANDIKART SEARCH INTELLIGENCE TEST SUITE');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('▶ [Group 1] Vernacular Synonym & Text Mismatch Resolution:');

it('Resolves Hindi "pyaj" to Onion with Did You Mean suggestion', () => {
  const res = resolveSynonymsAndSuggestions('pyaj');
  assert.strictEqual(res.targetCanonical, 'Onion');
  assert.ok(res.expandedTokens.includes('onion'));
  assert.ok(res.didYouMeanSuggestion?.includes('Onion'));
});

it('Resolves Odia/Hindi "tamatar" to Tomato', () => {
  const res = resolveSynonymsAndSuggestions('tamatar');
  assert.strictEqual(res.targetCanonical, 'Tomato');
  assert.ok(res.expandedTokens.includes('tomato'));
  assert.ok(res.didYouMeanSuggestion?.includes('Tomato'));
});

it('Resolves Marathi/Gujarati "batata" to Potato', () => {
  const res = resolveSynonymsAndSuggestions('batata');
  assert.strictEqual(res.targetCanonical, 'Potato');
  assert.ok(res.expandedTokens.includes('potato'));
});

it('Resolves "dhan" to Paddy / Rice', () => {
  const res = resolveSynonymsAndSuggestions('dhan');
  assert.strictEqual(res.targetCanonical, 'Paddy / Rice');
  assert.ok(res.expandedTokens.includes('paddy'));
});

it('Resolves "kalia" to Government Schemes', () => {
  const res = resolveSynonymsAndSuggestions('kalia');
  assert.strictEqual(res.targetCanonical, 'Government Schemes');
  assert.ok(res.didYouMeanSuggestion?.includes('Government Schemes'));
});

console.log('\n▶ [Group 2] Multi-Source Agricultural Search Engine:');

it('Returns all items when query is empty', () => {
  const res = executeAgriculturalSearch('');
  assert.ok(res.totalCount > 10, 'Should have rich default agricultural items');
  assert.strictEqual(res.didYouMean, null);
});

it('Searches Tomato by Hindi alias "tamatar" and returns matching crops', () => {
  const res = executeAgriculturalSearch('tamatar');
  assert.ok(res.results.length > 0, 'Should find tomato items');
  assert.ok(
    res.results.some((r) => r.title.toLowerCase().includes('tomato')),
    'Should match canonical Tomato item'
  );
  assert.ok(res.didYouMean !== null, 'Should provide Did You Mean suggestion');
});

it('Searches Onion by vernacular "pyaaz" and ranks high relevance', () => {
  const res = executeAgriculturalSearch('pyaaz');
  assert.ok(res.results.length > 0);
  assert.ok(res.results[0].title.toLowerCase().includes('onion'));
});

it('Filters by category "schemes" correctly', () => {
  const res = executeAgriculturalSearch('bima', 'schemes');
  assert.ok(res.results.length > 0);
  assert.ok(res.results.every((r) => r.category === 'schemes'));
});

it('Filters by category "pest" correctly for armyworm remedy', () => {
  const res = executeAgriculturalSearch('armyworm', 'pest');
  assert.ok(res.results.length > 0);
  assert.strictEqual(res.results[0].category, 'pest');
  assert.strictEqual(res.results[0].actionRoute, '/ai-assistant');
});

it('Searches verified buyer requests', () => {
  const res = executeAgriculturalSearch('reliance', 'buyers');
  assert.ok(res.results.length > 0);
  assert.ok(res.results.some((r) => r.title.toLowerCase().includes('reliance')));
});

console.log('\n========================================================');
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
}
