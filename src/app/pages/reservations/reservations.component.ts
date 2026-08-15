import { Component, computed } from '@angular/core';
import { ReservationService } from './reservations.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ReservationStatus } from '../../models/reservation.model';
import { Reservations } from './reservation.model';

interface Column {
  field: string;
  header: string;
  type?: 'date' | 'number' | 'string' | 'boolean';
}

@Component({
  selector: 'app-reservations',
  imports: [TableModule, CommonModule, FormsModule, TabsModule, ButtonModule, TagModule, ToastModule, DialogModule, InputTextarea, DropdownModule],
  providers: [MessageService],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss'
})
export class ReservationsComponent {
  reservations = computed(() => this.reservationService.reservations());

  cancelDialogVisible = false;
  cancelReservationId: string | null = null;
  cancelReason = '';

  statusDialogVisible = false;
  statusChangeTarget: Reservations | null = null;
  selectedNewStatus: ReservationStatus | null = null;
  updatingStatus = false;

  readonly statusOptions: { label: string; value: ReservationStatus }[] = [
    { label: 'Créée', value: ReservationStatus.CREATED },
    { label: 'Payée', value: ReservationStatus.PAYED },
    { label: 'En attente', value: ReservationStatus.PENDING },
    { label: 'Confirmée', value: ReservationStatus.CONFIRMED },
    { label: 'Validée', value: ReservationStatus.VALIDATED },
    { label: 'Rejetée', value: ReservationStatus.REJECTED },
    { label: 'Annulée', value: ReservationStatus.CANCELLED },
    { label: 'Déposée', value: ReservationStatus.DROPPED },
    { label: 'Échouée', value: ReservationStatus.FAILED },
    { label: 'Supprimée', value: ReservationStatus.DELETED },
  ];

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
      { field: 'promoCode', header: 'Code promo' },
      { field: 'discountAmount', header: 'Réduction' },
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

  openCancelDialog(id: string): void {
    this.cancelReservationId = id;
    this.cancelReason = '';
    this.cancelDialogVisible = true;
  }

  confirmCancel(): void {
    if (!this.cancelReservationId) return;
    this.reservationService.cancelReservation(this.cancelReservationId, this.cancelReason).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Annulé', detail: 'Réservation annulée' });
        this.cancelDialogVisible = false;
        this.reservationService.reservationsList().subscribe({});
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'annuler la réservation' })
    });
  }

  openStatusDialog(reservation: Reservations): void {
    this.statusChangeTarget = reservation;
    this.selectedNewStatus = (reservation.status as ReservationStatus) ?? null;
    this.statusDialogVisible = true;
  }

  confirmStatusChange(): void {
    if (!this.statusChangeTarget?.id || !this.selectedNewStatus) return;
    this.updatingStatus = true;
    this.reservationService.updateReservationStatus(this.statusChangeTarget.id, this.selectedNewStatus).subscribe({
      next: () => {
        const label = this.getStatusLabel(this.selectedNewStatus!);
        this.messageService.add({ severity: 'success', summary: 'Statut modifié', detail: `Nouveau statut : ${label}` });
        this.statusDialogVisible = false;
        this.updatingStatus = false;
        this.reservationService.reservationsList().subscribe({});
      },
      error: () => {
        this.updatingStatus = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de modifier le statut' });
      }
    });
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.label ?? status;
  }
}

