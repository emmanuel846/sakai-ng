export interface Profil {
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

export interface updateProfile {
  id: string;
  firstname: string;
  lastname: string;
  address: string;
  bio: string;
  country: string;
  birthdate: string;
  gender: string;
  preferences: string;
  public_pseudo: string;
}
export interface InAppNotification {
  id: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  title: string;
  content: string;
  userId: string;
  notificationType: string;
  read: boolean;
}