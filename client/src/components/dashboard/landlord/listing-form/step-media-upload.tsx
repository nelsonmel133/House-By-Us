import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useFormContext } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, CheckCircle2, AlertTriangle, Loader2, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { FullListingForm } from "./schema";

/**
 * Simulates the real upload pipeline:
 *  1. trpc.listings.requestPresignedUpload.mutate({ fileName, contentType })
 *     -> { uploadUrl, fileKey }
 *  2. PUT the file directly to `uploadUrl` (S3), tracking progress via XHR
 *     upload.onprogress.
 *  3. On 200, mark status "done" and store `fileKey` against the listing draft.
 * Here we simulate steps 2-3 with a timer so the UI/UX can be reviewed
 * without a live bucket.
 */
function simulateUpload(
  fileId: string,
  onProgress: (id: string, progress: number) => void,
  onComplete: (id: string, ok: boolean) => void
) {
  let progress = 0;
  const fails = Math.random() < 0.08;
  const interval = setInterval(() => {
    progress += Math.random() * 18 + 6;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      onProgress(fileId, progress);
      setTimeout(() => onComplete(fileId, !fails), 250);
    } else {
      onProgress(fileId, progress);
    }
  }, 280);
}

export function StepMediaUpload() {
  const { watch, setValue, formState: { errors } } = useFormContext<FullListingForm>();
  const mediaFiles = watch("mediaFiles") ?? [];

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newEntries = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        fileName: file.name,
        progress: 0,
        status: "queued" as const,
        previewUrl: URL.createObjectURL(file),
      }));

      setValue("mediaFiles", [...mediaFiles, ...newEntries], { shouldValidate: true });

      // Kick off the (simulated) presigned-upload flow for each file.
      newEntries.forEach((entry) => {
        setValue(
          "mediaFiles",
          [...mediaFiles, ...newEntries].map((f) => (f.id === entry.id ? { ...f, status: "uploading" } : f)),
          { shouldValidate: true }
        );

        simulateUpload(
          entry.id,
          (id, progress) => {
            const current = watch("mediaFiles") ?? [];
            setValue(
              "mediaFiles",
              current.map((f) => (f.id === id ? { ...f, progress } : f)),
              { shouldValidate: false }
            );
          },
          (id, ok) => {
            const current = watch("mediaFiles") ?? [];
            setValue(
              "mediaFiles",
              current.map((f) => (f.id === id ? { ...f, status: ok ? "done" : "error", progress: 100 } : f)),
              { shouldValidate: true }
            );
          }
        );
      });
    },
    [mediaFiles, setValue, watch]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "video/*": [] },
    multiple: true,
  });

  function removeFile(id: string) {
    setValue("mediaFiles", mediaFiles.filter((f) => f.id !== id), { shouldValidate: true });
  }

  function retryFile(id: string) {
    const current = mediaFiles.map((f) => (f.id === id ? { ...f, status: "uploading" as const, progress: 0 } : f));
    setValue("mediaFiles", current, { shouldValidate: true });
    simulateUpload(
      id,
      (fid, progress) => {
        const c = watch("mediaFiles") ?? [];
        setValue("mediaFiles", c.map((f) => (f.id === fid ? { ...f, progress } : f)), { shouldValidate: false });
      },
      (fid, ok) => {
        const c = watch("mediaFiles") ?? [];
        setValue(
          "mediaFiles",
          c.map((f) => (f.id === fid ? { ...f, status: ok ? "done" : "error", progress: 100 } : f)),
          { shouldValidate: true }
        );
      }
    );
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragActive ? "border-clay-500 bg-clay-50" : "border-ink-900/15 bg-sand-100 hover:bg-sand-200/60"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className={cn("h-9 w-9", isDragActive ? "text-clay-500" : "text-ink-400")} />
        <p className="mt-3 text-sm font-semibold text-ink-900">
          {isDragActive ? "Drop your photos here" : "Drag & drop photos or video"}
        </p>
        <p className="mt-1 text-xs text-ink-400">or click to browse · JPG, PNG, MP4 up to 25MB each</p>
      </div>

      {errors.mediaFiles && (
        <p className="text-xs text-destructive">{(errors.mediaFiles as any).message ?? "Please add at least 3 photos"}</p>
      )}

      <AnimatePresence>
        {mediaFiles.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mediaFiles.map((f) => (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative overflow-hidden rounded-lg border border-ink-900/10 bg-white"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-sand-200">
                  {f.previewUrl ? (
                    <img src={f.previewUrl} alt={f.fileName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-ink-400" />
                    </div>
                  )}

                  <button
                    onClick={() => removeFile(f.id)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-ink-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {f.status !== "done" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900/55 p-3">
                      {f.status === "error" ? (
                        <>
                          <AlertTriangle className="h-5 w-5 text-clay-300" />
                          <button
                            onClick={() => retryFile(f.id)}
                            className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-ink-900"
                          >
                            Retry upload
                          </button>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <Progress value={f.progress} className="h-1.5 w-full" />
                          <span className="font-mono text-[10px] text-white/90">{Math.round(f.progress)}%</span>
                        </>
                      )}
                    </div>
                  )}

                  {f.status === "done" && (
                    <div className="absolute right-1.5 bottom-1.5 rounded-full bg-forest-500 p-1">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-[11px] text-ink-400">{f.fileName}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
