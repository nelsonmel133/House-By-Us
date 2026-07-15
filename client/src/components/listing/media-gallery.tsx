import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Expand, PlayCircle } from "lucide-react";
import type { ListingMedia } from "@/types/domain";

interface MediaGalleryProps {
  media: ListingMedia[];
  title: string;
}

export function MediaGallery({ media, title }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const hero = media[0];
  const rest = media.slice(1, 5);

  function next() {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % media.length);
  }
  function prev() {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + media.length) % media.length);
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-xl md:h-[420px]">
        <button
          onClick={() => setLightboxIndex(0)}
          className="group relative col-span-4 h-64 overflow-hidden md:col-span-2 md:row-span-2 md:h-full"
        >
          {hero?.type === "video" && (
            <PlayCircle className="absolute left-1/2 top-1/2 z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" />
          )}
          <img
            src={hero?.url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-ink-900/0 transition-colors group-hover:bg-ink-900/10" />
        </button>

        {rest.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setLightboxIndex(i + 1)}
            className="group relative hidden h-full overflow-hidden md:block"
          >
            <img src={m.url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
            <div className="absolute inset-0 bg-ink-900/0 transition-colors group-hover:bg-ink-900/10" />
            {i === rest.length - 1 && media.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-900/50 text-sm font-semibold text-white">
                +{media.length - 5} more
              </div>
            )}
          </button>
        ))}

        <button
          onClick={() => setLightboxIndex(0)}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-card backdrop-blur-sm hover:bg-white"
        >
          <Expand className="h-3.5 w-3.5" /> View all photos
        </button>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/95 p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-6"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              src={media[lightboxIndex].url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-6"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-5 font-mono text-xs text-white/70">
              {lightboxIndex + 1} / {media.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
