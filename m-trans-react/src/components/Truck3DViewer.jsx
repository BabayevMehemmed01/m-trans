// =================================================================
// FAYL: src/components/Truck3DViewer.jsx
// TƏSVİR: Interaktiv 3D yük maşını — R3F + drei + three
//         Hissə klik → kamera zoom, highlight, OEM overlay
//
// İstifadə:
//   import Truck3DViewer from '../components/Truck3DViewer';
//   <Truck3DViewer />
//   <Truck3DViewer modelUrl="/models/truck.glb" height={560} />
//
// Qeyd: /public/models/truck.glb əlavə etdikdə modelUrl verin.
//       Fayl yoxdursa prosedural (box/cylinder) TIR maketi işləyir.
// =================================================================

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  CameraControls,
  ContactShadows,
  Grid,
  Html,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// ─── Kamera və hissə konfiqurasiyası ─────────────────────────────
const DEFAULT_EYE = [7.4, 3.9, 8.6];
const DEFAULT_TARGET = [0, 1.15, 0.2];

export const TRUCK_PARTS = {
  wheels: {
    id: 'wheels',
    nameKey: 'truck3d_part_wheels',
    descKey: 'truck3d_part_wheels_desc',
    oem: 'AL-22.5-10H',
    brand: 'Alcoa / Michelin',
    catalogCat: 'parts_category_suspension',
    eye: [4.6, 1.55, 5.4],
    target: [1.05, 0.48, 3.45],
    marker: [1.35, 1.15, 3.45],
  },
  engine: {
    id: 'engine',
    nameKey: 'truck3d_part_engine',
    descKey: 'truck3d_part_engine_desc',
    oem: 'D13K-460',
    brand: 'Volvo OEM',
    catalogCat: 'parts_category_engine',
    eye: [3.15, 2.15, 6.35],
    target: [0, 0.92, 4.15],
    marker: [0, 1.85, 4.35],
  },
  brakes: {
    id: 'brakes',
    nameKey: 'truck3d_part_brakes',
    descKey: 'truck3d_part_brakes_desc',
    oem: 'K020345',
    brand: 'Knorr-Bremse',
    catalogCat: 'parts_category_brakes',
    eye: [3.55, 1.15, 4.85],
    target: [1.08, 0.46, 3.45],
    marker: [1.45, 0.85, 3.15],
  },
  cabin: {
    id: 'cabin',
    nameKey: 'truck3d_part_cabin',
    descKey: 'truck3d_part_cabin_desc',
    oem: 'VL-CAB-FH4',
    brand: 'Volvo OEM',
    catalogCat: 'parts_category_body',
    eye: [5.6, 3.35, 6.9],
    target: [0, 1.85, 3.25],
    marker: [0, 3.35, 3.35],
  },
};

const PART_ORDER = ['cabin', 'engine', 'brakes', 'wheels'];

const COL = {
  body: '#1a2744',
  bodyHi: '#243656',
  metal: '#3a4558',
  steel: '#6b7788',
  tire: '#14181e',
  rim: '#9aa3b2',
  orange: '#FF6B1A',
  glass: '#6a9bb8',
  accent: '#E60000',
  highlight: '#ff3b3b',
};

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return mobile;
}

function partMaterial(selected, base, extras = {}) {
  return {
    color: selected ? COL.highlight : base,
    metalness: selected ? 0.55 : extras.metalness ?? 0.35,
    roughness: selected ? 0.28 : extras.roughness ?? 0.55,
    emissive: selected ? COL.accent : '#000000',
    emissiveIntensity: selected ? 0.45 : 0,
  };
}

function setCursor(on) {
  document.body.style.cursor = on ? 'pointer' : '';
}

// ─── Kamera idarəsi ──────────────────────────────────────────────
function FocusControls({ focusId, controlsRef }) {
  const { invalidate } = useThree();

  useEffect(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    ctrl.truckSpeed = 0;
    ctrl.smoothTime = 0.55;
    ctrl.draggingSmoothTime = 0.18;

    const part = focusId ? TRUCK_PARTS[focusId] : null;
    const [ex, ey, ez] = part ? part.eye : DEFAULT_EYE;
    const [tx, ty, tz] = part ? part.target : DEFAULT_TARGET;
    ctrl.setLookAt(ex, ey, ez, tx, ty, tz, true);
    invalidate();
  }, [focusId, controlsRef, invalidate]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={0.72}
      maxPolarAngle={1.38}
      minDistance={4.2}
      maxDistance={14.5}
      minAzimuthAngle={-Math.PI * 0.88}
      maxAzimuthAngle={Math.PI * 0.88}
    />
  );
}

