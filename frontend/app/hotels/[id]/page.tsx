'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Wifi,
  Coffee,
  Car,
  Waves,
  Utensils,
  X,
  Clock,
  Lock,
  Share2,
  Heart,
  MessageSquarePlus,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getActiveApiKey } from '@/lib/apiKey';
import {
  getUserFavorites,
  toggleUserFavorite,
  isAccommodationFavorited,
  getUserReservations,
  addUserReservation,
  ReservationItem,
  FavoriteItem
} from '@/lib/userStorage';
import BookingCalendar from '@/components/BookingCalendar';
import StarRating from '@/components/StarRating';

const NO_PHOTO_PLACEHOLDER = "https://www.tez-tour.ro/static/images/nophoto-hotel.png";

interface AccommodationDetails {
  id: string;
  name: string;
  location: string;
  city?: string;
  country?: string;
  pricePerNight: number;
  description: string;
  accommodationType: string;
  averageRating: number;
  totalReviewsCount: number;
  imageUrl?: string;
  imageUrls: string[];
  stars?: number;
  hasPool?: boolean;
  hasRoomService?: boolean;
  totalRooms?: number;
  floorNumber?: number;
  hasElevator?: boolean;
  numberOfRooms?: number;
  isFurnished?: boolean;
  bedInSharedRoomPrice?: number;
  hasSharedKitchen?: boolean;
  totalBeds?: number;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment?: string;
  reservationId: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  createdAt: string;
}

