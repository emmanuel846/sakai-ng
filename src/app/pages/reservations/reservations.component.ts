import { Component, computed, OnDestroy } from '@angular/core';
import { ReservationService } from './reservations.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableRowSelectEvent } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ImageModule } from 'primeng/image';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ReservationStatus } from '../../models/reservation.model';
import { Reservations } from './reservation.model';
import { ClientService } from '../clients/client.service';
import { environment } from '../../../environments/environment';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Column {
  field: string;
  header: string;
  type?: 'date' | 'number' | 'string' | 'boolean';
}

interface ColiPicture {
  id?: string;
  fileName?: string;
}

@Component({
  selector: 'app-reservations',
  imports: [
    TableModule,
    CommonModule,
    FormsModule,
    TabsModule,
    ButtonModule,
    TagModule,
    ToastModule,
    DialogModule,
    InputTextarea,
    DropdownModule,
    DividerModule,
    ImageModule,
    ProgressSpinnerModule
  ],
  providers: [MessageService],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.scss'
})
export class ReservationsComponent implements OnDestroy {
  reservations = computed(() => this.reservationService.reservations());

  cancelDialogVisible = false;
  cancelReservationId: string | null = null;
  cancelReason = '';

  statusDialogVisible = false;
  statusChangeTarget: Reservations | null = null;
  selectedNewStatus: ReservationStatus | null = null;
  updatingStatus = false;

  selectedReservation: Reservations | null = null;
  picturesLoading = false;
  picturesError: string | null = null;
  private pictureUrls = new Map<string, string>();
  private objectUrls: string[] = [];
  private picturesSub?: Subscription;

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
  onlineDeliveryReservations = computed(() =>
    Array.isArray(this.reservationService.reservations())
      ? this.reservationService.reservations().filter(r => r.shippingMode === 'ONLINE_DELIVERY')
      : []
  );

  receptionDialogVisible = false;
  receptionTarget: Reservations | null = null;
  receptionNote = '';
  declaringReception = false;
  collectorFiles: Record<string, File[]> = {};
  cols!: Column[];
  pendingCols!: Column[];

