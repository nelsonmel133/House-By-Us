import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_LABELS } from "./schema";

export function StepProgressRail({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isComplete = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  scale: isCurrent ? 1.08 : 1,
                  backgroundColor: isComplete || isCurrent ? "#C2542D" : "#F2EBDA",
                  color: isComplete || isCurrent ? "#FFFFFF" : "#5E5752",
                }}
                transition={{ duration: 0.25 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              >
                {isComplete ? <Check className="h-4 w-4" /> : stepNum}
              </motion.div>
              <span className={cn("hidden text-xs font-medium sm:block", isCurrent ? "text-ink-900" : "text-ink-400")}>
                {label}
              </span>
            </div>
            {stepNum < STEP_LABELS.length && (
              <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-sand-200">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-clay-500"
                  initial={false}
                  animate={{ width: isComplete ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
