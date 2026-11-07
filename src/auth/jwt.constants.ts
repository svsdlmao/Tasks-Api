/**
 * JWT signing settings. The secret is read lazily (at call time) so it's
 * available after the app's config/env is loaded. JWT_SECRET must be set.
 */
export function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set.');
  return s;
}

export const jwtExpiresIn = '7d';
