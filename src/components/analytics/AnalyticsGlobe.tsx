import { useMemo, useRef, useState } from 'react';

interface GeoPoint {
  country: string;
  count: number;
  lat: number;
  lng: number;
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'BR': [-14.2, -51.9], 'US': [37.1, -95.7], 'PT': [39.4, -8.2],
  'AR': [-38.4, -63.6], 'MX': [23.6, -102.5], 'CO': [4.6, -74.3],
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
  'Colombia': [4.6, -74.3], 'Chile': [-35.7, -71.5],
  'Desconhecido': [-14.2, -51.9],
};

function latLngToXY(lat: number, lng: number, width: number, height: number): [number, number] {
  const x = ((lng + 180) / 360) * width;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = height / 2 - (mercN / Math.PI) * (height / 2);
  return [x, y];
}

function isLand(lat: number, lng: number): boolean {
  if (lat > 25 && lat < 72 && lng > -170 && lng < -50) return true;
  if (lat > 7 && lat <= 25 && lng > -120 && lng < -75) return true;
  if (lat > -56 && lat <= 12 && lng > -82 && lng < -34) return true;
  if (lat > 35 && lat < 72 && lng > -12 && lng < 45) return true;
  if (lat > -36 && lat < 38 && lng > -18 && lng < 52) return true;
  if (lat > 12 && lat < 42 && lng > 25 && lng < 65) return true;
  if (lat > 40 && lat < 75 && lng > 45 && lng < 180) return true;
  if (lat > 6 && lat <= 40 && lng > 65 && lng < 98) return true;
  if (lat > -10 && lat < 28 && lng > 95 && lng < 140) return true;
  if (lat > 20 && lat < 55 && lng > 100 && lng < 145) return true;
  if (lat > 30 && lat < 46 && lng > 128 && lng < 146) return true;
  if (lat > -45 && lat < -10 && lng > 112 && lng < 155) return true;
  if (lat > -10 && lat < 6 && lng > 95 && lng < 141) return true;
  if (lat > 50 && lat < 60 && lng > -12 && lng < 2) return true;
  return false;
}

interface AnalyticsGlobeProps {
  countryData: { country: string; count: number }[];
}

export function AnalyticsGlobe({ countryData }: AnalyticsGlobeProps) {
  const [hoveredPoint, setHoveredPoint] = useState<GeoPoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const WIDTH = 800;
  const HEIGHT = 400;

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
    if (pts.length === 0) pts.push({ country: 'Brasil', count: 1, lat: -14.2, lng: -51.9 });
    return { points: pts, maxCount: max };
  }, [countryData]);

  const dotGrid = useMemo(() => {
    const dots: { x: number; y: number }[] = [];
    for (let lat = 78; lat > -58; lat -= 3) {
      for (let lng = -168; lng < 180; lng += 3) {
        if (isLand(lat, lng)) {
          const [x, y] = latLngToXY(lat, lng, WIDTH, HEIGHT);
          dots.push({ x, y });
        }
      }
    }
    return dots;
  }, []);

  return (
    <div className="w-full rounded-xl overflow-hidden relative" style={{ aspectRatio: '2/1', background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1e 100%)' }}>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full" style={{ display: 'block' }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-lg" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Land dot grid */}
        {dotGrid.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={1} fill="#2d2d52" opacity={0.5} />
        ))}

        {/* Data points */}
        {points.map((point, i) => {
          const [x, y] = latLngToXY(point.lat, point.lng, WIDTH, HEIGHT);
          const intensity = Math.max(0.4, point.count / maxCount);
          const r = Math.max(4, Math.min(14, (point.count / maxCount) * 14));

          return (
            <g key={i} onMouseEnter={() => setHoveredPoint(point)} onMouseLeave={() => setHoveredPoint(null)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r={r * 3} fill="#6366f1" opacity={intensity * 0.06} filter="url(#glow-lg)" />
              <circle cx={x} cy={y} r={r * 1.6} fill="#6366f1" opacity={intensity * 0.12} filter="url(#glow)" />
              <circle cx={x} cy={y} r={r} fill="#6366f1" opacity={intensity * 0.6} filter="url(#glow)" />
              <circle cx={x} cy={y} r={Math.max(2, r * 0.35)} fill="#c7d2fe" opacity={0.9} />
              <circle cx={x} cy={y} r={r} fill="none" stroke="#818cf8" strokeWidth={0.5} opacity={intensity * 0.3}>
                <animate attributeName="r" from={String(r)} to={String(r * 2.5)} dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" from={String(intensity * 0.3)} to="0" dur="3s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredPoint && (() => {
          const [x, y] = latLngToXY(hoveredPoint.lat, hoveredPoint.lng, WIDTH, HEIGHT);
          const tx = x > WIDTH - 130 ? x - 110 : x + 18;
          const ty = y > HEIGHT - 40 ? y - 32 : y - 8;
          const tw = Math.max(85, hoveredPoint.country.length * 7.5 + 50);
          return (
            <g>
              <rect x={tx - 6} y={ty - 15} width={tw} height={26} rx={6} fill="#1e1b4b" stroke="#4338ca" strokeWidth={1} opacity={0.95} />
              <text x={tx} y={ty + 3} fill="#e0e7ff" fontSize={11} fontFamily="system-ui, sans-serif" fontWeight={600}>
                {hoveredPoint.country}: {hoveredPoint.count} sessões
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
