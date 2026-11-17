import type { GlbModelId } from '../types/academy';

export interface GeometryData {
  positions: number[];
  normals: number[];
  indices: number[];
}

export interface GlbPartDef {
  name: string;
  mesh: GeometryData;
  materialIndex: number;
  translation?: [number, number, number];
  rotation?: [number, number, number, number]; // quaternion xyzw
  scale?: [number, number, number];
  extras?: Record<string, unknown>;
}

export interface GlbMaterialDef {
  name: string;
  baseColorFactor: [number, number, number, number];
  metallicFactor: number;
  roughnessFactor: number;
  alphaMode?: 'OPAQUE' | 'BLEND';
  emissiveFactor?: [number, number, number];
}

// ---------- Procedural CAD Geometry Primitives (Pure Math, Y-up, Right-handed) ----------

function mergeGeos(geos: GeometryData[]): GeometryData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  for (const g of geos) {
    for (let i = 0; i < g.positions.length; i++) positions.push(g.positions[i]);
    for (let i = 0; i < g.normals.length; i++) normals.push(g.normals[i]);
    for (let i = 0; i < g.indices.length; i++) indices.push(g.indices[i] + vertexOffset);
    vertexOffset += g.positions.length / 3;
  }
  return { positions, normals, indices };
}

function transformGeo(g: GeometryData, tx = 0, ty = 0, tz = 0, rx = 0, ry = 0, rz = 0): GeometryData {
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  const rot = (x: number, y: number, z: number): [number, number, number] => {
    // Rx
    const y1 = y * cx - z * sx;
    const z1 = y * sx + z * cx;
    const x1 = x;
    // Ry
    const x2 = x1 * cy + z1 * sy;
    const z2 = -x1 * sy + z1 * cy;
    const y2 = y1;
    // Rz
    const x3 = x2 * cz - y2 * sz;
    const y3 = x2 * sz + y2 * cz;
    const z3 = z2;
    return [x3, y3, z3];
  };

  const positions: number[] = [];
  const normals: number[] = [];
  for (let i = 0; i < g.positions.length; i += 3) {
    const [px, py, pz] = rot(g.positions[i], g.positions[i + 1], g.positions[i + 2]);
    positions.push(px + tx, py + ty, pz + tz);
    const [nx, ny, nz] = rot(g.normals[i], g.normals[i + 1], g.normals[i + 2]);
    const len = Math.hypot(nx, ny, nz) || 1;
    normals.push(nx / len, ny / len, nz / len);
  }
  return { positions, normals, indices: [...g.indices] };
}

function makeBox(w: number, h: number, d: number): GeometryData {
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const faces: { n: [number, number, number]; v: [number, number, number][] }[] = [
    { n: [0, 0, 1], v: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]] },
    { n: [0, 0, -1], v: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]] },
    { n: [0, 1, 0], v: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]] },
    { n: [0, -1, 0], v: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]] },
    { n: [1, 0, 0], v: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]] },
    { n: [-1, 0, 0], v: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]] },
  ];
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  faces.forEach((f, fi) => {
    const base = fi * 4;
    f.v.forEach((p) => {
      positions.push(p[0], p[1], p[2]);
      normals.push(f.n[0], f.n[1], f.n[2]);
    });
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });
  return { positions, normals, indices };
}

function makeCylinder(rTop: number, rBot: number, height: number, segs = 20, hollowInner = 0): GeometryData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const hy = height / 2;

  // Side outer
  const sideStart = 0;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    positions.push(rTop * ca, hy, rTop * sa);
    normals.push(ca, 0, sa);
    positions.push(rBot * ca, -hy, rBot * sa);
    normals.push(ca, 0, sa);
  }
  for (let i = 0; i < segs; i++) {
    const b = sideStart + i * 2;
    indices.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  }

  if (hollowInner > 0) {
    // Inner wall
    const innerStart = positions.length / 3;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      positions.push(hollowInner * ca, hy, hollowInner * sa);
      normals.push(-ca, 0, -sa);
      positions.push(hollowInner * ca, -hy, hollowInner * sa);
      normals.push(-ca, 0, -sa);
    }
    for (let i = 0; i < segs; i++) {
      const b = innerStart + i * 2;
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    // Top & Bottom rings
    const topStart = positions.length / 3;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      positions.push(rTop * ca, hy, rTop * sa);
      normals.push(0, 1, 0);
      positions.push(hollowInner * ca, hy, hollowInner * sa);
      normals.push(0, 1, 0);
    }
    for (let i = 0; i < segs; i++) {
      const b = topStart + i * 2;
      indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const botStart = positions.length / 3;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      positions.push(rBot * ca, -hy, rBot * sa);
      normals.push(0, -1, 0);
      positions.push(hollowInner * ca, -hy, hollowInner * sa);
      normals.push(0, -1, 0);
    }
    for (let i = 0; i < segs; i++) {
      const b = botStart + i * 2;
      indices.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
  } else {
    // Solid caps
    const topCenter = positions.length / 3;
    positions.push(0, hy, 0);
    normals.push(0, 1, 0);
    const topRing = positions.length / 3;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      positions.push(rTop * Math.cos(a), hy, rTop * Math.sin(a));
      normals.push(0, 1, 0);
    }
    for (let i = 0; i < segs; i++) {
      indices.push(topCenter, topRing + i + 1, topRing + i);
    }

    const botCenter = positions.length / 3;
    positions.push(0, -hy, 0);
    normals.push(0, -1, 0);
    const botRing = positions.length / 3;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      positions.push(rBot * Math.cos(a), -hy, rBot * Math.sin(a));
      normals.push(0, -1, 0);
    }
    for (let i = 0; i < segs; i++) {
      indices.push(botCenter, botRing + i, botRing + i + 1);
    }
  }

  return { positions, normals, indices };
}

function makeSphere(radius: number, segU = 14, segV = 10): GeometryData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let v = 0; v <= segV; v++) {
    const phi = (v / segV) * Math.PI;
    const sp = Math.sin(phi), cp = Math.cos(phi);
    for (let u = 0; u <= segU; u++) {
      const theta = (u / segU) * Math.PI * 2;
      const nx = sp * Math.cos(theta);
      const ny = cp;
      const nz = sp * Math.sin(theta);
      positions.push(radius * nx, radius * ny, radius * nz);
      normals.push(nx, ny, nz);
    }
  }
  const stride = segU + 1;
  for (let v = 0; v < segV; v++) {
    for (let u = 0; u < segU; u++) {
      const a = v * stride + u;
      const b = a + stride;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, normals, indices };
}

function makeTorus(majorR: number, minorR: number, segU = 24, segV = 12): GeometryData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let u = 0; u <= segU; u++) {
    const theta = (u / segU) * Math.PI * 2;
    const ct = Math.cos(theta), st = Math.sin(theta);
    for (let v = 0; v <= segV; v++) {
      const phi = (v / segV) * Math.PI * 2;
      const cp = Math.cos(phi), sp = Math.sin(phi);
      const r = majorR + minorR * cp;
      positions.push(r * ct, minorR * sp, r * st);
      normals.push(cp * ct, sp, cp * st);
    }
  }
  const stride = segV + 1;
  for (let u = 0; u < segU; u++) {
    for (let v = 0; v < segV; v++) {
      const a = u * stride + v;
      const b = a + stride;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, normals, indices };
}

function makeCoilSpring(majorR: number, wireR: number, turns: number, height: number, segs = 72): GeometryData {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const ringSegs = 8;

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = t * turns * Math.PI * 2;
    const cx = majorR * Math.cos(ang);
    const cz = majorR * Math.sin(ang);
    const cy = (t - 0.5) * height;
    const radOutX = Math.cos(ang);
    const radOutZ = Math.sin(ang);

    for (let j = 0; j <= ringSegs; j++) {
      const phi = (j / ringSegs) * Math.PI * 2;
      const cp = Math.cos(phi), sp = Math.sin(phi);
      const nx = radOutX * cp;
      const ny = sp;
      const nz = radOutZ * cp;
      positions.push(cx + wireR * nx, cy + wireR * ny, cz + wireR * nz);
      normals.push(nx, ny, nz);
    }
  }
  const stride = ringSegs + 1;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < ringSegs; j++) {
      const a = i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, normals, indices };
}

function makeVoluteGeometry(baseR: number, depth: number): GeometryData {
  // Spiral volute shell around X-axis (rotation axis = X)
  const parts: GeometryData[] = [];
  const segs = 28;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const a = t * Math.PI * 2;
    const spiralR = baseR * (0.85 + 0.35 * t);
    const tubeR = 0.14 + 0.12 * t;
    const y = spiralR * Math.cos(a);
    const z = spiralR * Math.sin(a);
    const seg = transformGeo(makeBox(depth * 0.72, tubeR * 1.4, (Math.PI * 2 * spiralR) / segs * 1.15), 0, y, z, -a, 0, 0);
    parts.push(seg);
  }
  // Back wall plate & front suction ring
  parts.push(transformGeo(makeCylinder(baseR * 0.92, baseR * 0.92, 0.08, 24), depth * 0.36, 0, 0, 0, 0, Math.PI / 2));
  parts.push(transformGeo(makeCylinder(baseR * 0.92, baseR * 0.92, 0.08, 24, baseR * 0.42), -depth * 0.36, 0, 0, 0, 0, Math.PI / 2));
  // Discharge vertical nozzle
  parts.push(transformGeo(makeCylinder(0.22, 0.24, 0.75, 18, 0.16), 0, baseR * 1.18, 0.18));
  parts.push(transformGeo(makeCylinder(0.33, 0.33, 0.07, 18, 0.16), 0, baseR * 1.55, 0.18));
  // Suction axial nozzle
  parts.push(transformGeo(makeCylinder(0.26, 0.26, 0.45, 18, 0.19), -depth * 0.62, 0, 0, 0, 0, Math.PI / 2));
  parts.push(transformGeo(makeCylinder(0.38, 0.38, 0.07, 18, 0.19), -depth * 0.85, 0, 0, 0, 0, Math.PI / 2));
  // Casing feet
  parts.push(transformGeo(makeBox(0.42, 0.22, 0.24), 0, -baseR * 1.05, 0.35));
  parts.push(transformGeo(makeBox(0.42, 0.22, 0.24), 0, -baseR * 1.05, -0.35));
  return mergeGeos(parts);
}

