import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Profil } from "../../models/profil.model";
import { AdminExpeditionCreateRequest, Expedition, ExpeditionLists, ExpeditionStatus } from "../../models/reservation.model";
@Injectable({
    providedIn: 'root'
})
export class ExpeditionService{
     url = environment.apiUrl+'/api/v1/expedition';
    constructor(private http: HttpClient) { }
    // Get all clients
    getExpeditons(): Observable<ExpeditionLists[]> {
        return this.http.get<ExpeditionLists[]>(this.url+'/list');
    }
    validate(clientId: string, status: ExpeditionStatus, raison?: string): Observable<any> {
        let query = `expId=${clientId}&expeditionStatus=${status}`;
        if (raison) {
            query += `&raison=${encodeURIComponent(raison)}`;
        }
        return this.http.put(this.url + '/validate?' + query, {});
    }
     updateExpedition(data: Expedition): Observable<Expedition> {
        return this.http.put<Expedition>(this.url + '/update', data);
    }

    createAdminExpedition(payload: AdminExpeditionCreateRequest): Observable<ExpeditionLists> {
        return this.http.post<ExpeditionLists>(`${this.url}/admin/create`, payload);
    }
}