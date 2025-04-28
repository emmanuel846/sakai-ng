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
}