function makeImpellerGeometry(type: 'open' | 'semi' | 'closed', radius = 0.55, bladeCount = 6): GeometryData {
  // Impeller rotating around X axis (in YZ plane)
  const parts: GeometryData[] = [];
  // Central Hub
  parts.push(transformGeo(makeCylinder(0.14, 0.16, 0.26, 18, 0.065), 0, 0, 0, 0, 0, Math.PI / 2));

  // Back shroud (semi & closed)
  if (type === 'semi' || type === 'closed') {
    parts.push(transformGeo(makeCylinder(radius, radius, 0.04, 24, 0.065), 0.11, 0, 0, 0, 0, Math.PI / 2));
  }
  // Front shroud with suction eye (closed only)
  if (type === 'closed') {
    parts.push(transformGeo(makeCylinder(radius, radius, 0.04, 24, radius * 0.42), -0.11, 0, 0, 0, 0, Math.PI / 2));
  }

  // Curved backward vanes (3 segments per vane for authentic spiral sweep)
  for (let b = 0; b < bladeCount; b++) {
    const baseAngle = (b / bladeCount) * Math.PI * 2;
    for (let s = 0; s < 3; s++) {
      const rFrac = 0.28 + s * 0.24;
      const rMid = radius * rFrac;
      const sweep = s * 0.34;
      const ang = baseAngle + sweep;
      const y = rMid * Math.cos(ang);
      const z = rMid * Math.sin(ang);
      const vane = transformGeo(makeBox(0.18, radius * 0.28, 0.035), 0, y, z, -(ang + 0.45), 0, 0);
      parts.push(vane);
    }
  }
  return mergeGeos(parts);
}

function makeElectricMotor(): GeometryData {
  const parts: GeometryData[] = [];
  // Main Stator Frame
  parts.push(transformGeo(makeCylinder(0.52, 0.52, 1.25, 24), 0, 0, 0, 0, 0, Math.PI / 2));
  // Cooling fins (12 radial fins)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    parts.push(transformGeo(makeBox(1.05, 0.04, 0.06), 0, 0.53 * Math.cos(a), 0.53 * Math.sin(a), -a, 0, 0));
  }
  // Fan Cowl at NDE
  parts.push(transformGeo(makeCylinder(0.50, 0.44, 0.36, 20), 0.78, 0, 0, 0, 0, Math.PI / 2));
  // Drive End Bell
  parts.push(transformGeo(makeCylinder(0.46, 0.52, 0.16, 20), -0.68, 0, 0, 0, 0, Math.PI / 2));
  // Terminal Box on top
  parts.push(transformGeo(makeBox(0.34, 0.24, 0.34), -0.1, 0.62, 0));
  // Lifting eye
  parts.push(transformGeo(makeTorus(0.08, 0.022, 14, 8), 0.28, 0.60, 0));
  // Mounting feet
  parts.push(transformGeo(makeBox(0.95, 0.12, 0.85), 0, -0.54, 0));
  return mergeGeos(parts);
}

function makeArrowGeo(length = 0.65): GeometryData {
  const shaft = transformGeo(makeCylinder(0.035, 0.035, length * 0.72, 12), 0, length * 0.36, 0);
  const head = transformGeo(makeCylinder(0.002, 0.095, length * 0.28, 12), 0, length * 0.86, 0);
  return mergeGeos([shaft, head]);
}

// ---------- Material Palette ----------

const MATERIALS: GlbMaterialDef[] = [
  /* 0 */ { name: 'IndustrialBlueCastIron', baseColorFactor: [0.09, 0.34, 0.58, 1.0], metallicFactor: 0.45, roughnessFactor: 0.48 },
  /* 1 */ { name: 'MachinedStainlessSteel', baseColorFactor: [0.78, 0.82, 0.86, 1.0], metallicFactor: 0.92, roughnessFactor: 0.18 },
  /* 2 */ { name: 'BronzeImpeller', baseColorFactor: [0.80, 0.58, 0.22, 1.0], metallicFactor: 0.88, roughnessFactor: 0.24 },
  /* 3 */ { name: 'BaseplateDarkSteel', baseColorFactor: [0.16, 0.20, 0.26, 1.0], metallicFactor: 0.55, roughnessFactor: 0.62 },
  /* 4 */ { name: 'SafetyAmberGuard', baseColorFactor: [0.92, 0.58, 0.08, 1.0], metallicFactor: 0.25, roughnessFactor: 0.42 },
  /* 5 */ { name: 'ElastomerRubberBlack', baseColorFactor: [0.08, 0.09, 0.11, 1.0], metallicFactor: 0.05, roughnessFactor: 0.82 },
  /* 6 */ { name: 'CarbonGraphiteSeal', baseColorFactor: [0.22, 0.24, 0.28, 1.0], metallicFactor: 0.30, roughnessFactor: 0.28 },
  /* 7 */ { name: 'MotorTealHousing', baseColorFactor: [0.07, 0.40, 0.44, 1.0], metallicFactor: 0.42, roughnessFactor: 0.45 },
  /* 8 */ { name: 'VaporBubbleCyan', baseColorFactor: [0.30, 0.82, 0.98, 0.72], metallicFactor: 0.10, roughnessFactor: 0.12, alphaMode: 'BLEND', emissiveFactor: [0.1, 0.45, 0.6] },
  /* 9 */ { name: 'AlertRedIndicator', baseColorFactor: [0.88, 0.20, 0.18, 1.0], metallicFactor: 0.25, roughnessFactor: 0.35, emissiveFactor: [0.35, 0.05, 0.04] },
  /* 10 */ { name: 'LaserGreenBeam', baseColorFactor: [0.12, 0.90, 0.42, 0.88], metallicFactor: 0.1, roughnessFactor: 0.2, alphaMode: 'BLEND', emissiveFactor: [0.08, 0.7, 0.25] },
  /* 11 */ { name: 'FluidPipeGlass', baseColorFactor: [0.55, 0.80, 0.96, 0.36], metallicFactor: 0.15, roughnessFactor: 0.15, alphaMode: 'BLEND' },
  /* 12 */ { name: 'HighPressureEmeraldIron', baseColorFactor: [0.08, 0.44, 0.32, 1.0], metallicFactor: 0.48, roughnessFactor: 0.44 },
  /* 13 */ { name: 'CrankcaseSlateIron', baseColorFactor: [0.24, 0.30, 0.38, 1.0], metallicFactor: 0.50, roughnessFactor: 0.50 },
];

// ---------- GLB Binary Encoder (glTF 2.0 Spec) ----------

export function encodeGlb(parts: GlbPartDef[], materials: GlbMaterialDef[] = MATERIALS): Uint8Array {
  // Concatenate binary vertex & index data into one BIN buffer
  const binChunks: Uint8Array[] = [];
  let byteOffset = 0;

  const bufferViews: Record<string, unknown>[] = [];
  const accessors: Record<string, unknown>[] = [];
  const meshes: Record<string, unknown>[] = [];
  const nodes: Record<string, unknown>[] = [];
  const rootChildren: number[] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const posArr = new Float32Array(p.mesh.positions);
    const normArr = new Float32Array(p.mesh.normals);
    const idxArr = new Uint32Array(p.mesh.indices);

    // Compute min/max for POSITION accessor (required by glTF 2.0)
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let k = 0; k < posArr.length; k += 3) {
      if (posArr[k] < minX) minX = posArr[k];
      if (posArr[k + 1] < minY) minY = posArr[k + 1];
      if (posArr[k + 2] < minZ) minZ = posArr[k + 2];
      if (posArr[k] > maxX) maxX = posArr[k];
      if (posArr[k + 1] > maxY) maxY = posArr[k + 1];
      if (posArr[k + 2] > maxZ) maxZ = posArr[k + 2];
    }

    const posBytes = new Uint8Array(posArr.buffer);
    const normBytes = new Uint8Array(normArr.buffer);
    const idxBytes = new Uint8Array(idxArr.buffer);

    const posViewIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: posBytes.byteLength, target: 34962 });
    binChunks.push(posBytes);
    byteOffset += posBytes.byteLength;

    const normViewIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: normBytes.byteLength, target: 34962 });
    binChunks.push(normBytes);
    byteOffset += normBytes.byteLength;

    const idxViewIdx = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: idxBytes.byteLength, target: 34963 });
    binChunks.push(idxBytes);
    byteOffset += idxBytes.byteLength;

    const posAccIdx = accessors.length;
    accessors.push({
      bufferView: posViewIdx,
      componentType: 5126, // FLOAT
      count: posArr.length / 3,
      type: 'VEC3',
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ],
    });

    const normAccIdx = accessors.length;
    accessors.push({
      bufferView: normViewIdx,
      componentType: 5126, // FLOAT
      count: normArr.length / 3,
      type: 'VEC3',
    });

    const idxAccIdx = accessors.length;
    accessors.push({
      bufferView: idxViewIdx,
      componentType: 5125, // UNSIGNED_INT
      count: idxArr.length,
      type: 'SCALAR',
    });

    const meshIdx = meshes.length;
    meshes.push({
      name: `${p.name}_Mesh`,
      primitives: [
        {
          attributes: { POSITION: posAccIdx, NORMAL: normAccIdx },
          indices: idxAccIdx,
          material: p.materialIndex,
        },
      ],
    });

    const node: Record<string, unknown> = {
      name: p.name,
      mesh: meshIdx,
    };
    if (p.translation) node.translation = p.translation;
    if (p.rotation) node.rotation = p.rotation;
    if (p.scale) node.scale = p.scale;
    if (p.extras) node.extras = p.extras;

    rootChildren.push(nodes.length);
    nodes.push(node);
  }

  // Pad BIN buffer to 4 bytes
  const binPad = (4 - (byteOffset % 4)) % 4;
  if (binPad > 0) {
    binChunks.push(new Uint8Array(binPad));
    byteOffset += binPad;
  }

  const gltfJson = {
    asset: { version: '2.0', generator: 'CentrifugalPumpAcademy-GLBBuilder/1.0' },
    scene: 0,
    scenes: [{ name: 'PumpAcademyScene', nodes: rootChildren }],
    nodes,
    meshes,
    materials: materials.map((m) => {
      const mat: Record<string, unknown> = {
        name: m.name,
        pbrMetallicRoughness: {
          baseColorFactor: m.baseColorFactor,
          metallicFactor: m.metallicFactor,
          roughnessFactor: m.roughnessFactor,
        },
        doubleSided: true,
      };
      if (m.alphaMode === 'BLEND') mat.alphaMode = 'BLEND';
      if (m.emissiveFactor) mat.emissiveFactor = m.emissiveFactor;
      return mat;
    }),
    bufferViews,
    accessors,
    buffers: [{ byteLength: byteOffset }],
  };

  const jsonStr = JSON.stringify(gltfJson);
  const encoder = new TextEncoder();
  const jsonRaw = encoder.encode(jsonStr);
  const jsonPad = (4 - (jsonRaw.byteLength % 4)) % 4;
  const jsonChunkLen = jsonRaw.byteLength + jsonPad;

  const totalLen = 12 + 8 + jsonChunkLen + 8 + byteOffset;
  const out = new Uint8Array(totalLen);
  const dv = new DataView(out.buffer);

  // Header
  dv.setUint32(0, 0x46546c67, true); // 'glTF'
  dv.setUint32(4, 2, true); // Version 2
  dv.setUint32(8, totalLen, true);

  // JSON Chunk
  let ptr = 12;
  dv.setUint32(ptr, jsonChunkLen, true);
  dv.setUint32(ptr + 4, 0x4e4f534a, true); // 'JSON'
  ptr += 8;
  out.set(jsonRaw, ptr);
  for (let p = 0; p < jsonPad; p++) out[ptr + jsonRaw.byteLength + p] = 0x20; // space pad
  ptr += jsonChunkLen;

  // BIN Chunk
  dv.setUint32(ptr, byteOffset, true);
  dv.setUint32(ptr + 4, 0x004e4942, true); // 'BIN\0'
  ptr += 8;
  for (const chunk of binChunks) {
    out.set(chunk, ptr);
    ptr += chunk.byteLength;
  }

  return out;
}

