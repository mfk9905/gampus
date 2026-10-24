'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers, Crosshair } from 'lucide-react';
import { getSmartTransitInfo, SmartTransitInfo } from '@/lib/utils/distance';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  campusLat?: number;
  campusLng?: number;
  campusName?: string;
  onChange: (lat: number, lng: number) => void;
}

// Google Maps high-speed tile endpoints (reliable, high-detail, never blocked)
const GOOGLE_STREET_TILE_URL = 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
const GOOGLE_HYBRID_TILE_URL = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
const ESRI_STREET_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

export default function LocationPickerMap({
  latitude,
  longitude,
  campusLat,
  campusLng,
  campusName,
  onChange,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const campusMarkerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const leafletInstanceRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [transitInfo, setTransitInfo] = useState<SmartTransitInfo | null>(null);

  // Update smart transit calculation whenever listing or campus coords change
  useEffect(() => {
    if (latitude && longitude && campusLat && campusLng) {
      const info = getSmartTransitInfo(latitude, longitude, campusLat, campusLng);
      setTransitInfo(info);
    } else {
      setTransitInfo(null);
    }
  }, [latitude, longitude, campusLat, campusLng]);

  // Helper to create tile layer
  const createTileLayer = (L: any, type: 'street' | 'satellite') => {
    if (type === 'satellite') {
      return L.tileLayer(GOOGLE_HYBRID_TILE_URL, {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 20,
      });
    }

    const layer = L.tileLayer(GOOGLE_STREET_TILE_URL, {
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; Google Maps',
      maxZoom: 20,
    });

    // Fallback to Esri World Street if Google is ever unreachable
    layer.on('tileerror', () => {
      if (mapRef.current && layer === tileLayerRef.current) {
        mapRef.current.removeLayer(layer);
        const fallback = L.tileLayer(ESRI_STREET_TILE_URL, {
          attribution: '&copy; Esri',
          maxZoom: 19,
        });
        fallback.addTo(mapRef.current);
        tileLayerRef.current = fallback;
      }
    });

    return layer;
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;

    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current) return;

      leafletInstanceRef.current = L;

      // If map already exists, return
      if (mapRef.current) return;

      // Initialize map instance with custom controls positioning
      const map = L.map(containerRef.current, {
        center: [latitude || 40.9841, longitude || 29.0267],
        zoom: 15,
        zoomControl: false, // We reposition zoom controls to bottom-right to avoid badge clash
        scrollWheelZoom: false,
        touchZoom: true,
      });

      mapRef.current = map;

      // Add zoom control at bottomright so top-left badges never collide
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add high-resolution Google Maps Layer
      const baseLayer = createTileLayer(L, 'street');
      baseLayer.addTo(map);
      tileLayerRef.current = baseLayer;

      // Custom Listing Pin SVG HTML
      const listingIcon = L.divIcon({
        className: 'custom-listing-pin',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <div style="position: absolute; width: 14px; height: 14px; background: rgba(5, 150, 105, 0.45); border-radius: 50%; transform: scale(2.2); animation: pulse 2s infinite;"></div>
            <div style="width: 38px; height: 38px; background: #059669; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 14px rgba(5,150,105,0.5); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      // Draggable listing marker
      const marker = L.marker([latitude, longitude], {
        icon: listingIcon,
        draggable: true,
        autoPan: true,
      }).addTo(map);

      markerRef.current = marker;

      // When pin is dragged, call onChange
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      // When user clicks anywhere on the map, move the pin
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onChange(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });

      // If campus coordinates are available, add campus landmark marker
      if (campusLat && campusLng) {
        const campusIcon = L.divIcon({
          className: 'custom-campus-pin',
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 32px; height: 32px; background: #4f46e5; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(79,70,229,0.4); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const campusMarker = L.marker([campusLat, campusLng], {
          icon: campusIcon,
          interactive: true,
        }).addTo(map);

        if (campusName) {
          campusMarker.bindTooltip(campusName, {
            permanent: false,
            direction: 'top',
            offset: [0, -18],
          });
        }

        campusMarkerRef.current = campusMarker;
      }

      // Invalidate sizes repeatedly on render so tiles load completely
      requestAnimationFrame(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      });
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 150);
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 500);

      // ResizeObserver to adjust whenever container size changes
      if (containerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        });
        resizeObserver.observe(containerRef.current);
      }
    });

    return () => {
      isMounted = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        campusMarkerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Handle map style toggle (Street vs Satellite)
  const handleMapTypeToggle = (type: 'street' | 'satellite') => {
    setMapType(type);
    const map = mapRef.current;
    const L = leafletInstanceRef.current;
    if (!map || !L) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayer = createTileLayer(L, type);
    newLayer.addTo(map);
    tileLayerRef.current = newLayer;

    map.invalidateSize();
  };

  // Center on listing marker
  const handleCenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([latitude, longitude], 16, { duration: 0.6 });
    }
  };

  // Sync marker position & map view if coordinates change externally
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.flyTo([latitude, longitude], 15, { duration: 0.8 });
        setTimeout(() => {
          if (mapRef.current) mapRef.current.invalidateSize();
        }, 300);
      }
    }
  }, [latitude, longitude]);

  // Sync campus marker if campus changes
  useEffect(() => {
    if (mapRef.current && campusMarkerRef.current && campusLat && campusLng) {
      campusMarkerRef.current.setLatLng([campusLat, campusLng]);
      if (campusName) {
        campusMarkerRef.current.unbindTooltip();
        campusMarkerRef.current.bindTooltip(campusName, {
          permanent: false,
          direction: 'top',
          offset: [0, -18],
        });
      }
    }
  }, [campusLat, campusLng, campusName]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Haritada Konum Seçimi
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          İşareti sürükleyebilir veya haritaya dokunarak konumu belirleyebilirsiniz.
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 h-64 sm:h-80 w-full touch-pan-x touch-pan-y">
        {/* Leaflet container */}
        <div
          ref={containerRef}
          className="w-full h-full min-h-[256px] sm:min-h-[320px] z-0"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Real-time Transit Overlay Badge (Top Left, responsive) */}
        {transitInfo && (
          <div className="absolute top-2.5 left-2.5 max-w-[calc(100%-140px)] sm:max-w-md z-10 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 flex items-center gap-2 text-[11px] sm:text-xs">
              <span className="text-sm sm:text-base shrink-0">{transitInfo.icon}</span>
              <div className="truncate">
                <span className="font-extrabold text-slate-900">
                  {campusName ? `${campusName}: ` : 'Kampüse: '}
                </span>
                <span className="font-bold text-emerald-700">
                  {transitInfo.distanceFormatted}
                </span>
                <span className="text-slate-600 ml-1 font-medium hidden xs:inline sm:inline">
                  ({transitInfo.estimatedMinutes} dk{' '}
                  {transitInfo.transitType === 'WALKING'
                    ? 'yürüme'
                    : transitInfo.transitType === 'BUS'
                    ? 'otobüs'
                    : 'metroyla'}
                  )
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Map Type Switcher & Recenter Controls (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-md text-[11px] sm:text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleMapTypeToggle('street')}
            className={`px-2 py-1 rounded-lg transition-all ${
              mapType === 'street'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Harita
          </button>
          <button
            type="button"
            onClick={() => handleMapTypeToggle('satellite')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              mapType === 'satellite'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            Uydu
          </button>
          <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={handleCenter}
            title="İşaretçiyi Ortala"
            className="p-1 text-slate-600 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Coordinates indicator at bottom-left to not clash with bottom-right zoom controls */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xs">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
