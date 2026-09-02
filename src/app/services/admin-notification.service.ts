import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, take, tap } from 'rxjs';
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

  private abortController: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connecting = false;
  private refreshInFlight = false;

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
    if (this.connecting || this.abortController) {
      return;
    }
    const token = this.authService.getAuthToken();
    if (!token) {
      return;
    }
    this.connecting = true;
    this.abortController = new AbortController();
    void this.readSse(token, this.abortController.signal);
  }

  stopSse(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.abortController?.abort();
    this.abortController = null;
    this.connecting = false;
  }

  requestBrowserPermission(): void {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private async readSse(token: string, signal: AbortSignal): Promise<void> {
    try {
      const response = await fetch(this.SSE_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        signal
      });
      if (!response.ok || !response.body) {
        this.abortController = null;
        this.connecting = false;
        this.handleSseHttpError(response.status);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';
        for (const block of blocks) {
          this.dispatchSseBlock(block);
        }
      }
      if (!signal.aborted) {
        this.abortController = null;
        this.scheduleReconnect(3000);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return;
      }
      this.abortController = null;
      this.scheduleReconnect(5000);
    } finally {
      this.connecting = false;
    }
  }

  private handleSseHttpError(status: number): void {
    if (status === 403) {
      return;
    }
    if (status === 401) {
      this.refreshThenReconnect();
      return;
    }
    this.scheduleReconnect(5000);
  }

  private refreshThenReconnect(): void {
    if (this.refreshInFlight) {
      return;
    }
    this.refreshInFlight = true;
    this.authService.refreshAccessToken().pipe(take(1)).subscribe({
      next: () => {
        this.refreshInFlight = false;
        this.scheduleReconnect(0);
      },
      error: () => {
        this.refreshInFlight = false;
      }
    });
  }

  private scheduleReconnect(delayMs: number): void {
    if (this.reconnectTimer || this.abortController) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.startSse();
    }, delayMs);
  }

  private dispatchSseBlock(block: string): void {
    let eventName = 'message';
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (eventName !== 'admin-notification' || dataLines.length === 0) {
      return;
    }
    this.zone.run(() => {
      try {
        const payload = JSON.parse(dataLines.join('\n')) as AdminSsePayload;
        this.liveSubject.next(payload);
        this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
        this.showBrowserNotification(payload);
      } catch {
        // ignore malformed payloads
      }
    });
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
