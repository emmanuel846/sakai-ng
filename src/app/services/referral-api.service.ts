import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReferralAdmin } from '../models/referral.model';

@Injectable({ providedIn: 'root' })
export class ReferralApiService {
  private readonly BASE = `${environment.apiUrl}/api/v1/referral`;

  constructor(private http: HttpClient) {}

  list(): Observable<ReferralAdmin[]> {
    return this.http.get<ReferralAdmin[]>(this.BASE);
  }
}