  constructor(
    private reservationService: ReservationService,
    private messageService: MessageService,
    private clientService: ClientService
  ) {
    this.reservationService.reservationsList().subscribe({});

    this.cols = [
      { field: 'id', header: 'Référence' },
      { field: 'createdAt', header: 'Date de création', type: 'date' },
      { field: 'amount', header: 'Montant' },
      { field: 'promoCode', header: 'Code promo' },
      { field: 'discountAmount', header: 'Réduction' },
      { field: 'creditAmount', header: 'Crédit' },
      { field: 'totalWeight', header: 'Poids total' },
      { field: 'status', header: 'Statut' },
      { field: 'shippingMode', header: 'Acheminement' },
      { field: 'trackingNumber', header: 'N° de suivi' },
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

  ngOnDestroy(): void {
    this.picturesSub?.unsubscribe();
    this.revokeObjectUrls();
  }

  resolveFieldData(data: any, field: string): any {
    if (!data || !field) return null;
    if (field.indexOf('.') === -1) {
      return data[field];
    }
    return field.split('.').reduce((obj, key) => (obj ? obj[key] : null), data);
  }

  onRowSelect(event: TableRowSelectEvent): void {
    this.openDetails(event.data as Reservations);
  }

  onRowUnselect(): void {
    this.clearSelection();
  }

  openDetails(reservation: Reservations, event?: Event): void {
    event?.stopPropagation();
    this.selectedReservation = reservation;
    this.collectorFiles = {};
    this.receptionNote = reservation.receptionNote ?? '';
    this.picturesLoading = true;
    this.picturesError = null;

    if (!reservation.id) {
      this.loadPicturesForReservation(reservation);
      return;
    }

    this.reservationService.getById(reservation.id).subscribe({
      next: (full) => {
        this.selectedReservation = full;
        this.receptionNote = full.receptionNote ?? '';
        this.loadPicturesForReservation(full);
      },
      error: () => {
        // Fallback sur les données liste si le détail complet échoue
        this.loadPicturesForReservation(reservation);
        this.messageService.add({
          severity: 'warn',
          summary: 'Détail partiel',
          detail: 'Impossible de recharger le détail complet de la réservation.'
        });
      }
    });
  }

  clearSelection(): void {
    this.selectedReservation = null;
    this.picturesError = null;
    this.picturesLoading = false;
    this.collectorFiles = {};
    this.picturesSub?.unsubscribe();
    this.revokeObjectUrls();
    this.pictureUrls.clear();
  }

  validate(id: string): void {
    this.reservationService.validateReservation(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Réservation validée' });
        this.refreshList();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de valider la réservation' })
    });
  }

  reject(id: string): void {
    this.reservationService.rejectReservation(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'Rejeté', detail: 'Réservation rejetée' });
        this.refreshList();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de rejeter la réservation' })
    });
  }

  suspend(id: string): void {
    this.reservationService.suspendReservation(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Suspendu', detail: 'Réservation suspendue' });
        this.refreshList();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de suspendre la réservation' })
    });
  }

  openCancelDialog(id: string, event?: Event): void {
    event?.stopPropagation();
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
        this.refreshList();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'annuler la réservation' })
    });
  }

  openStatusDialog(reservation: Reservations, event?: Event): void {
    event?.stopPropagation();
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
        this.refreshList();
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

  shippingModeLabel(mode?: string): string {
    return mode === 'ONLINE_DELIVERY' ? 'Commande en ligne' : 'Dépôt au point';
  }

  isOnlineDelivery(reservation: Reservations): boolean {
    return reservation.shippingMode === 'ONLINE_DELIVERY';
  }

  canDeclareReception(reservation: Reservations): boolean {
    return reservation.status === 'CONFIRMED'
      && (reservation.colis ?? []).some(coli => coli.coliStatus === 'CREATED');
  }

  /** Upload photos collecteur possible dès qu'il y a un colis (déblocage / incident). */
  canUploadCollectorPhotos(reservation: Reservations): boolean {
    return (reservation.colis ?? []).some(coli => !!coli.id);
  }

  openReceptionDialog(reservation: Reservations, event?: Event): void {
    event?.stopPropagation();
    this.receptionTarget = reservation;
    this.receptionNote = reservation.receptionNote ?? '';
    this.collectorFiles = {};
    this.receptionDialogVisible = true;
  }

  onCollectorFilesSelected(colisId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.collectorFiles[colisId] = input.files ? Array.from(input.files) : [];
  }

  confirmReception(fromDetail = false): void {
    const reservation = fromDetail ? this.selectedReservation : this.receptionTarget;
    if (!reservation?.id || this.declaringReception) return;
    if (!this.canDeclareReception(reservation)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Réception indisponible',
        detail: 'La réservation doit être confirmée avec au moins un colis CREATED.'
      });
      return;
    }

    this.declaringReception = true;
    const note = this.receptionNote.trim();
    const uploads = (reservation.colis ?? [])
      .filter(coli => coli.id && (this.collectorFiles[coli.id]?.length ?? 0) > 0)
      .map(coli => this.reservationService.addPicturesToColis(
        this.collectorFiles[coli.id],
        environment.Actor.collector,
        coli.id
      ));

    const finish = () => this.reservationService.declareReception(reservation.id!, note || undefined).subscribe({
      next: () => this.onReceptionSuccess(fromDetail),
      error: (err) => this.onReceptionError(err, 'Impossible d\'enregistrer la réception')
    });

    if (uploads.length) {
      forkJoin(uploads).subscribe({
        next: () => finish(),
        error: (err) => this.onReceptionError(err, 'Impossible de charger les photos')
      });
    } else {
      finish();
    }
  }

  saveCollectorPhotosOnly(fromDialog = false): void {
    const reservation = fromDialog ? this.receptionTarget : this.selectedReservation;
    if (!reservation?.id || this.declaringReception) return;

    const uploads = (reservation.colis ?? [])
      .filter(coli => coli.id && (this.collectorFiles[coli.id]?.length ?? 0) > 0)
      .map(coli => this.reservationService.addPicturesToColis(
        this.collectorFiles[coli.id],
        environment.Actor.collector,
        coli.id
      ));

    if (!uploads.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aucune photo',
        detail: 'Sélectionnez au moins une photo à charger.'
      });
      return;
    }

    this.declaringReception = true;
    forkJoin(uploads).subscribe({
      next: () => this.onReceptionSuccess(true, 'Photos enregistrées'),
      error: (err) => this.onReceptionError(err, 'Impossible de charger les photos')
    });
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  boolLabel(value?: boolean | null): string {
    if (value === true) return 'Oui';
    if (value === false) return 'Non';
    return '—';
  }

  reservationSeverity(status?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'PAYED':
      case 'CONFIRMED':
      case 'VALIDATED':
      case 'DROPPED':
        return 'success';
      case 'PENDING':
      case 'CREATED':
        return 'warn';
      case 'CANCELLED':
      case 'REJECTED':
      case 'DELETED':
      case 'FAILED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  receiverIdFileName(receiver?: { idpicturesName?: string | null; IDPicturesName?: string | null } | null): string | null {
    if (!receiver) return null;
    return receiver.idpicturesName || receiver.IDPicturesName || null;
  }

  pictureUrl(fileName?: string | null): string | null {
    if (!fileName) return null;
    return this.pictureUrls.get(fileName) ?? null;
  }

  coliPictures(coli: {
    expeditorColisPictures?: ColiPicture[] | null;
    travellerColisPictures?: ColiPicture[] | null;
    collectorColisPictures?: ColiPicture[] | null;
  }): { label: string; pictures: ColiPicture[] }[] {
    return [
      { label: 'Expéditeur', pictures: coli.expeditorColisPictures || [] },
      { label: 'Voyageur', pictures: coli.travellerColisPictures || [] },
      { label: 'Collecteur', pictures: coli.collectorColisPictures || [] }
    ];
  }

  private onReceptionSuccess(fromDetail: boolean, summary = 'Réception enregistrée'): void {
    this.declaringReception = false;
    this.receptionDialogVisible = false;
    this.collectorFiles = {};
    this.messageService.add({
      severity: 'success',
      summary,
      detail: summary === 'Photos enregistrées'
        ? 'Les photos ont été ajoutées à la réservation.'
        : 'Le colis est disponible pour le voyageur.'
    });
    const reselectId = this.selectedReservation?.id || this.receptionTarget?.id;
    this.refreshList(fromDetail || !!this.selectedReservation ? reselectId : undefined);
  }

  private onReceptionError(err: any, fallback: string): void {
    this.declaringReception = false;
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: err?.error?.message || fallback
    });
  }

  private refreshList(reselectId?: string): void {
    this.reservationService.reservationsList().subscribe({
      next: (data) => {
        if (!reselectId) return;
        const updated = (data || []).find(r => r.id === reselectId);
        if (updated) {
          this.openDetails(updated);
        }
      }
    });
  }

  private loadPicturesForReservation(reservation: Reservations): void {
    this.picturesSub?.unsubscribe();
    this.revokeObjectUrls();
    this.pictureUrls.clear();
    this.picturesError = null;

    const fileNames = new Set<string>();
    const idFile = this.receiverIdFileName(reservation.receiver);
    if (idFile) {
      fileNames.add(idFile);
    }
    for (const coli of reservation.colis || []) {
      for (const group of this.coliPictures(coli)) {
        for (const pic of group.pictures) {
          if (pic?.fileName) {
            fileNames.add(pic.fileName);
          }
        }
      }
    }

    if (fileNames.size === 0) {
      this.picturesLoading = false;
      return;
    }

    this.picturesLoading = true;
    const names = Array.from(fileNames);
    const requests = names.map((fileName) =>
      this.clientService.downloadFile(fileName).pipe(catchError(() => of(null)))
    );

    this.picturesSub = forkJoin(requests).subscribe({
      next: (blobs) => {
        let loaded = 0;
        names.forEach((fileName, index) => {
          const blob = blobs[index];
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          this.objectUrls.push(url);
          this.pictureUrls.set(fileName, url);
          loaded += 1;
        });
        this.picturesLoading = false;
        this.picturesError = loaded === 0 ? 'Impossible de charger les photos' : null;
      },
      error: () => {
        this.picturesLoading = false;
        this.picturesError = 'Impossible de charger les photos';
      }
    });
  }

  private revokeObjectUrls(): void {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls = [];
  }
}
