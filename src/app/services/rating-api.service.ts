import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlatformFeedbackAdmin, UserRatingAdmin } from '../models/rating.model';

@Injectable({
  providedIn: 'root'
})
export class RatingApiService {
  private readonly ratingBase = `${environment.apiUrl}/api/v1/rating`;
  private readonly feedbackBase = `${environment.apiUrl}/api/v1/platform-feedback`;

  constructor(private http: HttpClient) {}

  listUserRatings(): Observable<UserRatingAdmin[]> {
    return this.http.get<UserRatingAdmin[]>(`${this.ratingBase}/admin/list`);
  }

  listPlatformFeedback(): Observable<PlatformFeedbackAdmin[]> {
    return this.http.get<PlatformFeedbackAdmin[]>(`${this.feedbackBase}/admin/list`);
  }

  setPlatformFeedbackFeatured(id: string, featured: boolean): Observable<PlatformFeedbackAdmin> {
    const params = new HttpParams().set('featured', String(featured));
    return this.http.patch<PlatformFeedbackAdmin>(
      `${this.feedbackBase}/admin/${id}/featured`,
      null,
      { params }
    );
  }
}
