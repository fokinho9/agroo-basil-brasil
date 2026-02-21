import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

interface GeoPoint {
  country: string;
  count: number;
  lat: number;
  lng: number;
}

// Map of country codes/names to lat/lng
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'BR': [-14.2, -51.9], 'US': [37.1, -95.7], 'PT': [39.4, -8.2],
  'AR': [-38.4, -63.6], 'MX': [23.6, -102.5], 'CO': [-4.6, -74.3],
  'CL': [-35.7, -71.5], 'PE': [-9.2, -75.0], 'UY': [-32.5, -55.8],
  'PY': [-23.4, -58.4], 'BO': [-16.3, -63.6], 'EC': [-1.8, -78.2],
  'VE': [6.4, -66.6], 'DE': [51.2, 10.5], 'FR': [46.2, 2.2],
  'ES': [40.5, -3.7], 'IT': [41.9, 12.6], 'GB': [55.4, -3.4],
  'JP': [36.2, 138.3], 'CN': [35.9, 104.2], 'IN': [20.6, 78.9],
  'AU': [-25.3, 133.8], 'CA': [56.1, -106.3], 'RU': [61.5, 105.3],
  'ZA': [-30.6, 22.9], 'NG': [9.1, 8.7], 'EG': [26.8, 30.8],
  'AO': [-11.2, 17.9], 'MZ': [-18.7, 35.5], 'KR': [35.9, 127.8],
  'Brasil': [-14.2, -51.9], 'Brazil': [-14.2, -51.9],
  'United States': [37.1, -95.7], 'Portugal': [39.4, -8.2],
  'Argentina': [-38.4, -63.6], 'Mexico': [23.6, -102.5],
  'Germany': [51.2, 10.5], 'France': [46.2, 2.2],
  'Spain': [40.5, -3.7], 'Italy': [41.9, 12.6],
  'United Kingdom': [55.4, -3.4], 'Japan': [36.2, 138.3],
  'Desconhecido': [-14.2, -51.9], // default to Brazil
};

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function GlobePoints({ points, maxCount }: { points: GeoPoint[]; maxCount: number }) {
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group ref={groupRef}>
      {points.map((point, i) => {
        const pos = latLngToVector3(point.lat, point.lng, 1.02);
        const scale = Math.max(0.02, Math.min(0.08, (point.count / maxCount) * 0.08));
        const intensity = Math.max(0.3, Math.min(1, point.count / maxCount));

        return (
          <group key={i} position={pos}>
            <mesh>
              <sphereGeometry args={[scale, 8, 8]} />
              <meshBasicMaterial color={new THREE.Color(0.2, 1, 0.4)} transparent opacity={intensity} />
            </mesh>
            {/* Glow ring */}
            <mesh>
              <ringGeometry args={[scale * 1.2, scale * 2, 16]} />
              <meshBasicMaterial color={new THREE.Color(0.2, 1, 0.4)} transparent opacity={intensity * 0.3} side={THREE.DoubleSide} />
            </mesh>
            {point.count > 1 && (
              <Html distanceFactor={5} style={{ pointerEvents: 'none' }}>
                <div className="bg-background/90 border border-border rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap shadow-lg">
                  {point.country}: {point.count}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#1a1a2e"
        metalness={0.1}
        roughness={0.8}
        transparent
        opacity={0.95}
      />
      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.001, 32, 32]} />
        <meshBasicMaterial color="#2a2a4e" wireframe transparent opacity={0.3} />
      </mesh>
    </mesh>
  );
}

function GlobeScene({ points, maxCount }: { points: GeoPoint[]; maxCount: number }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      <GlobeMesh />
      <GlobePoints points={points} maxCount={maxCount} />
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={1.5}
        maxDistance={4}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

interface AnalyticsGlobeProps {
  countryData: { country: string; count: number }[];
}

export function AnalyticsGlobe({ countryData }: AnalyticsGlobeProps) {
  const { points, maxCount } = useMemo(() => {
    const pts: GeoPoint[] = [];
    let max = 1;
    for (const d of countryData) {
      const coords = COUNTRY_COORDS[d.country];
      if (coords) {
        pts.push({ country: d.country, count: d.count, lat: coords[0], lng: coords[1] });
        if (d.count > max) max = d.count;
      }
    }
    // If no data or only unknown, add Brazil as default
    if (pts.length === 0) {
      pts.push({ country: 'Brasil', count: 1, lat: -14.2, lng: -51.9 });
    }
    return { points: pts, maxCount: max };
  }, [countryData]);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden bg-[#0a0a1a] relative">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
          <GlobeScene points={points} maxCount={maxCount} />
        </Canvas>
      </Suspense>
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground/70">
        Arraste para girar • Scroll para zoom
      </div>
    </div>
  );
}
