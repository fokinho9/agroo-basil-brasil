import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface GeoPoint {
  label: string;
  count: number;
  lat: number;
  lng: number;
  type: 'country' | 'region' | 'city';
}

interface AnalyticsGlobeProps {
  countryData: { country: string; count: number }[];
  cityData?: { city: string; region: string; country: string; count: number; lat?: number; lng?: number }[];
}

// Extended coords including Brazilian states and major cities
const COORDS: Record<string, [number, number]> = {
  // Countries
  'BR': [-14.2, -51.9], 'US': [37.1, -95.7], 'PT': [39.4, -8.2],
  'AR': [-38.4, -63.6], 'MX': [23.6, -102.5], 'CO': [4.6, -74.3],
  'CL': [-35.7, -71.5], 'Peru': [-9.2, -75.0], 'UY': [-32.5, -55.8],
  'PY': [-23.4, -58.4], 'BO': [-16.3, -63.6], 'EC': [-1.8, -78.2],
  'VE': [6.4, -66.6], 'DE': [51.2, 10.5], 'FR': [46.2, 2.2],
  'Espanha': [40.5, -3.7], 'IT': [41.9, 12.6], 'GB': [55.4, -3.4],
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
  // Brazilian states
  'AC': [-9.97, -67.81], 'AL': [-9.57, -36.78], 'AP': [1.41, -51.77],
  'AM': [-3.42, -65.86], 'BA': [-12.97, -38.51], 'CE': [-3.72, -38.53],
  'DF': [-15.79, -47.88], 'ES': [-20.32, -40.34], 'GO': [-16.68, -49.25],
  'MA': [-2.53, -44.28], 'MT': [-15.6, -56.1], 'MS': [-20.44, -54.65],
  'MG': [-19.92, -43.94], 'PA': [-1.46, -48.5], 'PB': [-7.12, -34.86],
  'PR': [-25.43, -49.27], 'PE': [-8.05, -34.87], 'PI': [-5.09, -42.8],
  'RJ': [-22.91, -43.17], 'RN': [-5.79, -35.21], 'RS': [-30.03, -51.23],
  'RO': [-8.76, -63.9], 'RR': [2.82, -60.67], 'SC': [-27.59, -48.55],
  'SP': [-23.55, -46.63], 'SE': [-10.91, -37.07], 'TO': [-10.18, -48.33],
  // Major Brazilian cities
  'São Paulo': [-23.55, -46.63], 'Rio de Janeiro': [-22.91, -43.17],
  'Brasília': [-15.79, -47.88], 'Salvador': [-12.97, -38.51],
  'Fortaleza': [-3.72, -38.53], 'Belo Horizonte': [-19.92, -43.94],
  'Manaus': [-3.12, -60.02], 'Curitiba': [-25.43, -49.27],
  'Recife': [-8.05, -34.87], 'Porto Alegre': [-30.03, -51.23],
  'Belém': [-1.46, -48.5], 'Goiânia': [-16.68, -49.25],
  'Guarulhos': [-23.46, -46.53], 'Campinas': [-22.91, -47.06],
  'São Luís': [-2.53, -44.28], 'Maceió': [-9.67, -35.74],
  'Campo Grande': [-20.44, -54.65], 'Cuiabá': [-15.6, -56.1],
  'Tangará da Serra': [-14.62, -57.5], 'Natal': [-5.79, -35.21],
  'Teresina': [-5.09, -42.8], 'João Pessoa': [-7.12, -34.86],
  'Aracaju': [-10.91, -37.07], 'Florianópolis': [-27.59, -48.55],
  'Vitória': [-20.32, -40.34], 'Palmas': [-10.18, -48.33],
  'Macapá': [0.03, -51.07], 'Rio Branco': [-9.97, -67.81],
  'Boa Vista': [2.82, -60.67], 'Porto Velho': [-8.76, -63.9],
  'Uberlândia': [-18.92, -48.28], 'Ribeirão Preto': [-21.18, -47.81],
  'Sorocaba': [-23.5, -47.46], 'Londrina': [-23.3, -51.17],
  'Joinville': [-26.3, -48.84], 'Juiz de Fora': [-21.76, -43.35],
  'Niterói': [-22.88, -43.1], 'Santos': [-23.96, -46.33],
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

const BASE_WIDTH = 800;
const BASE_HEIGHT = 450;

export function AnalyticsGlobe({ countryData, cityData = [] }: AnalyticsGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<GeoPoint | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedPoint, setSelectedPoint] = useState<GeoPoint | null>(null);

  const { points, maxCount } = useMemo(() => {
    const pts: GeoPoint[] = [];
    let max = 1;

    // Add city-level data first (more specific)
    for (const d of cityData) {
      const coords = d.lat && d.lng ? [d.lat, d.lng] as [number, number] : COORDS[d.city] || COORDS[d.region];
      if (coords) {
        pts.push({ label: `${d.city}, ${d.region}`, count: d.count, lat: coords[0], lng: coords[1], type: 'city' });
        if (d.count > max) max = d.count;
      }
    }

    // Add country-level for countries without city detail
    const cityCoveredCountries = new Set(cityData.map(c => c.country));
    for (const d of countryData) {
      if (cityData.length > 0 && cityCoveredCountries.has(d.country)) continue;
      const coords = COORDS[d.country];
      if (coords) {
        pts.push({ label: d.country, count: d.count, lat: coords[0], lng: coords[1], type: 'country' });
        if (d.count > max) max = d.count;
      }
    }

    if (pts.length === 0) pts.push({ label: 'Brasil', count: 1, lat: -14.2, lng: -51.9, type: 'country' });
    return { points: pts, maxCount: max };
  }, [countryData, cityData]);

  const dotGrid = useMemo(() => {
    const spacing = zoom >= 2 ? 2 : 3;
    const dots: { x: number; y: number }[] = [];
    for (let lat = 78; lat > -58; lat -= spacing) {
      for (let lng = -168; lng < 180; lng += spacing) {
        if (isLand(lat, lng)) {
          const [x, y] = latLngToXY(lat, lng, BASE_WIDTH, BASE_HEIGHT);
          dots.push({ x, y });
        }
      }
    }
    return dots;
  }, [zoom]);

  const handleZoom = useCallback((delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(8, prev + delta)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedPoint(null);
  }, []);

  const focusOnBrazil = useCallback(() => {
    setZoom(3);
    const [bx, by] = latLngToXY(-14.2, -51.9, BASE_WIDTH, BASE_HEIGHT);
    setPan({ x: BASE_WIDTH / 2 - bx * 3, y: BASE_HEIGHT / 2 - by * 3 });
  }, []);

  // Mouse/touch pan handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [pan]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -0.3 : 0.3);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [handleZoom]);

  const viewBox = `0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleZoom(0.5)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleZoom(-0.5)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={resetView}>
            <Maximize2 className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={focusOnBrazil}>
            🇧🇷 Brasil
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          Zoom: {zoom.toFixed(1)}x • {points.length} localizações
        </span>
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden relative select-none"
        style={{
          aspectRatio: '16/9',
          background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <svg
          viewBox={viewBox}
          className="w-full h-full"
          style={{
            display: 'block',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          <defs>
            <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Land dot grid */}
          {dotGrid.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={zoom >= 3 ? 0.8 : 1}
              fill="hsl(var(--muted-foreground))"
              opacity={0.2}
            />
          ))}

          {/* Data points */}
          {points.map((point, i) => {
            const [x, y] = latLngToXY(point.lat, point.lng, BASE_WIDTH, BASE_HEIGHT);
            const intensity = Math.max(0.4, point.count / maxCount);
            const isCity = point.type === 'city';
            const baseR = isCity ? 3 : 5;
            const r = Math.max(baseR, Math.min(14, (point.count / maxCount) * 14));
            const isSelected = selectedPoint?.label === point.label;

            return (
              <g
                key={i}
                onPointerEnter={() => setHoveredPoint(point)}
                onPointerLeave={() => setHoveredPoint(null)}
                onClick={(e) => { e.stopPropagation(); setSelectedPoint(isSelected ? null : point); }}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow */}
                <circle cx={x} cy={y} r={r * 2.5} fill="hsl(var(--primary))" opacity={intensity * 0.08} filter="url(#glow2)" />
                <circle cx={x} cy={y} r={r * 1.4} fill="hsl(var(--primary))" opacity={intensity * 0.15} />
                {/* Main dot */}
                <circle cx={x} cy={y} r={r} fill="hsl(var(--primary))" opacity={intensity * 0.7} />
                {/* Center bright */}
                <circle cx={x} cy={y} r={Math.max(1.5, r * 0.3)} fill="hsl(var(--primary-foreground))" opacity={0.9} />
                {/* Pulse ring */}
                <circle cx={x} cy={y} r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.5} opacity={intensity * 0.3}>
                  <animate attributeName="r" from={String(r)} to={String(r * 2.5)} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from={String(intensity * 0.3)} to="0" dur="3s" repeatCount="indefinite" />
                </circle>
                {/* Selection ring */}
                {isSelected && (
                  <circle cx={x} cy={y} r={r + 3} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.5} opacity={0.8} />
                )}
                {/* Label at high zoom */}
                {zoom >= 2.5 && (
                  <text
                    x={x}
                    y={y - r - 4}
                    textAnchor="middle"
                    fill="hsl(var(--foreground))"
                    fontSize={Math.max(6, 10 / zoom)}
                    fontFamily="system-ui, sans-serif"
                    fontWeight={600}
                    opacity={0.8}
                  >
                    {point.label.length > 20 ? point.label.slice(0, 18) + '…' : point.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Hover tooltip */}
          {hoveredPoint && (() => {
            const [x, y] = latLngToXY(hoveredPoint.lat, hoveredPoint.lng, BASE_WIDTH, BASE_HEIGHT);
            const text = `${hoveredPoint.label}: ${hoveredPoint.count} sessões`;
            const tw = Math.max(100, text.length * 6 + 20);
            const tx = x + tw > BASE_WIDTH ? x - tw - 5 : x + 15;
            const ty = y < 30 ? y + 20 : y - 15;
            return (
              <g>
                <rect x={tx} y={ty - 12} width={tw} height={22} rx={4}
                  fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth={0.5} opacity={0.95} />
                <text x={tx + 8} y={ty + 3} fill="hsl(var(--popover-foreground))" fontSize={9} fontFamily="system-ui, sans-serif" fontWeight={500}>
                  {text}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Selected point detail */}
      {selectedPoint && (
        <div className="p-3 bg-muted/50 rounded-lg border flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{selectedPoint.label}</p>
            <p className="text-xs text-muted-foreground">
              {selectedPoint.count} sessão{selectedPoint.count !== 1 ? 's' : ''} •{' '}
              {selectedPoint.type === 'city' ? 'Cidade' : 'País'}
            </p>
          </div>
          <Badge variant="outline">{selectedPoint.count}</Badge>
        </div>
      )}
    </div>
  );
}
