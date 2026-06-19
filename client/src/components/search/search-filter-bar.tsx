import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger, Checkbox, Slider, Separator } from "@/components/ui/primitives";
import { Label } from "@/components/ui/label";
import type { HarareArea, SearchFilters, Utility } from "@/types/domain";
import { UTILITY_LABELS } from "@/types/domain";
import { cn } from "@/lib/utils";

const AREAS: HarareArea[] = [
  "Mount Pleasant",
  "Belgravia",
  "Avondale",
  "Hillside",
  "Msasa",
  "Eastlea",
  "Marlborough",
  "Chinhoyi (CUT proximity)",
  "Mabelreign",
  "Greendale",
];

const UTILITIES: Utility[] = ["borehole", "solar", "wifi", "prepaid_electricity", "security_guard", "fenced_yard"];

interface SearchFilterBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  resultCount: number;
}

export function SearchFilterBar({ filters, onChange, resultCount }: SearchFilterBarProps) {
  const [areaOpen, setAreaOpen] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const [utilOpen, setUtilOpen] = useState(false);

  const activeFilterCount =
    filters.areas.length + filters.utilities.length + (filters.priceMin > 0 || filters.priceMax < 300 ? 1 : 0);

  function toggleArea(area: HarareArea) {
    const next = filters.areas.includes(area)
      ? filters.areas.filter((a) => a !== area)
      : [...filters.areas, area];
    onChange({ ...filters, areas: next });
  }

  function toggleUtility(u: Utility) {
    const next = filters.utilities.includes(u)
      ? filters.utilities.filter((x) => x !== u)
      : [...filters.utilities, u];
    onChange({ ...filters, utilities: next });
  }

  function clearAll() {
    onChange({ ...filters, areas: [], utilities: [], priceMin: 0, priceMax: 300 });
  }

  return (
    <div className="border-b border-ink-900/8 bg-white/95 backdrop-blur-sm">
      <div className="flex flex-col gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              value={filters.query}
              onChange={(e) => onChange({ ...filters, query: e.target.value })}
              placeholder="Search by area, e.g. 'Mount Pleasant near UZ'"
              className="h-11 pl-9 text-sm"
            />
          </div>

          {/* Area filter */}
          <Popover open={areaOpen} onOpenChange={setAreaOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="default" className="hidden h-11 shrink-0 gap-1.5 md:flex">
                Area
                {filters.areas.length > 0 && (
                  <Badge className="ml-0.5 h-5 min-w-5 justify-center px-1">{filters.areas.length}</Badge>
                )}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Harare areas</p>
              <div className="grid max-h-64 gap-1.5 overflow-y-auto scrollbar-thin">
                {AREAS.map((area) => (
                  <label key={area} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-sand-100">
                    <Checkbox checked={filters.areas.includes(area)} onCheckedChange={() => toggleArea(area)} />
                    <span className="text-sm">{area}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Price filter */}
          <Popover open={priceOpen} onOpenChange={setPriceOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="default" className="hidden h-11 shrink-0 gap-1.5 md:flex">
                Price
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">Monthly rent (USD)</p>
              <Slider
                min={0}
                max={300}
                step={5}
                value={[filters.priceMin, filters.priceMax]}
                onValueChange={([min, max]) => onChange({ ...filters, priceMin: min, priceMax: max })}
              />
              <div className="mt-3 flex items-center justify-between font-mono text-sm text-ink-600">
                <span>${filters.priceMin}</span>
                <span>${filters.priceMax}+</span>
              </div>
            </PopoverContent>
          </Popover>

          {/* Utilities filter */}
          <Popover open={utilOpen} onOpenChange={setUtilOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="default" className="h-11 shrink-0 gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Utilities</span>
                {filters.utilities.length > 0 && (
                  <Badge className="ml-0.5 h-5 min-w-5 justify-center px-1">{filters.utilities.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Essential utilities</p>
              <div className="grid gap-1.5">
                {UTILITIES.map((u) => (
                  <label key={u} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-sand-100">
                    <Checkbox checked={filters.utilities.includes(u)} onCheckedChange={() => toggleUtility(u)} />
                    <span className="text-sm">{UTILITY_LABELS[u]}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filter chips + result count */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-400">{resultCount} listings</span>
          <AnimatePresence>
            {filters.areas.map((area) => (
              <motion.button
                key={area}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => toggleArea(area)}
                className="flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-forest-600 hover:bg-forest-100"
              >
                {area} <X className="h-3 w-3" />
              </motion.button>
            ))}
            {filters.utilities.map((u) => (
              <motion.button
                key={u}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => toggleUtility(u)}
                className="flex items-center gap-1 rounded-full bg-clay-50 px-2.5 py-0.5 text-xs font-medium text-clay-600 hover:bg-clay-100"
              >
                {UTILITY_LABELS[u]} <X className="h-3 w-3" />
              </motion.button>
            ))}
          </AnimatePresence>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs font-medium text-ink-400 underline hover:text-clay-600">
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