// ─── Material + klik helper ──────────────────────────────────────
function ClickMesh({ partId, selectedId, onPartClick, children, ...props }) {
  const selected = selectedId === partId;
  return (
    <mesh
      castShadow
      receiveShadow
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        onPartClick(partId);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setCursor(true);
      }}
      onPointerOut={() => setCursor(false)}
    >
      {children}
      {selected && (
        <meshStandardMaterial
          attach="material"
          {...partMaterial(true, COL.body)}
        />
      )}
    </mesh>
  );
}

// ─── Təkər + əyləc ───────────────────────────────────────────────
function Wheel({
  position,
  selectedId,
  onPartClick,
  showBrake = true,
  scale = 1,
}) {
  const wheelOn = selectedId === 'wheels';
  const brakeOn = selectedId === 'brakes';

  return (
    <group position={position} scale={scale}>
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        onClick={(e) => {
          e.stopPropagation();
          onPartClick('wheels');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCursor(true);
        }}
        onPointerOut={() => setCursor(false)}
      >
        <cylinderGeometry args={[0.52, 0.52, 0.34, 22]} />
        <meshStandardMaterial {...partMaterial(wheelOn, COL.tire, { roughness: 0.82, metalness: 0.12 })} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.36, 16]} />
        <meshStandardMaterial {...partMaterial(wheelOn, COL.rim, { metalness: 0.82, roughness: 0.22 })} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 10]} />
        <meshStandardMaterial color={COL.orange} metalness={0.55} roughness={0.3} />
      </mesh>

      {showBrake && (
        <>
          <mesh
            rotation={[0, 0, Math.PI / 2]}
            position={[position[0] > 0 ? -0.2 : 0.2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onPartClick('brakes');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setCursor(true);
            }}
            onPointerOut={() => setCursor(false)}
          >
            <cylinderGeometry args={[0.34, 0.34, 0.055, 22]} />
            <meshStandardMaterial {...partMaterial(brakeOn, '#4a5568', { metalness: 0.9, roughness: 0.18 })} />
          </mesh>
          <mesh
            position={[position[0] > 0 ? -0.16 : 0.16, 0.2, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onPartClick('brakes');
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setCursor(true);
            }}
            onPointerOut={() => setCursor(false)}
          >
            <boxGeometry args={[0.14, 0.12, 0.2]} />
            <meshStandardMaterial {...partMaterial(brakeOn, '#2a3140', { metalness: 0.65, roughness: 0.35 })} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ─── Prosedural TIR maketi ───────────────────────────────────────
function ProceduralTruck({ selectedId, onPartClick }) {
  const cabinOn = selectedId === 'cabin';
  const engineOn = selectedId === 'engine';

  const wheelZ = useMemo(
    () => [
      { pos: [-1.05, 0.52, 3.5], brake: true },
      { pos: [1.05, 0.52, 3.5], brake: true },
      { pos: [-1.05, 0.52, 1.35], brake: true },
      { pos: [1.05, 0.52, 1.35], brake: true },
      { pos: [-1.05, 0.52, 0.42], brake: true },
      { pos: [1.05, 0.52, 0.42], brake: true },
      { pos: [-1.05, 0.52, -5.55], brake: false },
      { pos: [1.05, 0.52, -5.55], brake: false },
      { pos: [-1.05, 0.52, -6.5], brake: false },
      { pos: [1.05, 0.52, -6.5], brake: false },
    ],
    []
  );

  return (
    <group>
      {/* Şassi */}
      <mesh position={[0, 0.62, 2.15]} receiveShadow>
        <boxGeometry args={[0.95, 0.16, 5.4]} />
        <meshStandardMaterial color="#0a101c" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.62, -3.85]} receiveShadow>
        <boxGeometry args={[0.85, 0.14, 7.1]} />
        <meshStandardMaterial color="#0a101c" metalness={0.5} roughness={0.45} />
      </mesh>

      {/* Kabin */}
      <ClickMesh
        partId="cabin"
        selectedId={selectedId}
        onPartClick={onPartClick}
        position={[0, 1.28, 3.45]}
      >
        <boxGeometry args={[2.32, 1.12, 1.85]} />
        {!cabinOn && <meshStandardMaterial color={COL.body} metalness={0.38} roughness={0.48} />}
      </ClickMesh>
      <ClickMesh
        partId="cabin"
        selectedId={selectedId}
        onPartClick={onPartClick}
        position={[0, 2.28, 3.12]}
      >
        <boxGeometry args={[2.32, 1.08, 1.42]} />
        {!cabinOn && <meshStandardMaterial color={COL.bodyHi} metalness={0.4} roughness={0.46} />}
      </ClickMesh>

      {/* Ön şüşə */}
      <mesh
        position={[0, 2.12, 4.22]}
        rotation={[-0.38, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPartClick('cabin');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCursor(true);
        }}
        onPointerOut={() => setCursor(false)}
      >
        <boxGeometry args={[2.12, 0.92, 0.08]} />
        <meshStandardMaterial
          color={cabinOn ? COL.highlight : COL.glass}
          metalness={0.15}
          roughness={0.12}
          transparent
          opacity={0.55}
          emissive={cabinOn ? COL.accent : '#1a3344'}
          emissiveIntensity={cabinOn ? 0.35 : 0.15}
        />
      </mesh>

      {/* Bamper / ızgara */}
      <ClickMesh
        partId="cabin"
        selectedId={selectedId}
        onPartClick={onPartClick}
        position={[0, 0.58, 4.72]}
      >
        <boxGeometry args={[2.42, 0.36, 0.38]} />
        {!cabinOn && <meshStandardMaterial color="#121820" metalness={0.45} roughness={0.4} />}
      </ClickMesh>
      <mesh position={[0, 1.12, 4.48]}>
        <boxGeometry args={[1.55, 0.62, 0.1]} />
        <meshStandardMaterial color={cabinOn ? COL.highlight : COL.metal} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.82, 4.55]}>
        <boxGeometry args={[2.28, 0.06, 0.08]} />
        <meshStandardMaterial color={COL.orange} metalness={0.4} roughness={0.35} />
      </mesh>

      {/* Faralar */}
      <mesh position={[-0.88, 0.72, 4.88]}>
        <boxGeometry args={[0.38, 0.16, 0.1]} />
        <meshStandardMaterial color="#fff4c2" emissive="#fff3c4" emissiveIntensity={0.85} />
      </mesh>
      <mesh position={[0.88, 0.72, 4.88]}>
        <boxGeometry args={[0.38, 0.16, 0.1]} />
        <meshStandardMaterial color="#fff4c2" emissive="#fff3c4" emissiveIntensity={0.85} />
      </mesh>

      {/* Güzgülər */}
      <mesh position={[-1.32, 2.05, 4.05]}>
        <boxGeometry args={[0.08, 0.42, 0.22]} />
        <meshStandardMaterial color={COL.metal} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[1.32, 2.05, 4.05]}>
        <boxGeometry args={[0.08, 0.42, 0.22]} />
        <meshStandardMaterial color={COL.metal} metalness={0.7} roughness={0.25} />
      </mesh>

      {/* Yanacaq bakları */}
      <mesh position={[-1.18, 0.82, 2.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 1.35, 14]} />
        <meshStandardMaterial color={COL.steel} metalness={0.75} roughness={0.28} />
      </mesh>
      <mesh position={[1.18, 0.82, 2.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.28, 1.35, 14]} />
        <meshStandardMaterial color={COL.steel} metalness={0.75} roughness={0.28} />
      </mesh>

      {/* Egzoz */}
      <mesh position={[-1.08, 1.85, 2.45]}>
        <cylinderGeometry args={[0.09, 0.09, 2.15, 10]} />
        <meshStandardMaterial color={COL.metal} metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Mühərrik */}
      <ClickMesh
        partId="engine"
        selectedId={selectedId}
        onPartClick={onPartClick}
        position={[0, 0.9, 4.12]}
      >
        <boxGeometry args={[1.22, 0.78, 1.12]} />
        {!engineOn && <meshStandardMaterial color="#2c3340" metalness={0.62} roughness={0.38} />}
      </ClickMesh>
      <ClickMesh
        partId="engine"
        selectedId={selectedId}
        onPartClick={onPartClick}
        position={[0, 1.38, 4.05]}
      >
        <boxGeometry args={[0.72, 0.28, 0.7]} />
        {!engineOn && <meshStandardMaterial color="#3d4656" metalness={0.7} roughness={0.3} />}
      </ClickMesh>
      <mesh position={[0.55, 0.95, 4.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.22, 12]} />
        <meshStandardMaterial {...partMaterial(engineOn, COL.orange, { metalness: 0.5, roughness: 0.35 })} />
      </mesh>
      <mesh position={[-0.55, 0.95, 4.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.22, 12]} />
        <meshStandardMaterial {...partMaterial(engineOn, COL.orange, { metalness: 0.5, roughness: 0.35 })} />
      </mesh>

      {/* Treyler */}
      <mesh position={[0, 2.02, -3.95]} receiveShadow>
        <boxGeometry args={[2.5, 2.5, 7.15]} />
        <meshStandardMaterial color="#121c32" metalness={0.32} roughness={0.55} />
      </mesh>
      <mesh position={[0, 3.3, -3.95]}>
        <boxGeometry args={[2.52, 0.12, 7.17]} />
        <meshStandardMaterial color={COL.orange} metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.82, -3.95]}>
        <boxGeometry args={[2.5, 0.08, 7.15]} />
        <meshStandardMaterial color={COL.orange} metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.05, -3.95]}>
        <boxGeometry args={[2.36, 1.55, 6.85]} />
        <meshStandardMaterial color="#0d1528" metalness={0.2} roughness={0.65} />
      </mesh>
      <mesh position={[-1.28, 1.55, -0.45]}>
        <boxGeometry args={[0.06, 0.22, 0.12]} />
        <meshStandardMaterial color={COL.accent} emissive={COL.accent} emissiveIntensity={0.4} />
      </mesh>

      {/* Dayaq ayaqları */}
      <mesh position={[-0.7, 0.42, -1.15]}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <meshStandardMaterial color={COL.metal} />
      </mesh>
      <mesh position={[0.7, 0.42, -1.15]}>
        <boxGeometry args={[0.08, 0.55, 0.08]} />
        <meshStandardMaterial color={COL.metal} />
      </mesh>

      {wheelZ.map((w, i) => (
        <Wheel
          key={i}
          position={w.pos}
          selectedId={selectedId}
          onPartClick={onPartClick}
          showBrake={w.brake}
        />
      ))}
    </group>
  );
}

