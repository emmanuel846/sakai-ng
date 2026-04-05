import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Province } from '../models/city.model';

@Injectable({
  providedIn: 'root'
})
export class ProvinceApiService {
  private readonly BASE = `${environment.apiUrl}/api/v1/provinces`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Province[]> {
    return this.http.get<Province[]>(`${this.BASE}/list`).pipe(
      catchError(() => of([]))
    );
  }
}
