import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Box,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { GlbModelId, PumpPartInfo } from '../types/academy';
import { base64ToArrayBuffer, buildGlbBuffer, uint8ToBase64 } from '../engine/glbBuilder';
import { PUMP_PARTS_CATALOG } from '../data/lessons';
import { Pump2DSchematic } from './Pump2DSchematic';

export const GLB_MODELS_META: {
  id: GlbModelId;
  arTitle: string;
  enTitle: string;
  desc: string;
}[] = [
  {
    id: 'complete_pump',
    arTitle: 'مضخة الطرد المركزي الكاملة',
    enTitle: 'Complete Centrifugal Pump Unit',
    desc: 'وحدة ضخ متكاملة على قاعدة مشتركة مع خطوط السحب والدفع والمحرك الكهربائي.',
  },
  {
    id: 'exploded_pump',
    arTitle: 'نموذج تفكيك المضخة (Exploded)',
    enTitle: 'Exploded Pump Assembly',
    desc: 'اسحب شريط التفكيك أو اضغط على أي جزء لفحص وظيفته وأعطاله وأساليب صيانته.',
  },
  {
    id: 'impeller_types',
    arTitle: 'مقارنة أنواع الدفاعات الثلاثة',
    enTitle: 'Open vs Semi-Open vs Closed Impellers',
    desc: 'مقارنة هندسية مباشرة بين الدفاعة المفتوحة ونصف المفتوحة والمغلقة.',
  },
  {
    id: 'bearings_loads',
    arTitle: 'المحامل والأحمال القطرية والمحورية',
    enTitle: 'Bearings & Radial/Axial Loads',
    desc: 'تمثيل لمحمل الكرات القطري ومحمل الدفع المحوري وأسهم اتجاه الأحمال.',
  },
  {
    id: 'mechanical_seal',
    arTitle: 'السداد الميكانيكي المفكك',
    enTitle: 'Mechanical Seal Exploded Assembly',
    desc: 'الأجزاء الدقيقة للسداد: الحلقة الثابتة، الدوارة، O-Ring، النابض، وحلقة الدفع.',
  },
  {
    id: 'cavitation_model',
    arTitle: 'محاكاة التكهف وتآكل الريش',
    enTitle: 'Cavitation Bubbles & Pitting Erosion',
    desc: 'تكون فقاعات البخار عند عين الدفاعة وانهيارها العنيف مع مناطق النقر المعدني.',
  },
  {
    id: 'water_hammer',
    arTitle: 'المطرقة المائية (موجة الصدمة)',
    enTitle: 'Water Hammer Pressure Surge',
    desc: 'الإغلاق المفاجئ لصمام الدفع وارتداد موجة الضغط العالي في الأنبوب.',
  },
  {
    id: 'alignment_model',
    arTitle: 'محاذاة المضخة والمحرك والليزر',
    enTitle: 'Shaft Alignment & Misalignment Modes',
    desc: 'محاكاة بصرية للانحراف الزاوي والموازي والمركب مع جهاز المحاذاة الليزري.',
  },
];

// Global cache of Base64 strings so generating + encoding happens lazily once per model
const glbBase64Cache = new Map<GlbModelId, string>();
export function getGlbBase64(id: GlbModelId): string {
  const existing = glbBase64Cache.get(id);
  if (existing) return existing;
  if (typeof window !== 'undefined') {
    const win = window as unknown as { __EMBEDDED_GLB_MODELS__?: Record<string, string> };
    const pre = win.__EMBEDDED_GLB_MODELS__?.[id];
    if (pre) {
      glbBase64Cache.set(id, pre);
      return pre;
    }
  }
  const b64 = uint8ToBase64(buildGlbBuffer(id));
  glbBase64Cache.set(id, b64);
  return b64;
}

interface Pump3DViewportProps {
  initialModelId?: GlbModelId;
  onJumpToLesson?: (lessonId: number) => void;
  compactMode?: boolean;
}

