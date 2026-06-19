import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { FullListingForm } from "./schema";

const ROOM_TYPES = [
  { value: "single", label: "Single room" },
  { value: "shared_double", label: "Shared (double)" },
  { value: "shared_triple", label: "Shared (triple)" },
  { value: "self_contained", label: "Self-contained" },
  { value: "cottage", label: "Cottage" },
];

export function StepCoreDetails() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<FullListingForm>();

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Listing title</Label>
        <Input id="title" {...register("title")} placeholder="e.g. Sunny self-contained cottage near UZ" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          {...register("description")}
          rows={5}
          className="w-full rounded-md border border-ink-900/15 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-clay-500"
          placeholder="Describe the space, the neighbourhood, and what makes it a good fit for students..."
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="pricePerMonthUsd">Rent per month (USD)</Label>
          <Input id="pricePerMonthUsd" type="number" {...register("pricePerMonthUsd")} placeholder="150" />
          {errors.pricePerMonthUsd && <p className="text-xs text-destructive">{errors.pricePerMonthUsd.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="occupancyLimit">Occupancy limit</Label>
          <Input id="occupancyLimit" type="number" {...register("occupancyLimit")} placeholder="1" />
          {errors.occupancyLimit && <p className="text-xs text-destructive">{errors.occupancyLimit.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Room type</Label>
        <Select
          value={watch("roomType")}
          onValueChange={(v) => setValue("roomType", v as FullListingForm["roomType"], { shouldValidate: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            {ROOM_TYPES.map((rt) => (
              <SelectItem key={rt.value} value={rt.value}>
                {rt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.roomType && <p className="text-xs text-destructive">{errors.roomType.message as string}</p>}
      </div>
    </div>
  );
}
