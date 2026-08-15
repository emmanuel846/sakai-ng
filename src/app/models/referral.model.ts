export type ReferralStatus = 'PENDING' | 'REWARDED' | 'INELIGIBLE';

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
