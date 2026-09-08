import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReferralAccess, ReferralAdmin, ReferralRewardRules } from '../models/referral.model';

@Injectable({ providedIn: 'root' })
export class ReferralApiService {
  private readonly BASE = `${environment.apiUrl}/api/v1/referral`;

  constructor(private http: HttpClient) {}

  list(): Observable<ReferralAdmin[]> {
    return this.http.get<ReferralAdmin[]>(this.BASE);
  }

  getAccess(): Observable<ReferralAccess> {
    return this.http.get<ReferralAccess>(`${this.BASE}/access`);
  }

  updateAccess(payload: ReferralAccess): Observable<ReferralAccess> {
    return this.http.put<ReferralAccess>(`${this.BASE}/access`, payload);
  }

  getRules(): Observable<ReferralRewardRules> {
    return this.http.get<ReferralRewardRules>(`${this.BASE}/rules`);
  }

  updateRules(payload: ReferralRewardRules): Observable<ReferralRewardRules> {
    return this.http.put<ReferralRewardRules>(`${this.BASE}/rules`, payload);
  }
}
