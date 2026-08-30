// =================================================================
// FAYL: src/components/Truck3DViewer.jsx
// TƏSVİR: High-Tech Hologram / Blueprint 3D TIR — R3F + drei +
//         postprocessing Bloom + maath (yağ kimi kamera)
// =================================================================

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  CameraControls,
  Grid,
  Html,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { easing } from 'maath';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

const ACCENT = '#E60000';
const DEFAULT_EYE = [7.6, 3.7, 8.4];
const DEFAULT_TARGET = [0, 1.2, 0.15];

const TRUCK_PARTS = {
  wheels: {
    id: 'wheels',
    nameKey: 'truck3d_part_wheels',
    descKey: 'truck3d_part_wheels_desc',
    oem: 'AL-22.5-10H',
    brand: 'Alcoa / Michelin',
    catalogCat: 'parts_category_suspension',
    eye: [4.35, 1.45, 5.55],
    target: [1.08, 0.52, 3.48],
    marker: [1.42, 1.22, 3.48],
  },
  engine: {
    id: 'engine',
    nameKey: 'truck3d_part_engine',
    descKey: 'truck3d_part_engine_desc',
    oem: 'D13K-460',
    brand: 'Volvo OEM',
    catalogCat: 'parts_category_engine',
    eye: [3.05, 2.05, 6.55],
    target: [0, 0.95, 4.18],
    marker: [0.15, 1.92, 4.42],
  },
  brakes: {
    id: 'brakes',
    nameKey: 'truck3d_part_brakes',
    descKey: 'truck3d_part_brakes_desc',
    oem: 'K020345',
    brand: 'Knorr-Bremse',
    catalogCat: 'parts_category_brakes',
    eye: [3.4, 1.05, 5.05],
    target: [1.1, 0.48, 3.42],
    marker: [1.52, 0.88, 3.12],
  },
  cabin: {
    id: 'cabin',
    nameKey: 'truck3d_part_cabin',
    descKey: 'truck3d_part_cabin_desc',
    oem: 'VL-CAB-FH4',
    brand: 'Volvo OEM',
    catalogCat: 'parts_category_body',
    eye: [5.45, 3.25, 6.75],
    target: [0, 1.88, 3.28],
    marker: [0, 3.42, 3.32],
  },
};

const PART_ORDER = ['cabin', 'engine', 'brakes', 'wheels'];

const WHEEL_LAYOUT = [
  { pos: [-1.08, 0.54, 3.52], brake: true },
  { pos: [1.08, 0.54, 3.52], brake: true },
  { pos: [-1.08, 0.54, 1.38], brake: true },
  { pos: [1.08, 0.54, 1.38], brake: true },
  { pos: [-1.08, 0.54, 0.44], brake: true },
  { pos: [1.08, 0.54, 0.44], brake: true },
  { pos: [-1.08, 0.54, -5.52], brake: false },
  { pos: [1.08, 0.54, -5.52], brake: false },
  { pos: [-1.08, 0.54, -6.48], brake: false },
  { pos: [1.08, 0.54, -6.48], brake: false },
];

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

function setCursor(on) {
  document.body.style.cursor = on ? 'pointer' : '';
}

// ─── Hologram material ───────────────────────────────────────────
function HoloMaterial({ active = false }) {
  const ref = useRef(null);

  useFrame((state, delta) => {
    const mat = ref.current;
    if (!mat) return;
    const pulse = active ? 2.15 + Math.sin(state.clock.elapsedTime * 3.1) * 0.55 : 0.62;
    easing.damp(mat, 'emissiveIntensity', pulse, 0.32, delta);
    easing.damp(mat, 'opacity', active ? 0.6 : 0.15, 0.38, delta);
    easing.dampC(mat.emissive, active ? ACCENT : '#444444', 0.34, delta);
  });

  return (
    <meshStandardMaterial
      ref={ref}
      transparent
      opacity={0.15}
      wireframe
      color="#ffffff"
      emissive="#444444"
      emissiveIntensity={0.62}
      toneMapped={false}
      depthWrite={false}
    />
  );
}

function Interactive({ partId, onPartClick, children }) {
  return (
    <group
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
    </group>
  );
}

function HoloMesh({ active, children, ...props }) {
  return (
    <mesh {...props}>
      {children}
      <HoloMaterial active={active} />
    </mesh>
  );
}

