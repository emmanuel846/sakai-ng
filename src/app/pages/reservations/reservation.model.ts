export interface Reservations {
  id: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  amount?: number;
  discountAmount?: number | null;
  grossAmount?: number | null;
  travelerShare?: number | null;
  promoCode?: string | null;
  creditAmount?: number | null;
  referralDiscountApplied?: boolean;
  totalWeight?: number;
  receiver?: Receiver;
  status: string;
  colis?: Coli[];
  expeditions?: Expeditions;
  clients?: Clients;
  shippingMode?: 'SELF_DROP' | 'ONLINE_DELIVERY';
  merchant?: string | null;
  trackingNumber?: string | null;
  estimatedDeliveryDate?: string | null;
  pickupCode?: string | null;
  receptionNote?: string | null;
  selectedCollectionPoint?: CollectionPoints | null;
  adminCreated?: boolean;
  adminPaymentMode?: 'STRIPE_LINK' | 'PAID_OFFLINE' | 'COMPLIMENTARY' | null;
  adminNote?: string | null;
}

export type AdminPaymentMode = 'STRIPE_LINK' | 'PAID_OFFLINE' | 'COMPLIMENTARY';

export interface AdminReservationCreateRequest {
  expeditionId: string;
  clientId: string;
  totalWeight: number;
  receiver: {
    fullName: string;
    phoneNumber: string;
    email?: string | null;
    address?: string | null;
  };
  colis?: Array<{
    weight: number;
    dimension?: string | null;
    type?: string | null;
    declaredPrice?: number;
    contains?: string | null;
    description?: string | null;
    reservedArticles?: Array<{ articleCategory?: string; quantity?: number | null; weight?: number | null }>;
  }>;
  shippingMode?: 'SELF_DROP' | 'ONLINE_DELIVERY';
  merchant?: string | null;
  trackingNumber?: string | null;
  estimatedDeliveryDate?: string | null;
  pickupCode?: string | null;
  collectionPointsId?: string | null;
  promoCode?: string | null;
  paymentMode: AdminPaymentMode;
  adminNote?: string | null;
}

export interface AdminReservationCreateResponse {
  data?: string | null;
  reservation: Reservations;
}

interface Expeditions {
  id: string;
  createdBy: null;
  updatedBy: null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  deliverySteps: null;
  customsFees: number;
  totalFees: null;
  receiptDate: string;
  deliveryDate: string;
  villeDep: string;
  countryDep: string;
  villeArr: string;
  countryArr: string;
  numVol: string;
  weightToLoad: number;
  weightReserved: number;
  depDateStart: string;
  depDateEnd: string;
  arrivalStartDate: string;
  arrivalEndDate: string;
  packageRetrivalDate: null;
  expeditionStatus: string;
  clients: Clients;
  collectionPoints: CollectionPoints;
  departureCollectionPoints?: CollectionPoints[];
  destCollectionPoints?: CollectionPoints;
  preferences: string;
}

interface CollectionPoints {
  id: string;
  createdBy: null;
  updatedBy: null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  name: string;
  location_url?: string;
  locationUrl?: string;
  adresse?: string;
  address?: string;
  iwtAdress?: string;
  contacts?: string;
  email?: string;
  openHours?: string;
  openingHours?: Array<{
    day?: string;
    openTime?: string;
    closeTime?: string;
    closed?: boolean;
  }>;
  status: string;
}

interface Clients {
  id: string;
  createdBy: null;
  updatedBy: null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  firstname: string;
  lastname: string;
  country: string;
  birthdate: string;
  address: string;
  phoneNumber: string;
  phoneVerified: boolean;
  rating: number;
  rating_counts: number;
  gender: string;
  preferences: null;
  verificationStatus: string;
  status: string;
  kycType: string;
  kycFileName: string;
  kycSelfieFileName: string;
  bio: null;
  level: null;
  users: null;
  usersId: number;
  public_pseudo: string;
  whotraveling_id?: string | null;
}

interface Coli {
  id: string;
  createdBy: null;
  updatedBy: null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  weight: number;
  dimension: string;
  type: string;
  declaredPrice: number;
  contains: string;
  description: string;
  expeditorValidation: boolean;
  travellerValidation: boolean;
  receiverValidation: boolean;
  coliStatus: string;
  reservedArticles?: Array<{ articleCategory?: string; quantity?: number | null; weight?: number | null }>;
  expeditorColisPictures: any[];
  travellerColisPictures: any[];
  collectorColisPictures: any[];
}

interface Receiver {
  id: string;
  createdBy: null;
  updatedBy: null;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  idpicturesName?: string | null;
  IDPicturesName?: string | null;
}