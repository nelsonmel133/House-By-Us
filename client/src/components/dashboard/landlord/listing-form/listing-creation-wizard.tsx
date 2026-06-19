import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StepProgressRail } from "./step-progress-rail";
import { StepCoreDetails } from "./step-core-details";
import { StepAmenitiesLocation } from "./step-amenities-location";
import { StepMediaUpload } from "./step-media-upload";
import {
  fullListingSchema,
  coreDetailsSchema,
  amenitiesLocationSchema,
  mediaSchema,
  type FullListingForm,
} from "./schema";

const STEP_SCHEMAS = [coreDetailsSchema, amenitiesLocationSchema, mediaSchema];

export function ListingCreationWizard({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const methods = useForm<FullListingForm>({
    resolver: zodResolver(fullListingSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      pricePerMonthUsd: undefined as unknown as number,
      roomType: undefined as unknown as FullListingForm["roomType"],
      occupancyLimit: 1,
      area: "",
      address: "",
      coordinates: { lat: 0, lng: 0 },
      utilities: [],
      houseRules: "",
      mediaFiles: [],
    },
  });

  async function goNext() {
    const schema = STEP_SCHEMAS[step - 1];
    const values = methods.getValues();
    const result = schema.safeParse(values);
    if (!result.success) {
      // Surface field errors for just this step's fields by triggering validation.
      await methods.trigger(Object.keys(schema.shape) as any);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      // trpc.listings.create.mutate(values)
      await new Promise((r) => setTimeout(r, 1200));
      setIsSubmitting(false);
      setIsDone(true);
      onComplete?.();
    }
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  if (isDone) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 className="h-14 w-14 text-forest-500" />
        </motion.div>
        <h2 className="mt-4 font-display text-xl font-bold text-ink-900">Listing submitted for review</h2>
        <p className="mt-1.5 max-w-sm text-sm text-ink-400">
          Our team typically verifies new listings within 24 hours. You'll get a notification once it's live.
        </p>
        <Button className="mt-6" onClick={() => { setIsDone(false); setStep(1); methods.reset(); }}>
          Create another listing
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <StepProgressRail currentStep={step} />

      <FormProvider {...methods}>
        <form className="mt-7" onSubmit={(e) => e.preventDefault()}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && <StepCoreDetails />}
              {step === 2 && <StepAmenitiesLocation />}
              {step === 3 && <StepMediaUpload />}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between border-t border-ink-900/8 pt-5">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 1} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button type="button" onClick={goNext} disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : step === 3 ? (
                "Submit for review"
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </Card>
  );
}
