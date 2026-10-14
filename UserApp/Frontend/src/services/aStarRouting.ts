/**
 * MandiKart A* (A-Star) Heuristic GPS Pathfinding & Realtime Polyline Routing Engine
 * 
 * Implements the optimal A* search algorithm:
 *   f(n) = g(n) + h(n)
 * where:
 *   - g(n) is the exact road-network distance from start to node n
 *   - h(n) is the admissible Haversine spherical distance heuristic to the destination
 * 
 * Calculates optimal agricultural freight corridors, generates high-density polyline coordinates,
 * and computes real-time vehicle GPS telemetry (driver pin, farmer farmgate, buyer destination, distance).
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface AStarRouteTelemetry {
  currentPosition: LatLng;
  heading: number; // degrees 0-360
  remainingDistanceKm: number;
  remainingEtaMinutes: number;
  completedPolyline: [number, number][]; // [lat, lng]
  remainingPolyline: [number, number][]; // [lat, lng]
  totalDistanceKm: number;
  distanceFromFarmerKm: number;
  farmerLocation: LatLng;
  destinationLocation: LatLng;
}

export interface AStarRoadNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  neighbors: { [nodeId: string]: number }; // distance in km
}

// Agricultural freight logistics graph (Nashik Farmgate -> Pune / Mumbai APMC Corridor)
export const AGRICULTURAL_ASTAR_GRAPH: { [id: string]: AStarRoadNode } = {
  farm_nashik_01: {
    id: 'farm_nashik_01',
    name: 'Nashik Organic Farmgate Hub',
    lat: 19.9975,
    lon: 73.7898,
    neighbors: { apmc_pimpalgaon: 14.2, junction_nh60_north: 8.5 },
  },
  apmc_pimpalgaon: {
    id: 'apmc_pimpalgaon',
    name: 'Pimpalgaon APMC Weighbridge',
    lat: 20.1706,
    lon: 73.9872,
    neighbors: { farm_nashik_01: 14.2, junction_nh60_north: 12.0, ozar_warehouse: 11.4 },
  },
  ozar_warehouse: {
    id: 'ozar_warehouse',
    name: 'Ozar Agri Cold Storage Hub',
    lat: 20.0934,
    lon: 73.9142,
    neighbors: { apmc_pimpalgaon: 11.4, junction_nh60_north: 7.2, toll_shirdi_bypass: 28.5 },
  },
  junction_nh60_north: {
    id: 'junction_nh60_north',
    name: 'NH-60 Sinnar Expressway Entry',
    lat: 19.8512,
    lon: 73.9924,
    neighbors: { farm_nashik_01: 8.5, apmc_pimpalgaon: 12.0, ozar_warehouse: 7.2, sangamner_hub: 34.0 },
  },
  sangamner_hub: {
    id: 'sangamner_hub',
    name: 'Sangamner Quality Sorting Hub',
    lat: 19.5762,
    lon: 74.2144,
    neighbors: { junction_nh60_north: 34.0, toll_shirdi_bypass: 24.1, alephata_cloverleaf: 38.6 },
  },
  toll_shirdi_bypass: {
    id: 'toll_shirdi_bypass',
    name: 'Shirdi Expressway Green Corridor',
    lat: 19.7645,
    lon: 74.4762,
    neighbors: { ozar_warehouse: 28.5, sangamner_hub: 24.1, alephata_cloverleaf: 45.0 },
  },
  alephata_cloverleaf: {
    id: 'alephata_cloverleaf',
    name: 'Alephata Central Transit Interchange',
    lat: 19.1983,
    lon: 74.1034,
    neighbors: { sangamner_hub: 38.6, toll_shirdi_bypass: 45.0, narayangaon_mandi: 18.2, chakan_freight_corridor: 42.0 },
  },
  narayangaon_mandi: {
    id: 'narayangaon_mandi',
    name: 'Narayangaon Tomato Wholesale Yard',
    lat: 19.1245,
    lon: 73.9782,
    neighbors: { alephata_cloverleaf: 18.2, chakan_freight_corridor: 32.5 },
  },
  chakan_freight_corridor: {
    id: 'chakan_freight_corridor',
    name: 'Chakan Express Logistics Hub',
    lat: 18.7612,
    lon: 73.8594,
    neighbors: { alephata_cloverleaf: 42.0, narayangaon_mandi: 32.5, bhosari_depot: 12.8, pune_shivajinagar_hub: 24.5 },
  },
  bhosari_depot: {
    id: 'bhosari_depot',
    name: 'Bhosari Sorting & Dispatch Yard',
    lat: 18.6275,
    lon: 73.8431,
    neighbors: { chakan_freight_corridor: 12.8, pune_market_yard: 18.6, pune_shivajinagar_hub: 11.2 },
  },
  pune_shivajinagar_hub: {
    id: 'pune_shivajinagar_hub',
    name: 'Shivajinagar Cold Delivery Hub',
    lat: 18.5314,
    lon: 73.8446,
    neighbors: { chakan_freight_corridor: 24.5, bhosari_depot: 11.2, pune_market_yard: 6.4, buyer_destination_pune: 3.2 },
  },
  pune_market_yard: {
    id: 'pune_market_yard',
    name: 'Gultekdi Pune APMC Market Yard',
    lat: 18.4912,
    lon: 73.8682,
    neighbors: { bhosari_depot: 18.6, pune_shivajinagar_hub: 6.4, buyer_destination_pune: 5.1 },
  },
  buyer_destination_pune: {
    id: 'buyer_destination_pune',
    name: 'Buyer Delivery Location (FC Road, Pune)',
    lat: 18.5204,
    lon: 73.8567,
    neighbors: { pune_shivajinagar_hub: 3.2, pune_market_yard: 5.1 },
  },
};

/**
 * Haversine formula to compute geodesic distance between two GPS coordinates (km)
 */
