import { create } from "zustand";
import { fetchVenueReviews, checkReviewEligibility } from "@/lib/reviewApi";
import { fetchVenueById } from "@/lib/api";
import type { DbReview, DbVenue, ReviewEligibility, ReviewsResponse } from "@/lib/types";

interface ReviewState {
  // Per-venue review data
  venueReviews: Record<string, DbReview[]>;
  venuePagination: Record<string, { page: number; totalPages: number; total: number }>;
  venueEligibility: Record<string, ReviewEligibility>;

  // Loading states
  loadingReviews: Record<string, boolean>;
  loadingMore: Record<string, boolean>;

  // Selected review for detail modal
  selectedReview: DbReview | null;
  showReviewDetail: boolean;

  // Venue header data for reviews screen
  venueHeaderData: Record<string, { name: string; images: string[]; location: string | null; rating: number; reviewCount: number }>;

  // Actions
  loadReviews: (venueId: string, page?: number) => Promise<void>;
  loadMoreReviews: (venueId: string) => Promise<void>;
  refreshReviews: (venueId: string) => Promise<void>;
  loadEligibility: (venueId: string) => Promise<void>;
  loadVenueHeader: (venueId: string) => Promise<void>;
  selectReview: (review: DbReview) => void;
  dismissReviewDetail: () => void;
  getPreviewReviews: (venueId: string, max?: number) => DbReview[];
  hasExistingReview: (venueId: string) => boolean;
  isEligible: (venueId: string) => boolean;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  venueReviews: {},
  venuePagination: {},
  venueEligibility: {},
  loadingReviews: {},
  loadingMore: {},
  selectedReview: null,
  showReviewDetail: false,
  venueHeaderData: {},

  loadReviews: async (venueId: string, page = 1) => {
    set((s) => ({ loadingReviews: { ...s.loadingReviews, [venueId]: true } }));
    try {
      const data = await fetchVenueReviews(venueId, page, 10);
      set((s) => ({
        venueReviews: { ...s.venueReviews, [venueId]: data.reviews },
        venuePagination: {
          ...s.venuePagination,
          [venueId]: { page: data.pagination.page, totalPages: data.pagination.totalPages, total: data.pagination.total },
        },
      }));
    } catch (err) {
      // Keep existing data on error
    } finally {
      set((s) => ({ loadingReviews: { ...s.loadingReviews, [venueId]: false } }));
    }
  },

  loadMoreReviews: async (venueId: string) => {
    const pagination = get().venuePagination[venueId];
    if (!pagination || pagination.page >= pagination.totalPages) return;
    if (get().loadingMore[venueId]) return;

    set((s) => ({ loadingMore: { ...s.loadingMore, [venueId]: true } }));
    try {
      const nextPage = pagination.page + 1;
      const data = await fetchVenueReviews(venueId, nextPage, 10);
      set((s) => ({
        venueReviews: {
          ...s.venueReviews,
          [venueId]: [...(s.venueReviews[venueId] || []), ...data.reviews],
        },
        venuePagination: {
          ...s.venuePagination,
          [venueId]: { page: data.pagination.page, totalPages: data.pagination.totalPages, total: data.pagination.total },
        },
      }));
    } catch (err) {
      // Silently fail, user can scroll again
    } finally {
      set((s) => ({ loadingMore: { ...s.loadingMore, [venueId]: false } }));
    }
  },

  refreshReviews: async (venueId: string) => {
    try {
      const data = await fetchVenueReviews(venueId, 1, 10);
      set((s) => ({
        venueReviews: { ...s.venueReviews, [venueId]: data.reviews },
        venuePagination: {
          ...s.venuePagination,
          [venueId]: { page: 1, totalPages: data.pagination.totalPages, total: data.pagination.total },
        },
      }));
    } catch {}
  },

  loadEligibility: async (venueId: string) => {
    try {
      const eligibility = await checkReviewEligibility(venueId);
      set((s) => ({
        venueEligibility: { ...s.venueEligibility, [venueId]: eligibility },
      }));
    } catch {}
  },

  loadVenueHeader: async (venueId: string) => {
    try {
      const venue = await fetchVenueById(venueId);
      if (venue) {
        const images = (venue.images && venue.images.length > 0) ? venue.images : (venue.image_url ? [venue.image_url] : []);
        set((s) => ({
          venueHeaderData: {
            ...s.venueHeaderData,
            [venueId]: {
              name: venue.name,
              images,
              location: venue.location || venue.city || null,
              rating: venue.rating,
              reviewCount: venue.review_count,
            },
          },
        }));
      }
    } catch {}
  },

  selectReview: (review: DbReview) => {
    set({ selectedReview: review, showReviewDetail: true });
  },

  dismissReviewDetail: () => {
    set({ showReviewDetail: false, selectedReview: null });
  },

  getPreviewReviews: (venueId: string, max = 2) => {
    return (get().venueReviews[venueId] || []).slice(0, max);
  },

  hasExistingReview: (venueId: string) => {
    return !!get().venueEligibility[venueId]?.existing_review;
  },

  isEligible: (venueId: string) => {
    return get().venueEligibility[venueId]?.eligible ?? false;
  },
}));
