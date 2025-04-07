export interface ColisPicture {
  id: string;
  weight: number;
  dimension: string;
  type: string;
  declaredPrice: number;
  contains: string;
  description: string;
  expeditorValidation: boolean;
  travellerValidation: boolean;
  receiverValidation: boolean;
  expeditorColisPictures: ExpeditorColisPicture[];
  travellerColisPictures: ExpeditorColisPicture[];
  collectorColisPictures: ExpeditorColisPicture[];
}

export interface ExpeditorColisPicture {
  id: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  fileName: string;
}

export interface IndentityFileResponse {
  id: string;
  createdBy: string;
  updatedBy: string;
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