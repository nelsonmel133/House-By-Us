import { useParams } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Star, ArrowLeft } from "lucide-react";
import { MediaGallery } from "@/components/listing/media-gallery";
import { ListingSpecsCard } from "@/components/listing/listing-specs-card";
import { ContactLandlordWidget } from "@/components/listing/contact-landlord-widget";
import { Badge } from "@/components/ui/badge";
import { MOCK_LISTINGS } from "@/lib/mock-data";

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  // In production: const { data: listing, isLoading } = trpc.listings.byId.useQuery({ id });
  const listing = MOCK_LISTINGS.find((l) => l.id === id) ?? MOCK_LISTINGS[0];

  return (
    <div className="min-h-screen bg-sand-100 pb-20">
      <header className="border-b border-ink-900/8 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
          <a href="/search" className="flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-clay-600">
            <ArrowLeft className="h-4 w-4" /> Back to search
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 md:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
                  {listing.title}
                </h1>
                {listing.verification === "verified" && (
                  <Badge variant="success" className="gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-400">
                <MapPin className="h-3.5 w-3.5" /> {listing.address}
                {listing.rating && (
                  <span className="ml-2 flex items-center gap-1 text-ink-600">
                    <Star className="h-3.5 w-3.5 fill-brass-500 text-brass-500" /> {listing.rating} ({listing.reviewCount} reviews)
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="mt-5"
        >
          <MediaGallery media={listing.media} title={listing.title} />
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-ink-900/8 bg-white p-5 shadow-card">
              <h2 className="font-display text-lg font-semibold text-ink-900">About this place</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{listing.description}</p>
            </div>

            <ListingSpecsCard listing={listing} />
          </div>

          <div className="lg:col-span-1">
            <ContactLandlordWidget
              landlord={listing.landlord}
              listingTitle={listing.title}
              pricePerMonthUsd={listing.pricePerMonthUsd}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
