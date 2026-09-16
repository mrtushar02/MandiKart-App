/**
 * MandiKart Farmer App — Dijkstra Shortest-Path & Polyline Routing Service
 * 
 * Mathematical graph implementation of Dijkstra's algorithm for agricultural transport corridors.
 * Calculates optimal road paths between farmgate locations and mandi fulfillment hubs,
 * generating high-resolution GPS polylines, bearings, and live vehicle telemetry.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteTelemetry {
  currentPosition: LatLng;
  heading: number; // degrees 0-360
  remainingDistanceKm: number;
  remainingEtaMinutes: number;
  completedPolyline: [number, number][]; // [lat, lng]
  remainingPolyline: [number, number][]; // [lat, lng]
  totalDistanceKm: number;
  currentRoadName: string;
}

export interface RoadNode {
  id: string;
  name: string;
  lat: number;
  lon: number;
  neighbors: { [nodeId: string]: number }; // distance in km
}

// Regional agricultural logistics graph nodes (Nashik / Maharashtra & Bhubaneswar / Odisha belts)
export const AGRICULTURAL_ROAD_GRAPH: { [id: string]: RoadNode } = {
  // --- Western Maharashtra Agricultural Corridors ---
  farm_nashik_01: {
    id: 'farm_nashik_01',
    name: 'Nashik Organic Farmgate',
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
    name: 'Buyer Delivery Hub (Pune APMC Zone)',
    lat: 18.5204,
    lon: 73.8567,
    neighbors: { pune_shivajinagar_hub: 3.2, pune_market_yard: 5.1 },
  },

  // --- Eastern Odisha Agri-corridor ---
  patia_green_farm: {
    id: 'patia_green_farm',
    name: 'Patia Organic Farmgate',
    lat: 20.3582,
    lon: 85.8185,
    neighbors: { kiit_square_junction: 1.8, nandankanan_bypass: 3.5 },
  },
  kiit_square_junction: {
    id: 'kiit_square_junction',
    name: 'KIIT Square Transit Corridor',
    lat: 20.3512,
    lon: 85.8174,
    neighbors: { patia_green_farm: 1.8, nandankanan_bypass: 2.2, jaydev_vihar_flyover: 5.8 },
  },
  nandankanan_bypass: {
    id: 'nandankanan_bypass',
    name: 'Nandankanan Bypass Express Road',
    lat: 20.3340,
    lon: 85.8235,
    neighbors: { patia_green_farm: 3.5, kiit_square_junction: 2.2, jaydev_vihar_flyover: 4.1 },
  },
  jaydev_vihar_flyover: {
    id: 'jaydev_vihar_flyover',
    name: 'Jaydev Vihar Agro Overpass',
    lat: 20.3015,
    lon: 85.8202,
    neighbors: { kiit_square_junction: 5.8, nandankanan_bypass: 4.1, baramunda_terminal: 3.4 },
  },
  baramunda_terminal: {
    id: 'baramunda_terminal',
    name: 'Baramunda Freight Corridor',
    lat: 20.2785,
    lon: 85.7960,
    neighbors: { jaydev_vihar_flyover: 3.4, khandagiri_crossing: 2.6 },
  },
  khandagiri_crossing: {
    id: 'khandagiri_crossing',
    name: 'Khandagiri Square Crossing',
    lat: 20.2612,
    lon: 85.7890,
    neighbors: { baramunda_terminal: 2.6, aiginia_mandi_gate3: 1.8 },
  },
  aiginia_mandi_gate3: {
    id: 'aiginia_mandi_gate3',
    name: 'Bhubaneswar Central Mandi Hub Gate 3',
    lat: 20.2520,
    lon: 85.7815,
    neighbors: { khandagiri_crossing: 1.8 },
  },
};

/**
 * Haversine distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
  return R * c;
}

/**
 * Bearing angle from coordinate A to coordinate B (0-360 degrees)
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
 * Find nearest graph node to an arbitrary lat/lon
 */
export function findNearestNode(lat: number, lon: number): string {
  let nearestId = 'farm_nashik_01';
  let minDist = Infinity;
  for (const key of Object.keys(AGRICULTURAL_ROAD_GRAPH)) {
    const node = AGRICULTURAL_ROAD_GRAPH[key];
    const dist = calculateHaversineDistance(lat, lon, node.lat, node.lon);
    if (dist < minDist) {
      minDist = dist;
      nearestId = key;
    }
  }
  return nearestId;
}

/**
 * Dijkstra Shortest Path Algorithm
 */
