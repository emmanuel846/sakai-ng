import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PromoCode, PromoCodeRequest } from '../models/promo-code.model';

@Injectable({
  providedIn: 'root'
})
export class PromoCodeApiService {
  private readonly BASE = `${environment.apiUrl}/api/v1/promo`;

  constructor(private http: HttpClient) {}

  list(): Observable<PromoCode[]> {
    return this.http.get<PromoCode[]>(this.BASE);
  }

  get(id: string): Observable<PromoCode> {
    return this.http.get<PromoCode>(`${this.BASE}/${id}`);
  }

  create(dto: PromoCodeRequest): Observable<PromoCode> {
    return this.http.post<PromoCode>(this.BASE, dto);
  }

  update(id: string, dto: PromoCodeRequest): Observable<PromoCode> {
    return this.http.put<PromoCode>(`${this.BASE}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
