import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PayoutMethod } from '../models/payout-method.model';

@Injectable({
  providedIn: 'root'
})
export class PayoutMethodApiService {
  private readonly BASE = `${environment.apiUrl}/api/v1/payoutmethod`;

  constructor(private http: HttpClient) {}

  getByClient(clientId: string): Observable<PayoutMethod[]> {
    return this.http.get<PayoutMethod[]>(`${this.BASE}/byClient`, {
      params: { clientId }
    });
  }

  /** IBAN en clair — ADMIN. */
  reveal(id: string): Observable<PayoutMethod> {
    return this.http.get<PayoutMethod>(`${this.BASE}/${id}/reveal`);
  }
}
