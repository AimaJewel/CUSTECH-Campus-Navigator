import { pathNodes, pathEdges, type PathNode, type PathEdge } from '@/data/campus';

interface AStarNode {
  id: string;
  g: number;
  h: number;
  f: number;
  parent: string | null;
}

function heuristic(a: PathNode, b: PathNode): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export type RoutePreference = 'shortest' | 'accessible' | 'shaded' | 'fastest';

function getEdgeWeight(edge: PathEdge, preference: RoutePreference): number {
  let weight = edge.distance;
  
  switch (preference) {
    case 'accessible':
      if (!edge.accessible) weight *= 100;
      if (edge.type === 'stairs') weight *= 50;
      break;
    case 'shaded':
      if (!edge.shaded) weight *= 1.5;
      break;
    case 'fastest':
      if (edge.type === 'road') weight *= 0.8;
      if (edge.type === 'shortcut') weight *= 0.7;
      break;
    default:
      break;
  }
  
  return weight;
}

export function findPath(
  startId: string,
  endId: string,
  preference: RoutePreference = 'shortest'
): { path: PathNode[]; distance: number; edges: PathEdge[] } | null {
  const nodeMap = new Map<string, PathNode>();
  pathNodes.forEach(n => nodeMap.set(n.id, n));
  
  const startNode = nodeMap.get(startId);
  const endNode = nodeMap.get(endId);
  if (!startNode || !endNode) return null;
  
  // Build adjacency list
  const adjacency = new Map<string, { nodeId: string; edge: PathEdge }[]>();
  pathEdges.forEach(edge => {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
    adjacency.get(edge.from)!.push({ nodeId: edge.to, edge });
    adjacency.get(edge.to)!.push({ nodeId: edge.from, edge });
  });
  
  // A* algorithm
  const openSet = new Map<string, AStarNode>();
  const closedSet = new Set<string>();
  
  const start: AStarNode = {
    id: startId,
    g: 0,
    h: heuristic(startNode, endNode),
    f: heuristic(startNode, endNode),
    parent: null,
  };
  openSet.set(startId, start);
  
  const allNodes = new Map<string, AStarNode>();
  allNodes.set(startId, start);
  
  while (openSet.size > 0) {
    // Find node with lowest f
    let current: AStarNode | null = null;
    for (const node of openSet.values()) {
      if (!current || node.f < current.f) current = node;
    }
    if (!current) return null;
    
    if (current.id === endId) {
      // Reconstruct path
      const path: PathNode[] = [];
      const edges: PathEdge[] = [];
      let curr: string | null = current.id;
      
      while (curr) {
        path.unshift(nodeMap.get(curr)!);
        const parentId: string | null | undefined = allNodes.get(curr)?.parent;
        if (parentId) {
          const currId = curr;
          const e = pathEdges.find(
            ed => (ed.from === parentId && ed.to === currId) || (ed.to === parentId && ed.from === currId)
          );
          if (e) edges.unshift(e);
        }
        curr = parentId ?? null;
      }
      
      return { path, distance: current.g, edges };
    }
    
    openSet.delete(current.id);
    closedSet.add(current.id);
    
    const neighbors = adjacency.get(current.id) || [];
    for (const { nodeId, edge } of neighbors) {
      if (closedSet.has(nodeId)) continue;
      
      const weight = getEdgeWeight(edge, preference);
      const tentG = current.g + weight;
      
      const existing = allNodes.get(nodeId);
      if (existing && tentG >= existing.g) continue;
      
      const neighborNode = nodeMap.get(nodeId)!;
      const h = heuristic(neighborNode, endNode);
      const astarNode: AStarNode = {
        id: nodeId,
        g: tentG,
        h,
        f: tentG + h,
        parent: current.id,
      };
      
      allNodes.set(nodeId, astarNode);
      openSet.set(nodeId, astarNode);
    }
  }
  
  return null;
}

// Calculate route stats
export function getRouteStats(path: PathNode[], edges: PathEdge[]) {
  const totalDistance = edges.reduce((sum, e) => sum + e.distance, 0);
  const walkingSpeed = 80; // pixels per minute (roughly 5km/h scaled)
  const estimatedTime = Math.ceil(totalDistance / walkingSpeed);
  const isAccessible = edges.every(e => e.accessible);
  const shadedPercentage = Math.round(
    (edges.filter(e => e.shaded).reduce((s, e) => s + e.distance, 0) / Math.max(totalDistance, 1)) * 100
  );
  const calories = Math.round(totalDistance * 0.05);
  
  return {
    totalDistance: Math.round(totalDistance),
    estimatedTime,
    isAccessible,
    shadedPercentage,
    calories,
    steps: path.length,
    edgeTypes: {
      road: edges.filter(e => e.type === 'road').length,
      walkway: edges.filter(e => e.type === 'walkway').length,
      shortcut: edges.filter(e => e.type === 'shortcut').length,
      stairs: edges.filter(e => e.type === 'stairs').length,
    }
  };
}
