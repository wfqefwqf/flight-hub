import { memo, useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import type { FlightHubSnapshot } from '@shared/types';
import gcoord from 'gcoord';
import L from 'leaflet';

interface FlightMapProps {
  tracking: FlightHubSnapshot['tracking'];
}

function toGCJ02(lng: number, lat: number): [number, number] {
  const result = gcoord.transform([lng, lat], gcoord.WGS84, gcoord.GCJ02);
  return [result[0], result[1]];
}

function MapController({ center }: { center: L.LatLngTuple }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: false });
  }, [map, center[0], center[1]]);
  return null;
}

const DEFAULT_CENTER_GCJ02: L.LatLngTuple = (() => {
  const [lng, lat] = gcoord.transform([121.4737, 31.2304], gcoord.WGS84, gcoord.GCJ02);
  return [lat, lng];
})();

export const FlightMap = memo(function FlightMap({ tracking }: FlightMapProps) {
  const center = useMemo((): L.LatLngTuple => {
    const position = tracking.position;
    if (position) {
      const [gcjLng, gcjLat] = toGCJ02(position.lon, position.lat);
      return [gcjLat, gcjLng];
    }
    return DEFAULT_CENTER_GCJ02;
  }, [tracking.position?.lat, tracking.position?.lon]);

  const polylinePositions = useMemo(
    () =>
      tracking.track.map((point) => {
        const [gcjLng, gcjLat] = toGCJ02(point.lon, point.lat);
        return [gcjLat, gcjLng] as L.LatLngTuple;
      }),
    [tracking.track]
  );

  const markerPosition = useMemo((): L.LatLngTuple | null => {
    const position = tracking.position;
    if (!position) return null;
    const [gcjLng, gcjLat] = toGCJ02(position.lon, position.lat);
    return [gcjLat, gcjLng];
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
        url="https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}"
        subdomains={['1', '2', '3', '4']}
        attribution="&copy; 高德地图"
      />
      <Polyline positions={polylinePositions} pathOptions={{ color: '#7fcfff', weight: 4 }} />
      {markerPosition && <Marker position={markerPosition} />}
    </MapContainer>
  );
});
