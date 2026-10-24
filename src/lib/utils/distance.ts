/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal point e.g. 1.4
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export interface SmartTransitInfo {
  airDistanceKm: number;
  roadDistanceKm: number;
  distanceFormatted: string;
  transitType: 'WALKING' | 'BUS' | 'METRO';
  icon: string;
  estimatedMinutes: number;
  badgeLabel: string;
  fullLabel: string;
}

/**
 * Formats road distance into smart transit times and labels.
 */
export function getTransitFromDistanceKm(roadDistanceKm: number): SmartTransitInfo {
  const airDistanceKm = Math.round((roadDistanceKm / 1.28) * 10) / 10;
  const distanceFormatted = formatDistance(roadDistanceKm);

  // 1. Walking distance: Up to 1.4 km road distance
  if (roadDistanceKm <= 1.4) {
    const estimatedMinutes = Math.max(2, Math.round(roadDistanceKm * 12.5));
    return {
      airDistanceKm,
      roadDistanceKm,
      distanceFormatted,
      transitType: 'WALKING',
      icon: '🚶',
      estimatedMinutes,
      badgeLabel: `🚶 ${estimatedMinutes} dk yürüme`,
      fullLabel: `${distanceFormatted} • 🚶 ${estimatedMinutes} dk yürüme`,
    };
  }

  // 2. Bus / Minibus distance: Between 1.4 km and 4.5 km
  if (roadDistanceKm <= 4.5) {
    const estimatedMinutes = Math.max(6, Math.round(4 + (roadDistanceKm / 20) * 60));
    return {
      airDistanceKm,
      roadDistanceKm,
      distanceFormatted,
      transitType: 'BUS',
      icon: '🚌',
      estimatedMinutes,
      badgeLabel: `🚌 ${estimatedMinutes} dk toplu taşıma`,
      fullLabel: `${distanceFormatted} • 🚌 ${estimatedMinutes} dk toplu taşıma`,
    };
  }

  // 3. Metro / Rail distance: Greater than 4.5 km
  const estimatedMinutes = Math.max(12, Math.round(6 + (roadDistanceKm / 26) * 60));
  return {
    airDistanceKm,
    roadDistanceKm,
    distanceFormatted,
    transitType: 'METRO',
    icon: '🚇',
    estimatedMinutes,
    badgeLabel: `🚇 ${estimatedMinutes} dk metroyla`,
    fullLabel: `${distanceFormatted} • 🚇 ${estimatedMinutes} dk metro/ulaşım`,
  };
}

/**
 * Calculates smart transit and real street network distance between a listing and campus.
 * Uses Istanbul urban street factor (1.28x) and dynamic walking/transit times.
 */
export function getSmartTransitInfo(
  listingLat: number,
  listingLng: number,
  campusLat: number,
  campusLng: number
): SmartTransitInfo {
  const airDistanceKm = calculateDistance(listingLat, listingLng, campusLat, campusLng);
  // Istanbul urban street grid factor (real walking/driving road winding)
  const roadDistanceKm = Math.round(airDistanceKm * 1.28 * 10) / 10;
  return getTransitFromDistanceKm(roadDistanceKm);
}