// ─── Kamera: CameraControls + maath ──────────────────────────────
function FocusControls({ focusId, controlsRef }) {
  const { invalidate } = useThree();
  const guiding = useRef(false);
  const dragging = useRef(false);
  const goalEye = useRef(new THREE.Vector3(...DEFAULT_EYE));
  const goalTarget = useRef(new THREE.Vector3(...DEFAULT_TARGET));
  const liveEye = useRef(new THREE.Vector3(...DEFAULT_EYE));
  const liveTarget = useRef(new THREE.Vector3(...DEFAULT_TARGET));

  useEffect(() => {
    const ctrl = controlsRef.current;
    const part = focusId ? TRUCK_PARTS[focusId] : null;
    goalEye.current.set(...(part ? part.eye : DEFAULT_EYE));
    goalTarget.current.set(...(part ? part.target : DEFAULT_TARGET));
    guiding.current = true;

    if (!ctrl) return;
    ctrl.truckSpeed = 0;
    ctrl.dollyToCursor = false;
    ctrl.infinityDolly = false;
    ctrl.smoothTime = 0.88;
    ctrl.draggingSmoothTime = 0.2;
    ctrl.getPosition(liveEye.current);
    ctrl.getTarget(liveTarget.current);
    const e = goalEye.current;
    const t = goalTarget.current;
    ctrl.setLookAt(e.x, e.y, e.z, t.x, t.y, t.z, true);
    invalidate();
  }, [focusId, controlsRef, invalidate]);

  useFrame((_, delta) => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    easing.damp(ctrl, 'smoothTime', guiding.current ? 0.9 : 0.28, 0.45, delta);

    if (!guiding.current || dragging.current) return;

    easing.damp3(liveEye.current, goalEye.current, 0.42, delta);
    easing.damp3(liveTarget.current, goalTarget.current, 0.42, delta);

    const e = liveEye.current;
    const t = liveTarget.current;
    ctrl.setLookAt(e.x, e.y, e.z, t.x, t.y, t.z, true);

    if (
      e.distanceTo(goalEye.current) < 0.035 &&
      t.distanceTo(goalTarget.current) < 0.035
    ) {
      guiding.current = false;
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minPolarAngle={0.78}
      maxPolarAngle={1.4}
      minDistance={4.6}
      maxDistance={13.8}
      minAzimuthAngle={-Math.PI * 0.8}
      maxAzimuthAngle={Math.PI * 0.8}
      smoothTime={0.88}
      draggingSmoothTime={0.2}
      onStart={() => {
        dragging.current = true;
        guiding.current = false;
      }}
      onEnd={() => {
        dragging.current = false;
      }}
    />
  );
}

// ─── Glassmorphism Html marker ───────────────────────────────────
function HoloMarker({ part, active, label, oem, onClick }) {
  const group = useRef(null);
  const anchor = useMemo(() => new THREE.Vector3(...part.marker), [part]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const dist = state.camera.position.distanceTo(anchor);
    const next = THREE.MathUtils.clamp(8.6 / dist, 0.7, 1.26) * (active ? 1.1 : 1);
    easing.damp3(group.current.scale, [next, next, next], 0.26, delta);
  });

  return (
    <group ref={group} position={part.marker}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setCursor(true);
        }}
        onPointerOut={() => setCursor(false)}
      >
        <sphereGeometry args={[0.05, 12, 12]} />
        <HoloMaterial active={active} />
      </mesh>
      <Html
        center
        sprite
        transform
        occlude={false}
        zIndexRange={[90, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          type="button"
          className={`t3d-mark${active ? ' is-on' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <span className="t3d-mark__dot" />
          <span className="t3d-mark__label">{label}</span>
          <span className="t3d-mark__oem">{oem}</span>
        </button>
      </Html>
    </group>
  );
}

function Hotspots({ selectedId, onPartClick, labels }) {
  return (
    <group>
      {PART_ORDER.map((id) => {
        const part = TRUCK_PARTS[id];
        return (
          <HoloMarker
            key={id}
            part={part}
            active={selectedId === id}
            label={labels[id]}
            oem={part.oem}
            onClick={() => onPartClick(id)}
          />
        );
      })}
    </group>
  );
}

// ─── Təkər + disk + kaliper ──────────────────────────────────────
function WheelAssembly({ position, selectedId, onPartClick, showBrake }) {
  const wheelOn = selectedId === 'wheels';
  const brakeOn = selectedId === 'brakes';
  const side = position[0] >= 0 ? 1 : -1;

  const lugs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return [Math.cos(a) * 0.145, Math.sin(a) * 0.145];
      }),
    []
  );
  const spokes = useMemo(
    () => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI),
    []
  );

  return (
    <group position={position}>
      <Interactive partId="wheels" onPartClick={onPartClick}>
        <HoloMesh active={wheelOn} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55, 0.55, 0.33, 28]} />
        </HoloMesh>
        <HoloMesh active={wheelOn} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.34, 20]} />
        </HoloMesh>
        <HoloMesh active={wheelOn} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.24, 20]} />
        </HoloMesh>
        <HoloMesh active={wheelOn} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.37, 0.028, 8, 24]} />
        </HoloMesh>
        <HoloMesh active={wheelOn} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.26, 0.02, 8, 18]} />
        </HoloMesh>
        <HoloMesh active={wheelOn} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.38, 12]} />
        </HoloMesh>
        <HoloMesh active={wheelOn} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.4, 10]} />
        </HoloMesh>
        {spokes.map((a, i) => (
          <HoloMesh key={`sp-${i}`} active={wheelOn} rotation={[a, 0, 0]}>
            <boxGeometry args={[0.038, 0.3, 0.032]} />
          </HoloMesh>
        ))}
        {lugs.map(([y, z], i) => (
          <HoloMesh
            key={`lg-${i}`}
            active={wheelOn}
            position={[side * 0.17, y, z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.016, 0.016, 0.055, 6]} />
          </HoloMesh>
        ))}
      </Interactive>

      {showBrake && (
        <Interactive partId="brakes" onPartClick={onPartClick}>
          <HoloMesh
            active={brakeOn}
            rotation={[0, 0, Math.PI / 2]}
            position={[side * -0.19, 0, 0]}
          >
            <cylinderGeometry args={[0.37, 0.37, 0.038, 28]} />
          </HoloMesh>
          <HoloMesh
            active={brakeOn}
            rotation={[0, 0, Math.PI / 2]}
            position={[side * -0.19, 0, 0]}
          >
            <cylinderGeometry args={[0.21, 0.21, 0.048, 16]} />
          </HoloMesh>
          <HoloMesh active={brakeOn} position={[side * -0.17, 0.24, 0]}>
            <boxGeometry args={[0.13, 0.15, 0.24]} />
          </HoloMesh>
          <HoloMesh active={brakeOn} position={[side * -0.17, 0.2, 0.09]}>
            <boxGeometry args={[0.055, 0.08, 0.075]} />
          </HoloMesh>
          <HoloMesh active={brakeOn} position={[side * -0.17, 0.2, -0.09]}>
            <boxGeometry args={[0.055, 0.08, 0.075]} />
          </HoloMesh>
        </Interactive>
      )}
    </group>
  );
}

// ─── Çertyoj TIR maketi ──────────────────────────────────────────
function BlueprintTruck({ selectedId, onPartClick }) {
  const cabinOn = selectedId === 'cabin';
  const engineOn = selectedId === 'engine';
  const group = useRef(null);

  const ribs = useMemo(
    () => Array.from({ length: 8 }, (_, i) => -0.85 - i * 0.86),
    []
  );
  const crosses = useMemo(
    () => [3.6, 2.4, 1.2, 0.1, -1.2, -2.6, -4.0, -5.5, -6.7],
    []
  );
  const pistons = useMemo(
    () => [-0.28, -0.1, 0.08, 0.26, 0.44],
    []
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const idle = selectedId ? 0 : Math.sin(state.clock.elapsedTime * 0.22) * 0.035;
    easing.damp(group.current.rotation, 'y', idle, 0.7, delta);
  });

  return (
    <group ref={group}>
      {/* Şassi relsləri + eninə tirlər */}
      <HoloMesh active={false} position={[-0.38, 0.64, -1.15]}>
        <boxGeometry args={[0.12, 0.16, 12.4]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0.38, 0.64, -1.15]}>
        <boxGeometry args={[0.12, 0.16, 12.4]} />
      </HoloMesh>
      {crosses.map((z) => (
        <HoloMesh key={`x-${z}`} active={false} position={[0, 0.64, z]}>
          <boxGeometry args={[0.86, 0.1, 0.1]} />
        </HoloMesh>
      ))}

      {/* Kabin */}
      <Interactive partId="cabin" onPartClick={onPartClick}>
        <HoloMesh active={cabinOn} position={[0, 1.32, 3.48]}>
          <boxGeometry args={[2.28, 1.08, 1.82]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0, 2.3, 3.18]}>
          <boxGeometry args={[2.28, 1.06, 1.38]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0, 2.88, 3.05]}>
          <boxGeometry args={[2.3, 0.1, 1.2]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0, 3.12, 2.55]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[2.18, 0.08, 0.85]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0, 2.18, 4.2]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[2.08, 0.88, 0.07]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[-1.16, 2.18, 3.22]}>
          <boxGeometry args={[0.06, 0.72, 0.7]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[1.16, 2.18, 3.22]}>
          <boxGeometry args={[0.06, 0.72, 0.7]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0, 2.72, 3.82]}>
          <boxGeometry args={[2.12, 0.08, 0.28]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0, 0.58, 4.74]}>
          <boxGeometry args={[2.4, 0.34, 0.36]} />
        </HoloMesh>
        {[-0.55, -0.22, 0.11, 0.44].map((y) => (
          <HoloMesh key={`gr-${y}`} active={cabinOn} position={[0, 1.05 + y, 4.5]}>
            <boxGeometry args={[1.42, 0.045, 0.06]} />
          </HoloMesh>
        ))}
        <HoloMesh active={cabinOn} position={[-0.9, 0.74, 4.9]}>
          <boxGeometry args={[0.36, 0.14, 0.08]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0.9, 0.74, 4.9]}>
          <boxGeometry args={[0.36, 0.14, 0.08]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[-0.9, 0.52, 4.86]}>
          <boxGeometry args={[0.22, 0.08, 0.06]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0.9, 0.52, 4.86]}>
          <boxGeometry args={[0.22, 0.08, 0.06]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[-1.38, 1.92, 4.02]}>
          <boxGeometry args={[0.22, 0.06, 0.06]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[1.38, 1.92, 4.02]}>
          <boxGeometry args={[0.22, 0.06, 0.06]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[-1.5, 2.08, 4.05]}>
          <boxGeometry args={[0.07, 0.4, 0.2]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[1.5, 2.08, 4.05]}>
          <boxGeometry args={[0.07, 0.4, 0.2]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[-1.18, 1.05, 3.95]}>
          <boxGeometry args={[0.16, 0.08, 0.32]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[1.18, 1.05, 3.95]}>
          <boxGeometry args={[0.16, 0.08, 0.32]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[-1.18, 0.82, 3.95]}>
          <boxGeometry args={[0.16, 0.08, 0.32]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[1.18, 0.82, 3.95]}>
          <boxGeometry args={[0.16, 0.08, 0.32]} />
        </HoloMesh>
        <HoloMesh active={cabinOn} position={[0, 1.55, 3.55]}>
          <boxGeometry args={[0.04, 1.35, 1.55]} />
        </HoloMesh>
      </Interactive>

      {/* Mühərrik — kabinin içindən görünür */}
      <Interactive partId="engine" onPartClick={onPartClick}>
        <HoloMesh active={engineOn} position={[0, 0.92, 4.14]}>
          <boxGeometry args={[1.18, 0.72, 1.08]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[0, 1.38, 4.08]}>
          <boxGeometry args={[0.78, 0.26, 0.72]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[0, 0.5, 4.14]}>
          <boxGeometry args={[1.02, 0.16, 0.88]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[0, 1.12, 4.62]}>
          <boxGeometry args={[1.05, 0.55, 0.08]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[0, 1.05, 4.72]}>
          <boxGeometry args={[1.12, 0.62, 0.06]} />
        </HoloMesh>
        {pistons.map((z) => (
          <HoloMesh
            key={`p-${z}`}
            active={engineOn}
            position={[0.62, 0.98, 4.05 + z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.07, 0.07, 0.18, 10]} />
          </HoloMesh>
        ))}
        <HoloMesh active={engineOn} position={[0.58, 1.22, 3.72]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.22, 12]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[0.58, 1.22, 3.72]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.14, 0.03, 8, 16]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[-0.62, 0.88, 4.35]}>
          <cylinderGeometry args={[0.1, 0.1, 0.32, 12]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[-0.62, 0.88, 3.95]}>
          <cylinderGeometry args={[0.1, 0.1, 0.32, 12]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[0.52, 0.72, 4.35]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 12]} />
        </HoloMesh>
        <HoloMesh active={engineOn} position={[0.52, 0.72, 4.12]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 10]} />
        </HoloMesh>
      </Interactive>

      {/* Yanacaq bakları, hava balonları, egzoz */}
      <HoloMesh active={false} position={[-1.2, 0.84, 2.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.27, 0.27, 1.32, 16]} />
      </HoloMesh>
      <HoloMesh active={false} position={[1.2, 0.84, 2.08]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.27, 0.27, 1.32, 16]} />
      </HoloMesh>
      <HoloMesh active={false} position={[-1.2, 0.84, 2.08]}>
        <boxGeometry args={[0.08, 0.58, 0.08]} />
      </HoloMesh>
      <HoloMesh active={false} position={[1.2, 0.84, 2.08]}>
        <boxGeometry args={[0.08, 0.58, 0.08]} />
      </HoloMesh>
      <HoloMesh active={false} position={[-0.55, 0.52, 1.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.42, 12]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0.55, 0.52, 1.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.42, 12]} />
      </HoloMesh>
      <HoloMesh active={false} position={[-1.12, 1.95, 2.42]}>
        <cylinderGeometry args={[0.085, 0.085, 2.2, 12]} />
      </HoloMesh>
      <HoloMesh active={false} position={[-1.12, 1.15, 2.42]}>
        <cylinderGeometry args={[0.14, 0.14, 0.42, 12]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0, 0.48, 1.9]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0, 0.78, -0.85]}>
        <cylinderGeometry args={[0.32, 0.32, 0.1, 16]} />
      </HoloMesh>

      {/* Treyler — büzməli panellər */}
      <HoloMesh active={false} position={[0, 2.05, -3.95]}>
        <boxGeometry args={[2.48, 2.48, 7.12]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0, 3.32, -3.95]}>
        <boxGeometry args={[2.52, 0.08, 7.16]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0, 0.84, -3.95]}>
        <boxGeometry args={[2.5, 0.07, 7.14]} />
      </HoloMesh>
      {ribs.map((z) => (
        <React.Fragment key={`rib-${z}`}>
          <HoloMesh active={false} position={[-1.26, 2.05, z]}>
            <boxGeometry args={[0.05, 2.2, 0.08]} />
          </HoloMesh>
          <HoloMesh active={false} position={[1.26, 2.05, z]}>
            <boxGeometry args={[0.05, 2.2, 0.08]} />
          </HoloMesh>
        </React.Fragment>
      ))}
      <HoloMesh active={false} position={[-0.64, 2.05, -7.48]}>
        <boxGeometry args={[1.16, 2.2, 0.06]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0.64, 2.05, -7.48]}>
        <boxGeometry args={[1.16, 2.2, 0.06]} />
      </HoloMesh>
      <HoloMesh active={false} position={[-0.7, 0.42, -1.18]}>
        <boxGeometry args={[0.07, 0.58, 0.07]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0.7, 0.42, -1.18]}>
        <boxGeometry args={[0.07, 0.58, 0.07]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0, 0.18, -1.18]}>
        <boxGeometry args={[1.5, 0.05, 0.12]} />
      </HoloMesh>
      <HoloMesh active={false} position={[0, 0.95, -7.55]}>
        <boxGeometry args={[2.4, 0.12, 0.1]} />
      </HoloMesh>
      <HoloMesh active={false} position={[-1.05, 1.15, -7.58]}>
        <boxGeometry args={[0.18, 0.1, 0.06]} />
      </HoloMesh>
      <HoloMesh active={false} position={[1.05, 1.15, -7.58]}>
        <boxGeometry args={[0.18, 0.1, 0.06]} />
      </HoloMesh>
      <HoloMesh active={false} position={[-1.18, 0.95, -5.95]}>
        <boxGeometry args={[0.08, 0.22, 1.35]} />
      </HoloMesh>
      <HoloMesh active={false} position={[1.18, 0.95, -5.95]}>
        <boxGeometry args={[0.08, 0.22, 1.35]} />
      </HoloMesh>

      {WHEEL_LAYOUT.map((w, i) => (
        <WheelAssembly
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

function HoloScan() {
  const ref = useRef(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.15 + (Math.sin(state.clock.elapsedTime * 0.42) * 0.5 + 0.5) * 3.35;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 1, -0.4]}>
      <planeGeometry args={[6.4, 14.2]} />
      <meshBasicMaterial
        color={ACCENT}
        transparent
        opacity={0.045}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
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

function GltfHoloTruck({ url, selectedId, onPartClick }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.userData.partId = inferPartId(child.name);
      child.material = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.15,
        wireframe: true,
        color: '#ffffff',
        emissive: '#444444',
        emissiveIntensity: 0.62,
        toneMapped: false,
        depthWrite: false,
      });
    });
  }, [clone]);

  useFrame((state, delta) => {
    clone.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const active = child.userData.partId && child.userData.partId === selectedId;
      const mat = child.material;
      const pulse = active ? 2.15 + Math.sin(state.clock.elapsedTime * 3.1) * 0.55 : 0.62;
      easing.damp(mat, 'emissiveIntensity', pulse, 0.32, delta);
      easing.damp(mat, 'opacity', active ? 0.6 : 0.15, 0.38, delta);
      easing.dampC(mat.emissive, active ? ACCENT : '#444444', 0.34, delta);
    });
  });

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
      <color attach="background" args={['#05080e']} />
      <fog attach="fog" args={['#05080e', 16, 34]} />

      <ambientLight intensity={0.22} color="#c8d4e4" />
      <hemisphereLight args={['#1a2438', '#05080e', 0.4]} />
      <directionalLight position={[7, 9, 5]} intensity={0.85} color="#f4f7fb" />
      <pointLight position={[0, 4.2, 3.2]} intensity={1.15} color={ACCENT} distance={14} />
      <pointLight position={[2.5, 2.2, 6]} intensity={0.45} color="#9ec4ff" distance={10} />

      <FocusControls focusId={selectedId} controlsRef={controlsRef} />

      <Suspense fallback={<SceneLoader text={labels.loading} />}>
        <ModelErrorBoundary fallback={<BlueprintTruck selectedId={selectedId} onPartClick={onPartClick} />}>
          {modelUrl ? (
            <GltfHoloTruck url={modelUrl} selectedId={selectedId} onPartClick={onPartClick} />
          ) : (
            <BlueprintTruck selectedId={selectedId} onPartClick={onPartClick} />
          )}
        </ModelErrorBoundary>
        <Hotspots selectedId={selectedId} onPartClick={onPartClick} labels={labels} />
        <HoloScan />
      </Suspense>

      <Grid
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.45}
        cellColor="#1a2a40"
        sectionSize={2.5}
        sectionThickness={1.05}
        sectionColor="#8a1414"
        fadeDistance={22}
        fadeStrength={1.4}
        position={[0, 0.002, 0]}
      />

      <EffectComposer multisampling={isMobile ? 0 : 4} enableNormalPass={false}>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={isMobile ? 1.15 : 1.5} />
      </EffectComposer>
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
            dpr={isMobile ? [1, 1] : [1, 1.5]}
            gl={{
              antialias: !isMobile,
              alpha: false,
              powerPreference: 'high-performance',
              stencil: false,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.05,
            }}
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

        {booting && mounted && (
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
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.1);
          color: #c5d0de; border-radius: 999px;
          padding: 8px 16px; font-family: var(--f-body);
          font-size: 0.82rem; font-weight: 700;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background .25s, border-color .25s, color .25s, box-shadow .25s;
        }
        .t3d__chip span {
          font-family: var(--f-mono); font-size: 0.68rem;
          color: #E60000; letter-spacing: .04em;
        }
        .t3d__chip:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .t3d__chip.is-on {
          background: rgba(230,0,0,0.16);
          border-color: rgba(230,0,0,0.5);
          color: #fff;
          box-shadow: 0 0 18px rgba(230,0,0,0.18);
        }
        .t3d__stage {
          position: relative; width: 100%;
          border-radius: 22px; overflow: hidden;
          background: #05080e;
          border: 1px solid rgba(230,0,0,0.18);
          box-shadow: 0 28px 60px rgba(0,0,0,0.5), inset 0 0 80px rgba(230,0,0,0.04);
          touch-action: none;
        }
        .t3d__stage canvas { display: block; width: 100% !important; height: 100% !important; }
        .t3d__hint {
          position: absolute; left: 18px; bottom: 14px; margin: 0;
          font-family: var(--f-mono); font-size: 0.68rem;
          letter-spacing: .08em; text-transform: uppercase;
          color: rgba(255,255,255,0.34); pointer-events: none;
        }
        .t3d__reset {
          position: absolute; right: 14px; bottom: 12px;
          appearance: none; cursor: pointer;
          background: rgba(8,10,16,0.62);
          border: 1px solid rgba(230,0,0,0.28);
          color: #d5deea; border-radius: 999px;
          padding: 7px 14px; font-size: 0.75rem; font-weight: 700;
          font-family: var(--f-body);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .t3d__reset:hover { border-color: rgba(230,0,0,0.55); color: #fff; }
        .t3d__pop {
          position: absolute; top: 16px; right: 16px;
          width: min(320px, calc(100% - 28px));
          background: rgba(8,10,16,0.62);
          border: 1px solid rgba(230,0,0,0.35);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 16px; padding: 18px 18px 16px;
          color: #e8eef6; box-shadow: 0 18px 40px rgba(0,0,0,0.42), 0 0 24px rgba(230,0,0,0.12);
          animation: t3dPop .4s cubic-bezier(.22,1,.36,1);
        }
        .t3d__pop-x {
          position: absolute; top: 8px; right: 10px;
          background: transparent; border: none; color: #8a9bb0;
          font-size: 1.35rem; cursor: pointer; line-height: 1;
        }
        .t3d__pop-brand {
          margin: 0 0 4px; font-family: var(--f-mono);
          font-size: 0.68rem; letter-spacing: .14em;
          text-transform: uppercase; color: #E60000; font-weight: 700;
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
          background: linear-gradient(135deg, #E60000 0%, #9b0000 100%);
          border: none; color: #fff; font-weight: 800;
          border-radius: 10px; padding: 11px 14px; font-size: 0.85rem;
          font-family: var(--f-body);
        }
        .t3d-boot {
          position: absolute; inset: 0; display: flex;
          flex-direction: column; align-items: center; justify-content: center;
          gap: 14px; background: #05080e; color: #9aa8ba;
          font-family: var(--f-mono); font-size: 0.78rem; letter-spacing: .12em;
          text-transform: uppercase;
        }
        .t3d-boot--overlay { background: rgba(5,8,14,0.72); z-index: 3; }
        .t3d-loader {
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: #c5d0de; font-family: var(--f-mono); font-size: 0.78rem;
          letter-spacing: .1em; text-transform: uppercase; text-align: center;
        }
        .t3d-loader small { color: #E60000; font-size: 0.7rem; }
        .t3d-loader__ring {
          width: 42px; height: 42px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.12);
          border-top-color: #E60000;
          animation: t3dSpin .8s linear infinite;
        }
        .t3d-mark {
          appearance: none; cursor: pointer;
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 0; padding: 7px 11px 7px 10px;
          border-radius: 9px;
          background: rgba(8,10,16,0.55);
          border: 1px solid rgba(230,0,0,0.38);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 0 16px rgba(230,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.04);
          color: #f2f4f8; white-space: nowrap;
          font-family: Inter, system-ui, sans-serif;
          transition: border-color .35s ease, box-shadow .35s ease, background .35s ease;
        }
        .t3d-mark__dot {
          position: absolute; left: -3px; top: 50%;
          width: 6px; height: 6px; margin-top: -3px;
          border-radius: 50%; background: #E60000;
          box-shadow: 0 0 8px #E60000;
        }
        .t3d-mark__label {
          font-size: 10px; font-weight: 700; letter-spacing: .02em;
          padding-left: 6px;
        }
        .t3d-mark__oem {
          display: block; max-height: 0; opacity: 0; overflow: hidden;
          margin: 0; padding-left: 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 9px; font-weight: 700; letter-spacing: .14em;
          color: #E60000; text-transform: uppercase;
          transform: translateY(-5px);
          transition: max-height .42s cubic-bezier(.22,1,.36,1),
                      opacity .32s ease, transform .42s cubic-bezier(.22,1,.36,1),
                      margin .32s ease;
        }
        .t3d-mark.is-on {
          background: rgba(18,6,8,0.62);
          border-color: rgba(230,0,0,0.85);
          box-shadow: 0 0 22px rgba(230,0,0,0.28);
        }
        .t3d-mark.is-on .t3d-mark__oem {
          max-height: 22px; opacity: 1; margin-top: 4px; transform: translateY(0);
        }
        @keyframes t3dSpin { to { transform: rotate(360deg); } }
        @keyframes t3dPop {
          from { opacity: 0; transform: translateY(10px); }
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
