export type Audience = 'CONSUMER' | 'ADMIN' | 'COURIER';

export type ListingDestination =
  | 'SECONDE_MAIN'
  | 'ARTICLES_NEUFS'
  | 'QUARTIER_BOUTIQUES'
  | 'ENSEIGNES';

export type ShopKind = 'standard' | 'proximite' | 'enseigne';

export type SignupRole = 'acheteur' | 'particulier' | 'boutique' | 'commerceLocal' | 'grandeSurface' | 'livreur';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  emailVerified?: boolean;
  preferredLocale?: 'FR' | 'EN';
  userKind?: string;
  authAudience?: Audience;
};

export type Me = {
  id: string;
  phone: string | null;
  email?: string | null;
  displayName: string;
  preferredLocale: 'FR' | 'EN';
  canBuy: boolean;
  emailVerified?: boolean;
  phoneNumberVerified?: boolean;
  avatarUrl?: string | null;
  city?: string | null;
  bio?: string | null;
  shippingZoneId?: string | null;
  seller: {
    profileId?: string;
    id?: string;
    kind: 'particulier' | 'boutique';
    shopKind: ShopKind | null;
    shopName?: string;
    shopDescription?: string;
    coverUrl?: string;
    likesCount?: number;
    verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
    listingDestination: ListingDestination | null;
    shippingZoneId?: string | null;
    bundleEnabled?: boolean;
    bundleMinItems?: number;
    bundleDiscountPercent?: number;
    vacationEnabled?: boolean;
    allowedDestinations: string[];
    capabilities: {
      createListing: boolean;
      excelImport: boolean;
      productLibrary: boolean;
      sellerDashboard: boolean;
    };
  } | null;
  courier: { verificationStatus: string; isAvailable: boolean; zoneIds?: string[] } | null;
  isAdmin: boolean;
};

export type Category = {
  id: string;
  parentId: string | null;
  nameFr: string;
  nameEn: string;
  slug: string;
  destination: ListingDestination | null;
  sortOrder: number;
  isActive: boolean;
  imageUrl?: string | null;
};

export type Zone = {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  isActive: boolean;
};

export type Tariff = {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  amountGnf: number;
};

export type ListingMedia = {
  id: string;
  listingId: string;
  storageKey: string;
  url?: string | null;
  mimeType: string;
  sortOrder: number;
};

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD' | 'SOLD_OUT' | 'REJECTED' | 'FLAGGED' | 'ARCHIVED';

export type Listing = {
  id: string;
  sellerProfileId: string;
  categoryId: string | null;
  zoneId: string | null;
  title: string;
  description: string | null;
  netPriceGnf: number;
  priceGnf: number;
  commissionRate: number;
  commissionAmountGnf: number;
  quantity: number;
  negotiable: boolean;
  discountEnabled: boolean;
  compareAtPriceGnf: number | null;
  status: ListingStatus;
  destination: ListingDestination;
  conditionNote: string | null;
  size?: string | null;
  brand?: string | null;
  colors?: string[] | null;
  favoritesCount?: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt?: string;
  media?: ListingMedia[];
  sellerProfile?: {
    id: string;
    userId: string;
    displayName?: string | null;
    shopName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    rating?: number;
    reviewsCount?: number;
    sellerKind?: string | null;
    shopKind?: string | null;
    vacationEnabled?: boolean;
    bundleEnabled?: boolean;
    bundleMinItems?: number;
    bundleDiscountPercent?: number;
  } | null;
  listingRating?: number;
  listingReviewsCount?: number;
  category?: { id: string; nameFr: string; nameEn: string };
};

export type PublicShop = {
  id: string;
  shopName: string;
  sellerKind?: 'particulier' | 'boutique' | null;
  shopKind: ShopKind | null;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  rating?: number;
  reviewsCount?: number;
  likesCount?: number;
  createdAt?: string;
  likedByMe?: boolean;
  listings?: Listing[];
  listingsCount?: number;
  soldCategories?: string[];
  listingCategories?: string[];
  deliveredCommunes?: string[];
  deliveryDelay?: string | null;
  vacationEnabled?: boolean;
  bundleEnabled?: boolean;
  bundleMinItems?: number;
  bundleDiscountPercent?: number;
  city?: string | null;
  neighborhood?: string | null;
  storeAddress?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
};

export type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  authorName?: string | null;
  userName?: string | null;
  user?: { displayName?: string | null; pseudo?: string | null } | null;
};
export type Comment = {
  id: string;
  body: string;
  userId: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  parentId: string | null;
  createdAt: string;
};

export type CartItem = {
  id: string;
  cartId: string;
  listingId: string;
  quantity: number;
  acceptedOffer?: { id: string; amountGnf: number } | null;
  listing: {
    id: string;
    title: string;
    priceGnf: number;
    quantity: number;
    status: string;
    media: { url?: string; storageKey?: string; sortOrder?: number }[];
  };
};

export type Cart = { id: string; userId: string; items: CartItem[] };

export type OrderStatus =
  | 'ORDERED'
  | 'PAID'
  | 'SELLER_NOTIFIED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COURIER_ASSIGNED'
  | 'COLLECTED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FUNDS_RELEASED'
  | 'FEEDBACK_PENDING'
  | 'DISPUTED'
  | 'REFUNDED';

export type TimelineEntry = { status: string; at: string; note?: string };

