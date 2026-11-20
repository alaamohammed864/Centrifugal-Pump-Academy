import type { GlbModelId } from '../types/academy';

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface CameraFramingInput {
  size: Vec3Tuple;
  viewDir: Vec3Tuple;
  fovDeg: number;
  aspect: number;
  padding?: number;
}

export interface CameraFramingResult {
  distance: number;
  projectedWidth: number;
  projectedHeight: number;
  projectedDepth: number;
}

function normalize(v: Vec3Tuple): Vec3Tuple {
  const len = Math.hypot(v.x, v.y, v.z);
  if (len <= 1e-8) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function getModelViewDirection(modelId: GlbModelId): Vec3Tuple {
  if (modelId === 'impeller_types') {
    return normalize({ x: 0, y: 0.32, z: 0.95 });
  }
  if (modelId === 'water_hammer') {
    return normalize({ x: 0.12, y: 0.3, z: 0.94 });
  }
  if (modelId === 'vertical_pump') {
    return normalize({ x: 0.65, y: 0.25, z: 0.72 });
  }
  return normalize({ x: 0.62, y: 0.36, z: 0.72 });
}

/**
 * Computes camera distance from bounding box center so the entire 3D model
 * fits inside BOTH horizontal and vertical frustum planes regardless of
 * mobile portrait (aspect < 1) or desktop widescreen (aspect > 1).
 */
export function computeAspectAwareFitDistance(input: CameraFramingInput): CameraFramingResult {
  const sx = Math.max(0.25, input.size.x);
  const sy = Math.max(0.25, input.size.y);
  const sz = Math.max(0.25, input.size.z);

  const dir = normalize(input.viewDir);
  const worldUp: Vec3Tuple = Math.abs(dir.y) > 0.98 ? { x: 0, y: 0, z: 1 } : { x: 0, y: 1, z: 0 };
  const right = normalize(cross(worldUp, dir));
  const up = normalize(cross(dir, right));

  const projectedWidth = Math.abs(right.x) * sx + Math.abs(right.y) * sy + Math.abs(right.z) * sz;
  const projectedHeight = Math.abs(up.x) * sx + Math.abs(up.y) * sy + Math.abs(up.z) * sz;
  const projectedDepth = Math.abs(dir.x) * sx + Math.abs(dir.y) * sy + Math.abs(dir.z) * sz;

  const safeFovDeg = Math.min(110, Math.max(20, input.fovDeg));
  const halfFovV = (safeFovDeg * Math.PI) / 360;
  const tanV = Math.tan(halfFovV);
  const safeAspect = Math.min(4, Math.max(0.25, input.aspect));
  const tanH = tanV * safeAspect;

  const pad = input.padding ?? 1.24;
  const distV = ((projectedHeight * 0.5) * pad) / tanV + projectedDepth * 0.5;
  const distH = ((projectedWidth * 0.5) * pad) / tanH + projectedDepth * 0.5;

  return {
    distance: Math.max(1.2, distV, distH),
    projectedWidth,
    projectedHeight,
    projectedDepth,
  };
}
