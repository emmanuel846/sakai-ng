import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";
import { Profil } from "../../models/profil.model";
import { Expedition, ExpeditionLists, ExpeditionStatus } from "../../models/reservation.model";
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
    validate(clientId: string,status: ExpeditionStatus): Observable<any> {
        return this.http.put(this.url+'/validate?expId='+clientId+'&expeditionStatus='+status, {});
    }
   
}