function inferPartId(name = '') {
  const n = name.toLowerCase();
  if (/(wheel|tire|tyre|rim)/.test(n)) return 'wheels';
  if (/(engine|motor)/.test(n)) return 'engine';
  if (/(brake|caliper|disc)/.test(n)) return 'brakes';
  if (/(cabin|cab|glass|door)/.test(n)) return 'cabin';
  return null;
}

function GltfTruck({ url, selectedId, onPartClick }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const materials = useRef(new Map());

  useEffect(() => {
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.partId = inferPartId(child.name);
      if (child.material) {
        child.material = child.material.clone();
        materials.current.set(child.uuid, {
          color: child.material.color?.clone(),
          emissive: child.material.emissive?.clone(),
          emissiveIntensity: child.material.emissiveIntensity ?? 0,
        });
      }
    });
  }, [clone]);

  useEffect(() => {
    clone.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const origin = materials.current.get(child.uuid);
      const active = child.userData.partId && child.userData.partId === selectedId;
      if (active) {
        child.material.color?.set(COL.highlight);
        if (child.material.emissive) child.material.emissive.set(COL.accent);
        child.material.emissiveIntensity = 0.4;
      } else if (origin) {
        if (origin.color) child.material.color.copy(origin.color);
        if (origin.emissive && child.material.emissive) child.material.emissive.copy(origin.emissive);
        child.material.emissiveIntensity = origin.emissiveIntensity;
      }
    });
  }, [clone, selectedId]);

  return (
    <primitive
      object={clone}
      onClick={(e) => {
        e.stopPropagation();
        const id = e.object.userData.partId;
        if (id) onPartClick(id);
      }}
    />
  );
}

