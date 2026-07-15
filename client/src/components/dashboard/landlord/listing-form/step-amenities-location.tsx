import { useFormContext } from "react-hook-form";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/primitives";
import { UTILITY_LABELS, type Utility } from "@/types/domain";
import type { FullListingForm } from "./schema";
import { LocationPickerMap } from "./location-picker-map";

const AREAS = [
  "Mount Pleasant", "Belgravia", "Avondale", "Hillside", "Msasa",
  "Eastlea", "Marlborough", "Chinhoyi (CUT proximity)", "Mabelreign", "Greendale",
];

const ALL_UTILITIES = Object.keys(UTILITY_LABELS) as Utility[];

export function StepAmenitiesLocation() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<FullListingForm>();

  const utilities = watch("utilities") ?? [];
  const coordinates = watch("coordinates") ?? { lat: 0, lng: 0 };

  function toggleUtility(u: Utility) {
    const next = utilities.includes(u) ? utilities.filter((x) => x !== u) : [...utilities, u];
    setValue("utilities", next, { shouldValidate: true });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Area</Label>
          <Select value={watch("area")} onValueChange={(v) => setValue("area", v, { shouldValidate: true })}>
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.area && <p className="text-xs text-destructive">{errors.area.message as string}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Street address</Label>
          <Input id="address" {...register("address")} placeholder="14 Glenara Avenue" />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Pin the exact location
        </Label>
        <p className="text-xs text-ink-400">Click on the map to drop a pin at the property's exact location.</p>
        <LocationPickerMap
          coordinates={coordinates}
          onChange={(c) => setValue("coordinates", c, { shouldValidate: true })}
        />
        {errors.coordinates && (
          <p className="text-xs text-destructive">Please pin a location on the map</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Essential utilities</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_UTILITIES.map((u) => (
            <label
              key={u}
              className="flex items-center gap-2 rounded-lg border border-ink-900/10 px-3 py-2.5 hover:bg-sand-100"
            >
              <Checkbox checked={utilities.includes(u)} onCheckedChange={() => toggleUtility(u)} />
              <span className="text-sm">{UTILITY_LABELS[u]}</span>
            </label>
          ))}
        </div>
        {errors.utilities && <p className="text-xs text-destructive">{errors.utilities.message as string}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="houseRules">House rules (optional, one per line)</Label>
        <textarea
          id="houseRules"
          {...register("houseRules")}
          rows={3}
          className="w-full rounded-md border border-ink-900/15 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-clay-500"
          placeholder={"No overnight guests after 10pm\nNo smoking indoors"}
        />
      </div>
    </div>
  );
}
