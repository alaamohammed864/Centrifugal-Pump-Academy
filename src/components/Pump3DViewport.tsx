import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Box,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { GlbModelId, PumpPartInfo } from '../types/academy';
import type { SimulatorPumpType } from '../engine/pumpPhysics';
import { GLB_MODELS_META, getGlbModelUrl, type GlbCategory } from '../engine/glbCatalog';
import { PUMP_PARTS_CATALOG } from '../data/lessons';
import { Pump2DSchematic } from './Pump2DSchematic';

const NODE_AR_LABELS: Record<string, string> = {
  Baseplate: 'القاعدة المعدنية المشتركة (Baseplate)',
  PumpVolute: 'الغلاف الحلزوني (Volute)',
  VoluteCasing: 'الغلاف الحلزوني (Volute Casing)',
  SuctionNozzle: 'فوهة السحب (Suction Nozzle)',
  SuctionPipe: 'أنبوب السحب (Suction Pipe)',
  DischargeNozzle: 'فوهة الدفع (Discharge Nozzle)',
  DischargePipe: 'أنبوب الدفع (Discharge Pipe)',
  Impeller: 'الدفاعة (Impeller)',
  PumpShaft: 'عمود الإدارة (Shaft)',
  Coupling: 'قارنة الربط (Coupling)',
  BearingHousing: 'بيت المحامل (Bearing Housing)',
  MechanicalSeal: 'السداد الميكانيكي (Mechanical Seal)',
  MotorUnit: 'المحرك الكهربائي (Motor)',
  ElectricMotor: 'المحرك الكهربائي (Motor)',
  CrankcaseFrame: 'علبة المرفق (Crankcase)',
  Crankshaft: 'عمود المرفق (Crankshaft)',
  FluidCylinder: 'أسطوانة الضخ (Fluid Cylinder)',
  DriveGear: 'الترس القائد (Drive Gear)',
  DrivenGear: 'الترس المنقاد (Driven Gear)',
  GearCasing: 'غلاف مضخة التروس',
  GearCasingCutaway: 'غلاف مضخة التروس المقطوع',
  HelicalScrewA: 'اللولب القائد (Drive Screw)',
  HelicalScrewB: 'اللولب المنقاد (Driven Screw)',
  ScrewCasing: 'غلاف المضخة اللولبية',
  ScrewBarrelCutaway: 'غلاف المضخة اللولبية المقطوع',
  TimingGearBox: 'صندوق تروس التزامن (Timing Gear)',
  RotaryLobeA: 'الفص الدوار الأول (Lobe A)',
  RotaryLobeB: 'الفص الدوار الثاني (Lobe B)',
  LobeCasing: 'غلاف المضخة الفصية',
  LobeChamberCutaway: 'غرفة المضخة الفصية المقطوعة',
  VaneCamRing: 'حلقة الكامة (Vane Cam Ring)',
  SlidingVaneCasing: 'غلاف المضخة الريشية',
  VerticalBasePlinth: 'قاعدة المضخة الرأسية',
  VerticalOuterSleeve: 'الغلاف الخارجي للمضخة الرأسية',
  VerticalPumpColumn: 'عمود التوجيه الرأسي (Column)',
  VerticalShaft: 'عمود الإدارة الرأسي',
  VerticalCoupling: 'القارنة الرأسية',
  AxialCasingShroud: 'غلاف الجريان المحوري',
  AxialTubularCasing: 'الغلاف الأنبوبي المحوري',
  MixedConicalCasing: 'الغلاف المخروطي للجريان المزدوج',
  MixedFlowCasing: 'غلاف الجريان المزدوج',
  ComparisonBase: 'قاعدة المقارنة الهندسية',
  InnerRotorCartridge: 'حزمة الدوار الداخلية (Cartridge)',
  BarrelOuterCasing: 'الغلاف البرميلي الخارجي (Barrel)',
  BarrelEndCover: 'غطاء نهاية البرميل (End Cover)',
  BarrelBoltedCover: 'الغطاء المثبت بالبراغي',
  MultistageEndHeads: 'أغطية السحب والدفع متعددة المراحل',
  MultistageSuctionCover: 'غطاء السحب الأمامي',
  MultistageDischargeCover: 'غطاء الدفع الخلفي',
  DoubleSuctionVolute: 'الغلاف الحلزوني مزدوج السحب',
};

