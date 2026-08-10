export interface PayoutMethod {
  id: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
  payoutType: string;
  accountHolderName: string;
  country: string;
  email: string;
  phoneNumber: string;
  bankName: string;
  /** Masqué par défaut ; plein après reveal admin. */
  iban: string;
  rib?: string | null;
  mobileOperator?: string | null;
  verificationDocumentUrl?: string | null;
  note?: string | null;
  client?: string;
  isDefault?: boolean;
  isVerified?: boolean;
}