export function calculateHaversineDistance(
  lat1OrPoint1: number | LatLng,
  lon1OrPoint2: number | LatLng,
  lat2?: number,
  lon2?: number
): number {
  let lat1: number;
  let lon1: number;
  let lat2Val: number;
  let lon2Val: number;

  if (typeof lat1OrPoint1 === 'object' && typeof lon1OrPoint2 === 'object') {
    lat1 = lat1OrPoint1.latitude;
    lon1 = lat1OrPoint1.longitude;
    lat2Val = lon1OrPoint2.latitude;
    lon2Val = lon1OrPoint2.longitude;
  } else {
    lat1 = lat1OrPoint1 as number;
    lon1 = lon1OrPoint2 as number;
    lat2Val = lat2 as number;
    lon2Val = lon2 as number;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((lat2Val - lat1) * Math.PI) / 180;
  const dLon = ((lon2Val - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2Val * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Bearing angle from coordinate A to coordinate B (degrees 0-360)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Find nearest road graph node to GPS point
 */
export function findNearestAStarNode(lat: number, lon: number): string {
  let nearestId = 'farm_nashik_01';
  let minDist = Infinity;
  for (const key of Object.keys(AGRICULTURAL_ASTAR_GRAPH)) {
    const node = AGRICULTURAL_ASTAR_GRAPH[key];
    const dist = calculateHaversineDistance(lat, lon, node.lat, node.lon);
    if (dist < minDist) {
      minDist = dist;
      nearestId = key;
    }
  }
  return nearestId;
}

/**
 * A* (A-Star) Pathfinding Search Algorithm
 * Uses heuristic h(n) = Haversine distance to target to guarantee optimal shortest path
 */
export function aStarShortestPath(
  startNodeId: string,
  endNodeId: string,
  graph: { [id: string]: AStarRoadNode } = AGRICULTURAL_ASTAR_GRAPH
): string[] {
  if (startNodeId === endNodeId) return [startNodeId];
  if (!graph[startNodeId] || !graph[endNodeId]) return [startNodeId, endNodeId];

  const goalNode = graph[endNodeId];

  // gScore: exact cost from start to node
  const gScore: { [id: string]: number } = {};
  // fScore: gScore + heuristic h(node, goal)
  const fScore: { [id: string]: number } = {};
  const cameFrom: { [id: string]: string | null } = {};

  const openSet = new Set<string>([startNodeId]);
  const closedSet = new Set<string>();

  for (const nodeId of Object.keys(graph)) {
    gScore[nodeId] = Infinity;
    fScore[nodeId] = Infinity;
    cameFrom[nodeId] = null;
  }

  gScore[startNodeId] = 0;
  fScore[startNodeId] = calculateHaversineDistance(
    graph[startNodeId].lat,
    graph[startNodeId].lon,
    goalNode.lat,
    goalNode.lon
  );

  while (openSet.size > 0) {
    // Pick node in openSet with lowest fScore
    let current: string | null = null;
    let lowestF = Infinity;

    for (const nodeId of openSet) {
      if (fScore[nodeId] < lowestF) {
        lowestF = fScore[nodeId];
        current = nodeId;
      }
    }

    if (!current) break;
    if (current === endNodeId) {
      // Reconstruct path
      const path: string[] = [];
      let curr: string | null = endNodeId;
      while (curr) {
        path.unshift(curr);
        curr = cameFrom[curr];
      }
      return path;
    }

    openSet.delete(current);
    closedSet.add(current);

    const neighbors = graph[current].neighbors;
    for (const neighborId of Object.keys(neighbors)) {
      if (closedSet.has(neighborId)) continue;

      const edgeWeight = neighbors[neighborId];
      const tentativeG = gScore[current] + edgeWeight;

      if (!openSet.has(neighborId)) {
        openSet.add(neighborId);
      } else if (tentativeG >= gScore[neighborId]) {
        continue;
      }

      cameFrom[neighborId] = current;
      gScore[neighborId] = tentativeG;
      const neighborNode = graph[neighborId];
      const h = neighborNode
        ? calculateHaversineDistance(neighborNode.lat, neighborNode.lon, goalNode.lat, goalNode.lon)
        : 0;
      fScore[neighborId] = tentativeG + h;
    }
  }

  return [startNodeId, endNodeId];
}

/**
 * Interpolate natural GPS waypoints with road curvature
 */
function interpolateAStarWaypoints(
  start: LatLng,
  end: LatLng,
  numPoints = 8
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Organic road curvature harmonic
    const harmonicWobble = Math.sin(t * Math.PI) * 0.0032;
    const lat = start.latitude + (end.latitude - start.latitude) * t + harmonicWobble * 0.45;
    const lon = start.longitude + (end.longitude - start.longitude) * t + harmonicWobble;
    points.push([lat, lon]);
  }
  return points;
}

/**
 * Generate A* Route Polyline between Farmer/Farmgate and Buyer
 */
export function generateAStarRoutePolyline(
  startCoords?: LatLng,
  destCoords?: LatLng,
  customPathNodeIds?: string[]
): [number, number][] {
  const startLat = startCoords?.latitude || 19.9975;
  const startLon = startCoords?.longitude || 73.7898;
  const endLat = destCoords?.latitude || 18.5204;
  const endLon = destCoords?.longitude || 73.8567;

  const startId = findNearestAStarNode(startLat, startLon);
  const endId = findNearestAStarNode(endLat, endLon);

  const nodeIds = customPathNodeIds || aStarShortestPath(startId, endId);

  const fullPolyline: [number, number][] = [];
  fullPolyline.push([startLat, startLon]);

  for (let i = 0; i < nodeIds.length; i++) {
    const currentNode = AGRICULTURAL_ASTAR_GRAPH[nodeIds[i]];
    if (currentNode) {
      if (i === 0) {
        const seg = interpolateAStarWaypoints(
          { latitude: startLat, longitude: startLon },
          { latitude: currentNode.lat, longitude: currentNode.lon },
          6
        );
        fullPolyline.push(...seg.slice(1));
      } else {
        const prevNode = AGRICULTURAL_ASTAR_GRAPH[nodeIds[i - 1]];
        const seg = interpolateAStarWaypoints(
          { latitude: prevNode.lat, longitude: prevNode.lon },
          { latitude: currentNode.lat, longitude: currentNode.lon },
          8
        );
        fullPolyline.push(...seg.slice(1));
      }
    }
  }

  const lastNode = AGRICULTURAL_ASTAR_GRAPH[nodeIds[nodeIds.length - 1]];
  if (lastNode) {
    const finalSeg = interpolateAStarWaypoints(
      { latitude: lastNode.lat, longitude: lastNode.lon },
      { latitude: endLat, longitude: endLon },
      6
    );
    fullPolyline.push(...finalSeg.slice(1));
  }

  return fullPolyline;
}

/**
 * Compute real-time vehicle telemetry along the A* polyline
 */
export function getVehicleTelemetryAlongAStarPolyline(
  polyline: [number, number][],
  progress: number,
  avgSpeedKmh = 38
): AStarRouteTelemetry {
  const defaultFarmer: LatLng = { latitude: 19.9975, longitude: 73.7898 };
  const defaultDest: LatLng = { latitude: 18.5204, longitude: 73.8567 };

  if (!polyline || polyline.length < 2) {
    return {
      currentPosition: defaultFarmer,
      heading: 45,
      remainingDistanceKm: 0,
      remainingEtaMinutes: 0,
      completedPolyline: polyline || [],
      remainingPolyline: [],
      totalDistanceKm: 0,
      distanceFromFarmerKm: 0,
      farmerLocation: defaultFarmer,
      destinationLocation: defaultDest,
    };
  }

  const farmerLoc: LatLng = { latitude: polyline[0][0], longitude: polyline[0][1] };
  const destLoc: LatLng = { latitude: polyline[polyline.length - 1][0], longitude: polyline[polyline.length - 1][1] };

  let totalDistanceKm = 0;
  const cumDistances: number[] = [0];

  for (let i = 1; i < polyline.length; i++) {
    const d = calculateHaversineDistance(
      polyline[i - 1][0],
      polyline[i - 1][1],
      polyline[i][0],
      polyline[i][1]
    );
    totalDistanceKm += d;
    cumDistances.push(totalDistanceKm);
  }

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const targetDistance = totalDistanceKm * clampedProgress;

  let segIndex = 0;
  for (let i = 1; i < cumDistances.length; i++) {
    if (cumDistances[i] >= targetDistance) {
      segIndex = i - 1;
      break;
    }
  }

  const segStartDist = cumDistances[segIndex];
  const segEndDist = cumDistances[segIndex + 1] || totalDistanceKm;
  const segLength = segEndDist - segStartDist;
  const segFraction = segLength > 0 ? (targetDistance - segStartDist) / segLength : 0;

  const p1 = polyline[segIndex];
  const p2 = polyline[Math.min(segIndex + 1, polyline.length - 1)];

  const currentLat = p1[0] + (p2[0] - p1[0]) * segFraction;
  const currentLon = p1[1] + (p2[1] - p1[1]) * segFraction;
  const heading = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

  const remainingDistanceKm = Math.max(0, totalDistanceKm - targetDistance);
  const remainingEtaMinutes = Math.max(1, Math.round((remainingDistanceKm / avgSpeedKmh) * 60));
  const distanceFromFarmerKm = Math.round(targetDistance * 10) / 10;

  const completedPolyline = polyline.slice(0, segIndex + 1);
  completedPolyline.push([currentLat, currentLon]);

  const remainingPolyline: [number, number][] = [[currentLat, currentLon], ...polyline.slice(segIndex + 1)];

  return {
    currentPosition: { latitude: currentLat, longitude: currentLon },
    heading,
    remainingDistanceKm: Math.round(remainingDistanceKm * 10) / 10,
    remainingEtaMinutes,
    completedPolyline,
    remainingPolyline,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    distanceFromFarmerKm,
    farmerLocation: farmerLoc,
    destinationLocation: destLoc,
  };
}
