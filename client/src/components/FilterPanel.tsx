import { useState, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Filter, X, ChevronDown, ChevronUp, BedDouble, Bath, Armchair, Car, Home, Search, MapPin, Loader2 } from "lucide-react";
import type { PropertyFilter } from "@shared/schema";

interface FilterPanelProps {
  filters: PropertyFilter;
  onFiltersChange: (filters: PropertyFilter) => void;
  onRefresh: () => void;
  lastFetched: string | null;
  isRefreshing: boolean;
  totalProperties: number;
  filteredCount: number;
  hideRefresh?: boolean;
  availablePropertyTypes?: string[];
  availableParkingTypes?: string[];
  onLocationSearch?: (lat: number, lng: number, name: string) => void;
}

function RangeSliderField({
  label,
  icon: Icon,
  min,
  max,
  value,
  onChange,
  testIdPrefix,
}: {
  label: string;
  icon: any;
  min: number;
  max: number;
  value: [number, number];
  onChange: (val: [number, number]) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#4A6492]" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
          {value[0]} - {value[1] >= max ? `${max}+` : value[1]}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="w-full"
        data-testid={`slider-${testIdPrefix}`}
      />
      <div className="flex justify-between gap-1 text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}+</span>
      </div>
    </div>
  );
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  onRefresh,
  lastFetched,
  isRefreshing,
  totalProperties,
  filteredCount,
  hideRefresh,
  availablePropertyTypes = [],
  availableParkingTypes = [],
  onLocationSearch,
}: FilterPanelProps) {
  const [parkingOpen, setParkingOpen] = useState(false);
  const [propertyTypeOpen, setPropertyTypeOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleLocationSearch = useCallback(async () => {
    const query = locationQuery.trim();
    if (!query || !onLocationSearch) return;
    setLocationSearching(true);
    setLocationError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", UK")}&format=json&limit=1&countrycodes=gb`,
        { headers: { "Accept": "application/json" } }
      );
      const results = await res.json();
      if (results.length > 0) {
        const { lat, lon, display_name } = results[0];
        onLocationSearch(parseFloat(lat), parseFloat(lon), display_name);
        setLocationError(null);
      } else {
        setLocationError("Location not found");
      }
    } catch {
      setLocationError("Search failed");
    } finally {
      setLocationSearching(false);
    }
  }, [locationQuery, onLocationSearch]);

  const handleLocationKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleLocationSearch();
      }
    },
    [handleLocationSearch]
  );

  const updateFilter = useCallback(
    (key: keyof PropertyFilter, value: any) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const toggleParkingType = useCallback(
    (type: string) => {
      const current = filters.parkingTypes || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      updateFilter("parkingTypes", updated);
    },
    [filters.parkingTypes, updateFilter]
  );

  const togglePropertyType = useCallback(
    (type: string) => {
      const current = filters.propertyTypes || [];
      const updated = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      updateFilter("propertyTypes", updated);
    },
    [filters.propertyTypes, updateFilter]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({
      bedroomsMin: 0,
      bedroomsMax: 10,
      bathroomsMin: 0,
      bathroomsMax: 10,
      receptionRoomsMin: 0,
      receptionRoomsMax: 10,
      parkingTypes: [],
      propertyTypes: [],
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.bedroomsMin > 0 ||
    filters.bedroomsMax < 10 ||
    filters.bathroomsMin > 0 ||
    filters.bathroomsMax < 10 ||
    filters.receptionRoomsMin > 0 ||
    filters.receptionRoomsMax < 10 ||
    (filters.parkingTypes && filters.parkingTypes.length > 0) ||
    (filters.propertyTypes && filters.propertyTypes.length > 0);

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return "Never";
    const date = new Date(ts);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-background" data-testid="filter-panel">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between gap-1 mb-1">
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Property Map</h1>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                className="text-xs text-muted-foreground"
                data-testid="button-clear-filters"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span data-testid="text-property-count">
            {filteredCount === totalProperties
              ? `${totalProperties} properties`
              : `${filteredCount} of ${totalProperties} properties`}
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Filtered
            </Badge>
          )}
        </div>
      </div>

      {onLocationSearch && (
        <div className="px-4 pt-3 pb-2 border-b">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[#4A6492]" />
            <span className="text-sm font-medium text-foreground">Location Search</span>
          </div>
          <div className="relative flex gap-1.5">
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => { setLocationQuery(e.target.value); setLocationError(null); }}
              onKeyDown={handleLocationKeyDown}
              placeholder="Search city or town..."
              className="flex-1 px-3 py-2 text-sm bg-muted/50 border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4A6492]/30 focus:border-[#4A6492]"
              data-testid="input-location-search"
            />
            <button
              onClick={handleLocationSearch}
              disabled={locationSearching || !locationQuery.trim()}
              className="px-3 py-2 rounded-md bg-[#4A6492] text-white text-sm font-medium hover:bg-[#3A5482] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="button-location-search"
            >
              {locationSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
          {locationError && (
            <p className="text-xs text-destructive mt-1.5" data-testid="text-location-error">{locationError}</p>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          Filters
        </div>

        <RangeSliderField
          label="Bedrooms"
          icon={BedDouble}
          min={0}
          max={10}
          value={[filters.bedroomsMin, filters.bedroomsMax]}
          onChange={([min, max]) => onFiltersChange({ ...filters, bedroomsMin: min, bedroomsMax: max })}
          testIdPrefix="bedrooms"
        />

        <RangeSliderField
          label="Bathrooms"
          icon={Bath}
          min={0}
          max={10}
          value={[filters.bathroomsMin, filters.bathroomsMax]}
          onChange={([min, max]) => onFiltersChange({ ...filters, bathroomsMin: min, bathroomsMax: max })}
          testIdPrefix="bathrooms"
        />

        <RangeSliderField
          label="Reception Rooms"
          icon={Armchair}
          min={0}
          max={10}
          value={[filters.receptionRoomsMin, filters.receptionRoomsMax]}
          onChange={([min, max]) => onFiltersChange({ ...filters, receptionRoomsMin: min, receptionRoomsMax: max })}
          testIdPrefix="reception-rooms"
        />

        {availablePropertyTypes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-[#4A6492]" />
              <span className="text-sm font-medium text-foreground">Property Type</span>
              {filters.propertyTypes && filters.propertyTypes.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {filters.propertyTypes.length}
                </Badge>
              )}
            </div>

            <button
              onClick={() => setPropertyTypeOpen(!propertyTypeOpen)}
              className="w-full flex items-center justify-between gap-1 px-3 py-2 text-sm bg-muted/50 border rounded-md text-foreground"
              data-testid="button-property-type-dropdown"
            >
              <span className="text-muted-foreground">
                {filters.propertyTypes && filters.propertyTypes.length > 0
                  ? `${filters.propertyTypes.length} selected`
                  : "All property types"}
              </span>
              {propertyTypeOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {propertyTypeOpen && (
              <div className="space-y-1 border rounded-md p-2 bg-muted/30 max-h-48 overflow-y-auto">
                {availablePropertyTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm text-foreground hover:bg-muted/50 transition-colors"
                    data-testid={`checkbox-property-type-${type.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.propertyTypes?.includes(type) || false}
                      onChange={() => togglePropertyType(type)}
                      className="w-4 h-4 rounded border-border text-[#4A6492] focus:ring-[#4A6492] focus:ring-offset-0"
                    />
                    {type}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {availableParkingTypes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-[#4A6492]" />
              <span className="text-sm font-medium text-foreground">Parking Type</span>
              {filters.parkingTypes && filters.parkingTypes.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {filters.parkingTypes.length}
                </Badge>
              )}
            </div>

            <button
              onClick={() => setParkingOpen(!parkingOpen)}
              className="w-full flex items-center justify-between gap-1 px-3 py-2 text-sm bg-muted/50 border rounded-md text-foreground"
              data-testid="button-parking-dropdown"
            >
              <span className="text-muted-foreground">
                {filters.parkingTypes && filters.parkingTypes.length > 0
                  ? `${filters.parkingTypes.length} selected`
                  : "All parking types"}
              </span>
              {parkingOpen ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {parkingOpen && (
              <div className="space-y-1 border rounded-md p-2 bg-muted/30 max-h-48 overflow-y-auto">
                {availableParkingTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm text-foreground hover:bg-muted/50 transition-colors"
                    data-testid={`checkbox-parking-${type.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.parkingTypes?.includes(type) || false}
                      onChange={() => toggleParkingType(type)}
                      className="w-4 h-4 rounded border-border text-[#4A6492] focus:ring-[#4A6492] focus:ring-offset-0"
                    />
                    {type}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!hideRefresh && (
        <div className="p-4 border-t bg-muted/30">
          <Button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full bg-[#4A6492] text-white"
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-2" data-testid="text-last-fetched">
            Last updated: {formatTimestamp(lastFetched)}
          </p>
        </div>
      )}
    </div>
  );
}