// In-memory ArrayBuffer cache for downloaded CDN GLB models (no Base64)
const glbBufferCache = new Map<GlbModelId, ArrayBuffer>();

interface Pump3DViewportProps {
  initialModelId?: GlbModelId;
  onJumpToLesson?: (lessonId: number) => void;
  onOpenInSimulator?: (pumpType: SimulatorPumpType) => void;
  compactMode?: boolean;
}

export const Pump3DViewport: React.FC<Pump3DViewportProps> = ({
  initialModelId = 'complete_pump',
  onJumpToLesson,
  onOpenInSimulator,
  compactMode = false,
}) => {
  const [activeModel, setActiveModel] = useState<GlbModelId>(initialModelId);
  const [categoryFilter, setCategoryFilter] = useState<GlbCategory>('all');
  const [explodePct, setExplodePct] = useState<number>(initialModelId === 'exploded_pump' ? 55 : 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [lightMode3D, setLightMode3D] = useState<boolean>(false);
  const [fallback2D, setFallback2D] = useState<boolean>(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState<number>(0);
  const [hasGlbAnimations, setHasGlbAnimations] = useState<boolean>(false);
  const [dockOpen, setDockOpen] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<PumpPartInfo | null>(null);
  const [selectedRawName, setSelectedRawName] = useState<string | null>(null);
  const [hiddenNodes, setHiddenNodes] = useState<Record<string, boolean>>({});
  const [nodeList, setNodeList] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [alignmentMode, setAlignmentMode] = useState<'auto' | 'perfect' | 'angular' | 'parallel' | 'combined'>('auto');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveModel(initialModelId);
    setExplodePct(initialModelId === 'exploded_pump' ? 55 : 0);
    setAlignmentMode('auto');
    setSelectedPart(null);
    setSelectedRawName(null);
    setModelLoadError(null);
  }, [initialModelId]);

  const sceneStateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    controls?: OrbitControls;
    modelGroup?: THREE.Group;
    loadedRoot?: THREE.Object3D | null;
    mixer?: THREE.AnimationMixer | null;
    operateActions: THREE.AnimationAction[];
    hasGlbAnimation: boolean;
    isSoftwareGl: boolean;
    requestRender: () => void;
    activeModel: GlbModelId;
    explodePct: number;
    isPlaying: boolean;
    lightMode3D: boolean;
    hiddenNodes: Record<string, boolean>;
    alignmentMode: 'auto' | 'perfect' | 'angular' | 'parallel' | 'combined';
    explodeWrappers: {
      wrapper: THREE.Group;
      node: THREE.Object3D;
      explodeDir?: [number, number, number];
    }[];
    homeCamPos: THREE.Vector3;
    homeTarget: THREE.Vector3;
  }>({
    operateActions: [],
    hasGlbAnimation: false,
    isSoftwareGl: false,
    requestRender: () => {},
    activeModel,
    explodePct,
    isPlaying,
    lightMode3D,
    hiddenNodes,
    alignmentMode,
    explodeWrappers: [],
    homeCamPos: new THREE.Vector3(3.5, 2.55, 5.0),
    homeTarget: new THREE.Vector3(0, 1.05, 0),
  });

  sceneStateRef.current.activeModel = activeModel;
  sceneStateRef.current.explodePct = explodePct;
  sceneStateRef.current.isPlaying = isPlaying;
  sceneStateRef.current.lightMode3D = lightMode3D;
  sceneStateRef.current.hiddenNodes = hiddenNodes;
  sceneStateRef.current.alignmentMode = alignmentMode;

  // Apply explode offsets, node visibility, and alignment pose overrides cleanly via outer wrappers
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st.modelGroup) return;
    const factor = st.explodePct / 100;

    for (const item of st.explodeWrappers) {
      if (item.node.name && item.node.name in st.hiddenNodes) {
        item.node.visible = !st.hiddenNodes[item.node.name];
      }
      if (item.explodeDir) {
        item.wrapper.position.set(
          item.explodeDir[0] * factor,
          item.explodeDir[1] * factor,
          item.explodeDir[2] * factor,
        );
      } else {
        item.wrapper.position.set(0, 0, 0);
      }

      if (st.activeModel === 'alignment_model' && item.node.name === 'MotorMovableUnit') {
        if (st.alignmentMode === 'auto') {
          item.wrapper.rotation.set(0, 0, 0);
        } else if (st.alignmentMode === 'perfect') {
          item.wrapper.position.set(0, 0, 0);
          item.wrapper.rotation.set(0, 0, 0);
        } else if (st.alignmentMode === 'parallel') {
          item.wrapper.position.set(0, 0.16, 0.12);
          item.wrapper.rotation.set(0, 0, 0);
        } else if (st.alignmentMode === 'angular') {
          item.wrapper.position.set(0, 0, 0);
          item.wrapper.rotation.set(0, 0.12, -0.1);
        } else {
          item.wrapper.position.set(0, 0.12, -0.1);
          item.wrapper.rotation.set(0, -0.1, 0.09);
        }
      }
    }

    st.requestRender();
  }, [explodePct, hiddenNodes, alignmentMode, activeModel]);

  // Mount Three.js renderer once
  useEffect(() => {
    if (fallback2D) return;
    const host = canvasHostRef.current;
    if (!host) return;

    let disposed = false;
    let rafId = 0;
    let timeoutId = 0;
    let renderer: THREE.WebGLRenderer;

    try {
      const testCanvas = document.createElement('canvas');
      const glProbe = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
      if (!glProbe) {
        setWebglError('تعذر تفعيل WebGL على هذا المتصفح — تم تفعيل المخطط التفاعلي ثنائي الأبعاد.');
        setFallback2D(true);
        return;
      }
      let gpuName = '';
      try {
        const dbg = glProbe.getExtension('WEBGL_debug_renderer_info');
        const param = dbg ? dbg.UNMASKED_RENDERER_WEBGL : glProbe.RENDERER;
        gpuName = String(glProbe.getParameter(param) || '');
      } catch {
        // ignore probe failures
      }
      glProbe.getExtension('WEBGL_lose_context')?.loseContext();
      const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuName);

      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
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
        0.05,
        200,
      );
      camera.position.set(3.5, 2.55, 5.0);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = !isSoftwareGl;
      controls.dampingFactor = 0.08;
      controls.enableZoom = true;
      controls.enableRotate = true;
      controls.enablePan = true;
      controls.minDistance = 0.4;
      controls.maxDistance = 30;
      controls.target.set(0, 1.05, 0);

      // 3-point balanced studio lighting
      const hemi = new THREE.HemisphereLight('#cbd5e1', '#0f172a', 0.5);
      scene.add(hemi);
      const keyLight = new THREE.DirectionalLight('#fff7ed', 0.95);
      keyLight.position.set(4, 6, 4);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight('#38bdf8', 0.38);
      rimLight.position.set(-4, 3, -3);
      scene.add(rimLight);

      const grid = new THREE.GridHelper(12, 24, '#334155', '#1e293b');
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
      st.isSoftwareGl = isSoftwareGl;

      let renderBusy = false;
      let renderDirty = false;
      let lastAnimTime = performance.now();

      const afterDraw = (cb: () => void) => {
        if (disposed) return;
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (typeof gl.fenceSync === 'function') {
          const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          gl.flush();
          const poll = () => {
            if (disposed) {
              if (sync) gl.deleteSync(sync);
              return;
            }
            const status = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
            if (status === gl.UNSIGNALED) {
              timeoutId = window.setTimeout(poll, 5);
            } else {
              if (sync) gl.deleteSync(sync);
              timeoutId = window.setTimeout(cb, 80);
            }
          };
          timeoutId = window.setTimeout(poll, 5);
        } else {
          timeoutId = window.setTimeout(cb, 80);
        }
      };

      const drawFrame = () => {
        if (disposed) return;
        renderDirty = false;

        const now = performance.now();
        const delta = Math.min(Math.max((now - lastAnimTime) * 0.001, 0), 0.1);
        lastAnimTime = now;

        controls.update();

        // Advance ONLY authentic embedded GLB AnimationMixer clips in Operate mode
        let needsNext = false;
        const shouldAnimateAlignment =
          st.activeModel !== 'alignment_model' || st.alignmentMode === 'auto';

        if (
          st.isPlaying &&
          !st.lightMode3D &&
          st.mixer &&
          st.hasGlbAnimation &&
          shouldAnimateAlignment
        ) {
          st.mixer.update(delta);
          needsNext = true;
        }

        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (disposed) return;
          if (needsNext || renderDirty) {
            st.requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      };

      st.requestRender = () => {
        if (disposed) return;
        if (renderBusy) {
          renderDirty = true;
          return;
        }
        renderBusy = true;
        rafId = requestAnimationFrame(drawFrame);
      };

      controls.addEventListener('change', st.requestRender);

      // Raycasting on pointer tap/click (ignoring orbit drags)
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
          // Walk up to find a named GLB part node
          let curr: THREE.Object3D | null = hits[0].object;
          let namedCandidate: THREE.Object3D | null = null;
          while (curr && curr !== st.modelGroup) {
            if (curr.name) {
              namedCandidate = curr;
              if (
                curr.userData?.partId ||
                PUMP_PARTS_CATALOG.some((p) => p.nodeName === curr!.name)
              ) {
                break;
              }
            }
            curr = curr.parent;
          }
          const targetObj = namedCandidate || hits[0].object;
          const hitName = targetObj.name;
          setSelectedRawName(hitName || 'Component');
          const found =
            PUMP_PARTS_CATALOG.find(
              (p) => p.nodeName === hitName || p.id === targetObj.userData?.partId,
            ) ?? null;
          setSelectedPart(found);

          // Highlight tapped part cleanly
          st.modelGroup.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) {
              const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
              if (m && m.emissive) {
                let belongs = false;
                let walker: THREE.Object3D | null = o;
                while (walker && walker !== st.modelGroup) {
                  if (walker === targetObj) {
                    belongs = true;
                    break;
                  }
                  walker = walker.parent;
                }
                if (belongs) {
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
        clearTimeout(timeoutId);
        ro.disconnect();
        controls.removeEventListener('change', st.requestRender);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        if (st.mixer) {
          st.mixer.stopAllAction();
          if (st.loadedRoot) st.mixer.uncacheRoot(st.loadedRoot);
          st.mixer = null;
        }
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

  // Load real GLB directly from GitHub jsdelivr CDN whenever activeModel changes
  useEffect(() => {
    if (fallback2D) return;
    const st = sceneStateRef.current;
    if (!st.modelGroup) return;

    const controller = new AbortController();
    let cancelled = false;

    const disposeCurrentModel = () => {
      if (st.mixer) {
        st.mixer.stopAllAction();
        if (st.loadedRoot) st.mixer.uncacheRoot(st.loadedRoot);
        st.mixer = null;
      }
      st.operateActions = [];
      st.hasGlbAnimation = false;
      st.loadedRoot = null;
      st.explodeWrappers = [];

      while (st.modelGroup && st.modelGroup.children.length > 0) {
        const child = st.modelGroup.children[0];
        st.modelGroup.remove(child);
        child.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            const mesh = o as THREE.Mesh;
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of mats) {
              if (!mat) continue;
              const std = mat as THREE.MeshStandardMaterial;
              std.map?.dispose();
              std.normalMap?.dispose();
              std.roughnessMap?.dispose();
              std.metalnessMap?.dispose();
              mat.dispose();
            }
          }
        });
      }
    };

    const loadRealGlb = async () => {
      setIsLoadingModel(true);
      setModelLoadError(null);
      setHasGlbAnimations(false);
      disposeCurrentModel();
      st.requestRender();

      try {
        const url = getGlbModelUrl(activeModel);
        let buffer = glbBufferCache.get(activeModel);
        if (!buffer) {
          const response = await fetch(url, { signal: controller.signal });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status} أثناء تحميل ${activeModel}.glb`);
          }
          buffer = await response.arrayBuffer();
          glbBufferCache.set(activeModel, buffer);
        }

        if (cancelled) return;

        const loader = new GLTFLoader();
        loader.parse(
          buffer.slice(0),
          '',
          (gltf) => {
            if (cancelled || !st.modelGroup) return;

            const loadedRoot = gltf.scene;
            const names: string[] = [];
            const wrappers: typeof st.explodeWrappers = [];

            // Wrap each top-level child node so explodeDir offsets layer cleanly without overwriting AnimationMixer translations
            const directChildren = [...loadedRoot.children];
            for (const node of directChildren) {
              const wrapper = new THREE.Group();
              loadedRoot.remove(node);
              wrapper.add(node);
              loadedRoot.add(wrapper);

              if (node.name) names.push(node.name);
              const dir = Array.isArray(node.userData?.explodeDir)
                ? (node.userData.explodeDir as [number, number, number])
                : undefined;
              wrappers.push({ wrapper, node, explodeDir: dir });

              node.traverse((o) => {
                if ((o as THREE.Mesh).isMesh) {
                  const mat = (o as THREE.Mesh).material as THREE.MeshStandardMaterial;
                  if (mat) {
                    mat.userData = {
                      ...mat.userData,
                      origEmissiveIntensity: mat.emissiveIntensity || 0,
                    };
                  }
                }
              });
            }

            st.modelGroup.add(loadedRoot);
            st.loadedRoot = loadedRoot;
            st.explodeWrappers = wrappers;

            setNodeList(names);
            setHiddenNodes({});

            // Apply initial explode slider state (e.g. exploded_pump defaults to 55%)
            const initFactor = (activeModel === 'exploded_pump' ? 55 : explodePct) / 100;
            for (const item of wrappers) {
              if (item.explodeDir) {
                item.wrapper.position.set(
                  item.explodeDir[0] * initFactor,
                  item.explodeDir[1] * initFactor,
                  item.explodeDir[2] * initFactor,
                );
              }
            }

            // Setup THREE.AnimationMixer strictly from embedded GLB clips (no fake motion if absent)
            const clips = gltf.animations || [];
            if (clips.length > 0) {
              const mixer = new THREE.AnimationMixer(loadedRoot);
              const operateClip = THREE.AnimationClip.findByName(clips, 'Operate');
              const clipsToPlay = operateClip ? [operateClip] : clips;
              const actions: THREE.AnimationAction[] = [];

              for (const clip of clipsToPlay) {
                const action = mixer.clipAction(clip);
                action.loop = THREE.LoopRepeat;
                action.play();
                actions.push(action);
              }

              st.mixer = mixer;
              st.operateActions = actions;
              st.hasGlbAnimation = true;
              setHasGlbAnimations(true);
            } else {
              st.mixer = null;
              st.operateActions = [];
              st.hasGlbAnimation = false;
              setHasGlbAnimations(false);
            }

            // Auto-frame camera cleanly via bounding box
            const box = new THREE.Box3().setFromObject(loadedRoot);
            if (!box.isEmpty() && st.camera && st.controls) {
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z, 1.0);
              const fovRad = THREE.MathUtils.degToRad(st.camera.fov);
              const fitDist = (maxDim / (2 * Math.tan(fovRad / 2))) * 1.48;

              let dirVec = new THREE.Vector3(0.62, 0.36, 0.72).normalize();
              if (activeModel === 'impeller_types') {
                dirVec = new THREE.Vector3(0, 0.32, 0.95).normalize();
              } else if (activeModel === 'water_hammer') {
                dirVec = new THREE.Vector3(0.12, 0.3, 0.94).normalize();
              }

              const camPos = center.clone().addScaledVector(dirVec, fitDist);
              st.homeCamPos.copy(camPos);
              st.homeTarget.copy(center);

              st.camera.position.copy(camPos);
              st.controls.target.copy(center);
              st.controls.minDistance = Math.max(0.35, maxDim * 0.28);
              st.controls.maxDistance = Math.max(12, maxDim * 5.5);
              st.controls.update();
            }

            setIsLoadingModel(false);
            st.requestRender();
          },
          (parseError) => {
            if (cancelled) return;
            setIsLoadingModel(false);
            setModelLoadError(
              parseError instanceof Error
                ? `تعذر قراءة ملف GLB: ${parseError.message}`
                : 'تعذر تحليل ملف GLB ثلاثي الأبعاد.',
            );
          },
        );
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        setIsLoadingModel(false);
        setModelLoadError(
          err instanceof Error
            ? `تعذر تحميل النموذج من CDN (${err.message}). تحقق من الاتصال بالإنترنت أو أعد المحاولة.`
            : 'تعذر تحميل النموذج ثلاثي الأبعاد من CDN.',
        );
      }
    };

    loadRealGlb();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeModel, fallback2D, retryNonce]);

  // Re-trigger render loop when Operate playback or alignment mode changes
  useEffect(() => {
    const st = sceneStateRef.current;
    if (st.isPlaying && !st.lightMode3D && st.hasGlbAnimation) {
      st.requestRender();
    } else {
      st.requestRender();
    }
  }, [isPlaying, lightMode3D, alignmentMode]);

  const activeMeta = useMemo(
    () => GLB_MODELS_META.find((m) => m.id === activeModel) ?? GLB_MODELS_META[0],
    [activeModel],
  );

  const visibleModels = useMemo(
    () => (categoryFilter === 'all' ? GLB_MODELS_META : GLB_MODELS_META.filter((m) => m.category === categoryFilter)),
    [categoryFilter],
  );

  const handleResetView = () => {
    const st = sceneStateRef.current;
    if (st.camera && st.controls) {
      st.camera.position.copy(st.homeCamPos);
      st.controls.target.copy(st.homeTarget);
      st.controls.update();
      st.requestRender();
    }
  };

  const handleReplayWaterHammer = () => {
    const st = sceneStateRef.current;
    setIsPlaying(true);
    if (st.mixer && st.operateActions.length > 0) {
      for (const action of st.operateActions) {
        action.reset().play();
      }
      st.mixer.update(0);
      st.requestRender();
    }
  };

  const handleDownloadGlb = async () => {
    const url = getGlbModelUrl(activeModel);
    setIsDownloading(true);
    try {
      let buffer = glbBufferCache.get(activeModel);
      if (!buffer) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buffer = await res.arrayBuffer();
        glbBufferCache.set(activeModel, buffer);
      }
      const blob = new Blob([buffer], { type: 'model/gltf-binary' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${activeModel}.glb`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeModel}.glb`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } finally {
      setIsDownloading(false);
    }
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

  const canExplode = useMemo(() => {
    return (
      activeModel !== 'impeller_types' &&
      activeModel !== 'cavitation_model' &&
      activeModel !== 'water_hammer' &&
      activeModel !== 'alignment_model'
    );
  }, [activeModel]);

  return (
    <div className="flex flex-col gap-3">
      {/* Category Filter + Model Selector Strip */}
      <div className="flex flex-col gap-2 rounded-lg border border-slate-300 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
          <div className="flex flex-nowrap items-center gap-1 overflow-x-auto sm:flex-wrap sm:overflow-visible">
            {(
              [
                ['all', `الكل (${GLB_MODELS_META.length})`],
                ['centrifugal', 'أنواع الطرد المركزي (6)'],
                ['pd', 'مضخات الإزاحة الموجبة (4)'],
                ['components', 'المكونات والظواهر (7)'],
              ] as const
            ).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-white dark:bg-sky-500/20 dark:text-sky-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {onOpenInSimulator && activeMeta.relatedSimulatorType && (
              <button
                type="button"
                onClick={() => onOpenInSimulator(activeMeta.relatedSimulatorType!)}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
              >
                <Activity className="h-3.5 w-3.5" />
                <span>تشغيل في المحاكي</span>
              </button>
            )}
            {onJumpToLesson && (
              <button
                type="button"
                onClick={() => onJumpToLesson(activeMeta.relatedLessonId)}
                className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <BookOpen className="h-3.5 w-3.5 text-sky-500" />
                <span>الدرس {activeMeta.relatedLessonId}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setFallback2D((v) => !v)}
              className="whitespace-nowrap rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {fallback2D ? 'العودة لعرض 3D GLB' : 'عرض تخطيطي 2D'}
            </button>
            <button
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadGlb}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-emerald-600/40 bg-emerald-600/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-600/20 disabled:opacity-50 dark:text-emerald-300"
              title="تنزيل ملف GLB الحقيقي من CDN"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isDownloading ? 'جاري التحميل...' : 'تحميل GLB'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {visibleModels.map((m) => {
            const active = m.id === activeModel;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setActiveModel(m.id);
                  setExplodePct(m.id === 'exploded_pump' ? 55 : 0);
                  setAlignmentMode('auto');
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
      </div>

      {/* Main Stage */}
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

        {/* Loading Overlay (never blank while fetching CDN GLB) */}
        {!fallback2D && isLoadingModel && !modelLoadError && (
          <div
            data-testid="glb-loading-overlay"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950/85 p-4 text-center text-slate-200"
          >
            <Loader2 className="h-7 w-7 animate-spin text-sky-400" />
            <div className="text-xs font-bold text-white">جاري تحميل النموذج ثلاثي الأبعاد: {activeMeta.arTitle}</div>
            <div className="font-en text-[11px] text-slate-400">{getGlbModelUrl(activeModel)}</div>
          </div>
        )}

        {/* Error Recovery Overlay (never blank on CDN error) */}
        {!fallback2D && modelLoadError && (
          <div
            data-testid="glb-error-overlay"
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-5 text-center"
          >
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <div className="max-w-md space-y-1">
              <div className="text-sm font-bold text-white">تعذر تحميل النموذج ثلاثي الأبعاد</div>
              <p className="text-xs text-slate-300">{modelLoadError}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setRetryNonce((n) => n + 1)}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>إعادة محاولة التحميل</span>
              </button>
              <button
                type="button"
                onClick={() => setFallback2D(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
              >
                <span>فتح المخطط التفاعلي 2D</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimal Top-Right HUD */}
        <div className="pointer-events-none absolute top-3 right-3 max-w-[calc(100%-9.5rem)] rounded-lg border border-slate-700/80 bg-slate-950/90 px-2.5 py-1.5 text-right sm:max-w-sm sm:px-3 sm:py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-300 sm:text-xs">
            <Box className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{activeMeta.arTitle}</span>
          </div>
          <div className="font-en truncate text-[10px] text-slate-400 sm:text-[11px]">{activeMeta.enTitle}</div>
        </div>

        {/* Minimal Top-Left Quick Action Icons (Operate Play/Pause, Reset, Fullscreen) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {!fallback2D && (
            <>
              <button
                type="button"
                disabled={!hasGlbAnimations}
                onClick={() => {
                  if (activeModel === 'alignment_model' && !isPlaying) {
                    setAlignmentMode('auto');
                  }
                  setIsPlaying((p) => !p);
                }}
                aria-label={isPlaying ? 'إيقاف وضع التشغيل Operate' : 'تشغيل وضع التشغيل Operate'}
                className={`inline-flex h-8 items-center justify-center gap-1 rounded-md border px-2 text-[11px] font-bold disabled:opacity-40 ${
                  isPlaying && hasGlbAnimations
                    ? 'border-emerald-500/50 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                    : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800'
                }`}
                title={hasGlbAnimations ? 'تشغيل/إيقاف حركة Operate المدمجة' : 'هذا النموذج لا يحتوي على Animation'}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{hasGlbAnimations ? (isPlaying ? 'Operate' : 'متوقف') : 'ساكن'}</span>
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

        {/* Selected Part Slide-In Inspector Card */}
        {(selectedPart || selectedRawName) && (
          <div className="absolute right-3 bottom-14 left-3 z-20 max-h-[55%] overflow-y-auto rounded-lg border border-sky-500/50 bg-slate-900/95 p-3 text-right shadow-xl sm:top-14 sm:right-auto sm:bottom-auto sm:left-3 sm:max-h-[68%] sm:w-72">
            <div className="mb-2 flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <div className="text-sm font-bold text-white">
                  {selectedPart
                    ? selectedPart.arName
                    : (selectedRawName ? (NODE_AR_LABELS[selectedRawName] ?? selectedRawName) : '')}
                </div>
                <div className="font-en text-[11px] text-sky-400">
                  {selectedPart ? selectedPart.enName : (selectedRawName ?? '3D CAD Assembly Component')}
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

        {/* Collapsible Bottom Control Dock */}
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
              <div className="max-h-[195px] space-y-3 overflow-y-auto border-t border-slate-800 p-3 text-xs sm:max-h-[250px]">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {canExplode && (
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
                      <div className="mb-1 font-semibold text-sky-300">وضع المحاذاة المعروض:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ['auto', 'حركة Operate الحية'],
                            ['perfect', 'محاذاة مثالية'],
                            ['angular', 'انحراف زاوي Angular'],
                            ['parallel', 'انحراف موازي Parallel'],
                            ['combined', 'انحراف مركب Combined'],
                          ] as const
                        ).map(([k, lbl]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              setAlignmentMode(k);
                              if (k === 'auto') {
                                setIsPlaying(true);
                              } else {
                                setIsPlaying(false);
                              }
                            }}
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
                        onClick={handleReplayWaterHammer}
                        className="w-full rounded-md bg-amber-600 px-3 py-1.5 font-semibold text-white hover:bg-amber-500"
                      >
                        إعادة إطلاق موجة المطرقة المائية (Operate)
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
                            <span>{catalogPart ? catalogPart.arName : (NODE_AR_LABELS[name] ?? name)}</span>
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
          {hasGlbAnimations ? 'Real GLB (AnimationMixer: Operate)' : 'Real GLB Static CAD'} · Orbit / Zoom / Pan / Tap Part
        </span>
      </div>
    </div>
  );
};
