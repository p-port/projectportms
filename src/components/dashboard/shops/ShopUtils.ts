
/**
 * Generates a unique identifier for a shop based on name and region
 * Format: [NAME]-[REGION]-[RANDOM_ALPHANUMERIC]
 */
export function generateShopIdentifier(name: string, region: string): string {
  const cleanName = name.trim().replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
  const cleanRegion = region.trim().replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
  
  // Random alphanumeric string (5 characters)
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `${cleanName}-${cleanRegion}-${randomPart}`;
}

/**
 * Formats a shop identifier for display
 */
export function formatShopIdentifier(identifier: string): string {
  return identifier;
}
