
// Simple ID generators for better user experience
export const generateShopId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `SHOP-${timestamp}${random}`.toUpperCase();
};

export const generateJobId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 3);
  return `JOB-${timestamp}${random}`.toUpperCase();
};

export const generateTrackingId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
