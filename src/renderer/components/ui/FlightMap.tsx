import { memo, useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import type { FlightHubSnapshot } from '@shared/types';
import L from 'leaflet';

interface FlightMapProps {
  tracking: FlightHubSnapshot['tracking'];
}

function MapController({ center }: { center: L.LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: false });
  }, [map, center[0], center[1]]);
  return null;
}

export const FlightMap = memo(function FlightMap({ tracking }: FlightMapProps) {
  const center = useMemo((): L.LatLngTuple => {
    const position = tracking.position;
    return position ? [position.lat, position.lon] : [31.2304, 121.4737];
  }, [tracking.position?.lat, tracking.position?.lon]);

  const polylinePositions = useMemo(
    () => tracking.track.map((point) => [point.lat, point.lon] as L.LatLngTuple),
    [tracking.track]
  );

  const markerPosition = tracking.position
    ? ([tracking.position.lat, tracking.position.lon] as L.LatLngTuple)
    : null;

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
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <Polyline positions={polylinePositions} pathOptions={{ color: '#7fcfff', weight: 4 }} />
      {markerPosition && <Marker position={markerPosition} />}
    </MapContainer>
  );
});
