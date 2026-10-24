'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Sparkles } from 'lucide-react';
import { getSmartTransitInfo, SmartTransitInfo } from '@/lib/utils/distance';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  campusLat?: number;
  campusLng?: number;
  campusName?: string;
  onChange: (lat: number, lng: number) => void;
}

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

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to prevent SSR window reference errors
    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current) return;

      // If map already exists, just update position
      if (mapRef.current) {
        return;
      }

      // Initialize map instance
      const map = L.map(containerRef.current, {
        center: [latitude || 41.0082, longitude || 28.9784],
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: false, // Prevent page scroll trapping
      });

      mapRef.current = map;

      // High-resolution Retina Voyager tiles by CartoDB
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(map);

      // Custom Listing Pin SVG HTML
      const listingIcon = L.divIcon({
        className: 'custom-listing-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: grab;">
            <div style="position: absolute; width: 14px; height: 14px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; transform: scale(2.2); animation: pulse 2s infinite;"></div>
            <div style="width: 34px; height: 34px; background: #059669; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 12px rgba(5,150,105,0.45); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Draggable listing marker
      const marker = L.marker([latitude, longitude], {
        icon: listingIcon,
        draggable: true,
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
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <div style="width: 30px; height: 30px; background: #4f46e5; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(79,70,229,0.35); display: flex; align-items: center; justify-content: center; color: white;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const campusMarker = L.marker([campusLat, campusLng], {
          icon: campusIcon,
          interactive: true,
        }).addTo(map);

        if (campusName) {
          campusMarker.bindTooltip(campusName, {
            permanent: false,
            direction: 'top',
            offset: [0, -16],
          });
        }

        campusMarkerRef.current = campusMarker;
      }
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        campusMarkerRef.current = null;
      }
    };
  }, []);

  // Sync marker position & map view if coordinates change externally (e.g. from dropdown)
  useEffect(() => {
    if (mapRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapRef.current.flyTo([latitude, longitude], 15, { duration: 0.8 });
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
          offset: [0, -16],
        });
      }
    }
  }, [campusLat, campusLng, campusName]);

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          Haritada Konum Seçimi
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          İşareti sürükleyebilir veya haritaya tıklayarak konumu netleştirebilirsiniz.
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner bg-slate-100 h-64 sm:h-72 w-full">
        {/* Leaflet container */}
        <div ref={containerRef} className="w-full h-full z-0" />

        {/* Real-time Transit Overlay Badge */}
        {transitInfo && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs">
              <span className="text-base shrink-0">{transitInfo.icon}</span>
              <div className="truncate">
                <span className="font-extrabold text-slate-900">
                  {campusName ? `${campusName}: ` : 'Kampüse: '}
                </span>
                <span className="font-bold text-emerald-700">
                  {transitInfo.distanceFormatted}
                </span>
                <span className="text-slate-600 ml-1">
                  ({transitInfo.estimatedMinutes} dk{' '}
                  {transitInfo.transitType === 'WALKING'
                    ? 'yürüme'
                    : transitInfo.transitType === 'BUS'
                    ? 'toplu taşıma'
                    : 'metroyla'}
                  )
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Coordinates indicator at bottom-right */}
        <div className="absolute bottom-2 right-2 z-10 pointer-events-none bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
          {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
