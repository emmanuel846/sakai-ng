export type ReferralStatus = 'PENDING' | 'REWARDED' | 'INELIGIBLE';
export type ReferralAccessMode = 'ALL' | 'SELECTED';
export type ReferralRewardTrigger = 'REGISTRATION' | 'FIRST_RESERVATION' | 'FIRST_EXPEDITION';
export type ReferralRewardBeneficiary = 'REFERRER' | 'REFEREE';
export type ReferralBenefitKind = 'CREDIT' | 'DISCOUNT';

export interface ReferralRewardRule {
  trigger: ReferralRewardTrigger;
  beneficiary: ReferralRewardBeneficiary;
  enabled: boolean;
  benefitKind: ReferralBenefitKind;
  rewardType: 'FIXED' | 'PERCENT';
  amount: number;
  oncePerReferee: boolean;
  maxPerMonth?: number | null;
}

export interface ReferralRewardRules {
  rules: ReferralRewardRule[];
}

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