function Hotspots({ selectedId, onPartClick, labels }) {
  return (
    <group>
      {PART_ORDER.map((id) => {
        const part = TRUCK_PARTS[id];
        const active = selectedId === id;
        return (
          <group key={id} position={part.marker}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onPartClick(id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setCursor(true);
              }}
              onPointerOut={() => setCursor(false)}
            >
              <sphereGeometry args={[active ? 0.13 : 0.1, 16, 16]} />
              <meshStandardMaterial
                color={active ? COL.highlight : COL.orange}
                emissive={active ? COL.accent : COL.orange}
                emissiveIntensity={active ? 0.9 : 0.45}
                roughness={0.25}
                metalness={0.2}
              />
            </mesh>
            <Html center distanceFactor={12} style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
              <span className={`t3d-pin${active ? ' is-on' : ''}`}>{labels[id]}</span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function SceneLoader({ text }) {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="t3d-loader" role="status">
        <div className="t3d-loader__ring" />
        <span>{text}</span>
        <small>{Math.round(progress)}%</small>
      </div>
    </Html>
  );
}

function Scene({
  selectedId,
  onPartClick,
  modelUrl,
  labels,
  controlsRef,
  isMobile,
}) {
  return (
    <>
      <color attach="background" args={['#070b12']} />
      <fog attach="fog" args={['#070b12', 14, 32]} />

      <ambientLight intensity={0.32} color="#9eb0c8" />
      <hemisphereLight args={['#1a2a44', '#0a0d12', 0.55]} />
      <directionalLight
        position={[8, 10, 6]}
        intensity={1.15}
        color="#f2f4f8"
        castShadow={!isMobile}
        shadow-mapSize-width={isMobile ? 512 : 1024}
        shadow-mapSize-height={isMobile ? 512 : 1024}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.35} color="#4a6a88" />
      <spotLight
        position={[2, 6, 8]}
        angle={0.45}
        penumbra={0.5}
        intensity={0.55}
        color="#FF6B1A"
      />

      <FocusControls focusId={selectedId} controlsRef={controlsRef} />

      <Suspense fallback={<SceneLoader text={labels.loading} />}>
        <ModelErrorBoundary fallback={<ProceduralTruck selectedId={selectedId} onPartClick={onPartClick} />}>
          {modelUrl ? (
            <GltfTruck url={modelUrl} selectedId={selectedId} onPartClick={onPartClick} />
          ) : (
            <ProceduralTruck selectedId={selectedId} onPartClick={onPartClick} />
          )}
        </ModelErrorBoundary>
        <Hotspots selectedId={selectedId} onPartClick={onPartClick} labels={labels} />
      </Suspense>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={22} blur={2.4} far={7} />
      <Grid
        args={[28, 28]}
        cellSize={0.55}
        cellThickness={0.55}
        cellColor="#162033"
        sectionSize={2.75}
        sectionThickness={1.05}
        sectionColor="#c44e14"
        fadeDistance={20}
        fadeStrength={1.35}
        position={[0, 0.005, 0]}
      />
    </>
  );
}

export default function Truck3DViewer({
  modelUrl = null,
  height = 560,
  className = '',
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const wrapRef = useRef(null);
  const controlsRef = useRef(null);

  const [mounted, setMounted] = useState(false);
  const [booting, setBooting] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setMounted(true);
      },
      { rootMargin: '220px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => () => setCursor(false), []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPartClick = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const selected = selectedId ? TRUCK_PARTS[selectedId] : null;

  const labels = useMemo(
    () => ({
      loading: t('truck3d_loading'),
      cabin: t('truck3d_part_cabin'),
      engine: t('truck3d_part_engine'),
      brakes: t('truck3d_part_brakes'),
      wheels: t('truck3d_part_wheels'),
    }),
    [t]
  );

  const canvasH = isMobile ? Math.min(height, 420) : height;

  return (
    <div ref={wrapRef} className={`t3d ${className}`.trim()}>
      <div className="t3d__chips" role="tablist" aria-label={t('truck3d_title')}>
        {PART_ORDER.map((id) => {
          const part = TRUCK_PARTS[id];
          const on = selectedId === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              className={`t3d__chip${on ? ' is-on' : ''}`}
              onClick={() => onPartClick(id)}
            >
              {t(part.nameKey)}
              <span>{part.oem}</span>
            </button>
          );
        })}
      </div>

      <div className="t3d__stage" style={{ height: canvasH }}>
        {mounted ? (
          <Canvas
            camera={{ position: DEFAULT_EYE, fov: 40, near: 0.1, far: 70 }}
            dpr={isMobile ? [1, 1] : [1, 1.6]}
            gl={{
              antialias: !isMobile,
              alpha: false,
              powerPreference: 'high-performance',
              stencil: false,
            }}
            shadows={!isMobile}
            onCreated={() => {
              requestAnimationFrame(() => setBooting(false));
            }}
            onPointerMissed={() => setSelectedId(null)}
          >
            <Scene
              selectedId={selectedId}
              onPartClick={onPartClick}
              modelUrl={modelUrl}
              labels={labels}
              controlsRef={controlsRef}
              isMobile={isMobile}
            />
          </Canvas>
        ) : (
          <div className="t3d-boot">
            <div className="t3d-loader__ring" />
            <span>{t('truck3d_loading')}</span>
          </div>
        )}

        {(booting && mounted) && (
          <div className="t3d-boot t3d-boot--overlay">
            <div className="t3d-loader__ring" />
            <span>{t('truck3d_loading')}</span>
          </div>
        )}

        <p className="t3d__hint">{t('truck3d_hint')}</p>

        <button
          type="button"
          className="t3d__reset"
          onClick={() => setSelectedId(null)}
        >
          {t('truck3d_reset')}
        </button>

        {selected && (
          <aside className="t3d__pop" role="dialog" aria-label={t(selected.nameKey)}>
            <button
              type="button"
              className="t3d__pop-x"
              onClick={() => setSelectedId(null)}
              aria-label={t('truck3d_close')}
            >
              ×
            </button>
            <p className="t3d__pop-brand">{selected.brand}</p>
            <h3>{t(selected.nameKey)}</h3>
            <p className="t3d__pop-desc">{t(selected.descKey)}</p>
            <dl>
              <div>
                <dt>{t('truck3d_oem')}</dt>
                <dd>{selected.oem}</dd>
              </div>
              <div>
                <dt>{t('truck3d_compat')}</dt>
                <dd>Volvo FH · Actros · Scania R</dd>
              </div>
            </dl>
            <button
              type="button"
              className="t3d__pop-cta"
              onClick={() => navigate(`/spare-parts?cat=${selected.catalogCat}`)}
            >
              {t('truck3d_view_catalog')} →
            </button>
          </aside>
        )}
      </div>

      <style>{`
        .t3d { width: 100%; }
        .t3d__chips {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-bottom: 16px; justify-content: center;
        }
        .t3d__chip {
          appearance: none; cursor: pointer;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #c5d0de; border-radius: 999px;
          padding: 8px 16px; font-family: var(--f-body);
          font-size: 0.82rem; font-weight: 700;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background .2s, border-color .2s, color .2s, transform .2s;
        }
        .t3d__chip span {
          font-family: var(--f-mono); font-size: 0.68rem;
          color: #FF6B1A; letter-spacing: .04em;
        }
        .t3d__chip:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .t3d__chip.is-on {
          background: rgba(230,0,0,0.14);
          border-color: rgba(255,107,26,0.45);
          color: #fff;
        }
        .t3d__stage {
          position: relative; width: 100%;
          border-radius: 22px; overflow: hidden;
          background: #070b12;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 28px 60px rgba(0,0,0,0.45);
          touch-action: none;
        }
        .t3d__stage canvas { display: block; width: 100% !important; height: 100% !important; }
        .t3d__hint {
          position: absolute; left: 18px; bottom: 14px; margin: 0;
          font-family: var(--f-mono); font-size: 0.68rem;
          letter-spacing: .08em; text-transform: uppercase;
          color: rgba(255,255,255,0.38); pointer-events: none;
        }
        .t3d__reset {
          position: absolute; right: 14px; bottom: 12px;
          appearance: none; cursor: pointer;
          background: rgba(8,12,20,0.72);
          border: 1px solid rgba(255,255,255,0.14);
          color: #d5deea; border-radius: 999px;
          padding: 7px 14px; font-size: 0.75rem; font-weight: 700;
          font-family: var(--f-body); backdrop-filter: blur(10px);
        }
        .t3d__reset:hover { border-color: rgba(255,107,26,0.45); color: #fff; }
        .t3d__pop {
          position: absolute; top: 16px; right: 16px;
          width: min(320px, calc(100% - 28px));
          background: rgba(10,14,22,0.88);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(16px);
          border-radius: 16px; padding: 18px 18px 16px;
          color: #e8eef6; box-shadow: 0 18px 40px rgba(0,0,0,0.4);
          animation: t3dPop .28s ease;
        }
        .t3d__pop-x {
          position: absolute; top: 8px; right: 10px;
          background: transparent; border: none; color: #8a9bb0;
          font-size: 1.35rem; cursor: pointer; line-height: 1;
        }
        .t3d__pop-brand {
          margin: 0 0 4px; font-family: var(--f-mono);
          font-size: 0.68rem; letter-spacing: .14em;
          text-transform: uppercase; color: #FF6B1A; font-weight: 700;
        }
        .t3d__pop h3 {
          margin: 0 0 8px; font-family: var(--f-display);
          font-size: 1.15rem; font-weight: 800; letter-spacing: -.02em;
        }
        .t3d__pop-desc { margin: 0 0 14px; color: #8a9bb0; font-size: 0.86rem; line-height: 1.5; }
        .t3d__pop dl { margin: 0 0 14px; display: grid; gap: 8px; }
        .t3d__pop dl div { display: flex; justify-content: space-between; gap: 12px; }
        .t3d__pop dt { color: #6b7a8d; font-size: 0.75rem; }
        .t3d__pop dd {
          margin: 0; font-family: var(--f-mono); font-size: 0.78rem;
          color: #fff; font-weight: 700;
        }
        .t3d__pop-cta {
          width: 100%; appearance: none; cursor: pointer;
          background: linear-gradient(135deg, #FF5E1A 0%, #FF9500 100%);
          border: none; color: #fff; font-weight: 800;
          border-radius: 10px; padding: 11px 14px; font-size: 0.85rem;
          font-family: var(--f-body);
        }
        .t3d-boot {
          position: absolute; inset: 0; display: flex;
          flex-direction: column; align-items: center; justify-content: center;
          gap: 14px; background: #070b12; color: #9aa8ba;
          font-family: var(--f-mono); font-size: 0.78rem; letter-spacing: .12em;
          text-transform: uppercase;
        }
        .t3d-boot--overlay { background: rgba(7,11,18,0.72); z-index: 3; }
        .t3d-loader {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: #c5d0de; font-family: var(--f-mono); font-size: 0.78rem;
          letter-spacing: .1em; text-transform: uppercase; text-align: center;
        }
        .t3d-loader small { color: #FF6B1A; font-size: 0.7rem; }
        .t3d-loader__ring {
          width: 42px; height: 42px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.12);
          border-top-color: #FF6B1A;
          animation: t3dSpin .8s linear infinite;
        }
        .t3d-pin {
          display: inline-block; padding: 3px 8px; border-radius: 999px;
          background: rgba(8,12,20,0.78); border: 1px solid rgba(255,107,26,0.35);
          color: #e8eef6; font-size: 10px; font-family: Inter, sans-serif;
          font-weight: 700; transform: translateY(-18px);
        }
        .t3d-pin.is-on { background: rgba(230,0,0,0.75); border-color: #ff6b1a; }
        @keyframes t3dSpin { to { transform: rotate(360deg); } }
        @keyframes t3dPop {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .t3d__pop { top: auto; bottom: 48px; right: 10px; left: 10px; width: auto; }
          .t3d__hint { display: none; }
          .t3d__chip { font-size: 0.75rem; padding: 7px 12px; }
        }
      `}</style>
    </div>
  );
}
