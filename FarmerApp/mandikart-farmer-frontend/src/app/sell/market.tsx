/**
 * MandiKart Farmer App — Deprecated Sell Market Route
 * Seamlessly redirects to the central live Gemini 2.5 Flash APMC Market Prices Intelligence screen.
 */

import React from 'react';
import { Redirect } from 'expo-router';

export default function SellMarketRedirect() {
  return <Redirect href="/market-prices" />;
}
