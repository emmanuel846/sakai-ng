export type AdminNotificationEventType =
  | 'TRAJET_CREE'
  | 'TRAJET_DEMARRE'
  | 'RESERVATION_EFFECTUEE'
  | 'KYC_ENVOYE';

export interface AdminNotification {
  id: string;
  createdAt: string;
  title: string;
  content: string;
  adminUserId: number;
  eventType: AdminNotificationEventType;
  referenceType: string | null;
  referenceId: string | null;
  read: boolean;
  deleted?: boolean;
}

export interface AdminSsePayload {
  title: string;
  content: string;
  eventType: AdminNotificationEventType;
  referenceType: string;
  referenceId: string;
}

export interface AdminNotificationEmails {
  emails: string[];
}
