/**
 * MandiKart Admin Panel — Dynamic API Config
 * Resolves API URL based on active window hostname (localhost or LAN IP).
 */
export const getAdminApiBaseUrl = (): string => {
  const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:4003/api/v1/admin`;
};
