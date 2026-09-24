/**
 * Converts the ordered nodes returned by the routing engine into display-ready
 * walking instructions. It deliberately has no dependency on A* or campus data.
 */
export interface NavigationPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export type NavigationInstructionType =
  | 'start'
  | 'straight'
  | 'slight-left'
  | 'left'
  | 'sharp-left'
  | 'slight-right'
  | 'right'
  | 'sharp-right'
  | 'destination';

export interface NavigationInstruction {
  type: NavigationInstructionType;
  instruction: string;
  /** Distance covered after this instruction, rounded to the nearest metre. */
  distance: number;
  /** Position in the original route where this instruction begins. */
  nodeIndex: number;
}

export interface TurnByTurnOptions {
  originName?: string;
  destinationName?: string;
  /** Converts map-coordinate units to metres. Defaults to 1 for the current map. */
  metresPerUnit?: number;
  /** Typical pedestrian speed in metres per minute. Defaults to 80 (4.8 km/h). */
  walkingSpeedMetresPerMinute?: number;
  /** Angles at or below this value are treated as continuing straight. */
  straightThresholdDegrees?: number;
  /** Turns above this value are described as sharp. */
  sharpTurnThresholdDegrees?: number;
}

export interface TurnByTurnDirections {
  instructions: NavigationInstruction[];
  totalDistance: number;
  estimatedWalkingTimeMinutes: number;
}

const DEFAULT_OPTIONS: Required<Omit<TurnByTurnOptions, 'originName' | 'destinationName'>> = {
  metresPerUnit: 1,
  walkingSpeedMetresPerMinute: 80,
  straightThresholdDegrees: 15,
  sharpTurnThresholdDegrees: 135,
};

type TurnType = Exclude<NavigationInstructionType, 'start' | 'destination'>;

function distanceBetween(a: NavigationPoint, b: NavigationPoint, metresPerUnit: number): number {
  return Math.hypot(b.x - a.x, b.y - a.y) * metresPerUnit;
}

/** Returns a signed angle in screen/map coordinates: positive is a right turn. */
function signedTurnAngleDegrees(from: NavigationPoint, via: NavigationPoint, to: NavigationPoint): number {
  const incomingX = via.x - from.x;
  const incomingY = via.y - from.y;
  const outgoingX = to.x - via.x;
  const outgoingY = to.y - via.y;
  const cross = incomingX * outgoingY - incomingY * outgoingX;
  const dot = incomingX * outgoingX + incomingY * outgoingY;
  return Math.atan2(cross, dot) * (180 / Math.PI);
}

function classifyTurn(angle: number, options: Required<Omit<TurnByTurnOptions, 'originName' | 'destinationName'>>): TurnType {
  const magnitude = Math.abs(angle);
  if (magnitude <= options.straightThresholdDegrees) return 'straight';

  const direction = angle > 0 ? 'right' : 'left';
  if (magnitude > options.sharpTurnThresholdDegrees) return `sharp-${direction}` as TurnType;
  if (magnitude < 45) return `slight-${direction}` as TurnType;
  return direction;
}

function formatDistance(distance: number): string {
  return `${Math.max(1, Math.round(distance))} metre${Math.round(distance) === 1 ? '' : 's'}`;
}

function instructionText(type: TurnType, distance: number): string {
  const distanceText = formatDistance(distance);
  if (type === 'straight') return `Walk straight for ${distanceText}`;

  const phrases: Record<Exclude<TurnType, 'straight'>, string> = {
    'slight-left': 'Keep slightly left',
    left: 'Turn left at the junction',
    'sharp-left': 'Make a sharp left',
    'slight-right': 'Keep slightly right',
    right: 'Turn right at the junction',
    'sharp-right': 'Make a sharp right',
  };
  return `${phrases[type]} and continue for ${distanceText}`;
}

/**
 * Generates concise instructions by folding every straight run into the prior
 * manoeuvre. Zero-length coordinate segments are ignored safely.
 */
export function generateTurnByTurnDirections(
  path: readonly NavigationPoint[],
  suppliedOptions: TurnByTurnOptions = {},
): TurnByTurnDirections {
  const options = { ...DEFAULT_OPTIONS, ...suppliedOptions };
  if (options.metresPerUnit <= 0 || options.walkingSpeedMetresPerMinute <= 0) {
    throw new Error('metresPerUnit and walkingSpeedMetresPerMinute must be greater than zero.');
  }

  if (path.length === 0) {
    return { instructions: [], totalDistance: 0, estimatedWalkingTimeMinutes: 0 };
  }

  const originName = options.originName ?? path[0].label ?? 'your starting point';
  const destinationName = options.destinationName ?? path[path.length - 1].label ?? 'your destination';
  const totalDistance = path.slice(1).reduce(
    (sum, node, index) => sum + distanceBetween(path[index], node, options.metresPerUnit),
    0,
  );
  const instructions: NavigationInstruction[] = [{
    type: 'start',
    instruction: `Start from ${originName}`,
    distance: 0,
    nodeIndex: 0,
  }];

  if (path.length > 1) {
    let activeType: TurnType = 'straight';
    let activeDistance = distanceBetween(path[0], path[1], options.metresPerUnit);
    let activeNodeIndex = 0;

    for (let index = 1; index < path.length - 1; index += 1) {
      const nextDistance = distanceBetween(path[index], path[index + 1], options.metresPerUnit);
      if (nextDistance === 0) continue;

      const nextType = classifyTurn(signedTurnAngleDegrees(path[index - 1], path[index], path[index + 1]), options);
      if (nextType === 'straight') {
        activeDistance += nextDistance;
        continue;
      }

      if (activeDistance > 0) {
        instructions.push({
          type: activeType,
          instruction: instructionText(activeType, activeDistance),
          distance: Math.round(activeDistance),
          nodeIndex: activeNodeIndex,
        });
      }
      activeType = nextType;
      activeDistance = nextDistance;
      activeNodeIndex = index;
    }

    if (activeDistance > 0) {
      instructions.push({
        type: activeType,
        instruction: instructionText(activeType, activeDistance),
        distance: Math.round(activeDistance),
        nodeIndex: activeNodeIndex,
      });
    }
  }

  instructions.push({
    type: 'destination',
    instruction: `You have arrived at ${destinationName}`,
    distance: 0,
    nodeIndex: path.length - 1,
  });

  return {
    instructions,
    totalDistance: Math.round(totalDistance),
    estimatedWalkingTimeMinutes: totalDistance === 0 ? 0 : Math.max(1, Math.ceil(totalDistance / options.walkingSpeedMetresPerMinute)),
  };
}
