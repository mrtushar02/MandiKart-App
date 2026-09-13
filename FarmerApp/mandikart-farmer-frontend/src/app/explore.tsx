/**
 * MandiKart Farmer App — Explore Redirect
 * Redirects to main dashboard.
 */

import React from 'react';
import { Redirect } from 'expo-router';

export default function ExploreRedirect() {
  return <Redirect href="/(tabs)/home" />;
}