// ---------- 8 Distinct Engineering GLB Models ----------

function buildFullPumpParts(explodedCapable: boolean): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  // 1. Baseplate
  const baseGeo = mergeGeos([
    makeBox(3.8, 0.14, 1.35),
    transformGeo(makeBox(3.7, 0.06, 0.12), 0, -0.07, 0.62),
    transformGeo(makeBox(3.7, 0.06, 0.12), 0, -0.07, -0.62),
  ]);
  parts.push({
    name: 'Baseplate',
    mesh: baseGeo,
    materialIndex: 3,
    translation: [0.1, 0.07, 0],
    extras: { partId: 'baseplate', explodeDir: [0, -0.6, 0] },
  });

  // 2. Volute Casing (with cutaway window feeling via flanges)
  parts.push({
    name: 'VoluteCasing',
    mesh: makeVoluteGeometry(0.68, 0.48),
    materialIndex: 0,
    translation: [-1.05, 0.88, 0],
    extras: { partId: 'volute_casing', explodeDir: [-0.95, 0.35, 0] },
  });

  // 3. Impeller (Closed Brass/Bronze Impeller inside volute)
  parts.push({
    name: 'Impeller',
    mesh: makeImpellerGeometry('closed', 0.48, 6),
    materialIndex: 2,
    translation: [-1.05, 0.88, 0],
    extras: { partId: 'impeller', explodeDir: [-0.55, 0, 0.65] },
  });

  // 4. Wear Ring
  parts.push({
    name: 'WearRing',
    mesh: transformGeo(makeCylinder(0.28, 0.28, 0.07, 20, 0.23), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 2,
    translation: [-1.25, 0.88, 0],
    extras: { partId: 'wear_ring', explodeDir: [-1.2, 0, 0] },
  });

  // 5. Pump Shaft & Sleeve
  parts.push({
    name: 'PumpShaft',
    mesh: transformGeo(makeCylinder(0.065, 0.065, 1.65, 16), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 1,
    translation: [-0.42, 0.88, 0],
    extras: { partId: 'shaft', explodeDir: [0, 0.55, 0] },
  });

  // 6. Stuffing Box & Mechanical Seal
  parts.push({
    name: 'MechanicalSeal',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.16, 0.16, 0.14, 18, 0.075), 0, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCoilSpring(0.11, 0.015, 4, 0.16, 36), 0.12, 0, 0, 0, 0, Math.PI / 2),
    ]),
    materialIndex: 6,
    translation: [-0.66, 0.88, 0],
    extras: { partId: 'mechanical_seal', explodeDir: [-0.25, 0.75, 0.35] },
  });

  // 7. Bearing Housing & Bearings
  const bearingHsg = mergeGeos([
    transformGeo(makeCylinder(0.24, 0.24, 0.62, 18, 0.11), 0, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeBox(0.54, 0.52, 0.26), 0, -0.42, 0),
  ]);
  parts.push({
    name: 'BearingHousing',
    mesh: bearingHsg,
    materialIndex: 0,
    translation: [-0.15, 0.88, 0],
    extras: { partId: 'bearing_housing', explodeDir: [0, -0.25, -0.7] },
  });

  // Inner Bearings (front + rear)
  const bearingRings = mergeGeos([
    transformGeo(makeTorus(0.11, 0.032, 16, 10), -0.22, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeTorus(0.11, 0.032, 16, 10), 0.22, 0, 0, 0, 0, Math.PI / 2),
  ]);
  parts.push({
    name: 'Bearings',
    mesh: bearingRings,
    materialIndex: 1,
    translation: [-0.15, 0.88, 0],
    extras: { partId: 'bearings', explodeDir: [0, 0.75, -0.35] },
  });

  // 8. Coupling & Safety Guard
  parts.push({
    name: 'Coupling',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.15, 0.15, 0.09, 16, 0.065), -0.07, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.15, 0.15, 0.09, 16, 0.065), 0.07, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.13, 0.13, 0.06, 16), 0, 0, 0, 0, 0, Math.PI / 2),
    ]),
    materialIndex: 4,
    translation: [0.46, 0.88, 0],
    extras: { partId: 'coupling', explodeDir: [0, 0.85, 0] },
  });

  // 9. Electric Motor
  parts.push({
    name: 'ElectricMotor',
    mesh: makeElectricMotor(),
    materialIndex: 7,
    translation: [1.32, 0.88, 0],
    extras: { partId: 'electric_motor', explodeDir: [0.95, 0, 0] },
  });

  // 10. Suction & Discharge Piping (included especially on complete_pump, optional hide on exploded)
  const suctionPipe = mergeGeos([
    transformGeo(makeCylinder(0.19, 0.19, 0.75, 16, 0.16), -1.85, 0.88, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.28, 0.28, 0.05, 16, 0.16), -1.48, 0.88, 0, 0, 0, Math.PI / 2),
  ]);
  parts.push({
    name: 'SuctionPipe',
    mesh: suctionPipe,
    materialIndex: 11,
    extras: { partId: 'suction_pipe', explodeDir: [-1.4, 0, 0] },
  });

  const dischargePipe = mergeGeos([
    transformGeo(makeCylinder(0.16, 0.16, 0.75, 16, 0.13), -1.05, 2.34, 0.18),
    transformGeo(makeCylinder(0.26, 0.26, 0.05, 16, 0.13), -1.05, 1.97, 0.18),
  ]);
  parts.push({
    name: 'DischargePipe',
    mesh: dischargePipe,
    materialIndex: 11,
    extras: { partId: 'discharge_pipe', explodeDir: [0, 1.15, 0] },
  });

  // Suppress unused warning when explodedCapable=false
  if (!explodedCapable) {
    return parts;
  }
  return parts;
}

function buildImpellerComparisonParts(): GlbPartDef[] {
  return [
    {
      name: 'OpenImpeller',
      mesh: makeImpellerGeometry('open', 0.62, 6),
      materialIndex: 1,
      translation: [-1.5, 0.7, 0],
      extras: { partId: 'open_impeller', labelAr: 'الدفاعة المفتوحة (Open)' },
    },
    {
      name: 'SemiOpenImpeller',
      mesh: makeImpellerGeometry('semi', 0.62, 6),
      materialIndex: 0,
      translation: [0, 0.7, 0],
      extras: { partId: 'semi_open_impeller', labelAr: 'الدفاعة النصف مفتوحة (Semi-Open)' },
    },
    {
      name: 'ClosedImpeller',
      mesh: makeImpellerGeometry('closed', 0.62, 6),
      materialIndex: 2,
      translation: [1.5, 0.7, 0],
      extras: { partId: 'closed_impeller', labelAr: 'الدفاعة المغلقة (Closed)' },
    },
    {
      name: 'ComparisonBase',
      mesh: makeBox(4.3, 0.08, 1.2),
      materialIndex: 3,
      translation: [0, 0.04, 0],
    },
  ];
}

function buildBearingsLoadsParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];
  // Shaft
  parts.push({
    name: 'PumpShaft',
    mesh: transformGeo(makeCylinder(0.16, 0.16, 2.8, 20), 0, 0.75, 0, 0, 0, Math.PI / 2),
    materialIndex: 1,
  });

  // Ball Bearing (Radial)
  const balls: GeometryData[] = [
    transformGeo(makeTorus(0.32, 0.045, 24, 10), 0, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeTorus(0.19, 0.035, 24, 10), 0, 0, 0, 0, 0, Math.PI / 2),
  ];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    balls.push(transformGeo(makeSphere(0.052, 10, 8), 0, 0.255 * Math.cos(a), 0.255 * Math.sin(a)));
  }
  parts.push({
    name: 'BallBearing_Radial',
    mesh: mergeGeos(balls),
    materialIndex: 2,
    translation: [-0.75, 0.75, 0],
    extras: { partId: 'ball_bearing', explodeDir: [0, 0.5, 0] },
  });

  // Roller Bearing (Heavy Radial)
  const rollers: GeometryData[] = [
    transformGeo(makeCylinder(0.36, 0.36, 0.24, 24, 0.31), 0, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.21, 0.21, 0.24, 24, 0.16), 0, 0, 0, 0, 0, Math.PI / 2),
  ];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rollers.push(transformGeo(makeCylinder(0.042, 0.042, 0.20, 10), 0, 0.26 * Math.cos(a), 0.26 * Math.sin(a), 0, 0, Math.PI / 2));
  }
  parts.push({
    name: 'RollerBearing_HeavyRadial',
    mesh: mergeGeos(rollers),
    materialIndex: 1,
    translation: [0.0, 0.75, 0],
    extras: { partId: 'roller_bearing', explodeDir: [0, 0.8, 0] },
  });

  // Thrust Bearing (Axial Load)
  const pads: GeometryData[] = [
    transformGeo(makeCylinder(0.38, 0.38, 0.08, 24, 0.17), -0.07, 0, 0, 0, 0, Math.PI / 2),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pads.push(transformGeo(makeBox(0.09, 0.16, 0.16), 0.05, 0.28 * Math.cos(a), 0.28 * Math.sin(a), -a, 0, 0));
  }
  parts.push({
    name: 'ThrustBearing_Axial',
    mesh: mergeGeos(pads),
    materialIndex: 4,
    translation: [0.75, 0.75, 0],
    extras: { partId: 'thrust_bearing', explodeDir: [0.4, 0.5, 0] },
  });

  // Radial Load Arrows (Downward/Upward perpendicular to shaft)
  parts.push({
    name: 'RadialLoadArrow',
    mesh: transformGeo(makeArrowGeo(0.55), -0.75, 1.72, 0, Math.PI, 0, 0),
    materialIndex: 9,
    extras: { partId: 'radial_load' },
  });

  // Axial Load Arrows (Parallel to shaft)
  parts.push({
    name: 'AxialLoadArrow',
    mesh: transformGeo(makeArrowGeo(0.65), 1.55, 0.75, 0, 0, 0, Math.PI / 2),
    materialIndex: 8,
    extras: { partId: 'axial_load' },
  });

  return parts;
}

function buildMechanicalSealParts(): GlbPartDef[] {
  return [
    {
      name: 'ShaftSection',
      mesh: transformGeo(makeCylinder(0.16, 0.16, 2.4, 20), 0, 0.65, 0, 0, 0, Math.PI / 2),
      materialIndex: 1,
      extras: { partId: 'seal_shaft', explodeDir: [0, 0, 0] },
    },
    {
      name: 'MatingRing_Stationary',
      mesh: transformGeo(makeCylinder(0.38, 0.38, 0.14, 24, 0.18), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 1,
      translation: [-0.68, 0.65, 0],
      extras: { partId: 'mating_ring', explodeDir: [-0.65, 0, 0] },
    },
    {
      name: 'ORing_SecondarySeal',
      mesh: transformGeo(makeTorus(0.28, 0.035, 22, 10), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 5,
      translation: [-0.52, 0.65, 0],
      extras: { partId: 'o_ring', explodeDir: [-0.4, 0.35, 0] },
    },
    {
      name: 'PrimarySealingRing_Rotary',
      mesh: transformGeo(makeCylinder(0.32, 0.32, 0.12, 24, 0.18), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 6,
      translation: [-0.22, 0.65, 0],
      extras: { partId: 'primary_ring', explodeDir: [-0.15, 0, 0] },
    },
    {
      name: 'FlexibleDiaphragm',
      mesh: transformGeo(makeCylinder(0.26, 0.22, 0.18, 20, 0.17), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 5,
      translation: [-0.04, 0.65, 0],
      extras: { partId: 'diaphragm', explodeDir: [0.05, -0.35, 0] },
    },
    {
      name: 'RetainerAndDriveRing',
      mesh: transformGeo(makeCylinder(0.33, 0.33, 0.14, 22, 0.18), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 2,
      translation: [0.18, 0.65, 0],
      extras: { partId: 'retainer', explodeDir: [0.3, 0.35, 0] },
    },
    {
      name: 'CoilSpring',
      mesh: transformGeo(makeCoilSpring(0.25, 0.025, 5, 0.48, 80), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 1,
      translation: [0.55, 0.65, 0],
      extras: { partId: 'coil_spring', explodeDir: [0.6, 0, 0] },
    },
    {
      name: 'SpringRetainer',
      mesh: transformGeo(makeCylinder(0.34, 0.34, 0.08, 22, 0.17), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 2,
      translation: [0.88, 0.65, 0],
      extras: { partId: 'spring_retainer', explodeDir: [0.95, 0, 0] },
    },
  ];
}

function buildCavitationParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];
  // Cutaway Volute (Semi-transparent)
  parts.push({
    name: 'CutawayVolute',
    mesh: makeVoluteGeometry(0.85, 0.52),
    materialIndex: 11,
    translation: [0, 0.95, 0],
  });
  // Impeller
  parts.push({
    name: 'Impeller',
    mesh: makeImpellerGeometry('semi', 0.68, 6),
    materialIndex: 2,
    translation: [0, 0.95, 0],
  });
  // Suction pipe glass
  parts.push({
    name: 'SuctionInlet',
    mesh: transformGeo(makeCylinder(0.30, 0.30, 0.95, 18, 0.25), -0.95, 0.95, 0, 0, 0, Math.PI / 2),
    materialIndex: 11,
  });

  // Vapor Bubbles forming at suction eye (low pressure zone)
  const bubbleCoords: [number, number, number, number][] = [
    [-0.75, 0.95, 0.08, 0.06],
    [-0.62, 1.04, -0.09, 0.075],
    [-0.50, 0.88, 0.12, 0.08],
    [-0.36, 1.08, 0.04, 0.09],
    [-0.28, 0.82, -0.11, 0.07],
    [-0.18, 1.12, -0.06, 0.065],
    [-0.12, 0.78, 0.10, 0.055],
  ];
  bubbleCoords.forEach(([x, y, z, r], idx) => {
    parts.push({
      name: `VaporBubble_${idx + 1}`,
      mesh: makeSphere(r, 10, 8),
      materialIndex: 8,
      translation: [x, y, z],
    });
  });

  // Implosion / Pitting Shock Zones on impeller vane leading/discharge edges
  const shockCoords: [number, number, number][] = [
    [0.02, 1.32, 0.18],
    [0.02, 0.62, -0.22],
    [0.02, 1.15, -0.35],
    [0.02, 0.78, 0.36],
  ];
  shockCoords.forEach(([x, y, z], idx) => {
    parts.push({
      name: `PittingZone_${idx + 1}`,
      mesh: makeSphere(0.085, 10, 8),
      materialIndex: 9,
      translation: [x, y, z],
    });
  });

  return parts;
}

function buildWaterHammerParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];
  // Pump Casing at Left
  parts.push({
    name: 'PumpUnit',
    mesh: makeVoluteGeometry(0.55, 0.38),
    materialIndex: 0,
    translation: [-1.8, 0.75, 0],
  });
  // Long Transparent Discharge Pipe
  parts.push({
    name: 'DischargePipeline',
    mesh: transformGeo(makeCylinder(0.22, 0.22, 3.4, 20, 0.18), 0, 1.48, 0.15, 0, 0, Math.PI / 2),
    materialIndex: 11,
  });
  // Pipe Supports
  parts.push({
    name: 'PipeSupports',
    mesh: mergeGeos([
      transformGeo(makeBox(0.16, 1.25, 0.36), -0.9, 0.62, 0.15),
      transformGeo(makeBox(0.16, 1.25, 0.36), 0.7, 0.62, 0.15),
    ]),
    materialIndex: 3,
  });
  // Rapid-Closing Valve at Right End
  parts.push({
    name: 'RapidValveBody',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.28, 0.28, 0.42, 16), 1.75, 1.48, 0.15, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.05, 0.05, 0.55, 10), 1.75, 1.88, 0.15),
      transformGeo(makeTorus(0.22, 0.035, 16, 8), 1.75, 2.15, 0.15),
    ]),
    materialIndex: 4,
  });
  // Valve Gate Disc (moves during animation)
  parts.push({
    name: 'ValveGate',
    mesh: makeBox(0.06, 0.36, 0.36),
    materialIndex: 9,
    translation: [1.75, 1.48, 0.15],
  });
  // Pressure Shockwave Rings
  for (let i = 0; i < 4; i++) {
    parts.push({
      name: `PressureWave_${i + 1}`,
      mesh: transformGeo(makeTorus(0.26, 0.045, 18, 8), 0, 0, 0, 0, 0, Math.PI / 2),
      materialIndex: 9,
      translation: [1.3 - i * 0.7, 1.48, 0.15],
    });
  }
  return parts;
}

function buildAlignmentParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];
  // Common Baseplate
  parts.push({
    name: 'Baseplate',
    mesh: makeBox(3.4, 0.12, 1.2),
    materialIndex: 3,
    translation: [0, 0.06, 0],
  });
  // Fixed Pump Pedestal & Coupling Half (Left)
  parts.push({
    name: 'PumpFixedUnit',
    mesh: mergeGeos([
      makeBox(0.85, 0.62, 0.65),
      transformGeo(makeCylinder(0.22, 0.22, 0.55, 18), 0.55, 0.18, 0, 0, 0, Math.PI / 2),
    ]),
    materialIndex: 0,
    translation: [-1.05, 0.43, 0],
  });
  parts.push({
    name: 'PumpShaftAndCoupling',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.065, 0.065, 0.52, 16), 0.25, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.16, 0.16, 0.10, 18), 0.48, 0, 0, 0, 0, Math.PI / 2),
    ]),
    materialIndex: 1,
    translation: [-0.62, 0.62, 0],
  });

  // Movable Motor Unit (Right) - animated/adjusted in viewer by alignment controls!
  parts.push({
    name: 'MotorMovableUnit',
    mesh: mergeGeos([
      transformGeo(makeElectricMotor(), 0.72, 0, 0),
      transformGeo(makeCylinder(0.065, 0.065, 0.45, 16), -0.15, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.16, 0.16, 0.10, 18), -0.35, 0, 0, 0, 0, Math.PI / 2),
    ]),
    materialIndex: 7,
    translation: [0.35, 0.62, 0],
  });

  // Laser Transmitter & Receiver + Beam
  parts.push({
    name: 'LaserTransmitter',
    mesh: mergeGeos([
      makeBox(0.10, 0.26, 0.10),
      transformGeo(makeCylinder(0.025, 0.025, 0.25, 10), 0, -0.18, 0),
    ]),
    materialIndex: 4,
    translation: [-0.24, 0.96, 0],
  });
  parts.push({
    name: 'LaserReceiver',
    mesh: mergeGeos([
      makeBox(0.10, 0.26, 0.10),
      transformGeo(makeCylinder(0.025, 0.025, 0.25, 10), 0, -0.18, 0),
    ]),
    materialIndex: 4,
    translation: [0.16, 0.96, 0],
  });
  parts.push({
    name: 'LaserBeam',
    mesh: transformGeo(makeCylinder(0.012, 0.012, 0.42, 8), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 10,
    translation: [-0.04, 0.98, 0],
  });

  return parts;
}

// ---------- 9 Remaining PDF Pump Type GLB Models ----------

function makeSpurGearGeo(pitchR: number, thickness: number, teeth = 10, boreR = 0.06, phaseOffset = 0): GeometryData {
  const parts: GeometryData[] = [
    transformGeo(makeCylinder(pitchR * 0.86, pitchR * 0.86, thickness, 16, boreR), 0, 0, 0, 0, 0, Math.PI / 2),
  ];
  const toothH = pitchR * 0.28;
  const toothW = (Math.PI * 2 * pitchR) / (teeth * 2.3);
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2 + phaseOffset;
    const r = pitchR * 0.94;
    parts.push(transformGeo(makeBox(thickness * 0.94, toothH, toothW), 0, r * Math.cos(a), r * Math.sin(a), -a, 0, 0));
  }
  return mergeGeos(parts);
}

function makeHelicalScrewGeo(radius: number, length: number, turns = 3.2, handedness = 1): GeometryData {
  const parts: GeometryData[] = [
    transformGeo(makeCylinder(radius * 0.42, radius * 0.42, length, 14), 0, 0, 0, 0, 0, Math.PI / 2),
  ];
  const segs = 28;
  for (let i = 0; i < segs; i++) {
    const t = i / segs - 0.5;
    const x = t * length * 0.88;
    const a = t * turns * Math.PI * 2 * handedness;
    const y = radius * 0.68 * Math.cos(a);
    const z = radius * 0.68 * Math.sin(a);
    parts.push(
      transformGeo(makeBox(length / segs * 1.15, radius * 0.62, 0.045), x, y, z, -a, 0, 0.35 * handedness),
    );
  }
  return mergeGeos(parts);
}

function makeLobeRotorGeo(radius: number, length: number, lobes = 3, phaseOffset = 0): GeometryData {
  const parts: GeometryData[] = [
    transformGeo(makeCylinder(radius * 0.46, radius * 0.46, length, 14, 0.05), 0, 0, 0, 0, 0, Math.PI / 2),
  ];
  for (let i = 0; i < lobes; i++) {
    const a = (i / lobes) * Math.PI * 2 + phaseOffset;
    const cy = radius * 0.52 * Math.cos(a);
    const cz = radius * 0.52 * Math.sin(a);
    parts.push(transformGeo(makeCylinder(radius * 0.44, radius * 0.44, length * 0.96, 12), 0, cy, cz, 0, 0, Math.PI / 2));
  }
  return mergeGeos(parts);
}

function buildMultistagePumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'Baseplate',
    mesh: makeBox(4.3, 0.14, 1.35),
    materialIndex: 3,
    translation: [0.05, 0.07, 0],
    extras: { partId: 'baseplate', explodeDir: [0, -0.5, 0] },
  });

  // 5-stage tie-bolted segmented casing (transparent middle window + solid end heads & tie rods)
  const stageParts: GeometryData[] = [
    transformGeo(makeCylinder(0.54, 0.54, 0.16, 18, 0.16), -0.82, 0, 0, 0, 0, Math.PI / 2), // Suction cover
    transformGeo(makeCylinder(0.54, 0.54, 0.16, 18, 0.16), 0.82, 0, 0, 0, 0, Math.PI / 2), // Discharge cover
    transformGeo(makeCylinder(0.24, 0.24, 0.48, 14, 0.17), -0.72, 0.68, 0), // Top vertical suction nozzle
    transformGeo(makeCylinder(0.34, 0.34, 0.06, 14, 0.17), -0.72, 0.92, 0),
    transformGeo(makeCylinder(0.22, 0.22, 0.56, 14, 0.15), 0.72, 0.72, 0), // Top high-pressure discharge nozzle
    transformGeo(makeCylinder(0.34, 0.34, 0.06, 14, 0.15), 0.72, 1.0, 0),
    transformGeo(makeBox(0.32, 0.35, 0.92), -0.75, -0.62, 0),
    transformGeo(makeBox(0.32, 0.35, 0.92), 0.75, -0.62, 0),
  ];
  // 4 Tie rods clamping stages together
  for (const [ty, tz] of [[0.48, 0.48], [0.48, -0.48], [-0.48, 0.48], [-0.48, -0.48]]) {
    stageParts.push(transformGeo(makeCylinder(0.032, 0.032, 1.76, 8), 0, ty, tz, 0, 0, Math.PI / 2));
  }
  parts.push({
    name: 'MultistageEndHeads',
    mesh: mergeGeos(stageParts),
    materialIndex: 0,
    translation: [-0.82, 0.92, 0],
    extras: { partId: 'multistage_casing', explodeDir: [-0.45, 0.25, -0.45] },
  });

  // Cutaway glass stage rings so 5 impellers are visible
  const ringGeos: GeometryData[] = [];
  for (let i = 0; i < 5; i++) {
    ringGeos.push(transformGeo(makeCylinder(0.50, 0.50, 0.24, 18, 0.44), -0.56 + i * 0.28, 0, 0, 0, 0, Math.PI / 2));
  }
  parts.push({
    name: 'StageDiffuserShell',
    mesh: mergeGeos(ringGeos),
    materialIndex: 11,
    translation: [-0.82, 0.92, 0],
    extras: { partId: 'multistage_casing', explodeDir: [0, 0.85, 0] },
  });

  // 5 Brass Closed Impellers in series on single shaft
  const impGeos: GeometryData[] = [];
  for (let i = 0; i < 5; i++) {
    impGeos.push(transformGeo(makeImpellerGeometry('closed', 0.38, 5), -0.56 + i * 0.28, 0, 0));
  }
  parts.push({
    name: 'MultistageImpellerStack',
    mesh: mergeGeos(impGeos),
    materialIndex: 2,
    translation: [-0.82, 0.92, 0],
    extras: { partId: 'multistage_impellers', explodeDir: [0, 0.4, 0.7] },
  });

  parts.push({
    name: 'PumpShaft',
    mesh: transformGeo(makeCylinder(0.06, 0.06, 2.55, 14), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 1,
    translation: [-0.35, 0.92, 0],
    extras: { partId: 'shaft', explodeDir: [0, 0.3, 0] },
  });

  parts.push({
    name: 'BearingHousing',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.20, 0.20, 0.34, 14, 0.09), -1.78, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeBox(0.26, 0.56, 0.34), -1.78, -0.45, 0),
      transformGeo(makeCylinder(0.20, 0.20, 0.34, 14, 0.09), 0.16, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeBox(0.26, 0.56, 0.34), 0.16, -0.45, 0),
    ]),
    materialIndex: 0,
    translation: [-0.0, 0.92, 0],
    extras: { partId: 'bearing_housing', explodeDir: [0, -0.25, -0.5] },
  });

  parts.push({
    name: 'Coupling',
    mesh: transformGeo(makeCylinder(0.15, 0.15, 0.20, 14, 0.06), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 4,
    translation: [0.58, 0.92, 0],
    extras: { partId: 'coupling', explodeDir: [0, 0.75, 0] },
  });

  parts.push({
    name: 'ElectricMotor',
    mesh: makeElectricMotor(),
    materialIndex: 7,
    translation: [1.42, 0.92, 0],
    extras: { partId: 'electric_motor', explodeDir: [0.75, 0, 0] },
  });

  return parts;
}

function buildSplitCaseDoubleSuctionParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'Baseplate',
    mesh: makeBox(3.9, 0.14, 1.55),
    materialIndex: 3,
    translation: [0.1, 0.07, 0],
    extras: { partId: 'baseplate', explodeDir: [0, -0.4, 0] },
  });

  // Lower split casing with BOTH suction & discharge side nozzles mounted on bottom half!
  const lowerHalf = mergeGeos([
    makeBox(0.86, 0.52, 1.15),
    transformGeo(makeCylinder(0.52, 0.52, 0.76, 18), 0, 0.26, 0, 0, 0, Math.PI / 2),
    // Side suction pipe (+Z)
    transformGeo(makeCylinder(0.25, 0.25, 0.65, 16, 0.20), 0, 0.12, 0.82, Math.PI / 2, 0, 0),
    transformGeo(makeCylinder(0.36, 0.36, 0.06, 16, 0.20), 0, 0.12, 1.15, Math.PI / 2, 0, 0),
    // Side discharge pipe (-Z)
    transformGeo(makeCylinder(0.21, 0.21, 0.65, 16, 0.16), 0, 0.12, -0.82, Math.PI / 2, 0, 0),
    transformGeo(makeCylinder(0.32, 0.32, 0.06, 16, 0.16), 0, 0.12, -1.15, Math.PI / 2, 0, 0),
  ]);
  parts.push({
    name: 'LowerSplitCasing',
    mesh: lowerHalf,
    materialIndex: 0,
    translation: [-0.95, 0.56, 0],
    extras: { partId: 'lower_split_casing', explodeDir: [0, -0.2, 0] },
  });

  // Removable Upper Split Casing cover (semi-transparent/cutaway feel so central rotor shows at explode=0, lifts up cleanly on explode!)
  const upperHalf = mergeGeos([
    transformGeo(makeCylinder(0.52, 0.52, 0.74, 18, 0.44), 0, 0, 0, 0, 0, Math.PI / 2),
    makeBox(0.92, 0.08, 1.18), // horizontal split flange lip
    transformGeo(makeTorus(0.08, 0.022, 12, 8), 0, 0.58, 0), // top lifting eye
  ]);
  parts.push({
    name: 'UpperSplitCasing',
    mesh: upperHalf,
    materialIndex: 11,
    translation: [-0.95, 0.86, 0],
    extras: { partId: 'upper_split_casing', explodeDir: [0, 1.05, 0] },
  });

  // Central Double-Suction Back-to-Back Impeller
  const dsImpeller = mergeGeos([
    transformGeo(makeImpellerGeometry('closed', 0.42, 6), -0.11, 0, 0),
    transformGeo(makeImpellerGeometry('closed', 0.42, 6), 0.11, 0, 0, Math.PI, Math.PI, 0),
  ]);
  parts.push({
    name: 'DoubleSuctionImpeller',
    mesh: dsImpeller,
    materialIndex: 2,
    translation: [-0.95, 0.86, 0],
    extras: { partId: 'double_suction_impeller', explodeDir: [0, 0.45, 0.65] },
  });

  parts.push({
    name: 'PumpShaft',
    mesh: transformGeo(makeCylinder(0.065, 0.065, 2.25, 14), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 1,
    translation: [-0.45, 0.86, 0],
    extras: { partId: 'shaft', explodeDir: [0, 0.35, 0] },
  });

  // Between-Bearings Pedestals (BB1 configuration)
  parts.push({
    name: 'BearingHousing',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.19, 0.19, 0.30, 14, 0.09), -1.62, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeBox(0.24, 0.52, 0.34), -1.62, -0.44, 0),
      transformGeo(makeCylinder(0.19, 0.19, 0.30, 14, 0.09), -0.26, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeBox(0.24, 0.52, 0.34), -0.26, -0.44, 0),
    ]),
    materialIndex: 0,
    translation: [0, 0.86, 0],
    extras: { partId: 'bearing_housing', explodeDir: [0, -0.2, -0.5] },
  });

  parts.push({
    name: 'Coupling',
    mesh: transformGeo(makeCylinder(0.15, 0.15, 0.20, 14, 0.06), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 4,
    translation: [0.46, 0.86, 0],
    extras: { partId: 'coupling', explodeDir: [0, 0.7, 0] },
  });

  parts.push({
    name: 'ElectricMotor',
    mesh: makeElectricMotor(),
    materialIndex: 7,
    translation: [1.32, 0.86, 0],
    extras: { partId: 'electric_motor', explodeDir: [0.75, 0, 0] },
  });

  return parts;
}

function buildBarrelPumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'Baseplate',
    mesh: makeBox(4.2, 0.15, 1.45),
    materialIndex: 3,
    translation: [0.05, 0.075, 0],
    extras: { partId: 'baseplate', explodeDir: [0, -0.45, 0] },
  });

  // Thick Forged Cylindrical Barrel Outer Shell (semi-transparent body + heavy top suction/discharge high-pressure nozzles)
  const barrelShell = mergeGeos([
    transformGeo(makeCylinder(0.62, 0.62, 1.65, 20, 0.50), 0, 0, 0, 0, 0, Math.PI / 2),
    // Vertical Top Suction Nozzle
    transformGeo(makeCylinder(0.22, 0.22, 0.55, 14, 0.15), -0.52, 0.78, 0),
    transformGeo(makeCylinder(0.36, 0.36, 0.08, 14, 0.15), -0.52, 1.06, 0),
    // Vertical Top High-Pressure Discharge Nozzle
    transformGeo(makeCylinder(0.20, 0.20, 0.55, 14, 0.13), 0.52, 0.78, 0),
    transformGeo(makeCylinder(0.36, 0.36, 0.08, 14, 0.13), 0.52, 1.06, 0),
  ]);
  parts.push({
    name: 'BarrelOuterCasing',
    mesh: barrelShell,
    materialIndex: 11,
    translation: [-0.85, 0.96, 0],
    extras: { partId: 'barrel_casing', explodeDir: [0, 0.85, 0] },
  });

  // Heavy Bolted Forged Barrel End Cover + Pedestals
  const barrelCover = mergeGeos([
    transformGeo(makeCylinder(0.68, 0.68, 0.18, 20, 0.10), -0.88, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.66, 0.66, 0.16, 20, 0.10), 0.88, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeBox(0.30, 0.58, 0.96), -0.65, -0.58, 0),
    transformGeo(makeBox(0.30, 0.58, 0.96), 0.65, -0.58, 0),
  ]);
  parts.push({
    name: 'BarrelEndCover',
    mesh: barrelCover,
    materialIndex: 12,
    translation: [-0.85, 0.96, 0],
    extras: { partId: 'barrel_casing', explodeDir: [-0.95, 0, 0] },
  });

  // Extractable Multi-Stage Cartridge Rotor inside Barrel
  const cartridgeGeos: GeometryData[] = [];
  for (let i = 0; i < 6; i++) {
    cartridgeGeos.push(transformGeo(makeImpellerGeometry('closed', 0.40, 5), -0.60 + i * 0.24, 0, 0));
  }
  parts.push({
    name: 'InnerRotorCartridge',
    mesh: mergeGeos(cartridgeGeos),
    materialIndex: 2,
    translation: [-0.85, 0.96, 0],
    extras: { partId: 'multistage_impellers', explodeDir: [-0.8, 0.15, 0.75] },
  });

  parts.push({
    name: 'PumpShaft',
    mesh: transformGeo(makeCylinder(0.065, 0.065, 2.45, 14), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 1,
    translation: [-0.38, 0.96, 0],
    extras: { partId: 'shaft', explodeDir: [-0.4, 0.4, 0] },
  });

  parts.push({
    name: 'Coupling',
    mesh: transformGeo(makeCylinder(0.15, 0.15, 0.20, 14, 0.06), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 4,
    translation: [0.56, 0.96, 0],
    extras: { partId: 'coupling', explodeDir: [0, 0.7, 0] },
  });

  parts.push({
    name: 'ElectricMotor',
    mesh: makeElectricMotor(),
    materialIndex: 7,
    translation: [1.40, 0.96, 0],
    extras: { partId: 'electric_motor', explodeDir: [0.75, 0, 0] },
  });

  return parts;
}

function buildVerticalPumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  // Heavy Inline Base Plinth + Inline Horizontal Suction & Discharge Flanges
  const basePlinth = mergeGeos([
    makeBox(1.55, 0.22, 1.10),
    transformGeo(makeCylinder(0.22, 0.22, 0.52, 14, 0.16), -0.78, 0.28, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.34, 0.34, 0.07, 14, 0.16), -1.04, 0.28, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.22, 0.22, 0.52, 14, 0.16), 0.78, 0.28, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.34, 0.34, 0.07, 14, 0.16), 1.04, 0.28, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.56, 0.60, 0.36, 18), 0, 0.28, 0),
  ]);
  parts.push({
    name: 'VerticalBasePlinth',
    mesh: basePlinth,
    materialIndex: 0,
    translation: [0, 0.11, 0],
    extras: { partId: 'baseplate', explodeDir: [0, -0.35, 0] },
  });

  // Semi-transparent vertical stainless outer sleeve showing internal vertical stages
  parts.push({
    name: 'VerticalOuterSleeve',
    mesh: makeCylinder(0.46, 0.46, 1.35, 18, 0.40),
    materialIndex: 11,
    translation: [0, 1.24, 0],
    extras: { partId: 'vertical_stages', explodeDir: [0, 0, 0.85] },
  });

  // 4 Vertical Impellers stacked vertically along Y-axis!
  const vImpGeos: GeometryData[] = [];
  for (let i = 0; i < 4; i++) {
    vImpGeos.push(transformGeo(makeImpellerGeometry('closed', 0.35, 5), 0, -0.45 + i * 0.30, 0, 0, 0, Math.PI / 2));
  }
  parts.push({
    name: 'VerticalImpellerStack',
    mesh: mergeGeos(vImpGeos),
    materialIndex: 2,
    translation: [0, 1.24, 0],
    extras: { partId: 'vertical_stages', explodeDir: [0, 0.2, 0.4] },
  });

  parts.push({
    name: 'VerticalShaft',
    mesh: makeCylinder(0.055, 0.055, 1.85, 12),
    materialIndex: 1,
    translation: [0, 1.48, 0],
    extras: { partId: 'shaft', explodeDir: [0, 0.4, 0] },
  });

  // Motor Stool & Vertical Coupling
  parts.push({
    name: 'VerticalCoupling',
    mesh: mergeGeos([
      makeCylinder(0.32, 0.42, 0.32, 16, 0.24),
      makeCylinder(0.13, 0.13, 0.18, 14),
    ]),
    materialIndex: 4,
    translation: [0, 2.08, 0],
    extras: { partId: 'coupling', explodeDir: [0, 0.65, 0] },
  });

  // Vertical Electric Motor on top
  parts.push({
    name: 'VerticalMotorHead',
    mesh: transformGeo(makeElectricMotor(), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 7,
    translation: [0, 2.86, 0],
    extras: { partId: 'vertical_motor', explodeDir: [0, 1.0, 0] },
  });

  return parts;
}

function buildAxialMixedPumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'ComparisonBase',
    mesh: makeBox(4.1, 0.12, 1.45),
    materialIndex: 3,
    translation: [0, 0.06, 0],
  });

  // LEFT: Axial Flow Propeller Pump (flow parallel to shaft!)
  const axialCasing = mergeGeos([
    transformGeo(makeCylinder(0.55, 0.55, 1.45, 20, 0.48), 0, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.64, 0.64, 0.07, 18, 0.48), -0.72, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.64, 0.64, 0.07, 18, 0.48), 0.72, 0, 0, 0, 0, Math.PI / 2),
  ]);
  parts.push({
    name: 'AxialTubularCasing',
    mesh: axialCasing,
    materialIndex: 11,
    translation: [-1.10, 0.90, 0],
    extras: { partId: 'axial_propeller', explodeDir: [0, 0.7, 0] },
  });

  // 4-blade twisted Axial Propeller Rotor
  const propParts: GeometryData[] = [
    transformGeo(makeCylinder(0.14, 0.14, 0.46, 14), 0, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.04, 0.14, 0.22, 12), -0.34, 0, 0, 0, 0, Math.PI / 2), // Nose cone
  ];
  for (let b = 0; b < 4; b++) {
    const a = (b / 4) * Math.PI * 2;
    propParts.push(
      transformGeo(makeBox(0.24, 0.36, 0.04), 0, 0.29 * Math.cos(a), 0.29 * Math.sin(a), -a, 0.55, 0),
    );
  }
  parts.push({
    name: 'AxialPropeller',
    mesh: mergeGeos(propParts),
    materialIndex: 2,
    translation: [-1.10, 0.90, 0],
    extras: { partId: 'axial_propeller', explodeDir: [0, 0, 0.6] },
  });

  parts.push({
    name: 'AxialFlowArrow',
    mesh: transformGeo(makeArrowGeo(0.85), -1.45, 1.56, 0, 0, 0, -Math.PI / 2),
    materialIndex: 8,
    extras: { partId: 'axial_propeller' },
  });

  // RIGHT: Mixed Flow Pump (conical impeller discharging at > 90 deg!)
  const mixedCasing = mergeGeos([
    transformGeo(makeCylinder(0.68, 0.44, 1.10, 20, 0.38), 0, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.75, 0.75, 0.07, 18, 0.55), 0.55, 0, 0, 0, 0, Math.PI / 2),
    transformGeo(makeCylinder(0.52, 0.52, 0.07, 18, 0.38), -0.55, 0, 0, 0, 0, Math.PI / 2),
  ]);
  parts.push({
    name: 'MixedConicalCasing',
    mesh: mixedCasing,
    materialIndex: 11,
    translation: [1.05, 0.90, 0],
    extras: { partId: 'mixed_flow_rotor', explodeDir: [0, 0.7, 0] },
  });

  const mixedParts: GeometryData[] = [
    transformGeo(makeCylinder(0.44, 0.16, 0.46, 16), 0, 0, 0, 0, 0, Math.PI / 2),
  ];
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2;
    mixedParts.push(
      transformGeo(makeBox(0.32, 0.28, 0.04), 0.05, 0.34 * Math.cos(a), 0.34 * Math.sin(a), -a, 0.4, -0.45),
    );
  }
  parts.push({
    name: 'MixedFlowRotor',
    mesh: mergeGeos(mixedParts),
    materialIndex: 4,
    translation: [1.05, 0.90, 0],
    extras: { partId: 'mixed_flow_rotor', explodeDir: [0, 0, 0.6] },
  });

  parts.push({
    name: 'MixedFlowArrow',
    mesh: transformGeo(makeArrowGeo(0.75), 0.75, 1.48, 0, 0, 0, -Math.PI / 3.2),
    materialIndex: 10,
    extras: { partId: 'mixed_flow_rotor' },
  });

  return parts;
}

function buildReciprocatingPumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'Baseplate',
    mesh: makeBox(3.8, 0.14, 1.35),
    materialIndex: 3,
    translation: [0, 0.07, 0],
    extras: { partId: 'baseplate' },
  });

  // Heavy Crankcase Frame (Left)
  parts.push({
    name: 'CrankcaseFrame',
    mesh: mergeGeos([
      makeBox(1.05, 0.85, 0.85),
      transformGeo(makeCylinder(0.44, 0.44, 0.82, 16), 0, 0.18, 0, Math.PI / 2, 0, 0),
    ]),
    materialIndex: 13,
    translation: [-1.15, 0.56, 0],
    extras: { partId: 'reciprocating_piston', explodeDir: [-0.6, 0, 0] },
  });

  // Rotating Crankshaft & Crank Pin
  parts.push({
    name: 'Crankshaft',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.30, 0.30, 0.14, 18), 0, 0, 0, Math.PI / 2, 0, 0),
      transformGeo(makeCylinder(0.06, 0.06, 0.34, 10), 0.18, 0.14, 0, Math.PI / 2, 0, 0),
    ]),
    materialIndex: 1,
    translation: [-1.05, 0.74, 0.44],
    extras: { partId: 'reciprocating_piston' },
  });

  // Connecting Rod + Horizontal Plunger/Piston inside cutaway fluid cylinder!
  parts.push({
    name: 'ReciprocatingPiston',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.055, 0.055, 0.95, 12), -0.35, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.22, 0.22, 0.24, 18), 0.15, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeTorus(0.225, 0.024, 16, 8), 0.10, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeTorus(0.225, 0.024, 16, 8), 0.20, 0, 0, 0, 0, Math.PI / 2),
    ]),
    materialIndex: 2,
    translation: [-0.20, 0.74, 0],
    extras: { partId: 'reciprocating_piston', explodeDir: [0, 0.5, 0.5] },
  });

  // Cutaway Glass Fluid End Cylinder + Valve Block
  parts.push({
    name: 'FluidCylinder',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.30, 0.30, 1.05, 18, 0.25), 0.22, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeBox(0.55, 0.68, 0.62), 0.85, 0, 0), // Valve chest
      transformGeo(makeCylinder(0.16, 0.16, 0.42, 12, 0.12), 0.85, -0.45, 0), // Suction port
      transformGeo(makeCylinder(0.15, 0.15, 0.42, 12, 0.11), 0.85, 0.52, 0), // Discharge port
    ]),
    materialIndex: 11,
    translation: [0.05, 0.74, 0],
    extras: { partId: 'reciprocating_piston', explodeDir: [0.4, 0, 0] },
  });

  // Prominent Pulsation Dampener (Air Vessel) mounted on Discharge Manifold (PDF p. 11)
  parts.push({
    name: 'PulsationDampener',
    mesh: mergeGeos([
      makeCylinder(0.14, 0.14, 0.28, 12),
      transformGeo(makeCylinder(0.28, 0.28, 0.45, 16), 0, 0.34, 0),
      transformGeo(makeSphere(0.28, 14, 10), 0, 0.56, 0),
    ]),
    materialIndex: 9,
    translation: [0.90, 1.32, 0],
    extras: { partId: 'pulsation_dampener', explodeDir: [0, 0.85, 0] },
  });

  // Safety Relief Valve on discharge
  parts.push({
    name: 'SafetyReliefValve',
    mesh: mergeGeos([
      makeCylinder(0.11, 0.11, 0.30, 12),
      transformGeo(makeCoilSpring(0.08, 0.015, 4, 0.22, 28), 0, 0.26, 0),
      transformGeo(makeCylinder(0.14, 0.14, 0.08, 12), 0, 0.40, 0),
    ]),
    materialIndex: 4,
    translation: [1.35, 1.05, 0.22],
    extras: { partId: 'safety_relief_valve', explodeDir: [0.4, 0.6, 0.3] },
  });

  return parts;
}

function buildGearPumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'Baseplate',
    mesh: makeBox(3.5, 0.14, 1.3),
    materialIndex: 3,
    translation: [0.1, 0.07, 0],
    extras: { partId: 'baseplate' },
  });

  // Cutaway Glass Figure-8 Gear Housing with Suction (bottom/back) & Discharge (top/front)
  parts.push({
    name: 'GearCasingCutaway',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.42, 0.42, 0.42, 18, 0.36), 0, 0.22, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.42, 0.42, 0.42, 18, 0.36), 0, -0.22, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.16, 0.16, 0.48, 12, 0.12), 0, 0, -0.58, Math.PI / 2, 0, 0), // Suction port
      transformGeo(makeCylinder(0.16, 0.16, 0.48, 12, 0.12), 0, 0, 0.58, Math.PI / 2, 0, 0), // Discharge port
    ]),
    materialIndex: 11,
    translation: [-0.95, 0.88, 0],
    extras: { partId: 'gear_pump_gears', explodeDir: [-0.65, 0.4, 0] },
  });

  // Upper Drive Spur Gear (10 teeth, 0 phase)
  parts.push({
    name: 'DriveGear',
    mesh: makeSpurGearGeo(0.24, 0.30, 10, 0.055, 0),
    materialIndex: 2,
    translation: [-0.95, 1.10, 0],
    extras: { partId: 'gear_pump_gears', explodeDir: [-0.3, 0.65, 0.4] },
  });

  // Lower Idler Driven Spur Gear (10 teeth, offset by PI/10 for clean intermeshing!)
  parts.push({
    name: 'DrivenGear',
    mesh: makeSpurGearGeo(0.24, 0.30, 10, 0.055, Math.PI / 10),
    materialIndex: 4,
    translation: [-0.95, 0.64, 0],
    extras: { partId: 'gear_pump_gears', explodeDir: [-0.3, -0.35, 0.4] },
  });

  parts.push({
    name: 'PumpShaft',
    mesh: transformGeo(makeCylinder(0.055, 0.055, 1.35, 14), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 1,
    translation: [-0.32, 1.10, 0],
    extras: { partId: 'shaft' },
  });

  // Integral Safety Relief Valve on Gear Casing
  parts.push({
    name: 'SafetyReliefValve',
    mesh: mergeGeos([
      makeCylinder(0.11, 0.11, 0.28, 12),
      transformGeo(makeCylinder(0.15, 0.15, 0.08, 12), 0, 0.18, 0),
    ]),
    materialIndex: 9,
    translation: [-0.95, 1.48, 0.25],
    extras: { partId: 'safety_relief_valve', explodeDir: [0, 0.75, 0] },
  });

  parts.push({
    name: 'Coupling',
    mesh: transformGeo(makeCylinder(0.14, 0.14, 0.18, 14, 0.055), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 4,
    translation: [0.38, 1.10, 0],
    extras: { partId: 'coupling' },
  });

  parts.push({
    name: 'ElectricMotor',
    mesh: makeElectricMotor(),
    materialIndex: 7,
    translation: [1.18, 1.00, 0],
    extras: { partId: 'electric_motor', explodeDir: [0.7, 0, 0] },
  });

  return parts;
}

function buildScrewPumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'Baseplate',
    mesh: makeBox(4.0, 0.14, 1.35),
    materialIndex: 3,
    translation: [0.05, 0.07, 0],
    extras: { partId: 'baseplate' },
  });

  // Cutaway Elongated Barrel showing twin helical screws inside
  parts.push({
    name: 'ScrewBarrelCutaway',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.46, 0.46, 1.45, 18, 0.40), 0, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.22, 0.22, 0.42, 14, 0.16), -0.45, 0.56, 0), // Suction
      transformGeo(makeCylinder(0.20, 0.20, 0.42, 14, 0.14), 0.45, 0.56, 0), // Discharge
    ]),
    materialIndex: 11,
    translation: [-0.95, 0.88, 0],
    extras: { partId: 'helical_screws', explodeDir: [0, 0.85, 0] },
  });

  // Timing Gear Housing + Pedestals
  parts.push({
    name: 'TimingGearBox',
    mesh: mergeGeos([
      makeBox(0.36, 0.68, 0.72),
      transformGeo(makeBox(0.32, 0.45, 0.78), 0, -0.48, 0),
    ]),
    materialIndex: 12,
    translation: [-0.08, 0.88, 0],
    extras: { partId: 'bearing_housing', explodeDir: [0, -0.2, -0.6] },
  });

  // Twin Intermeshing Helical Screws
  parts.push({
    name: 'HelicalScrewA',
    mesh: makeHelicalScrewGeo(0.21, 1.36, 3.2, 1),
    materialIndex: 2,
    translation: [-0.95, 0.88, 0.16],
    extras: { partId: 'helical_screws', explodeDir: [-0.45, 0.2, 0.5] },
  });

  parts.push({
    name: 'HelicalScrewB',
    mesh: makeHelicalScrewGeo(0.21, 1.36, 3.2, -1),
    materialIndex: 1,
    translation: [-0.95, 0.88, -0.16],
    extras: { partId: 'helical_screws', explodeDir: [-0.45, 0.2, -0.5] },
  });

  parts.push({
    name: 'Coupling',
    mesh: transformGeo(makeCylinder(0.14, 0.14, 0.20, 14, 0.055), 0, 0, 0, 0, 0, Math.PI / 2),
    materialIndex: 4,
    translation: [0.36, 0.88, 0.16],
    extras: { partId: 'coupling' },
  });

  parts.push({
    name: 'ElectricMotor',
    mesh: makeElectricMotor(),
    materialIndex: 7,
    translation: [1.22, 0.88, 0.10],
    extras: { partId: 'electric_motor', explodeDir: [0.75, 0, 0] },
  });

  return parts;
}

function buildLobeVanePumpParts(): GlbPartDef[] {
  const parts: GlbPartDef[] = [];

  parts.push({
    name: 'ComparisonBase',
    mesh: makeBox(3.8, 0.12, 1.35),
    materialIndex: 3,
    translation: [0, 0.06, 0],
  });

  // LEFT: Rotary Lobe Pump (Twin 3-lobe synchronized rotors inside cutaway figure-8 housing)
  parts.push({
    name: 'LobeChamberCutaway',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.46, 0.46, 0.44, 18, 0.40), 0, 0.24, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.46, 0.46, 0.44, 18, 0.40), 0, -0.24, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.16, 0.16, 0.42, 12, 0.12), 0, 0, -0.58, Math.PI / 2, 0, 0),
      transformGeo(makeCylinder(0.16, 0.16, 0.42, 12, 0.12), 0, 0, 0.58, Math.PI / 2, 0, 0),
    ]),
    materialIndex: 11,
    translation: [-1.05, 0.88, 0],
    extras: { partId: 'rotary_lobes', explodeDir: [-0.4, 0.7, 0] },
  });

  parts.push({
    name: 'RotaryLobeA',
    mesh: makeLobeRotorGeo(0.28, 0.34, 3, 0),
    materialIndex: 2,
    translation: [-1.05, 1.12, 0],
    extras: { partId: 'rotary_lobes', explodeDir: [-0.3, 0.4, 0.5] },
  });

  parts.push({
    name: 'RotaryLobeB',
    mesh: makeLobeRotorGeo(0.28, 0.34, 3, Math.PI / 3),
    materialIndex: 4,
    translation: [-1.05, 0.64, 0],
    extras: { partId: 'rotary_lobes', explodeDir: [-0.3, -0.3, 0.5] },
  });

  // RIGHT: Sliding Vane Pump (Eccentric rotor + sliding radial vanes inside circular cam ring)
  parts.push({
    name: 'VaneCamRing',
    mesh: mergeGeos([
      transformGeo(makeCylinder(0.64, 0.64, 0.46, 20, 0.54), 0, 0, 0, 0, 0, Math.PI / 2),
      transformGeo(makeCylinder(0.16, 0.16, 0.40, 12, 0.12), 0, 0, -0.72, Math.PI / 2, 0, 0),
      transformGeo(makeCylinder(0.16, 0.16, 0.40, 12, 0.12), 0, 0, 0.72, Math.PI / 2, 0, 0),
    ]),
    materialIndex: 11,
    translation: [1.05, 0.88, 0],
    extras: { partId: 'sliding_vane_rotor', explodeDir: [0.4, 0.7, 0] },
  });

  // Eccentrically mounted slotted rotor with 6 sliding blades
  const vaneParts: GeometryData[] = [
    transformGeo(makeCylinder(0.32, 0.32, 0.36, 18, 0.07), 0, 0, 0, 0, 0, Math.PI / 2),
  ];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    vaneParts.push(
      transformGeo(makeBox(0.34, 0.28, 0.035), 0, 0.36 * Math.cos(a), 0.36 * Math.sin(a), -a, 0, 0),
    );
  }
  parts.push({
    name: 'SlidingVaneRotor',
    mesh: mergeGeos(vaneParts),
    materialIndex: 1,
    translation: [1.05, 0.76, 0.06], // Eccentric offset inside cam ring!
    extras: { partId: 'sliding_vane_rotor', explodeDir: [0.4, 0.2, 0.5] },
  });

  return parts;
}

export function buildGlbBuffer(modelId: GlbModelId): Uint8Array {
  switch (modelId) {
    case 'complete_pump':
      return encodeGlb(buildFullPumpParts(false));
    case 'exploded_pump':
      return encodeGlb(buildFullPumpParts(true));
    case 'impeller_types':
      return encodeGlb(buildImpellerComparisonParts());
    case 'bearings_loads':
      return encodeGlb(buildBearingsLoadsParts());
    case 'mechanical_seal':
      return encodeGlb(buildMechanicalSealParts());
    case 'cavitation_model':
      return encodeGlb(buildCavitationParts());
    case 'water_hammer':
      return encodeGlb(buildWaterHammerParts());
    case 'alignment_model':
      return encodeGlb(buildAlignmentParts());
    case 'multistage_pump':
      return encodeGlb(buildMultistagePumpParts());
    case 'split_case_double_suction':
      return encodeGlb(buildSplitCaseDoubleSuctionParts());
    case 'barrel_pump':
      return encodeGlb(buildBarrelPumpParts());
    case 'vertical_pump':
      return encodeGlb(buildVerticalPumpParts());
    case 'axial_mixed_pump':
      return encodeGlb(buildAxialMixedPumpParts());
    case 'reciprocating_pump':
      return encodeGlb(buildReciprocatingPumpParts());
    case 'gear_pump':
      return encodeGlb(buildGearPumpParts());
    case 'screw_pump':
      return encodeGlb(buildScrewPumpParts());
    case 'lobe_vane_pump':
      return encodeGlb(buildLobeVanePumpParts());
  }
}

export function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof Buffer !== 'undefined' && typeof atob === 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateAllGlbBase64Map(): Record<GlbModelId, string> {
  const ids: GlbModelId[] = [
    'complete_pump',
    'exploded_pump',
    'impeller_types',
    'bearings_loads',
    'mechanical_seal',
    'cavitation_model',
    'water_hammer',
    'alignment_model',
    'multistage_pump',
    'split_case_double_suction',
    'barrel_pump',
    'vertical_pump',
    'axial_mixed_pump',
    'reciprocating_pump',
    'gear_pump',
    'screw_pump',
    'lobe_vane_pump',
  ];
  const map = {} as Record<GlbModelId, string>;
  for (const id of ids) {
    map[id] = uint8ToBase64(buildGlbBuffer(id));
  }
  return map;
}
