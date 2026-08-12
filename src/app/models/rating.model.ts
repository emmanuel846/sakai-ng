export interface UserRatingAdmin {
  id: string;
  raterUserId: string;
  raterPseudo: string;
  raterName: string;
  ratedUserId: string;
  ratedPseudo: string;
  ratedName: string;
  reservationId: string | null;
  score: number;
  comment: string;
  createdAt: string;
}

export interface PlatformFeedbackAdmin {
  id: string;
  clientId: string;
  clientPseudo: string;
  clientName: string;
  reservationId: string | null;
  expeditionId: string | null;
  score: number;
  comment: string;
  createdAt: string;
}
