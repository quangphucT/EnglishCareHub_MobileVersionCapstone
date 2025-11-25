/**
 * Decode JWT token to get payload
 * Similar to web middleware JWT decoding
 */
export interface DecodedToken {
  userId?: string;
  email?: string;
  role?: string;
  isPlacementTestDone?: boolean;
  isGoalSet?: boolean;
  exp?: number;
  iat?: number;
  [key: string]: any;
}

export const decodeJWT = (token: string): DecodedToken | null => {
  try {
    // JWT có format: header.payload.signature
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    // Decode base64url to base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 to string
    const jsonPayload = atob(base64);
    
    // Parse JSON
    const decoded = JSON.parse(jsonPayload);

    // Map các claims từ backend (Microsoft Identity format)
    return {
      userId: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      isPlacementTestDone: decoded['IsPlacementTestDone'] === 'True' || decoded['IsPlacementTestDone'] === true,
      isGoalSet: decoded['IsGoalSet'] === 'True' || decoded['IsGoalSet'] === true,
      exp: decoded.exp,
      iat: decoded.iat,
      ...decoded,
    };
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};
