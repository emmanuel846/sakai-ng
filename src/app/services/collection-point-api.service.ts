import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CollectionPoint,
  CollectionPointCreateRequest,
  CollectionPointUpdateRequest,
  CollectionPointStatus,
  CollectionPointType
} from '../models/collectionPoint.model';

@Injectable({
  providedIn: 'root'
})
export class CollectionPointApiService {
  private readonly BASE = `${environment.apiUrl}/api/v1/collection-points`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(this.BASE);
  }

  getById(id: string): Observable<CollectionPoint> {
    return this.http.get<CollectionPoint>(`${this.BASE}/${id}`);
  }

  create(dto: CollectionPointCreateRequest): Observable<CollectionPoint> {
    return this.http.post<CollectionPoint>(this.BASE, dto);
  }

  update(id: string, dto: CollectionPointUpdateRequest): Observable<CollectionPoint> {
    return this.http.put<CollectionPoint>(`${this.BASE}/${id}`, dto);
  }

  changeStatus(id: string, status: CollectionPointStatus): Observable<CollectionPoint> {
    return this.http.patch<CollectionPoint>(`${this.BASE}/${id}/status`, null, {
      params: new HttpParams().set('status', status)
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  getByType(type: CollectionPointType): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(`${this.BASE}/by-type/${type}`);
  }

  getByCountry(countryId: string): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(`${this.BASE}/by-country/${countryId}`);
  }

  getByCity(cityId: string): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(`${this.BASE}/by-city/${cityId}`);
  }

  getByProvince(provinceId: string): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(`${this.BASE}/by-province/${provinceId}`);
  }

  getByStatus(status: CollectionPointStatus): Observable<CollectionPoint[]> {
    return this.http.get<CollectionPoint[]>(`${this.BASE}/by-status/${status}`);
  }

  // --- Backward-compat aliases ---
  getCollectionPoints(): Observable<CollectionPoint[]> { return this.getAll(); }
  createCollectionPoint(dto: CollectionPointCreateRequest): Observable<CollectionPoint> { return this.create(dto); }
  updateCollectionPoint(id: string, dto: CollectionPointUpdateRequest): Observable<CollectionPoint> { return this.update(id, dto); }
  deleteCollectionPoint(id: string): Observable<void> { return this.delete(id); }
  getCollectionPointsByCountry(_: string): Observable<CollectionPoint[]> { return this.getAll(); }
}

