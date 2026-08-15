export type PromoCodeType = 'PERCENT' | 'FIXED';
export type PromoFundedBy = 'PLATFORM';

export interface PromoCode {
  id: string;
  code: string;
  type: PromoCodeType;
  value: number;
  fundedBy: PromoFundedBy;
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  maxUsesPerClient: number | null;
  minAmount: number | null;
  minWeight: number | null;
  countryDep: string | null;
  countryArr: string | null;
  active: boolean;
  description: string | null;
  usageCount: number;
  expired: boolean;
  notYetValid: boolean;
  createdAt: string;
}

export interface PromoCodeRequest {
  code: string;
  type: PromoCodeType;
  value: number;
  fundedBy: PromoFundedBy;
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  maxUsesPerClient: number | null;
  minAmount: number | null;
  minWeight: number | null;
  countryDep: string | null;
  countryArr: string | null;
  active: boolean;
  description: string | null;
}