interface UserReservation {
  id: string;
  accommodationId?: string;
  hotelId?: string;
  hotelName?: string;
  dates?: string;
  status?: string;
  type?: string;
}

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  const hotelId = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;

  const [hotel, setHotel] = useState<AccommodationDetails | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Booking Form State
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const threeDaysLater = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d.toISOString().split('T')[0];
  }, []);

  const [checkIn, setCheckIn] = useState<string>(tomorrow);
  const [checkOut, setCheckOut] = useState<string>(threeDaysLater);
  const [guests, setGuests] = useState<number>(2);
  const [isBookingLoading, setIsBookingLoading] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<{ ro: string; en: string } | null>(null);

  // Review Form State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewReservationId, setReviewReservationId] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewStatusMessage, setReviewStatusMessage] = useState<{ type: 'success' | 'error'; ro: string; en: string } | null>(null);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [userReservations, setUserReservations] = useState<UserReservation[]>([]);

  // Check auth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    queueMicrotask(() => {
      const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
      const profile = localStorage.getItem('rbooking_user_profile') || localStorage.getItem('currentUser');
      const logged = localStorage.getItem('rbooking_logged_in') === 'true' || Boolean(token);
      setIsLoggedIn(logged);

      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          if (parsed.id || parsed.Id) {
            setCurrentUserId(parsed.id || parsed.Id);
          }
          if (parsed.email || parsed.Email) {
            setCurrentUserEmail(parsed.email || parsed.Email);
          }
        } catch (e) {
          console.error(e);
        }
      }

      setUserReservations(getUserReservations());
      setIsSaved(isAccommodationFavorited(hotelId));
    });
  }, [hotelId]);

  const userReservationsForThisHotel = useMemo(() => {
    return userReservations.filter((res) => {
      if (res.accommodationId && (res.accommodationId === hotelId || (hotel?.id && res.accommodationId === hotel.id))) {
        return true;
      }
      if (res.hotelId && (res.hotelId === hotelId || (hotel?.id && res.hotelId === hotel.id))) {
        return true;
      }
      if (hotel?.name && res.hotelName) {
        const hName = hotel.name.toLowerCase().trim();
        const rName = res.hotelName.toLowerCase().trim();
        if (hName === rName || hName.includes(rName) || rName.includes(hName)) {
          return true;
        }
      }
      return false;
    });
  }, [userReservations, hotelId, hotel]);

  const hasUserBookedThisHotel = useMemo(() => {
    return userReservationsForThisHotel.length > 0;
  }, [userReservationsForThisHotel]);

  const activeReservationForThisHotel = useMemo(() => {
    return userReservationsForThisHotel.find(
      (r) => r.status !== 'Cancelled' && (r.status === 'Confirmed' || r.status === 'Pending' || r.type === 'current')
    );
  }, [userReservationsForThisHotel]);

  const reviewedReservationIds = useMemo(() => {
    return new Set(reviews.map((r) => r.reservationId));
  }, [reviews]);

  const unreviewedReservations = useMemo(() => {
    return userReservationsForThisHotel.filter((res) => !reviewedReservationIds.has(res.id));
  }, [userReservationsForThisHotel, reviewedReservationIds]);

  const hasReviewedStay = useMemo(() => {
    if (!isLoggedIn) return false;

    // Verificăm în recenziile existente pentru această cazare
    const inReviews = reviews.some(
      (rev) =>
        (currentUserId && rev.userId === currentUserId) ||
        (currentUserEmail && rev.userEmail === currentUserEmail) ||
        userReservationsForThisHotel.some((ur) => ur.id === rev.reservationId)
    );
    if (inReviews) return true;

    // Verificăm și în istoricul local de recenzii pentru această cazare
    if (typeof window !== 'undefined') {
      try {
        const savedReviewed: string[] = JSON.parse(localStorage.getItem('rbooking_reviewed_hotels') || '[]');
        if (savedReviewed.includes(hotelId) || (hotel?.id && savedReviewed.includes(hotel.id))) {
          return true;
        }
      } catch {
        // ignore
      }
    }

    return false;
  }, [isLoggedIn, reviews, currentUserId, currentUserEmail, userReservationsForThisHotel, hotelId, hotel]);

  // Fetch hotel details and reviews
  const loadData = useCallback(async () => {
    if (!hotelId) return;
    setIsLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
    const apiKey = getActiveApiKey();

    try {
      // 1. Fetch Accommodation
      const res = await fetch(`${apiUrl}/Accommodations/${hotelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const baseImg = data.imageUrl && data.imageUrl.trim() ? data.imageUrl : NO_PHOTO_PLACEHOLDER;
        const gallery = data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : [baseImg];

        setHotel({
          id: data.id || hotelId,
          name: data.name || 'Boutique Stay',
          location: data.location || `${data.city || 'România'}, ${data.country || ''}`,
          city: data.city || 'București',
          country: data.country || 'România',
          pricePerNight: data.pricePerNight || 320,
          description: data.description || (lang === 'RO' 
            ? 'O proprietate selectă cu arhitectură contemporană, spații luminoase și finisaje de înaltă calitate, perfect concepută pentru o experiență de relaxare autentică.' 
            : 'A curated stay offering contemporary architecture, bright spaces and high-quality finishes, crafted for an authentic relaxing experience.'),
          accommodationType: data.accommodationType || 'Hotel',
          averageRating: typeof data.averageRating === 'number' ? data.averageRating : 0,
          totalReviewsCount: typeof data.totalReviewsCount === 'number' ? data.totalReviewsCount : 0,
          imageUrl: baseImg,
          imageUrls: gallery,
          stars: data.stars,
          hasPool: data.hasPool ?? true,
          hasRoomService: data.hasRoomService ?? true,
          totalRooms: data.totalRooms || 28,
          floorNumber: data.floorNumber,
          hasElevator: data.hasElevator,
          numberOfRooms: data.numberOfRooms,
          isFurnished: data.isFurnished,
          bedInSharedRoomPrice: data.bedInSharedRoomPrice,
          hasSharedKitchen: data.hasSharedKitchen,
          totalBeds: data.totalBeds,
        });

        setSelectedImage(baseImg);
      } else {
        // Fallback demo mock
        setHotel({
          id: hotelId,
          name: 'Grand Architectural Stay',
          location: 'Calea Victoriei 56, București',
          city: 'București',
          country: 'România',
          pricePerNight: 450,
          description: lang === 'RO' 
            ? 'Amplasat într-o clădire istorică complet restaurată, acest hotel boutique îmbină eleganța clasică cu facilitățile moderne de lux. Bucură-te de camere spațioase, terasă panoramică și servicii impecabile.'
            : 'Set in a fully restored historic building, this boutique hotel combines classic elegance with modern luxury amenities. Enjoy spacious rooms, a panoramic terrace and impeccable hospitality.',
          accommodationType: 'Hotel',
          averageRating: 0,
          totalReviewsCount: 0,
          imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
          imageUrls: [
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
          ],
          stars: 5,
          hasPool: true,
          hasRoomService: true,
          totalRooms: 40,
        });
        setSelectedImage('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80');
      }

      // 2. Fetch Reviews
      const revRes = await fetch(`${apiUrl}/Reviews/accommodation/${hotelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
      });

      if (revRes.ok) {
        const revData = await revRes.json();
        if (Array.isArray(revData)) {
          setReviews(revData);
        }
      }
    } catch {
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [hotelId, lang]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  // Calculations for Price
  const numberOfNights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [checkIn, checkOut]);

  const pricePerNight = hotel?.pricePerNight || 350;
  const basePriceTotal = pricePerNight * numberOfNights;
  const serviceFee = Math.round(basePriceTotal * 0.08);
  const totalPrice = basePriceTotal + serviceFee;

  // Handle Booking
  const handleBookingSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingError(null);

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (activeReservationForThisHotel) {
      setBookingError({
        ro: 'Ai deja o rezervare activă la această cazare. Nu poți face o nouă rezervare până când cea anterioară nu este finalizată sau anulată.',
        en: 'You already have an active reservation at this accommodation. You cannot create a new booking until your previous stay is completed or cancelled.'
      });
      setIsBookingLoading(false);
      return;
    }

    setIsBookingLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
    const apiKey = getActiveApiKey();
    const token = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');

    const effectiveUserId = currentUserId || '00000000-0000-0000-0000-000000000001';

    const payload = {
      userId: effectiveUserId,
      accommodationId: hotel?.id || hotelId,
      checkInDate: new Date(checkIn).toISOString(),
      checkOutDate: new Date(checkOut).toISOString(),
      numberOfGuests: guests,
    };

    try {
      const res = await fetch(`${apiUrl}/Reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });

      let createdReservationId = `res-${Date.now()}`;
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) createdReservationId = data.id;
      }

      // Save locally per-user
      const targetAccId = hotel?.id || hotelId;
      const newReservation: ReservationItem = {
        id: createdReservationId,
        accommodationId: targetAccId,
        hotelId: targetAccId,
        hotelName: hotel?.name || 'Boutique Stay',
        location: hotel?.location || 'România',
        dates: `${checkIn} - ${checkOut} (${numberOfNights} ${lang === 'RO' ? 'nopți' : 'nights'})`,
        status: 'Confirmed',
        imageUrl: hotel?.imageUrl || NO_PHOTO_PLACEHOLDER,
        type: 'current',
        totalPrice: totalPrice,
        guests: guests,
        userId: currentUserId || undefined,
        userEmail: currentUserEmail || undefined,
        createdAt: new Date().toISOString()
      };

      addUserReservation(newReservation);

      setBookingSuccess(true);
      setTimeout(() => {
        router.push('/reservations');
      }, 1500);
    } catch {
      setBookingError({
        ro: 'Eroare la procesarea rezervării. Vă rugăm reîncercați.',
        en: 'Error processing reservation. Please try again.'
      });
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Handle Review Submission (Triggers Webhook A => B)
  const handleReviewSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewStatusMessage(null);

    setIsSubmittingReview(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5293/api';
    const apiKey = getActiveApiKey();
    const rawToken = localStorage.getItem('rbooking_token') || localStorage.getItem('authToken');
    const token = rawToken ? rawToken.replace(/^Bearer\s+/i, '').trim() : '';

    // Determinăm un reservationId valid conform formatului GUID
    const isGuid = (val?: string | null) =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()));

    let chosenResId: string | null = null;
    if (isGuid(reviewReservationId)) {
      chosenResId = reviewReservationId.trim();
    } else {
      const matching = unreviewedReservations.find(r => isGuid(r.id));
      if (matching) {
        chosenResId = matching.id;
      } else {
        const anyUserRes = userReservations.find(r => isGuid(r.id));
        if (anyUserRes) chosenResId = anyUserRes.id;
      }
    }

    if (!hasUserBookedThisHotel) {
      setReviewStatusMessage({
        type: 'error',
        ro: 'Trebuie să ai o rezervare la această cazare pentru a putea lăsa o recenzie.',
        en: 'You must have a reservation for this accommodation to leave a review.'
      });
      setIsSubmittingReview(false);
      return;
    }

    if (hasReviewedStay) {
      setReviewStatusMessage({
        type: 'error',
        ro: 'Ai adăugat deja o recenzie pentru această cazare. Fiecare utilizator poate publica o singură recenzie per cazare.',
        en: 'You have already submitted a review for this accommodation. Each user is allowed only one review per accommodation.'
      });
      setIsSubmittingReview(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/Reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reservationId: chosenResId,
          accommodationId: isGuid(hotel?.id || hotelId) ? (hotel?.id || hotelId) : null,
          rating: reviewRating,
          comment: reviewComment.trim()
        }),
      });

      if (res.ok) {
        setReviewStatusMessage({
          type: 'success',
          ro: '✓ Recenzie publicată cu succes! Webhook-ul a fost trimis către API B.',
          en: '✓ Review submitted successfully! Webhook dispatched to API B.'
        });

        // Adăugăm recenzia local instant
        const newReview: ReviewItem = {
          id: Date.now(),
          rating: reviewRating,
          comment: reviewComment.trim(),
          reservationId: chosenResId || '00000000-0000-0000-0000-000000000000',
          userId: currentUserId,
          userEmail: currentUserEmail || (lang === 'RO' ? 'Client Autentificat' : 'Authenticated Guest'),
          userName: lang === 'RO' ? 'Client Autentificat' : 'Authenticated Guest',
          createdAt: new Date().toISOString()
        };
        setReviews(prev => [newReview, ...prev]);
        setReviewComment('');

        // Marcăm hotelul și rezervarea ca evaluate local
        if (typeof window !== 'undefined') {
          try {
            const savedReviewed: string[] = JSON.parse(localStorage.getItem('rbooking_reviewed_hotels') || '[]');
            if (!savedReviewed.includes(hotelId)) {
              savedReviewed.push(hotelId);
              localStorage.setItem('rbooking_reviewed_hotels', JSON.stringify(savedReviewed));
            }
          } catch {
            // ignore
          }
        }

        setTimeout(() => {
          setIsReviewModalOpen(false);
          setReviewStatusMessage(null);
          loadData();
        }, 1200);
      } else {
        const status = res.status;
        let errorMessage = '';

        try {
          const err = await res.json();
          if (err.errors && typeof err.errors === 'object') {
            const errList = Object.values(err.errors).flat().filter(Boolean) as string[];
            if (errList.length > 0) {
              errorMessage = errList.join(', ');
            }
          }
          if (!errorMessage) {
            if (err.message && typeof err.message === 'string') {
              errorMessage = err.message;
            } else if (err.title && typeof err.title === 'string' && !err.title.toLowerCase().includes('validation errors')) {
              errorMessage = err.title;
            } else if (err.error && typeof err.error === 'string') {
              errorMessage = err.error;
            }
          }
        } catch {
          // Response is not JSON
        }

        const lowerErr = errorMessage.toLowerCase();
        let roMsg = '';
        let enMsg = '';

        if (lowerErr.includes('deja') || lowerErr.includes('already') || lowerErr.includes('recenzie asociată') || lowerErr.includes('toate rezervările') || (status === 400 && !errorMessage)) {
          roMsg = 'Există deja o recenzie asociată acestei rezervări. Fiecare rezervare permite o singură recenzie.';
          enMsg = 'You have already submitted a review for this reservation. Each reservation allows only one review.';
        } else if (lowerErr.includes('trebuie să ai') || lowerErr.includes('must have') || lowerErr.includes('fără recenzie') || lowerErr.includes('nu a fost găsită')) {
          roMsg = 'Trebuie să ai o rezervare la această cazare pentru a putea lăsa o recenzie.';
          enMsg = 'You must have a reservation for this accommodation to leave a review.';
        } else if (status === 403 || lowerErr.includes('altui utilizator') || lowerErr.includes('permisiunea') || lowerErr.includes('another user')) {
          roMsg = 'Nu poți adăuga o recenzie pentru rezervarea altui utilizator.';
          enMsg = 'You cannot add a review for another user\'s reservation.';
        } else if (status === 401 || lowerErr.includes('unauthorized') || lowerErr.includes('autentificat') || lowerErr.includes('sesiunea')) {
          roMsg = 'Sesiunea a expirat sau nu ești autentificat. Te rugăm să te conectezi din nou.';
          enMsg = 'Session expired or not logged in. Please log in again.';
        } else {
          roMsg = errorMessage || 'Nu s-a putut publica recenzia. Fiecare rezervare permite o singură recenzie.';
          enMsg = errorMessage ? `Error: ${errorMessage}` : 'Could not submit review. Each reservation allows only one review.';
        }

        setReviewStatusMessage({
          type: 'error',
          ro: roMsg,
          en: enMsg
        });
      }
    } catch {
      setReviewStatusMessage({
        type: 'error',
        ro: 'Eroare de rețea la publicarea recenziei.',
        en: 'Network error submitting review.'
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleToggleFavorite = () => {
    if (typeof window === 'undefined' || !hotel) return;
    const favItem: FavoriteItem = {
      id: hotel.id,
      name: hotel.name,
      location: hotel.location,
      city: hotel.city,
      country: hotel.country,
      pricePerNight: hotel.pricePerNight,
      imageUrl: hotel.imageUrl || NO_PHOTO_PLACEHOLDER,
      accommodationType: hotel.accommodationType,
      averageRating: hotel.averageRating,
      savedAt: new Date().toISOString()
    };

    const result = toggleUserFavorite(favItem);
    setIsSaved(result.isSaved);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0D0E11] flex flex-col items-center justify-center text-neutral-900 dark:text-neutral-100">
        <div className="w-12 h-12 border-2 border-amber-600 border-t-transparent animate-spin rounded-full mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-neutral-500">
          {lang === 'RO' ? 'Se încarcă detaliile proprietății...' : 'Loading property details...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0D0E11] text-neutral-900 dark:text-neutral-100 transition-colors duration-300 font-sans flex flex-col">
      {/* Top Floating Glass Buttons (Bară invizibilă, doar butoane cu blur și colțuri ușor rotunjite) */}
      <div className="sticky top-20 z-30 pointer-events-none py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/#accommodations"
            className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-2 bg-white/75 dark:bg-[#131519]/75 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 rounded-lg shadow-xs hover:shadow-md hover:bg-white/95 dark:hover:bg-[#1a1d24]/95 text-xs font-mono uppercase tracking-wider text-neutral-800 dark:text-neutral-200 hover:text-neutral-950 dark:hover:text-white transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'RO' ? '← Înapoi la Colecție' : '← Back to stays'}</span>
          </Link>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/75 dark:bg-[#131519]/75 backdrop-blur-md border border-neutral-200/80 dark:border-white/10 rounded-lg shadow-xs hover:shadow-md hover:bg-white/95 dark:hover:bg-[#1a1d24]/95 text-xs font-mono text-neutral-800 dark:text-neutral-200 transition-all cursor-pointer active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? (lang === 'RO' ? 'Copiat!' : 'Copied!') : (lang === 'RO' ? 'Distribuie' : 'Share')}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`inline-flex items-center gap-1.5 px-3 py-2 backdrop-blur-md rounded-lg border shadow-xs hover:shadow-md transition-all cursor-pointer text-xs font-mono active:scale-[0.98] ${
                isSaved
                  ? 'bg-rose-50/80 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80'
                  : 'bg-white/75 text-neutral-800 border-neutral-200/80 dark:bg-[#131519]/75 dark:text-neutral-200 dark:border-white/10 hover:bg-white/95 dark:hover:bg-[#1a1d24]/95'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{isSaved ? (lang === 'RO' ? 'Salvat' : 'Saved') : (lang === 'RO' ? 'Salvează' : 'Save')}</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-12">
        {/* 1. Header Editorial */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest font-semibold bg-amber-500/10 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300 border border-amber-500/30">
              [ {hotel?.accommodationType?.toUpperCase() || 'HOTEL'} ]
            </span>
            <StarRating
              rating={hotel?.averageRating}
              totalReviews={hotel?.totalReviewsCount}
              size="sm"
              unratedLabel={lang === 'RO' ? 'Fără recenzii' : 'No reviews'}
            />
            <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{lang === 'RO' ? 'Verificat RBooking 2026' : 'RBooking Verified 2026'}</span>
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif text-neutral-950 dark:text-white font-normal tracking-tight">
                {hotel?.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 font-sans mt-2">
                <MapPin className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span>{hotel?.location}</span>
                <span>•</span>
                <span className="font-mono text-xs text-neutral-500">
                  {hotel && (hotel.totalReviewsCount ?? 0) > 0
                    ? `★ ${hotel.averageRating?.toFixed(1)} (${hotel.totalReviewsCount} ${lang === 'RO' ? 'recenzii' : 'reviews'})`
                    : (lang === 'RO' ? 'Fără recenzii' : 'No reviews')}
                </span>
              </div>
            </div>

            <div className="lg:text-right font-mono">
              <div className="text-xs text-neutral-500 uppercase tracking-widest">
                {lang === 'RO' ? 'Tarif de la' : 'Starting from'}
              </div>
              <div className="text-3xl sm:text-4xl font-serif text-neutral-950 dark:text-white font-medium">
                {hotel?.pricePerNight} <span className="text-sm font-mono text-neutral-500">LEI / {lang === 'RO' ? 'noapte' : 'night'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Image Gallery Showcase */}
        <div className="space-y-4">
          <div className="relative w-full h-[400px] sm:h-[540px] bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 overflow-hidden shadow-xl">
            <Image
              src={selectedImage || NO_PHOTO_PLACEHOLDER}
              alt={hotel?.name || 'Stay image'}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-center transition-all duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-mono tracking-wider uppercase border border-white/20">
              {lang === 'RO' ? 'Arhitectură & Design Interior' : 'Architecture & Interior Design'}
            </div>
          </div>

          {/* Thumbnails */}
          {hotel?.imageUrls && hotel.imageUrls.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {hotel.imageUrls.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-28 h-20 shrink-0 border-2 overflow-hidden cursor-pointer transition ${
                    selectedImage === img
                      ? 'border-amber-600 dark:border-amber-400 scale-[1.03] shadow-md'
                      : 'border-neutral-300 dark:border-neutral-800 opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Main Grid: Left Details & Right Booking Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Story & Description */}
            <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-8">
              <h2 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300">
                [ 01 / {lang === 'RO' ? 'DESPRE PROPRIETATE' : 'ABOUT PROPERTY'} ]
              </h2>
              <p className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans font-normal">
                {hotel?.description}
              </p>
            </div>

            {/* Key Amenities */}
            <div className="space-y-6 border-b border-neutral-200 dark:border-neutral-800 pb-8">
              <h2 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300">
                [ 02 / {lang === 'RO' ? 'FACILITĂȚI & STANDARDE' : 'AMENITIES & STANDARDS'} ]
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                <div className="p-4 bg-white dark:bg-[#131519] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
                  <Wifi className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <span>{lang === 'RO' ? 'Wi-Fi de Mare Viteză' : 'High-Speed Wi-Fi'}</span>
                </div>
                <div className="p-4 bg-white dark:bg-[#131519] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
                  <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <span>{lang === 'RO' ? 'Mic Dejun Gourmet' : 'Gourmet Breakfast'}</span>
                </div>
                <div className="p-4 bg-white dark:bg-[#131519] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
                  <Car className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <span>{lang === 'RO' ? 'Parcare Privată' : 'Private Parking'}</span>
                </div>
                <div className="p-4 bg-white dark:bg-[#131519] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
                  <Waves className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <span>{lang === 'RO' ? 'Piscină & Spa' : 'Pool & Wellness'}</span>
                </div>
                <div className="p-4 bg-white dark:bg-[#131519] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
                  <Utensils className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <span>{lang === 'RO' ? 'Restaurant Fine Dining' : 'Fine Dining'}</span>
                </div>
                <div className="p-4 bg-white dark:bg-[#131519] border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shadow-xs">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-300" />
                  <span>{lang === 'RO' ? 'Recepție 24/7' : '24/7 Reception'}</span>
                </div>
              </div>
            </div>

            {/* Accommodation-specific details */}
            <div className="space-y-4 border-b border-neutral-200 dark:border-neutral-800 pb-8">
              <h2 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300">
                [ 03 / {lang === 'RO' ? 'SPECIFICAȚII CAMERE' : 'ROOM SPECIFICATIONS'} ]
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                  <span className="text-neutral-500 block mb-1">{lang === 'RO' ? 'Check-in' : 'Check-in'}</span>
                  <span className="font-bold text-neutral-900 dark:text-white">14:00 - 23:00</span>
                </div>
                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                  <span className="text-neutral-500 block mb-1">{lang === 'RO' ? 'Check-out' : 'Check-out'}</span>
                  <span className="font-bold text-neutral-900 dark:text-white">08:00 - 11:00</span>
                </div>
                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                  <span className="text-neutral-500 block mb-1">{lang === 'RO' ? 'Capacitate' : 'Capacity'}</span>
                  <span className="font-bold text-neutral-900 dark:text-white">1 - 6 {lang === 'RO' ? 'Oaspeți' : 'Guests'}</span>
                </div>
                <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800">
                  <span className="text-neutral-500 block mb-1">{lang === 'RO' ? 'Anulare' : 'Cancellation'}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{lang === 'RO' ? 'Gratuită 48h' : 'Free 48h'}</span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-amber-700 dark:text-amber-300">
                    [ 04 / {lang === 'RO' ? 'RECENZII & EVALUĂRI' : 'REVIEWS & RATINGS'} ]
                  </h2>
                  <div className="text-xl font-serif mt-1 flex items-center gap-2">
                    {hotel && (hotel.totalReviewsCount ?? 0) > 0 ? (
                      <>
                        <span>★ {hotel.averageRating?.toFixed(1)} / 5.0</span>
                        <span className="text-xs font-mono text-neutral-500">
                          ({hotel.totalReviewsCount} {lang === 'RO' ? 'recenzii verificate' : 'verified reviews'})
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-mono text-neutral-500">
                        {lang === 'RO' ? 'Nicio recenzie încă' : 'No reviews yet'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasReviewedStay && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-mono rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lang === 'RO' ? 'Ai evaluat acest sejur' : 'You reviewed this stay'}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={hasReviewedStay}
                    onClick={() => {
                      if (!isLoggedIn) {
                        router.push('/login');
                        return;
                      }
                      if (hasReviewedStay) {
                        return;
                      }
                      setIsReviewModalOpen(true);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-semibold border transition shadow-xs ${
                      hasReviewedStay
                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-600 dark:border-neutral-800 cursor-not-allowed'
                        : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 cursor-pointer'
                    }`}
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>
                      {hasReviewedStay
                        ? (lang === 'RO' ? 'Recenzie Adăugată' : 'Review Added')
                        : (lang === 'RO' ? 'Adaugă Recenzie' : 'Add Review')}
                    </span>
                  </button>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 border border-dashed border-neutral-300 dark:border-neutral-800 text-center space-y-2">
                  <p className="text-xs font-mono uppercase text-neutral-500">
                    {lang === 'RO' ? 'Nu există recenzii încă pentru această cazare.' : 'No reviews yet for this accommodation.'}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {lang === 'RO' ? 'Fii primul oaspete care lasă o impresie!' : 'Be the first guest to leave a review!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 bg-white dark:bg-[#131519] border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <StarRating rating={rev.rating} size="xs" />
                        <span className="text-[11px] font-mono text-neutral-500">
                          {new Date(rev.createdAt).toLocaleDateString(lang === 'RO' ? 'ro-RO' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      <p className="text-sm text-neutral-800 dark:text-neutral-200 font-sans leading-relaxed">
                        {rev.comment || (lang === 'RO' ? 'Sejur excelent, totul a fost impecabil.' : 'Excellent stay, everything was spotless.')}
                      </p>

                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                        <span>{rev.userEmail || (lang === 'RO' ? 'Client Verificat RBooking' : 'RBooking Verified Guest')}</span>
                        <span className="text-emerald-600 dark:text-emerald-400">✓ {lang === 'RO' ? 'Sejur Confirmat' : 'Confirmed Stay'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols) - Sticky Booking Widget */}
          <div className="lg:col-span-4 lg:sticky lg:top-36 space-y-4">
            <div className="p-6 sm:p-8 bg-white dark:bg-[#14171E] border-2 border-neutral-900 dark:border-white shadow-2xl space-y-6">
              <div className="flex items-baseline justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                <div>
                  <span className="text-2xl sm:text-3xl font-serif font-medium text-neutral-950 dark:text-white">
                    {hotel?.pricePerNight} LEI
                  </span>
                  <span className="text-xs font-mono text-neutral-500"> / {lang === 'RO' ? 'noapte' : 'night'}</span>
                </div>
                <StarRating
                  rating={hotel?.averageRating}
                  totalReviews={hotel?.totalReviewsCount}
                  size="xs"
                  showNumber
                  unratedLabel={lang === 'RO' ? 'Nou' : 'New'}
                />
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Calendar Vizual Interactiv cu Pătrățele Evidențiate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-bold block">
                    {lang === 'RO' ? 'Perioadă Sejur (Pătrățele Evidențiate)' : 'Stay Period (Highlighted Dates)'}
                  </label>
                  <BookingCalendar
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onRangeChange={(newIn, newOut) => {
                      setCheckIn(newIn);
                      if (newOut <= newIn) {
                        const d = new Date(newIn);
                        d.setDate(d.getDate() + 1);
                        setCheckOut(d.toISOString().split('T')[0]);
                      } else {
                        setCheckOut(newOut);
                      }
                    }}
                    lang={lang}
                    minNights={1}
                  />
                </div>

                {/* Guests input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-bold">
                    {lang === 'RO' ? 'Număr Oaspeți' : 'Number of Guests'}
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full p-2.5 bg-neutral-50 dark:bg-[#1A1D24] border border-neutral-300 dark:border-neutral-700 text-xs font-mono rounded focus:outline-none focus:border-neutral-950 dark:focus:border-white"
                  >
                    <option value={1}>1 {lang === 'RO' ? 'Oaspete' : 'Guest'}</option>
                    <option value={2}>2 {lang === 'RO' ? 'Oaspeți' : 'Guests'}</option>
                    <option value={3}>3 {lang === 'RO' ? 'Oaspeți' : 'Guests'}</option>
                    <option value={4}>4 {lang === 'RO' ? 'Oaspeți' : 'Guests'}</option>
                    <option value={5}>5 {lang === 'RO' ? 'Oaspeți' : 'Guests'}</option>
                  </select>
                </div>

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>{pricePerNight} LEI × {numberOfNights} {lang === 'RO' ? 'nopți' : 'nights'}</span>
                    <span>{basePriceTotal} LEI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{lang === 'RO' ? 'Taxe de serviciu (8%)' : 'Service fees (8%)'}</span>
                    <span>{serviceFee} LEI</span>
                  </div>
                  <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-between font-bold text-neutral-950 dark:text-white text-sm">
                    <span>Total</span>
                    <span>{totalPrice} LEI</span>
                  </div>
                </div>

                {bookingError && (
                  <div className="p-3 text-xs font-mono bg-red-50 text-red-800 border border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800 rounded">
                    {lang === 'RO' ? bookingError.ro : bookingError.en}
                  </div>
                )}

                {bookingSuccess && (
                  <div className="p-3 text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-2 rounded">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{lang === 'RO' ? 'Rezervare confirmată! Se redirecționează...' : 'Reservation confirmed! Redirecting...'}</span>
                  </div>
                )}

                {activeReservationForThisHotel && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{lang === 'RO' ? 'Ai o rezervare activă la această cazare' : 'Active Reservation Exists'}</span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 font-sans text-xs leading-relaxed">
                      {lang === 'RO'
                        ? `Sejurul tău (${activeReservationForThisHotel.dates}) este înregistrat. Fiecare utilizator poate avea o singură rezervare activă la aceeași proprietate.`
                        : `Your stay (${activeReservationForThisHotel.dates}) is active. Each user can have only one active reservation per property.`}
                    </p>
                    <div className="pt-1">
                      <Link
                        href="/reservations"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-[11px] font-mono uppercase tracking-wider rounded-lg hover:bg-neutral-800 dark:hover:bg-amber-300 transition"
                      >
                        <span>{lang === 'RO' ? 'Vezi Rezervările Mele' : 'View My Reservations'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBookingLoading || bookingSuccess || Boolean(activeReservationForThisHotel)}
                  className={`w-full py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] transition-all duration-200 border text-center ${
                    activeReservationForThisHotel
                      ? 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500 border-neutral-300 dark:border-neutral-700 cursor-not-allowed'
                      : 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-amber-300 border-neutral-950 dark:border-white cursor-pointer shadow-lg active:scale-[0.99] disabled:opacity-50'
                  }`}
                >
                  {isBookingLoading
                    ? (lang === 'RO' ? 'Se procesează...' : 'Processing...')
                    : activeReservationForThisHotel
                    ? (lang === 'RO' ? 'Rezervare Activă Existentă' : 'Active Reservation Exists')
                    : !isLoggedIn
                    ? (lang === 'RO' ? 'Autentifică-te pentru Rezervare' : 'Login to Book')
                    : (lang === 'RO' ? 'Rezervă Acum' : 'Reserve Now')}
                </button>
              </form>

              <div className="pt-2 text-center text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>{lang === 'RO' ? 'Tranzacție Securizată SSL 256-bit' : '256-bit SSL Secure Checkout'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Adăugare Recenzie */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#131519] border border-neutral-300 dark:border-neutral-800 w-full max-w-lg p-6 sm:p-8 rounded-2xl shadow-2xl relative text-neutral-900 dark:text-white">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-700 dark:text-amber-300">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-medium">
                  {lang === 'RO' ? 'Lasă o Recenzie' : 'Write a Review'}
                </h3>
                <p className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                  {hotel?.name}
                </p>
              </div>
            </div>

            {!hasUserBookedThisHotel ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-mono space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{lang === 'RO' ? 'Nu ai o rezervare la această cazare' : 'No reservation found for this stay'}</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-sans text-xs pt-1">
                    {lang === 'RO'
                      ? 'Pentru a asigura autenticitatea recenziilor, doar oaspeții care au rezervat un sejur la această cazare pot adăuga o recenzie.'
                      : 'To ensure authenticity, only guests who have booked a stay at this accommodation can submit a review.'}
                  </p>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      const bookingWidget = document.getElementById('booking-widget');
                      if (bookingWidget) bookingWidget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 py-2.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-amber-300 transition cursor-pointer text-center"
                  >
                    {lang === 'RO' ? 'Rezervă un Sejur' : 'Book a Stay'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-4 py-2.5 border border-neutral-300 dark:border-neutral-700 font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  >
                    {lang === 'RO' ? 'Închide' : 'Close'}
                  </button>
                </div>
              </div>
            ) : hasReviewedStay ? (
              <div className="space-y-4 pt-2">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-mono space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{lang === 'RO' ? 'Ai adăugat deja o recenzie pentru această cazare!' : 'You already submitted a review for this accommodation!'}</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-sans text-xs pt-1">
                    {lang === 'RO'
                      ? 'Fiecare utilizator poate publica o singură recenzie per cazare pentru a asigura transparența și corectitudinea evaluărilor.'
                      : 'Each user is allowed only one review per accommodation to ensure transparency and integrity of ratings.'}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    className="w-full py-2.5 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-mono text-xs uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-amber-300 transition cursor-pointer"
                  >
                    {lang === 'RO' ? 'Închide' : 'Close'}
                  </button>
                </div>
              </div>
            ) : (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              {/* Star rating selector */}
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
                  {lang === 'RO' ? 'Notă (1 - 5 Stele)' : 'Rating (1 - 5 Stars)'}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-2 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-amber-500 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-neutral-400'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold pl-2">{reviewRating} / 5</span>
                </div>
              </div>

              {/* Verified stay notice & optional reservation selector */}
              <div className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{lang === 'RO' ? 'Sejur verificat pentru:' : 'Verified stay for:'} <strong>{hotel?.name}</strong></span>
                </div>
                {unreviewedReservations.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-600 dark:text-neutral-400 mb-1">
                      {lang === 'RO' ? 'Asociază cu o rezervare neevaluată din cont:' : 'Link with an unreviewed reservation from account:'}
                    </label>
                    <select
                      value={reviewReservationId}
                      onChange={(e) => setReviewReservationId(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-[#181a20] text-xs font-mono text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg"
                    >
                      <option value="">{lang === 'RO' ? '-- Selectează automat prima rezervare disponibilă --' : '-- Auto-select first available reservation --'}</option>
                      {unreviewedReservations.map((res) => (
                        <option key={res.id} value={res.id}>
                          {res.hotelName || 'Sejur'} ({res.dates})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                  {lang === 'RO' ? 'Comentariu & Experiență' : 'Comment & Feedback'}
                </label>
                <textarea
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={lang === 'RO' ? 'Descrieți experiența dvs. la această cazare...' : 'Describe your stay and experience...'}
                  required
                  className="w-full p-3 bg-neutral-50 dark:bg-[#181a20] text-xs font-sans text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              {reviewStatusMessage && (
                <div
                  className={`p-3 text-xs font-mono rounded-xl border ${
                    reviewStatusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                  }`}
                >
                  {lang === 'RO' ? reviewStatusMessage.ro : reviewStatusMessage.en}
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="flex-1 py-3 bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 text-xs font-mono uppercase tracking-widest font-semibold rounded-xl border border-neutral-950 dark:border-white hover:bg-neutral-800 dark:hover:bg-amber-300 cursor-pointer text-center transition disabled:opacity-50"
                >
                  {isSubmittingReview ? (lang === 'RO' ? 'Se publică...' : 'Submitting...') : (lang === 'RO' ? 'Publică Recenzia & Trimite Webhook' : 'Submit Review & Trigger Webhook')}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
