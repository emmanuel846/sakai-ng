export interface Reservations {
  id: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  amount?: number;
  totalWeight?: number;
  receiver?: Receiver;
  status: string;
  colis?: Coli[];
  expeditions?: Expeditions;
  clients?: Clients;
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
  location_url: string;
  adresse: string;
  contacts: string;
  openHours: string;
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
  idpicturesName: null;
}