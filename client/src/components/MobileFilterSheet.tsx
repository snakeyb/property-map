import { X, Filter, RefreshCw } from "lucide-react";
import FilterPanel from "./FilterPanel";
import type { PropertyFilter } from "@shared/schema";

interface MobileFilterSheetProps {
  filters: PropertyFilter;
  onFiltersChange: (filters: PropertyFilter) => void;
  onRefresh: () => void;
  lastFetched: string | null;
  isRefreshing: boolean;
  totalProperties: number;
  filteredCount: number;
  onClose: () => void;
  availablePropertyTypes?: string[];
  availableParkingTypes?: string[];
  onLocationSearch?: (lat: number, lng: number, name: string) => void;
}

export default function MobileFilterSheet(props: MobileFilterSheetProps) {
  const { onClose, ...filterProps } = props;

  return (
    <div
      className="fixed inset-0 bg-white flex flex-col md:hidden"
      style={{ zIndex: 10000 }}
      data-testid="mobile-filter-panel"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b bg-[#4A6492] text-white">
        <span className="font-semibold text-base">Filters</span>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-white/20"
          data-testid="button-close-filters"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <FilterPanel {...filterProps} hideRefresh />
      </div>
      <div className="px-4 py-3 border-t bg-gray-50 space-y-2">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-md bg-[#4A6492] text-white font-medium text-sm"
          data-testid="button-apply-filters"
        >
          Show {props.filteredCount} properties
        </button>
        <button
          onClick={props.onRefresh}
          disabled={props.isRefreshing}
          className="w-full py-2 rounded-md border border-[#4A6492] text-[#4A6492] font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
          data-testid="button-refresh-mobile"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${props.isRefreshing ? "animate-spin" : ""}`} />
          {props.isRefreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>
    </div>
  );
}

export function MobileFilterBar({
  filteredCount,
  totalProperties,
  hasActiveFilters,
  onOpen,
}: {
  filteredCount: number;
  totalProperties: number;
  hasActiveFilters: boolean;
  onOpen: () => void;
}) {
  return (
    <div className="flex md:hidden items-center justify-between px-3 py-2 bg-white border-b" data-testid="mobile-filter-bar">
      <span className="text-xs text-gray-500" data-testid="text-mobile-count">
        {filteredCount === totalProperties
          ? `${totalProperties} properties`
          : `${filteredCount} of ${totalProperties}`}
      </span>
      <button
        onClick={onOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-[#4A6492] text-white"
        data-testid="button-mobile-filters"
      >
        <Filter className="w-3.5 h-3.5" />
        Filters
        {hasActiveFilters && (
          <span className="bg-white/25 text-[10px] px-1.5 py-0.5 rounded">
            Active
          </span>
        )}
      </button>
    </div>
  );
}
