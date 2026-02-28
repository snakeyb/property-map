import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Property } from "@shared/schema";

const DEFAULT_CENTER: [number, number] = [51.5074, -0.1278];
const DEFAULT_ZOOM = 7;

function createCustomIcon(count?: number) {
  if (count) {
    return L.divIcon({
      html: `<div style="background:#4A6492;color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">${count}</div>`,
      className: "custom-cluster-icon",
      iconSize: L.point(40, 40),
      iconAnchor: L.point(20, 20),
    });
  }
  return L.divIcon({
    html: `<div style="background:#4A6492;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    className: "custom-marker-icon",
    iconSize: L.point(16, 16),
    iconAnchor: L.point(8, 8),
  });
}

function formatAddress(property: Property): string {
  const parts = [
    property.addressStreet,
    property.addressCity,
    property.addressState,
    property.addressPostalCode,
    property.addressCountry,
  ].filter(Boolean);
  return parts.join(", ") || "Address not available";
}

function createPopupContent(property: Property): string {
  const address = formatAddress(property);
  const listingUrl = property.listingUrl || "";

  return `
    <div style="min-width:280px;max-width:320px;font-family:Inter,system-ui,sans-serif;">
      <div style="padding:16px;">
        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:600;color:#1F2937;line-height:1.3;">${property.name || "Unnamed Property"}</h3>
        ${property.type ? `<span style="display:inline-block;background:#EEF2FF;color:#4A6492;font-size:12px;font-weight:500;padding:2px 8px;border-radius:6px;margin-bottom:12px;">${property.type}</span>` : ""}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0;">
          ${property.bedrooms != null ? `<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#4B5563;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A6492" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>${property.bedrooms} Bed${property.bedrooms !== 1 ? "s" : ""}</div>` : ""}
          ${property.bathrooms != null ? `<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#4B5563;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A6492" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M7 19v2"/><path d="M17 19v2"/></svg>${property.bathrooms} Bath${property.bathrooms !== 1 ? "s" : ""}</div>` : ""}
          ${property.receptionRooms != null ? `<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#4B5563;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A6492" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/></svg>${property.receptionRooms} Recep</div>` : ""}
          ${property.parking ? `<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:#4B5563;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A6492" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>${property.parking}</div>` : ""}
        </div>
        <div style="display:flex;align-items:flex-start;gap:6px;padding:8px 0;border-top:1px solid #E5E7EB;margin-top:4px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:2px;flex-shrink:0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style="font-size:12px;color:#6B7280;line-height:1.4;">${address}</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px;margin-top:10px;padding-top:10px;border-top:1px solid #E5E7EB;">
          <a href="https://pf.wspp.co.uk/#CUnits/view/${property.id}" target="_blank" rel="noopener noreferrer" title="Open in PropertyPipeline" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid #E5E7EB;background:#F9FAFB;color:#4A6492;cursor:pointer;transition:all .2s;text-decoration:none;" data-testid="link-property-pipeline" onmouseover="this.style.background='#EEF2FF';this.style.borderColor='#4A6492'" onmouseout="this.style.background='#F9FAFB';this.style.borderColor='#E5E7EB'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </a>
          ${listingUrl ? `
          <a href="${listingUrl}" target="_blank" rel="noopener noreferrer" title="Open listing" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid #E5E7EB;background:#F9FAFB;color:#4A6492;cursor:pointer;transition:all .2s;text-decoration:none;" data-testid="link-listing-url" onmouseover="this.style.background='#EEF2FF';this.style.borderColor='#4A6492'" onmouseout="this.style.background='#F9FAFB';this.style.borderColor='#E5E7EB'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <button onclick="navigator.clipboard.writeText('${listingUrl}').then(function(){var btn=event.target.closest('button');btn.querySelector('svg').innerHTML='<polyline points=&quot;20 6 9 17 4 12&quot;></polyline>';btn.querySelector('svg').setAttribute('stroke','#10B981');setTimeout(function(){btn.querySelector('svg').innerHTML='<rect width=&quot;14&quot; height=&quot;14&quot; x=&quot;8&quot; y=&quot;8&quot; rx=&quot;2&quot; ry=&quot;2&quot;></rect><path d=&quot;M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2&quot;></path>';btn.querySelector('svg').setAttribute('stroke','#4A6492');},1500)})" title="Copy listing URL" style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1px solid #E5E7EB;background:#F9FAFB;color:#4A6492;cursor:pointer;transition:all .2s;" data-testid="button-copy-url" onmouseover="this.style.background='#EEF2FF';this.style.borderColor='#4A6492'" onmouseout="this.style.background='#F9FAFB';this.style.borderColor='#E5E7EB'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
          </button>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

interface PropertyMapProps {
  properties: Property[];
  isLoading: boolean;
  onMapReady?: (map: L.Map) => void;
}

export default function PropertyMap({ properties, isLoading, onMapReady }: PropertyMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerClusterRef = useRef<any>(null);
  const initialFitDoneRef = useRef(false);

  const mappableProperties = useMemo(
    () => properties.filter((p) => p.latitude != null && p.longitude != null),
    [properties]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerClusterRef.current) {
      map.removeLayer(markerClusterRef.current);
    }

    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 40;
        let fontSize = 14;
        if (count >= 100) {
          size = 50;
          fontSize = 15;
        } else if (count >= 10) {
          size = 45;
          fontSize = 14;
        }
        return L.divIcon({
          html: `<div style="background:#4A6492;color:white;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:${fontSize}px;box-shadow:0 2px 8px rgba(74,100,146,0.4);border:3px solid white;font-family:Inter,system-ui,sans-serif;">${count}</div>`,
          className: "custom-cluster-icon",
          iconSize: L.point(size, size),
          iconAnchor: L.point(size / 2, size / 2),
        });
      },
    });

    mappableProperties.forEach((property) => {
      const marker = L.marker([property.latitude!, property.longitude!], {
        icon: L.divIcon({
          html: `<div style="background:#E53E3E;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
          className: "custom-marker-icon",
          iconSize: L.point(24, 24),
          iconAnchor: L.point(12, 12),
        }),
      });

      marker.bindPopup(createPopupContent(property), {
        maxWidth: 340,
        minWidth: 280,
        className: "property-popup",
        closeButton: true,
        autoPan: true,
        autoPanPadding: L.point(40, 40),
      });

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    markerClusterRef.current = clusterGroup;

    if (!initialFitDoneRef.current && mappableProperties.length > 0) {
      const bounds = L.latLngBounds(
        mappableProperties.map((p) => [p.latitude!, p.longitude!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      initialFitDoneRef.current = true;
    }
  }, [mappableProperties]);

  return (
    <div className="relative w-full h-full" data-testid="map-container">
      <div ref={mapContainerRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#4A6492] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-muted-foreground">Loading properties...</span>
          </div>
        </div>
      )}
      {!isLoading && mappableProperties.length === 0 && properties.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-background border rounded-lg px-4 py-3 shadow-md">
          <p className="text-sm text-muted-foreground">No properties with location data match your filters</p>
        </div>
      )}
    </div>
  );
}
