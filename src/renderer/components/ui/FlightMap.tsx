import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import type { FlightHubSnapshot } from '@shared/types';
import L from 'leaflet';

interface FlightMapProps {
  tracking: FlightHubSnapshot['tracking'];
}

function MapController({ center }: { center: L.LatLngTuple }) {
  const map = useMap();
  const followingRef = useRef(true);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onDragStart = () => {
      followingRef.current = false;
      clearResumeTimer();
    };
    const onDragEnd = () => {
      clearResumeTimer();
      resumeTimerRef.current = setTimeout(() => {
        followingRef.current = true;
      }, 5000);
    };

    map.on('dragstart', onDragStart);
    map.on('dragend', onDragEnd);

    return () => {
      map.off('dragstart', onDragStart);
      map.off('dragend', onDragEnd);
      clearResumeTimer();
    };
  }, [map, clearResumeTimer]);

  useEffect(() => {
    if (followingRef.current) {
      map.setView(center, map.getZoom(), { animate: false });
    }
  }, [map, center[0], center[1]]);

  return null;
}

const DEFAULT_CENTER: L.LatLngTuple = [31.2304, 121.4737];

export const FlightMap = memo(function FlightMap({ tracking }: FlightMapProps) {
  const center = useMemo((): L.LatLngTuple => {
    const position = tracking.position;
    return position ? [position.lat, position.lon] : DEFAULT_CENTER;
  }, [tracking.position?.lat, tracking.position?.lon]);

  const polylinePositions = useMemo(
    () => tracking.track.map((point) => [point.lat, point.lon] as L.LatLngTuple),
    [tracking.track]
  );

  const markerPosition = useMemo((): L.LatLngTuple | null => {
    const position = tracking.position;
    return position ? [position.lat, position.lon] : null;
  }, [tracking.position?.lat, tracking.position?.lon]);

  return (
    <MapContainer
      center={center}
      zoom={6}
      preferCanvas
      zoomAnimation={false}
      fadeAnimation={false}
      markerZoomAnimation={false}
      style={{ height: 560, width: '100%' }}
    >
      <MapController center={center} />
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        maxZoom={18}
      />
      <Polyline positions={polylinePositions} pathOptions={{ color: '#7fcfff', weight: 4 }} />
      {markerPosition && <Marker position={markerPosition} />}
    </MapContainer>
  );
});
