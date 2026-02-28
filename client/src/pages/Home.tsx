import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import PropertyMap from "@/components/PropertyMap";
import FilterPanel from "@/components/FilterPanel";
import MobileFilterSheet, { MobileFilterBar } from "@/components/MobileFilterSheet";
import type { Property, PropertyFilter, PropertiesResponse } from "@shared/schema";

const DEFAULT_FILTERS: PropertyFilter = {
  bedroomsMin: 0,
  bedroomsMax: 10,
  bathroomsMin: 0,
  bathroomsMax: 10,
  receptionRoomsMin: 0,
  receptionRoomsMax: 10,
  parkingTypes: [],
  propertyTypes: [],
};

function applyFilters(properties: Property[], filters: PropertyFilter): Property[] {
  return properties.filter((p) => {
    if (p.bedrooms != null) {
      if (p.bedrooms < filters.bedroomsMin) return false;
      if (filters.bedroomsMax < 10 && p.bedrooms > filters.bedroomsMax) return false;
    }
    if (p.bathrooms != null) {
      if (p.bathrooms < filters.bathroomsMin) return false;
      if (filters.bathroomsMax < 10 && p.bathrooms > filters.bathroomsMax) return false;
    }
    if (p.receptionRooms != null) {
      if (p.receptionRooms < filters.receptionRoomsMin) return false;
      if (filters.receptionRoomsMax < 10 && p.receptionRooms > filters.receptionRoomsMax) return false;
    }
    if (filters.parkingTypes && filters.parkingTypes.length > 0) {
      if (!p.parking || !filters.parkingTypes.some((type) => 
        p.parking?.toLowerCase().includes(type.toLowerCase())
      )) {
        return false;
      }
    }
    if (filters.propertyTypes && filters.propertyTypes.length > 0) {
      if (!p.type || !filters.propertyTypes.some((type) =>
        p.type?.toLowerCase() === type.toLowerCase()
      )) {
        return false;
      }
    }
    return true;
  });
}

export default function Home() {
  const [filters, setFilters] = useState<PropertyFilter>(DEFAULT_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  const { data, isLoading, isFetching, error } = useQuery<PropertiesResponse>({
    queryKey: ["/api/properties", refreshKey],
    queryFn: async () => {
      const url = refreshKey > 0
        ? `${basePath}/api/properties?refresh=true`
        : `${basePath}/api/properties`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to load properties (${res.status})`);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const properties = data?.properties || [];
  const lastFetched = data?.lastFetched || null;

  const filteredProperties = useMemo(
    () => applyFilters(properties, filters),
    [properties, filters]
  );

  const availablePropertyTypes = useMemo(() => {
    const types = new Set<string>();
    properties.forEach((p) => {
      if (p.type) types.add(p.type);
    });
    return Array.from(types).sort();
  }, [properties]);

  const availableParkingTypes = useMemo(() => {
    const types = new Set<string>();
    properties.forEach((p) => {
      if (p.parking) types.add(p.parking);
    });
    return Array.from(types).sort();
  }, [properties]);

  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleMapReady = useCallback((map: L.Map) => {
    mapInstanceRef.current = map;
  }, []);

  const handleLocationSearch = useCallback((lat: number, lng: number, _name: string) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1.5 });
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const hasActiveFilters =
    filters.bedroomsMin > 0 ||
    filters.bedroomsMax < 10 ||
    filters.bathroomsMin > 0 ||
    filters.bathroomsMax < 10 ||
    filters.receptionRoomsMin > 0 ||
    filters.receptionRoomsMax < 10 ||
    (filters.parkingTypes && filters.parkingTypes.length > 0) ||
    (filters.propertyTypes && filters.propertyTypes.length > 0);

  const filterProps = {
    filters,
    onFiltersChange: setFilters,
    onRefresh: handleRefresh,
    lastFetched,
    isRefreshing: isFetching,
    totalProperties: properties.length,
    filteredCount: filteredProperties.length,
    availablePropertyTypes,
    availableParkingTypes,
    onLocationSearch: handleLocationSearch,
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row" data-testid="page-home">
      <aside className="hidden md:flex md:w-80 lg:w-96 border-r flex-shrink-0 h-full">
        <FilterPanel {...filterProps} />
      </aside>

      <div className="flex-1 flex flex-col h-full">
        <MobileFilterBar
          filteredCount={filteredProperties.length}
          totalProperties={properties.length}
          hasActiveFilters={hasActiveFilters}
          onOpen={() => setMobileFiltersOpen(true)}
        />

        <main className="flex-1 relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 shadow-md max-w-md" data-testid="error-banner">
              <p className="text-sm font-medium">Failed to load properties</p>
              <p className="text-xs mt-1 opacity-80">{error.message}</p>
              <button
                onClick={handleRefresh}
                className="text-xs font-medium underline mt-1"
                data-testid="button-retry"
              >
                Try again
              </button>
            </div>
          )}
          <PropertyMap
            properties={filteredProperties}
            isLoading={isLoading}
            onMapReady={handleMapReady}
          />
        </main>
      </div>

      {mobileFiltersOpen && (
        <MobileFilterSheet
          {...filterProps}
          onClose={() => setMobileFiltersOpen(false)}
        />
      )}
    </div>
  );
}