export type Order = {
  id: string;
  buyerId: string;
  sellerId: string;
  courierId: string | null;
  items: {
    listingId: string | null;
    title: string;
    quantity: number;
    priceGnf: number;
    netPriceGnf: number;
    commissionGnf: number;
    imageUrl: string;
  }[];
  amountGnf: number;
  shippingCostGnf: number;
  commissionGnf: number;
  status: OrderStatus;
  escrowStatus: 'pending' | 'blocked' | 'released' | 'refunded';
  fulfillmentMode: 'courier' | 'pickup' | 'shopLocalDelivery';
  paymentMethod: PaymentMethod;
  pickupZoneId: string | null;
  disputeReason?: string;
  offerAmountGnf: number | null;
  originalAmountGnf: number;
  offerStatus: 'none' | 'pending' | 'accepted' | 'refused';
  courierName: string | null;
  timeline: TimelineEntry[];
  address?: {
    line?: string;
    city?: string;
    phone?: string;
    name?: string;
    email?: string;
    paymentPhone?: string;
    zoneId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  images: string[];
  reviewed?: boolean;
  buyerConfirmedAt?: string | null;
  buyer?: { id: string; pseudo: string; avatarUrl?: string | null };
  seller?: {
    id: string;
    pseudo: string;
    avatarUrl?: string | null;
    sellerKind?: string | null;
    shopKind?: string | null;
  };
  courier?: { id: string; pseudo: string; avatarUrl?: string | null } | null;
  notifiedCourierNames?: string[];
  pickup?: {
    place: string;
    address?: string | null;
    landmark?: string | null;
    phone?: string | null;
    openingTime?: string | null;
    closingTime?: string | null;
  };
  dropoff?: {
    place: string;
    address?: string | null;
    phone?: string | null;
    name?: string | null;
  };
};

export type PaymentMethod = 'OM_GN' | 'MTN_GN' | 'CINETPAY';

export type Payment = {
  id: string;
  merchantTransactionId: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  kind: string;
  paymentMethod: PaymentMethod;
  amountGnf: number;
  message: string;
  paymentUrl: string;
  mustRedirect?: boolean;
  orderIds: string[];
};

export type Offer = {
  id: string;
  listingId: string;
  buyerId?: string;
  sellerId?: string;
  amountGnf: number;
  message: string;
  status: 'pending' | 'accepted' | 'refused';
  used?: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  listingId: string | null;
  orderId: string | null;
  participantIds: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  peer: { id: string; name: string } | null;
};

export type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  kind?: 'text' | 'courier';
  meta?: {
    kind?: 'courier';
    name?: string;
    phone?: string;
    portraitUrl?: string;
    vehicle?: string;
    plate?: string;
  } | null;
};

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
};

export type NotificationPreference = {
  type: string;
  push?: boolean;
  email?: boolean;
  inApp?: boolean;
};

export type Favorite = { id: string; listingId: string; listing: (Listing & { _id?: string }) | null };

export type DisputeMessage = {
  id?: string;
  senderId?: string;
  senderRole?: string;
  senderName?: string;
  body: string;
  fromAdmin?: boolean;
  kind?: string;
  attachments?: { url: string; name?: string; mimeType?: string }[];
  createdAt: string;
};

export type DisputeRole = 'buyer' | 'seller' | 'admin';

export type Dispute = {
  id: string;
  orderId: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: 'refund_buyer' | 'release_seller' | 'partial_refund' | null;
  resolvedBy?: DisputeRole | null;
  buyerPercent?: number | null;
  openerRole: 'buyer' | 'seller';
  buyerId: string | null;
  sellerId: string | null;
  buyerName: string;
  sellerName: string;
  productTitle?: string;
  productImage?: string;
  amountGnf?: number;
  netGnf?: number;
  orderStatus?: string;
  escrowStatus?: string;
  viewerRole?: DisputeRole | null;
  currentUserId: string;
  evidence: { url: string; uploaderRole?: string; capturedAt?: string }[];
  messages: DisputeMessage[];
  createdAt: string;
};

export type WalletBalance = {
  balanceGnf: number;
  availableBalanceGnf: number;
  reservedBalanceGnf: number;
  currency: 'GNF';
};

export type LedgerEntry = {
  id: string;
  type: string;
  amountGnf: number;
  isCredit: boolean;
  label: string;
  createdAt: string;
};

export type SellerVerification = {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  reason: string;
  shopName: string;
  shopKind: ShopKind | null;
  shopDescription: string;
  storeAddress: string;
  soldCategories?: string[];
  deliveredCommunes?: string[];
  deliveryDelay?: string;
  neighborhood?: string;
  landmark?: string;
  orangeMoneyPhone?: string;
  openingTime?: string;
  closingTime?: string;
  documents: { url: string; name?: string; mimeType?: string; documentType?: string; createdAt?: string }[];
  messages: {
    senderId: string | null;
    fromAdmin: boolean;
    body: string;
    attachments: { url: string; name?: string }[];
    createdAt: string;
  }[];
};

export type LibraryItem = {
  id: string;
  title: string;
  description?: string;
  categoryId?: string | null;
  createdAt?: string;
};

export type CourierDocument = { url: string; mimeType?: string; name?: string };

export type CourierProfile = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
  courier: {
    verificationStatus: string;
    isAvailable: boolean;
    zoneId?: string | null;
    zoneIds?: string[];
    vehicle?: string;
    plate?: string;
    portraitUrl?: string;
    vehiclePhotoUrl?: string;
    rejectionReason?: string;
    kycLocked?: boolean;
    identityDocuments?: CourierDocument[];
  } | null;
  stats: { active: number; delivered: number; availableGnf: number };
};

export type CourierGains = {
  availableGnf: number;
  reservedGnf: number;
  deliveredCount: number;
  totalFeesGnf: number;
  entries: LedgerEntry[];
};

export type SalesChartPoint = { date: string; ventes: number; revenus: number };
