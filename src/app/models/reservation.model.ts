export interface Reservation {
  amount: number;
  totalWeight: number;
  receiver: Receiver;
  colis: Coli[];
  expeditionId: string;
  clientId: string;
}

export interface Receiver {
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  id?:string;
}

export enum ReservationStatus {
  CREATED = 'CREATED',
  DELETED = 'DELETED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  CONFIRMED = 'CONFIRMED',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  DROPPED = 'DROPPED',
  FAILED = 'FAILED'
}

export enum ExpeditionStatus {
  CREATED = 'CREATED',
  DELETED = 'DELETED',
  RESERVED = 'RESERVED',
  STARTED = 'STARTED',
  ONGOING = 'ONGOING',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED'
}

export enum ColiStatus {
  CREATED = 'CREATED',
  DELETED = 'DELETED',
  DROPPED = 'DROPPED',
  PICKED = 'PICKED',
  DELIVERED = 'DELIVERED',
}

export interface ListsReservation {
  id: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  amount: number;
  totalWeight: number;
  receiver: Receiver;
  status: string;
  colis: Coli[];
  expeditions: Expeditions;
  clients: Clients;
}

export interface Expeditions {
  id: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  deliverySteps: string;
  customsFees: number;
  receiptDate: string;
  deliveryDate: string;
  villeDep: string;
  villeArr: string;
  weightToLoad: number;
  depDateStart: string;
  depDateEnd: string;
  arrivalStartDate: string;
  arrivalEndDate: string;
  expeditionStatus: string;
  clients: Clients;
  collectionPoints: CollectionPoints;
}

export interface CollectionPoints {
  id: string;
  name: string;
  location_url: string;
  adresse: string;
  contacts: string;
  openHours: string;
  status: string;
}

export interface Clients {
  id: string;
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
  preferences: string;
  verificationStatus: string;
  status: string;
  kycType: string;
  kycFileName: string;
  kycSelfieFileName: string;
  bio: string;
  level: string;
  usersId: number;
  public_pseudo: string;
}

export interface Coli {
  id?: string;
  deleted?: boolean;
  weight: number;
  dimension: string;
  type: string;
  declaredPrice: number;
  contains: string;
  description: string;
  expeditorValidation?: boolean;
  travellerValidation?: boolean;
  receiverValidation?: boolean;
  coliStatus?: string;
  expeditorColisPictures?: ExpeditorColisPicture[];
  travellerColisPictures?: ExpeditorColisPicture[];
  collectorColisPictures?: ExpeditorColisPicture[];
}

interface ExpeditorColisPicture {
  id: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  fileName: string;
}

export interface Expedition {
  deliveryDate: string
  numVol: string
  countryDep: string
  countryArr: string
  fees: number
  preferences?: string
  receiptDate: string
  villeDep: string
  villeArr: string
  weight: number
  depStartDate: string
  depEndDate: string
  arrivalStartDate: string
  arrivalEndDate: string
  clientId: string
  collectionPointsId: string
}

export interface SearchParams {
  villeDep: string;
  villeArr: string;
  depDateStart: string;
}

export interface SearchParamsByCountry {
  countryDep: string;
  countryArr: string;
  depDateStart: string;
}
export interface SearchParmsByCountryOnly{
  countryDep: string;
  countryArr: string;
}

export interface ReservationParams {
  expeditionId: string;
}

export interface ExpeditionLists {
  id: string;
  numVol: string
  countryDep: string
  countryArr: string
  deliverySteps: string;
  customsFees: number;
  receiptDate: string;
  deliveryDate: string;
  villeDep: string;
  villeArr: string;
  weightToLoad: number;
  weightReserved:number;
  depDateStart: string;
  depDateEnd: string;
  arrivalStartDate: string;
  arrivalEndDate: string;
  expeditionStatus: string;
  clients: Clients;
  collectionPoints: CollectionPoints;
  preferences?: string;
}
export interface ExpeditionListsByMonth{
  month:number
  expeditions:ExpeditionLists[]
}
export interface ListReservations {
  id: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  amount: number;
  totalWeight: number;
  status: ReservationStatus;
  colis: Coli[];
  expeditions: ExpeditionLists;
  clients: Clients;
}
