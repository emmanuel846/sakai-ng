import { Component, computed } from '@angular/core';
import { ReservationService } from './reservations.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
interface Column {
  field: string;
  header: string;
  type?: 'date' | 'number' | 'string' | 'boolean';
}
@Component({
  selector: 'app-reservations',
  imports: [TableModule, CommonModule, TabsModule, ButtonModule, TagModule, ToastModule],
  providers: [MessageService],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss'
})
export class ReservationsComponent {
  reservations = computed(() => this.reservationService.reservations());
  pendingReservations = computed(() =>
    Array.isArray(this.reservationService.reservations())
      ? this.reservationService.reservations().filter(r => r.status === 'CREATED')
      : []
  );
  cols!: Column[];
  pendingCols!: Column[];

  constructor(private reservationService: ReservationService, private messageService: MessageService){
    this.reservationService.reservationsList().subscribe({});

    this.cols = [
      { field: 'id', header: 'Référence' },
      { field: 'createdAt', header: 'Date de création', type: 'date' },
      { field: 'amount', header: 'Montant' },
      { field: 'totalWeight', header: 'Poids total' },
      { field: 'status', header: 'Statut' },
    
      // Champs imbriqués
      { field: 'receiver.fullName', header: 'Récepteur' },
      { field: 'receiver.phoneNumber', header: 'Téléphone récepteur' },
    
      { field: 'clients.firstname', header: 'Client' },
      { field: 'clients.phoneNumber', header: 'Téléphone client' },
    
      { field: 'expeditions.countryDep', header: 'Pays de départ' },
      { field: 'expeditions.countryArr', header: 'Pays d\'arrivée' },
      { field: 'expeditions.depDateStart', header: 'Date départ prévue', type: 'date' },
      { field: 'expeditions.arrivalEndDate', header: 'Date d\'arrivée estimée', type: 'date' },
    
      { field: 'expeditions.collectionPoints.name', header: 'Point de collecte' },
    ];

    this.pendingCols = [
      { field: 'id', header: 'Référence' },
      { field: 'createdAt', header: 'Date de création', type: 'date' },
      { field: 'amount', header: 'Montant' },
      { field: 'totalWeight', header: 'Poids total' },
      { field: 'receiver.fullName', header: 'Récepteur' },
      { field: 'clients.firstname', header: 'Client' },
      { field: 'clients.phoneNumber', header: 'Téléphone client' },
      { field: 'expeditions.countryDep', header: 'Pays de départ' },
      { field: 'expeditions.countryArr', header: 'Pays d\'arrivée' },
      { field: 'expeditions.depDateStart', header: 'Date départ prévue', type: 'date' },
    ];
  }

  resolveFieldData(data: any, field: string): any {
    if (!data || !field) return null;
    if (field.indexOf('.') === -1) {
      return data[field];
    } else {
      return field.split('.').reduce((obj, key) => (obj ? obj[key] : null), data);
    }
  }

  validate(id: string): void {
    this.reservationService.validateReservation(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Réservation validée' });
        this.reservationService.reservationsList().subscribe({});
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de valider la réservation' })
    });
  }

  reject(id: string): void {
    this.reservationService.rejectReservation(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Rejeté', detail: 'Réservation rejetée' });
        this.reservationService.reservationsList().subscribe({});
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de rejeter la réservation' })
    });
  }

  suspend(id: string): void {
    this.reservationService.suspendReservation(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Suspendu', detail: 'Réservation suspendue' });
        this.reservationService.reservationsList().subscribe({});
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de suspendre la réservation' })
    });
  }
}

