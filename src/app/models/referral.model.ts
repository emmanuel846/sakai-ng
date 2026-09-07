export type ReferralStatus = 'PENDING' | 'REWARDED' | 'INELIGIBLE';
export type ReferralAccessMode = 'ALL' | 'SELECTED';

export interface ReferralAccess {
  enabled: boolean;
  accessMode: ReferralAccessMode;
  allowedClientIds: string[];
}

export interface ReferralAdmin {
  id: string;
  referralCode: string;
  status: ReferralStatus;
  rewardAmount: number | null;
  rewardedAt: string | null;
  createdAt: string;
  referrerId: string;
  referrerName: string;
  referrerCode: string | null;
  refereeId: string;
  refereeName: string;
  reservationId: string | null;
}
