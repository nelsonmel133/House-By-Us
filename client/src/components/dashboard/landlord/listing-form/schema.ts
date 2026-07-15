import { z } from "zod";

export const coreDetailsSchema = z.object({
  title: z.string().min(8, "Give your listing a descriptive title (min 8 characters)"),
  description: z.string().min(40, "Description should be at least 40 characters"),
  pricePerMonthUsd: z.coerce.number().min(20, "Minimum rent is $20/month").max(2000),
  roomType: z.enum(["single", "shared_double", "shared_triple", "self_contained", "cottage"]),
  occupancyLimit: z.coerce.number().min(1).max(10),
});

export const amenitiesLocationSchema = z.object({
  area: z.string().min(1, "Select an area"),
  address: z.string().min(6, "Enter a street address"),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  utilities: z.array(z.string()).min(1, "Select at least one utility"),
  houseRules: z.string().optional(),
});

export const mediaSchema = z.object({
  mediaFiles: z
    .array(
      z.object({
        id: z.string(),
        fileName: z.string(),
        progress: z.number(),
        status: z.enum(["queued", "uploading", "done", "error"]),
        previewUrl: z.string().optional(),
      })
    )
    .min(3, "Upload at least 3 photos so students can see the space clearly"),
});

export const fullListingSchema = coreDetailsSchema.merge(amenitiesLocationSchema).merge(mediaSchema);

export type CoreDetailsForm = z.infer<typeof coreDetailsSchema>;
export type AmenitiesLocationForm = z.infer<typeof amenitiesLocationSchema>;
export type MediaForm = z.infer<typeof mediaSchema>;
export type FullListingForm = z.infer<typeof fullListingSchema>;

export const STEP_LABELS = ["Core details", "Amenities & location", "Photos & video"] as const;
