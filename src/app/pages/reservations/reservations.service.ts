import { HttpClient } from "@angular/common/http";
import { Injectable, signal, WritableSignal } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable, tap } from "rxjs";
import { Reservations } from "./reservation.model";

@Injectable({
    providedIn:'root'
})
export class ReservationService{
    apiUrl = environment.apiUrl+"/api/v1/reservation";
    constructor(private http: HttpClient){}
    reservations: WritableSignal<Reservations[]> = signal({} as any);
    reservationsList():Observable<Reservations[]>{
        return this.http.get<Reservations[]>(this.apiUrl+"/list")
        .pipe(
            tap(data=>{
                this.reservations.set(data);
            })
        )
    }

    listByExpedition(expeditionId: string): Observable<Reservations[]> {
        return this.http.get<Reservations[]>(this.apiUrl + '/listByExpedition', {
            params: { expeditionId }
        });
    }

    validateReservation(id: string): Observable<Reservations> {
        return this.http.put<Reservations>(`${this.apiUrl}/${id}/validate`, {});
    }

    rejectReservation(id: string): Observable<Reservations> {
        return this.http.put<Reservations>(`${this.apiUrl}/${id}/reject`, {});
    }

    suspendReservation(id: string): Observable<Reservations> {
        return this.http.put<Reservations>(`${this.apiUrl}/${id}/suspend`, {});
    }

    cancelReservation(id: string, reason?: string): Observable<Reservations> {
        let params: any = { reservationId: id };
        if (reason) params['reason'] = reason;
        return this.http.post<Reservations>(`${this.apiUrl}/cancel`, {}, { params });
    }

    addPicturesToColis(files: File[], actors: string, colisId: string): Observable<unknown> {
        const formData = new FormData();
        [...files].forEach((file) => formData.append('files', file, file.name));
        formData.append('actors', actors);
        formData.append('colisId', colisId);
        return this.http.put(`${environment.apiUrl}/api/v1/colis/addPictures`, formData);
    }

    getById(id: string): Observable<Reservations> {
        return this.http.get<Reservations>(`${this.apiUrl}/listById`, {
            params: { id }
        });
    }

    declareReception(reservationId: string, note?: string): Observable<Reservations> {
        const params: Record<string, string> = { reservationId };
        if (note) params['note'] = note;
        return this.http.post<Reservations>(`${this.apiUrl}/declareReception`, {}, { params });
    }

    updateReservationStatus(id: string, status: string): Observable<Reservations> {
        return this.http.get<Reservations>(`${this.apiUrl}/updateStatus`, {
            params: { reservationId: id, status }
        });
    }

    updateColisStatus(colisId: string, coliStatus: string): Observable<unknown> {
        return this.http.get(`${environment.apiUrl}/api/v1/colis/adminUpdateStatus`, {
            params: { colisId, coliStatus }
        });
    }
}