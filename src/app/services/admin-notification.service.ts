import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import {
  AdminNotification,
  AdminNotificationEmails,
  AdminSsePayload
} from '../models/admin-notification.model';

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {
  private readonly BASE = `${environment.apiUrl}/api/v1/admin/notifications`;
  private readonly SSE_URL = `${environment.apiUrl}/api/sse/admin/subscribe`;

  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private liveSubject = new Subject<AdminSsePayload>();
  live$ = this.liveSubject.asObservable();

  private eventSource: EventSource | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private zone: NgZone
  ) {}

  list(): Observable<AdminNotification[]> {
    return this.http.get<AdminNotification[]>(this.BASE);
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.BASE}/unread-count`).pipe(
      tap((res) => this.unreadCountSubject.next(res.count ?? 0))
    );
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(`${this.BASE}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, current - 1));
      })
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.BASE}/read-all`, {}).pipe(
      tap(() => this.unreadCountSubject.next(0))
    );
  }

  getEmails(): Observable<AdminNotificationEmails> {
    return this.http.get<AdminNotificationEmails>(`${this.BASE}/emails`);
  }

  updateEmails(emails: string[]): Observable<AdminNotificationEmails> {
    return this.http.put<AdminNotificationEmails>(`${this.BASE}/emails`, { emails });
  }

  refreshUnreadCount(): void {
    this.unreadCount().subscribe({ error: () => undefined });
  }

  startSse(): void {
    if (this.eventSource || typeof EventSource === 'undefined') {
      return;
    }
    const token = this.authService.getAuthToken();
    if (!token) {
      return;
    }
    const url = `${this.SSE_URL}?access_token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);
    this.eventSource.addEventListener('admin-notification', (event: MessageEvent) => {
      this.zone.run(() => {
        try {
          const payload = JSON.parse(event.data) as AdminSsePayload;
          this.liveSubject.next(payload);
          this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
          this.showBrowserNotification(payload);
        } catch {
          // ignore malformed payloads
        }
      });
    });
    this.eventSource.onerror = () => {
      this.stopSse();
      setTimeout(() => this.startSse(), 5000);
    };
  }

  stopSse(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  requestBrowserPermission(): void {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private showBrowserNotification(payload: AdminSsePayload): void {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification(payload.title, {
        body: payload.content,
        tag: `${payload.eventType}-${payload.referenceId || Date.now()}`
      });
    } catch {
      // Browser may block Notification constructor outside user gesture in some contexts
    }
  }
}
