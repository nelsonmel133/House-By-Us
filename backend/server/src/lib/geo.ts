/**
 * Geospatial utilities for listing proximity search.
 *
 * MySQL 8+ has spatial extensions, but for simplicity and broad hosting
 * compatibility, we use a bounding-box approximation with the Haversine
 * formula to filter candidates, then sort by exact distance.
 *
 * Approximation accuracy:
 *   At Harare's latitude (-17.8°), 1° longitude ≈ 104 km, 1° latitude ≈ 111 km.
 *   A 5 km radius bounding box is accurate enough for student housing search.
 */

/** Earth's mean radius in kilometres */
const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lng points in kilometres.
 * Used to compute exact distance after the DB bounding-box pre-filter.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

/**
 * Compute a lat/lng bounding box for a given centre point and radius.
 * Used to build efficient `WHERE latitude BETWEEN ? AND ?` SQL clauses.
 *
 * @param lat       Centre latitude
 * @param lng       Centre longitude
 * @param radiusKm  Search radius in kilometres
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): BoundingBox {
  // 1° latitude ≈ 111.32 km everywhere
  const latDelta = radiusKm / 111.32;

  // 1° longitude varies with latitude
  const lngDelta = radiusKm / (111.32 * Math.cos(toRad(lat)));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