export const Pump3DViewport: React.FC<Pump3DViewportProps> = ({
  initialModelId = 'complete_pump',
  onJumpToLesson,
  compactMode = false,
}) => {
  const [activeModel, setActiveModel] = useState<GlbModelId>(initialModelId);
  const [explodePct, setExplodePct] = useState<number>(initialModelId === 'exploded_pump' ? 55 : 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [lightMode3D, setLightMode3D] = useState<boolean>(false);
  const [fallback2D, setFallback2D] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<PumpPartInfo | null>(null);
  const [selectedRawName, setSelectedRawName] = useState<string | null>(null);
  const [hiddenNodes, setHiddenNodes] = useState<Record<string, boolean>>({});
  const [nodeList, setNodeList] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [alignmentMode, setAlignmentMode] = useState<'perfect' | 'angular' | 'parallel' | 'combined'>('combined');
  const [hammerTriggerAt, setHammerTriggerAt] = useState<number>(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  // Sync initialModelId changes from outside (e.g. clicking "View in 3D" from a Lesson)
  useEffect(() => {
    setActiveModel(initialModelId);
    setExplodePct(initialModelId === 'exploded_pump' ? 55 : 0);
    setSelectedPart(null);
    setSelectedRawName(null);
  }, [initialModelId]);

  // Mutable scene references accessed inside Three.js closures cleanly
  const sceneStateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    modelGroup?: THREE.Group;
    requestRender: () => void;
    activeModel: GlbModelId;
    explodePct: number;
    isPlaying: boolean;
    lightMode3D: boolean;
    hiddenNodes: Record<string, boolean>;
    alignmentMode: 'perfect' | 'angular' | 'parallel' | 'combined';
    hammerPhase: number;
    selectedMeshName: string | null;
    basePositions: Map<THREE.Object3D, THREE.Vector3>;
    baseRotations: Map<THREE.Object3D, THREE.Euler>;
  }>({
    requestRender: () => {},
    activeModel,
    explodePct,
    isPlaying,
    lightMode3D,
    hiddenNodes,
    alignmentMode,
    hammerPhase: 0,
    selectedMeshName: null,
    basePositions: new Map(),
    baseRotations: new Map(),
  });

  sceneStateRef.current.activeModel = activeModel;
  sceneStateRef.current.explodePct = explodePct;
  sceneStateRef.current.isPlaying = isPlaying;
  sceneStateRef.current.lightMode3D = lightMode3D;
  sceneStateRef.current.hiddenNodes = hiddenNodes;
  sceneStateRef.current.alignmentMode = alignmentMode;
  sceneStateRef.current.selectedMeshName = selectedRawName;

  // Apply transforms whenever explode/hidden/alignment changes
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st.modelGroup) return;
    const factor = st.explodePct / 100;

    st.modelGroup.traverse((obj) => {
      if (obj === st.modelGroup) return;
      if (obj.name && obj.name in st.hiddenNodes) {
        obj.visible = !st.hiddenNodes[obj.name];
      }
      const basePos = st.basePositions.get(obj);
      const dir = obj.userData?.explodeDir as [number, number, number] | undefined;
      if (basePos && dir) {
        obj.position.set(
          basePos.x + dir[0] * factor,
          basePos.y + dir[1] * factor,
          basePos.z + dir[2] * factor,
        );
      }
      if (st.activeModel === 'alignment_model' && obj.name === 'MotorMovableUnit' && basePos) {
        const baseRot = st.baseRotations.get(obj);
        if (st.alignmentMode === 'perfect') {
          obj.position.copy(basePos);
          if (baseRot) obj.rotation.copy(baseRot);
        } else if (st.alignmentMode === 'parallel') {
          obj.position.set(basePos.x, basePos.y + 0.16, basePos.z + 0.12);
          if (baseRot) obj.rotation.copy(baseRot);
        } else if (st.alignmentMode === 'angular') {
          obj.position.copy(basePos);
          obj.rotation.set(0, 0.12, -0.10);
        } else {
          obj.position.set(basePos.x, basePos.y + 0.12, basePos.z - 0.10);
          obj.rotation.set(0, -0.10, 0.09);
        }
      }
    });
    st.requestRender();
  }, [explodePct, hiddenNodes, alignmentMode, activeModel]);

  useEffect(() => {
    if (hammerTriggerAt > 0) {
      sceneStateRef.current.hammerPhase = 0.01;
      sceneStateRef.current.requestRender();
    }
  }, [hammerTriggerAt]);

  // Mount Three.js renderer once
  useEffect(() => {
    if (fallback2D) return;
    const host = canvasHostRef.current;
    if (!host) return;

    let disposed = false;
    let rafId = 0;
    let renderer: THREE.WebGLRenderer;
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!gl) {
        setWebglError('تعذر تفعيل WebGL على هذا المتصفح — تم تفعيل المخطط التفاعلي ثنائي الأبعاد.');
        setFallback2D(true);
        return;
      }
      let debugStr = '';
      try {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        if (dbg) debugStr = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '');
      } catch {
        // ignore
      }
      const isSoftwareGl = /llvmpipe|swiftshader|software/i.test(debugStr);

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.88;
      renderer.shadowMap.enabled = false;
      renderer.domElement.setAttribute('data-testid', 'pump-3d-canvas');
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.touchAction = 'none';
      host.innerHTML = '';
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#0a0f1a');

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;

      const camera = new THREE.PerspectiveCamera(
        42,
        Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight),
        0.1,
        100,
      );
      camera.position.set(3.5, 2.55, 5.0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 1.4;
      controls.maxDistance = 12;
      controls.target.set(0, 1.05, 0);

      // Balanced studio lighting for clear industrial metal contrast
      const hemi = new THREE.HemisphereLight('#cbd5e1', '#0f172a', 0.45);
      scene.add(hemi);
      const dir = new THREE.DirectionalLight('#ffffff', 0.92);
      dir.position.set(4, 6, 4);
      scene.add(dir);
      const rim = new THREE.DirectionalLight('#38bdf8', 0.35);
      rim.position.set(-4, 3, -3);
      scene.add(rim);

      // Floor reference grid
      const grid = new THREE.GridHelper(10, 20, '#334155', '#1e293b');
      grid.position.y = 0;
      scene.add(grid);

      const modelGroup = new THREE.Group();
      scene.add(modelGroup);

      const st = sceneStateRef.current;
      st.renderer = renderer;
      st.scene = scene;
      st.camera = camera;
      st.controls = controls;
      st.modelGroup = modelGroup;

      let renderPending = false;
      const drawFrame = () => {
        if (disposed) return;
        renderPending = false;
        controls.update();

        // Advance continuous mechanical animation when playing & not lightMode3D
        let needsNext = false;
        if (st.isPlaying && !st.lightMode3D && st.modelGroup) {
          const id = st.activeModel;
          const t = performance.now() * 0.001;
          st.modelGroup.traverse((obj) => {
            if (id === 'complete_pump' || id === 'exploded_pump') {
              if (obj.name === 'Impeller' || obj.name === 'PumpShaft' || obj.name === 'Coupling') {
                obj.rotation.x += 0.06;
                needsNext = true;
              }
            } else if (id === 'impeller_types') {
              if (obj.name.endsWith('Impeller')) {
                obj.rotation.x += 0.035;
                needsNext = true;
              }
            } else if (id === 'bearings_loads') {
              if (obj.name === 'PumpShaft' || obj.name === 'BallBearing' || obj.name === 'ThrustBearing') {
                obj.rotation.x += 0.04;
                needsNext = true;
              }
            } else if (id === 'mechanical_seal') {
              if (obj.name === 'ShaftAndSleeve' || obj.name === 'PrimaryRotatingRing' || obj.name === 'DriveRing') {
                obj.rotation.x += 0.045;
                needsNext = true;
              }
            } else if (id === 'cavitation_model') {
              if (obj.name === 'ImpellerCutaway') {
                obj.rotation.x += 0.055;
                needsNext = true;
              } else if (obj.name.startsWith('VaporBubble_')) {
                const idx = Number(obj.name.split('_')[1] || 1);
                const phase = (t * 1.4 + idx * 0.37) % 1;
                const s = phase < 0.75 ? 0.5 + phase * 1.2 : Math.max(0.15, (1 - phase) * 4.5);
                obj.scale.setScalar(s);
                needsNext = true;
              }
            } else if (id === 'water_hammer') {
              if (st.hammerPhase === 0) st.hammerPhase = 0.01;
              st.hammerPhase = (st.hammerPhase + 0.016) % 1.4;
              const closing = st.hammerPhase < 0.35;
              if (obj.name === 'ValveGate') {
                const base = st.basePositions.get(obj);
                if (base) {
                  obj.position.y = closing ? base.y + (0.35 - st.hammerPhase) * 0.8 : base.y;
                }
                needsNext = true;
              } else if (obj.name.startsWith('PressureWave_')) {
                const idx = Number(obj.name.split('_')[1] || 1);
                const waveTravel = ((st.hammerPhase * 1.8 + idx * 0.25) % 1);
                const base = st.basePositions.get(obj);
                if (base) {
                  obj.position.x = 1.55 - waveTravel * 2.85;
                  const pulse = 1 + Math.sin(waveTravel * Math.PI) * 0.45;
                  obj.scale.set(1, pulse, pulse);
                }
                needsNext = true;
              }
            } else if (id === 'alignment_model') {
              if (obj.name === 'LaserBeam') {
                const pulse = 0.85 + Math.sin(t * 5) * 0.25;
                obj.scale.set(1, pulse, pulse);
                needsNext = true;
              }
            }
          });
        }

        renderer.render(scene, camera);

        if (needsNext && !disposed) {
          // Schedule next tick after frame completes
          requestAnimationFrame(scheduleNext);
        }
      };

      const scheduleNext = () => {
        if (!disposed && !renderPending) {
          renderPending = true;
          rafId = requestAnimationFrame(drawFrame);
        }
      };

      st.requestRender = () => {
        if (!disposed && !renderPending) {
          renderPending = true;
          rafId = requestAnimationFrame(drawFrame);
        }
      };

      controls.addEventListener('change', st.requestRender);

      // Raycasting on pointer click (ignore drag gestures)
      let downPos = { x: 0, y: 0 };
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      const onPointerDown = (e: PointerEvent) => {
        downPos = { x: e.clientX, y: e.clientY };
      };
      const onPointerUp = (e: PointerEvent) => {
        const dist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
        if (dist > 6 || !st.modelGroup) return;
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(st.modelGroup.children, true);
        if (hits.length > 0) {
          let curr: THREE.Object3D | null = hits[0].object;
          while (curr && curr.parent && curr.parent !== st.modelGroup) {
            curr = curr.parent;
          }
          const hitName = curr?.name || hits[0].object.name;
          setSelectedRawName(hitName);
          const found =
            PUMP_PARTS_CATALOG.find((p) => p.nodeName === hitName || p.id === curr?.userData?.partId) ?? null;
          setSelectedPart(found);

          // Brief highlight feedback via emissive tint
          st.modelGroup.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) {
                if (o === curr || o.parent === curr) {
                  m.emissive.set('#0284c7');
                  m.emissiveIntensity = 0.42;
                } else {
                  m.emissiveIntensity = m.userData?.origEmissiveIntensity ?? 0.0;
                }
              }
            }
          });
          st.requestRender();
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);

      const handleResize = () => {
        if (!host || disposed) return;
        const w = Math.max(1, host.clientWidth);
        const h = Math.max(1, host.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        st.requestRender();
      };
      const ro = new ResizeObserver(handleResize);
      ro.observe(host);
      handleResize();

      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        ro.disconnect();
        controls.removeEventListener('change', st.requestRender);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        controls.dispose();
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'WebGL initialization failed');
      setFallback2D(true);
    }
  }, [fallback2D]);

  // Load binary GLB whenever activeModel changes
  useEffect(() => {
    if (fallback2D) return;
    const st = sceneStateRef.current;
    if (!st.modelGroup) return;

    const b64 = getGlbBase64(activeModel);
    const buffer = base64ToArrayBuffer(b64);
    const loader = new GLTFLoader();

    loader.parse(
      buffer,
      '',
      (gltf) => {
        if (!st.modelGroup) return;
        // Dispose old geometry/materials
        while (st.modelGroup.children.length > 0) {
          const child = st.modelGroup.children[0];
          st.modelGroup.remove(child);
          child.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const mesh = o as THREE.Mesh;
              mesh.geometry?.dispose();
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material?.dispose();
              }
            }
          });
        }
        st.basePositions.clear();
        st.baseRotations.clear();

        const loadedRoot = gltf.scene;
        const names: string[] = [];
        const childrenCopy = [...loadedRoot.children];
        childrenCopy.forEach((node) => {
          st.modelGroup!.add(node);
          if (node.name) names.push(node.name);
          st.basePositions.set(node, node.position.clone());
          st.baseRotations.set(node, node.rotation.clone());
          node.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (mat) {
                mat.userData = { ...mat.userData, origEmissiveIntensity: mat.emissiveIntensity || 0 };
              }
            }
          });
        });
        setNodeList(names);
        setHiddenNodes({});

        // Apply initial explode if exploded_pump
        const factor = (activeModel === 'exploded_pump' ? 55 : explodePct) / 100;
        st.modelGroup.traverse((obj) => {
          const bp = st.basePositions.get(obj);
          const dir = obj.userData?.explodeDir as [number, number, number] | undefined;
          if (bp && dir) {
            obj.position.set(bp.x + dir[0] * factor, bp.y + dir[1] * factor, bp.z + dir[2] * factor);
          }
        });

        // Camera framing per model
        if (st.camera && st.controls) {
          if (activeModel === 'impeller_types') {
            st.camera.position.set(0, 2.2, 4.4);
            st.controls.target.set(0, 0.7, 0);
          } else if (activeModel === 'mechanical_seal') {
            st.camera.position.set(1.6, 1.5, 2.9);
            st.controls.target.set(0, 0.7, 0);
          } else if (activeModel === 'water_hammer') {
            st.camera.position.set(0.3, 2.1, 4.3);
            st.controls.target.set(0, 1.35, 0);
          } else {
            st.camera.position.set(3.5, 2.55, 5.0);
            st.controls.target.set(0, 1.05, 0);
          }
          st.controls.update();
        }
        st.requestRender();
      },
      () => {
        setFallback2D(true);
      },
    );
  }, [activeModel, fallback2D]);

  // Re-trigger render when playback resumes
  useEffect(() => {
    if (isPlaying && !lightMode3D) {
      sceneStateRef.current.requestRender();
    }
  }, [isPlaying, lightMode3D]);

  const activeMeta = useMemo(
    () => GLB_MODELS_META.find((m) => m.id === activeModel) ?? GLB_MODELS_META[0],
    [activeModel],
  );

  const handleResetView = () => {
    const st = sceneStateRef.current;
    if (st.camera && st.controls) {
      st.camera.position.set(3.5, 2.55, 5.0);
      st.controls.target.set(0, 1.05, 0);
      st.controls.update();
      st.requestRender();
    }
  };

  const handleDownloadGlb = () => {
    const bytes = buildGlbBuffer(activeModel);
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeModel}.glb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleFullscreen = () => {
    if (!stageRef.current) return;
    if (!document.fullscreenElement) {
      stageRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Model Selector Strip (Horizontal scroll on mobile so 3D canvas stays visible above fold) */}
      <div className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {GLB_MODELS_META.map((m) => {
            const active = m.id === activeModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveModel(m.id);
                  setExplodePct(m.id === 'exploded_pump' ? 55 : 0);
                  setSelectedPart(null);
                  setSelectedRawName(null);
                }}
                className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m.arTitle}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setFallback2D((v) => !v)}
            className="whitespace-nowrap rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {fallback2D ? 'العودة لعرض 3D GLB' : 'عرض تخطيطي 2D'}
          </button>
          <button
            type="button"
            onClick={handleDownloadGlb}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-emerald-600/40 bg-emerald-600/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-600/20 dark:text-emerald-300"
            title="تنزيل ملف GLB ثنائي مضمّن"
          >
            <Download className="h-3.5 w-3.5" />
            <span>تحميل GLB</span>
          </button>
        </div>
      </div>

      {/* Main Stage (Responsive height + >= 75% uncluttered) */}
      <div
        ref={stageRef}
        className={`relative overflow-hidden rounded-xl border border-slate-300 bg-slate-950 dark:border-slate-800 ${
          compactMode ? 'h-[340px] sm:h-[380px]' : 'h-[390px] sm:h-[480px] md:h-[580px]'
        }`}
      >
        {fallback2D ? (
          <div className="h-full w-full overflow-auto bg-slate-900 p-3 sm:p-4">
            {webglError && (
              <div className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                {webglError}
              </div>
            )}
            <Pump2DSchematic
              selectedPartId={selectedPart?.id ?? null}
              onSelectPart={(p) => setSelectedPart(p)}
            />
          </div>
        ) : (
          <div ref={canvasHostRef} className="h-full w-full cursor-grab active:cursor-grabbing" />
        )}

        {/* Minimal Top-Right HUD (Model title only — collision-safe width on phones) */}
        <div className="pointer-events-none absolute top-3 right-3 max-w-[calc(100%-8.25rem)] rounded-lg border border-slate-700/80 bg-slate-950/90 px-2.5 py-1.5 text-right sm:max-w-sm sm:px-3 sm:py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-300 sm:text-xs">
            <Box className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{activeMeta.arTitle}</span>
          </div>
          <div className="font-en truncate text-[10px] text-slate-400 sm:text-[11px]">{activeMeta.enTitle}</div>
        </div>

        {/* Minimal Top-Left Quick Action Icons */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {!fallback2D && (
            <>
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? 'إيقاف الحركة' : 'تشغيل الحركة'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800"
                title={isPlaying ? 'إيقاف الحركة' : 'تشغيل الحركة'}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={handleResetView}
                aria-label="إعادة ضبط الكاميرا"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800"
                title="إعادة ضبط الزاوية"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label="ملء الشاشة"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>

        {/* Selected Part Slide-In Inspector Card (Bottom drawer on mobile, left card on desktop) */}
        {(selectedPart || selectedRawName) && (
          <div className="absolute right-3 bottom-14 left-3 z-20 max-h-[55%] overflow-y-auto rounded-lg border border-sky-500/50 bg-slate-900/95 p-3 text-right shadow-xl sm:top-14 sm:right-auto sm:bottom-auto sm:left-3 sm:max-h-[68%] sm:w-72">
            <div className="mb-2 flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <div className="text-sm font-bold text-white">
                  {selectedPart ? selectedPart.arName : selectedRawName}
                </div>
                <div className="font-en text-[11px] text-sky-400">
                  {selectedPart ? selectedPart.enName : '3D CAD Assembly Component'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPart(null);
                  setSelectedRawName(null);
                }}
                aria-label="إغلاق بطاقة المكون"
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedPart ? (
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <span className="font-semibold text-sky-300">الوظيفة: </span>
                  {selectedPart.functionDesc}
                </p>
                <p>
                  <span className="font-semibold text-emerald-300">آلية العمل: </span>
                  {selectedPart.howItWorks}
                </p>
                <div>
                  <span className="font-semibold text-amber-300">علامات الخلل الشائعة:</span>
                  <ul className="mt-1 list-disc space-y-0.5 pr-4 text-[11px] text-slate-300">
                    {selectedPart.failureSymptoms.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                {onJumpToLesson && selectedPart.relatedLessonIds.length > 0 && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onJumpToLesson(selectedPart.relatedLessonIds[0])}
                      className="w-full rounded-md bg-sky-600 px-2.5 py-1.5 text-center text-xs font-semibold text-white hover:bg-sky-500"
                    >
                      افتح الدرس المرتبط (درس {selectedPart.relatedLessonIds[0]})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-300">{activeMeta.desc}</p>
            )}
          </div>
        )}

        {/* Collapsible Bottom Control Dock (Collapsed by default for unobstructed 3D viewport) */}
        <div className="absolute right-3 bottom-3 left-3 z-10">
          <div className="rounded-lg border border-slate-700/80 bg-slate-950/90 text-slate-200">
            <button
              type="button"
              onClick={() => setDockOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-sky-400" />
                <span className="truncate">أدوات التفكيك وإخفاء المكونات والتحكم بالمشهد</span>
              </span>
              {dockOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            {dockOpen && (
              <div className="space-y-3 border-t border-slate-800 p-3 text-xs">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {(activeModel === 'complete_pump' ||
                    activeModel === 'exploded_pump' ||
                    activeModel === 'mechanical_seal') && (
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span>مستوى التفكيك (Exploded View)</span>
                        <span className="font-mono-num text-sky-300">{explodePct}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={explodePct}
                        onChange={(e) => setExplodePct(Number(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  )}

                  {activeModel === 'alignment_model' && (
                    <div className="md:col-span-2">
                      <div className="mb-1 font-semibold text-sky-300">حالة المحاذاة المعروضة:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ['perfect', 'محاذاة مثالية'],
                            ['angular', 'انحراف زاوي Angular'],
                            ['parallel', 'انحراف موازي Parallel'],
                            ['combined', 'انحراف مركب Combined'],
                          ] as const
                        ).map(([k, lbl]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setAlignmentMode(k)}
                            className={`whitespace-nowrap rounded px-2.5 py-1 text-xs ${
                              alignmentMode === k
                                ? 'bg-sky-600 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeModel === 'water_hammer' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setHammerTriggerAt(Date.now())}
                        className="w-full rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-500"
                      >
                        إطلاق موجة إغلاق مفاجئ للصمام
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={lightMode3D}
                        onChange={(e) => setLightMode3D(e.target.checked)}
                        className="accent-sky-500"
                      />
                      <span>وضع 3D خفيف (توفير البطارية والأداء)</span>
                    </label>
                  </div>
                </div>

                {/* Hide / Show Individual Parts */}
                {nodeList.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold text-slate-400">
                      إظهار / إخفاء مكونات النموذج (اضغط على جزء في النموذج لعرض بطاقته):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {nodeList.map((name) => {
                        const isHidden = Boolean(hiddenNodes[name]);
                        const catalogPart = PUMP_PARTS_CATALOG.find((p) => p.nodeName === name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() =>
                              setHiddenNodes((prev) => ({
                                ...prev,
                                [name]: !prev[name],
                              }))
                            }
                            className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-1 text-[11px] ${
                              isHidden
                                ? 'border-slate-700 bg-slate-900 text-slate-500 line-through'
                                : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-sky-500'
                            }`}
                          >
                            {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3 text-sky-400" />}
                            <span>{catalogPart ? catalogPart.arName : name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Model Engineering Caption */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
        <span>{activeMeta.desc}</span>
        <span className="font-en text-[11px] text-slate-500">
          Embedded Binary glTF 2.0 (.glb) · Touch Orbit / Pinch Zoom / Tap Part to Inspect
        </span>
      </div>
    </div>
  );
};