export function dijkstraShortestPath(
  startNodeId: string,
  endNodeId: string,
  graph: { [id: string]: RoadNode } = AGRICULTURAL_ROAD_GRAPH
): string[] {
  if (startNodeId === endNodeId) return [startNodeId];

  const distances: { [id: string]: number } = {};
  const previous: { [id: string]: string | null } = {};
  const unvisited = new Set<string>();

  for (const nodeId of Object.keys(graph)) {
    distances[nodeId] = nodeId === startNodeId ? 0 : Infinity;
    previous[nodeId] = null;
    unvisited.add(nodeId);
  }

  while (unvisited.size > 0) {
    let closestNode: string | null = null;
    let shortestDist = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < shortestDist) {
        shortestDist = distances[nodeId];
        closestNode = nodeId;
      }
    }

    if (!closestNode || shortestDist === Infinity) break;
    if (closestNode === endNodeId) break;

    unvisited.delete(closestNode);

    const neighbors = graph[closestNode].neighbors;
    for (const neighborId of Object.keys(neighbors)) {
      if (!unvisited.has(neighborId)) continue;
      const weight = neighbors[neighborId];
      const alt = distances[closestNode] + weight;
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = closestNode;
      }
    }
  }

  const path: string[] = [];
  let curr: string | null = endNodeId;
  while (curr) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return path.length > 1 && path[0] === startNodeId ? path : [startNodeId, endNodeId];
}

function interpolateWaypoints(
  start: LatLng,
  end: LatLng,
  numPoints = 8
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const harmonicWobble = Math.sin(t * Math.PI) * 0.0025;
    const lat = start.latitude + (end.latitude - start.latitude) * t + harmonicWobble * 0.3;
    const lon = start.longitude + (end.longitude - start.longitude) * t + harmonicWobble;
    points.push([lat, lon]);
  }
  return points;
}

export function generateRoutePolyline(
  startCoords?: LatLng,
  destCoords?: LatLng,
  customPathNodeIds?: string[]
): [number, number][] {
  const startLat = startCoords?.latitude || 19.9975;
  const startLon = startCoords?.longitude || 73.7898;
  const endLat = destCoords?.latitude || 18.5204;
  const endLon = destCoords?.longitude || 73.8567;

  const startId = findNearestNode(startLat, startLon);
  const endId = findNearestNode(endLat, endLon);

  const nodeIds = customPathNodeIds || dijkstraShortestPath(startId, endId);

  const fullPolyline: [number, number][] = [];
  fullPolyline.push([startLat, startLon]);

  for (let i = 0; i < nodeIds.length; i++) {
    const currentNode = AGRICULTURAL_ROAD_GRAPH[nodeIds[i]];
    if (currentNode) {
      if (i === 0) {
        const seg = interpolateWaypoints(
          { latitude: startLat, longitude: startLon },
          { latitude: currentNode.lat, longitude: currentNode.lon },
          5
        );
        fullPolyline.push(...seg.slice(1));
      } else {
        const prevNode = AGRICULTURAL_ROAD_GRAPH[nodeIds[i - 1]];
        const seg = interpolateWaypoints(
          { latitude: prevNode.lat, longitude: prevNode.lon },
          { latitude: currentNode.lat, longitude: currentNode.lon },
          8
        );
        fullPolyline.push(...seg.slice(1));
      }
    }
  }

  const lastNode = AGRICULTURAL_ROAD_GRAPH[nodeIds[nodeIds.length - 1]];
  if (lastNode) {
    const finalSeg = interpolateWaypoints(
      { latitude: lastNode.lat, longitude: lastNode.lon },
      { latitude: endLat, longitude: endLon },
      5
    );
    fullPolyline.push(...finalSeg.slice(1));
  }

  return fullPolyline;
}

export function getVehicleTelemetryAlongPolyline(
  polyline: [number, number][],
  progress: number,
  avgSpeedKmh = 42
): RouteTelemetry {
  if (!polyline || polyline.length < 2) {
    const fallback: LatLng = { latitude: 19.9975, longitude: 73.7898 };
    return {
      currentPosition: fallback,
      heading: 45,
      remainingDistanceKm: 0,
      remainingEtaMinutes: 0,
      completedPolyline: polyline || [],
      remainingPolyline: [],
      totalDistanceKm: 0,
      currentRoadName: 'Agro Highway Link',
    };
  }

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

  const completedPolyline = polyline.slice(0, segIndex + 1);
  completedPolyline.push([currentLat, currentLon]);

  const remainingPolyline: [number, number][] = [
    [currentLat, currentLon],
    ...polyline.slice(segIndex + 1),
  ];

  let currentRoadName = 'NH-60 Sinnar Expressway';
  if (clampedProgress < 0.3) currentRoadName = 'Farmgate Link Road';
  else if (clampedProgress < 0.7) currentRoadName = 'State Highway Agri Corridor';
  else currentRoadName = 'Mandi Hub Approach';

  return {
    currentPosition: { latitude: currentLat, longitude: currentLon },
    heading,
    remainingDistanceKm: Math.round(remainingDistanceKm * 10) / 10,
    remainingEtaMinutes,
    completedPolyline,
    remainingPolyline,
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    currentRoadName,
  };
}
