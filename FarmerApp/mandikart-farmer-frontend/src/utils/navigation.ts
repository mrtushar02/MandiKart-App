import { router } from 'expo-router';

type RouterType = typeof router;

/**
 * Safely navigates back if possible, otherwise routes to a safe fallback screen
 * to avoid "The action 'GO_BACK' was not handled by any navigator" warning.
 */
export function safeGoBack(router: RouterType, fallbackRoute: string = '/(tabs)/home') {
  try {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackRoute as any);
    }
  } catch {
    router.replace(fallbackRoute as any);
  }
}
