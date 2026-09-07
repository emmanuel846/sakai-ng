import { AfterContentInit, Component, OnDestroy, input, OnInit } from '@angular/core';
import {
  CollectionPoints,
  Expedition,
  ExpeditionLists,
  ExpeditionStatus,
  ExpeditorColisPicture
} from '../../models/reservation.model';
import { ExpeditionService } from './expedition.service';
import { Table, TableModule, TableRowSelectEvent } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { RippleModule } from 'primeng/ripple';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { ProgressBar } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';
import { ImageModule } from 'primeng/image';
import { TooltipModule } from 'primeng/tooltip';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ReservationService } from '../reservations/reservations.service';
import { Reservations } from '../reservations/reservation.model';
import { AdminCreateReservationComponent } from '../reservations/admin-create-reservation/admin-create-reservation.component';
import { ClientService } from '../clients/client.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-expeditions',
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    ProgressBar,
    ProgressSpinnerModule,
    DatePicker,
    CheckboxModule,
    TabsModule,
    DividerModule,
    AccordionModule,
    ImageModule,
    TooltipModule,
    AdminCreateReservationComponent
  ],
  providers: [MessageService],
  templateUrl: './expeditions.component.html',
  styleUrl: './expeditions.component.scss'
})
export class ExpeditionsComponent implements OnInit, AfterContentInit, OnDestroy {
  loading = false;
  expeditions: ExpeditionLists[] = [];
  expedtionStatus = ExpeditionStatus;
  selectedExpedition: ExpeditionLists | null = null;
  editDialogVisible = false;
  editForm!: FormGroup;
  saving = false;
  filterBy = input<ExpeditionStatus | null>(null);
  statusFilter: ExpeditionStatus | null = null;
  private allExpeditions: ExpeditionLists[] = [];
  activeDetailTab: string | number = 'trajet';

  reservations: Reservations[] = [];
  reservationsLoading = false;
  reservationsError: string | null = null;
  picturesLoading = false;
  picturesError: string | null = null;
  private pictureUrls = new Map<string, string>();
  private objectUrls: string[] = [];
  private reservationsSub?: Subscription;
  private picturesSub?: Subscription;
  collectorFiles: Record<string, File[]> = {};
  receptionNotes: Record<string, string> = {};
  declaringReceptionId: string | null = null;
  updatingStatus = false;
  selectedStatus: ExpeditionStatus | null = null;
  createDialogVisible = false;
  createExpedition: ExpeditionLists | null = null;

  readonly statusOptions: { label: string; value: ExpeditionStatus }[] = [
    { label: 'En attente de validation', value: ExpeditionStatus.CREATED },
    { label: 'En attente', value: ExpeditionStatus.PENDING },
    { label: 'En cours de traitement', value: ExpeditionStatus.VALIDATED },
    { label: 'Réservée', value: ExpeditionStatus.RESERVED },
    { label: 'Démarrée', value: ExpeditionStatus.STARTED },
    { label: 'En cours', value: ExpeditionStatus.ONGOING },
    { label: 'Livrée', value: ExpeditionStatus.DELIVERED },
    { label: 'Terminée', value: ExpeditionStatus.COMPLETED },
    { label: 'Rejetée', value: ExpeditionStatus.REJECTED },
    { label: 'Annulée', value: ExpeditionStatus.CANCELLED },
    { label: 'Supprimée', value: ExpeditionStatus.DELETED }
  ];

  categories = [
    { name: 'Chaussures et accessoires' },
    { name: 'Sacs' },
    { name: 'Jeux' },
    { name: 'Parfums' },
    { name: 'Téléphones et accessoires' },
    { name: 'Pc portable et accessoires' },
    { name: 'Pommade' },
    { name: 'Denrée alimentaires' },
    { name: 'Savon' },
    { name: 'Produits cosmétiques' },
    { name: 'Médicaments' },
    { name: 'Protège sleep / menstrues' },
    { name: 'Bijoux' },
    { name: 'Montres' },
    { name: 'Fournitures scolaire' },
    { name: 'Pièces Auto' },
    { name: 'Ustensiles de cuisine' },
    { name: 'Liqueurs locale' },
    { name: 'Huiles alimentaires' },
    { name: 'Documents' },
    { name: 'Autres' }
  ];
  selectedPreferences: Array<{ selected: boolean; categoryName: string; maxQuantity: number }> = [];

  constructor(
    private expeditionService: ExpeditionService,
    private reservationService: ReservationService,
    private clientService: ClientService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.selectedPreferences = this.categories.map((cat) => ({
      selected: false,
      categoryName: cat.name,
      maxQuantity: 1
    }));
    this.getAllExpeditions();
  }

  ngAfterContentInit() {}

  ngOnDestroy() {
    this.reservationsSub?.unsubscribe();
    this.picturesSub?.unsubscribe();
    this.revokeObjectUrls();
  }

  get isAllTab(): boolean {
    return this.filterBy() == null;
  }

  getAllExpeditions() {
    this.loading = true;
    this.expeditionService.getExpeditons().subscribe({
      next: (data) => {
        this.allExpeditions = data.reverse();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilters() {
    const tabFilter = this.filterBy();
    this.expeditions = this.allExpeditions.filter((exp) => {
      if (tabFilter && exp.expeditionStatus !== tabFilter) {
        return false;
      }
      if (this.isAllTab && this.statusFilter && exp.expeditionStatus !== this.statusFilter) {
        return false;
      }
      return true;
    });
    if (this.selectedExpedition) {
      const refreshed = this.expeditions.find((e) => e.id === this.selectedExpedition!.id);
      if (refreshed) {
        this.selectedExpedition = refreshed;
        this.selectedStatus = refreshed.expeditionStatus as ExpeditionStatus;
      }
    }
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  onRowSelect(event: TableRowSelectEvent) {
    const expedition = event.data as ExpeditionLists;
    this.selectExpedition(expedition);
  }

  onRowUnselect() {
    if (this.selectedExpedition && !this.expeditions.some((e) => e.id === this.selectedExpedition!.id)) {
      return;
    }
    this.clearSelection();
  }

  openDetails(expedition: ExpeditionLists) {
    this.selectExpedition(expedition);
  }

  clearSelection() {
    this.selectedExpedition = null;
    this.selectedStatus = null;
    this.reservations = [];
    this.reservationsError = null;
    this.picturesError = null;
    this.activeDetailTab = 'trajet';
    this.reservationsSub?.unsubscribe();
    this.picturesSub?.unsubscribe();
    this.revokeObjectUrls();
    this.pictureUrls.clear();
  }

  private selectExpedition(expedition: ExpeditionLists) {
    this.selectedExpedition = expedition;
    this.selectedStatus = expedition.expeditionStatus as ExpeditionStatus;
    this.activeDetailTab = 'trajet';
    this.loadReservations(expedition.id);
  }

  onDetailStatusChange(status: ExpeditionStatus) {
    if (!status || !this.selectedExpedition || status === this.selectedExpedition.expeditionStatus) {
      this.selectedStatus = (this.selectedExpedition?.expeditionStatus as ExpeditionStatus) ?? null;
      return;
    }
    this.selectedStatus = status;
    this.validate(status, this.selectedExpedition);
  }

  statusLabel(status?: string | null): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? status ?? '—';
  }

  validate(expedtionStatus: ExpeditionStatus, expedition?: ExpeditionLists) {
    const target = expedition ?? this.selectedExpedition;
    if (!target || this.updatingStatus) {
      return;
    }
    this.selectedExpedition = target;
    this.updatingStatus = true;
    const raison = expedtionStatus === ExpeditionStatus.REJECTED ? 'Rejet administrateur' : undefined;
    this.expeditionService.validate(target.id, expedtionStatus, raison).subscribe({
      next: () => {
        this.updatingStatus = false;
        if (this.selectedExpedition?.id === target.id) {
          this.selectedExpedition = {
            ...this.selectedExpedition,
            expeditionStatus: expedtionStatus
          };
          this.selectedStatus = expedtionStatus;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Statut modifié',
          detail: `Nouveau statut : ${this.statusLabel(expedtionStatus)}`
        });
        this.getAllExpeditions();
      },
      error: (err) => {
        this.updatingStatus = false;
        this.selectedStatus = this.selectedExpedition?.expeditionStatus as ExpeditionStatus ?? null;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message || 'Impossible de mettre à jour le statut'
        });
      }
    });
  }

  openEditDialog(expedition: ExpeditionLists, event?: Event) {
    event?.stopPropagation();
    this.selectedExpedition = expedition;
    this.selectedStatus = expedition.expeditionStatus as ExpeditionStatus;

    this.selectedPreferences = this.categories.map((cat) => {
      const existingPref = expedition.preferences?.find((p) => p.categoryName === cat.name);
      return {
        selected: !!existingPref,
        categoryName: cat.name,
        maxQuantity: existingPref?.maxQuantity || 1
      };
    });

    this.editForm = this.fb.group({
      numVol: [expedition.numVol, Validators.required],
      countryDep: [expedition.countryDep, Validators.required],
      countryArr: [expedition.countryArr, Validators.required],
      villeDep: [expedition.villeDep, Validators.required],
      villeArr: [expedition.villeArr, Validators.required],
      weightToLoad: [expedition.weightToLoad, [Validators.required, Validators.min(0)]],
      customsFees: [expedition.customsFees ?? 0, [Validators.required, Validators.min(0)]],
      depDateStart: [new Date(expedition.depDateStart), Validators.required],
      arrivalStartDate: [new Date(expedition.arrivalStartDate), Validators.required],
      receiptDate: [new Date(expedition.receiptDate), Validators.required],
      deliveryDate: [new Date(expedition.deliveryDate), Validators.required],
      deliverySteps: [expedition.deliverySteps || '']
    });
    this.editDialogVisible = true;
  }

  saveExpedition() {
    if (!this.editForm?.valid || !this.selectedExpedition) {
      return;
    }
    this.saving = true;
    const formValue = this.editForm.value;

    const preferencesArray = this.selectedPreferences
      .filter((pref) => pref.selected)
      .map((pref) => ({
        categoryName: pref.categoryName,
        maxQuantity: pref.maxQuantity,
        limitType: 'QUANTITY' as const
      }));

    const updatedExpedition: Expedition = {
      id: this.selectedExpedition.id,
      numVol: formValue.numVol,
      countryDep: formValue.countryDep,
      countryArr: formValue.countryArr,
      villeDep: formValue.villeDep,
      villeArr: formValue.villeArr,
      weight: formValue.weightToLoad,
      fees: formValue.customsFees,
      totalFees: formValue.customsFees,
      preferences: preferencesArray,
      depStartDate: formValue.depDateStart.toISOString(),
      depEndDate: this.selectedExpedition.depDateEnd || formValue.depDateStart.toISOString(),
      arrivalStartDate: formValue.arrivalStartDate.toISOString(),
      arrivalEndDate: this.selectedExpedition.arrivalEndDate || formValue.arrivalStartDate.toISOString(),
      receiptDate: formValue.receiptDate.toISOString(),
      deliveryDate: formValue.deliveryDate.toISOString(),
      packageRetrivalDate: formValue.receiptDate.toISOString(),
      clientId: this.selectedExpedition.clients.id,
      collectionPointsId: this.selectedExpedition.collectionPoints?.id || '',
      collectionPointsIds: this.selectedExpedition.collectionPoints?.id
        ? [this.selectedExpedition.collectionPoints.id]
        : []
    };

    this.expeditionService.updateExpedition(updatedExpedition).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Expédition modifiée avec succès'
        });
        this.editDialogVisible = false;
        this.saving = false;
        this.getAllExpeditions();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: "Erreur lors de la modification de l'expédition"
        });
        this.saving = false;
        console.error('Error updating expedition:', error);
      }
    });
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    return String(value);
  }

  formatMoney(value?: number | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return `${Number(value).toFixed(2)} €`;
  }

  formatPercent(value?: number | null): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    const pct = value <= 1 ? value * 100 : value;
    return `${pct.toFixed(2)} %`;
  }

  remainingWeight(exp: ExpeditionLists): number {
    return Math.max(0, (exp.weightToLoad || 0) - (exp.weightReserved || 0));
  }

  canCreateReservation(exp?: ExpeditionLists | null): boolean {
    return !!exp
      && exp.expeditionStatus === ExpeditionStatus.VALIDATED
      && this.remainingWeight(exp) > 0;
  }

  openCreateReservation(expedition?: ExpeditionLists | null, event?: Event): void {
    event?.stopPropagation();
    this.createExpedition = expedition ?? this.selectedExpedition;
    this.createDialogVisible = true;
  }

  onAdminReservationCreated(reservation: Reservations): void {
    this.getAllExpeditions();
    if (this.selectedExpedition?.id && reservation.expeditions?.id === this.selectedExpedition.id) {
      this.loadReservations(this.selectedExpedition.id);
    }
  }

  statusSeverity(status?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case ExpeditionStatus.COMPLETED:
      case ExpeditionStatus.DELIVERED:
      case ExpeditionStatus.VALIDATED:
        return 'success';
      case ExpeditionStatus.STARTED:
      case ExpeditionStatus.ONGOING:
      case ExpeditionStatus.RESERVED:
        return 'info';
      case ExpeditionStatus.CREATED:
      case ExpeditionStatus.PENDING:
        return 'warn';
      case ExpeditionStatus.REJECTED:
      case ExpeditionStatus.DELETED:
      case ExpeditionStatus.CANCELLED:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  reservationSeverity(status?: string | null): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'PAYED':
      case 'CONFIRMED':
      case 'VALIDATED':
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

  boolLabel(value?: boolean | null): string {
    if (value === true) return 'Oui';
    if (value === false) return 'Non';
    return '—';
  }

  preferenceLabel(pref: { categoryName: string; maxQuantity?: number | null; maxWeight?: number | null; limitType?: string }): string {
    if (pref.limitType === 'WEIGHT') {
      return `${pref.categoryName} — max ${pref.maxWeight ?? '—'} kg`;
    }
    return `${pref.categoryName} — max ${pref.maxQuantity ?? '—'} u.`;
  }

  collectionLocation(point?: CollectionPoints | null): string | null {
    if (!point) return null;
    return point.locationUrl || point.location_url || null;
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
    expeditorColisPictures?: ExpeditorColisPicture[] | null;
    travellerColisPictures?: ExpeditorColisPicture[] | null;
    collectorColisPictures?: ExpeditorColisPicture[] | null;
  }): { label: string; pictures: ExpeditorColisPicture[] }[] {
    return [
      { label: 'Expéditeur', pictures: coli.expeditorColisPictures || [] },
      { label: 'Voyageur', pictures: coli.travellerColisPictures || [] },
      { label: 'Collecteur', pictures: coli.collectorColisPictures || [] }
    ];
  }

  isOnlineDelivery(reservation: Reservations): boolean {
    return reservation.shippingMode === 'ONLINE_DELIVERY';
  }

  canDeclareReception(reservation: Reservations): boolean {
    return reservation.status === 'CONFIRMED'
      && (reservation.colis ?? []).some(coli => coli.coliStatus === 'CREATED');
  }

  onCollectorFilesSelected(colisId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.collectorFiles[colisId] = input.files ? Array.from(input.files) : [];
  }

  declareReception(reservation: Reservations): void {
    if (!reservation.id || this.declaringReceptionId) return;
    this.declaringReceptionId = reservation.id;
    const note = (this.receptionNotes[reservation.id] ?? '').trim();
    const uploads = (reservation.colis ?? [])
      .filter(coli => coli.id && (this.collectorFiles[coli.id]?.length ?? 0) > 0)
      .map(coli => this.reservationService.addPicturesToColis(
        this.collectorFiles[coli.id],
        environment.Actor.collector,
        coli.id
      ));

    const finish = () => this.reservationService.declareReception(reservation.id!, note || undefined).subscribe({
      next: () => {
        this.declaringReceptionId = null;
        this.collectorFiles = {};
        this.messageService.add({
          severity: 'success',
          summary: 'Réception enregistrée',
          detail: 'Le colis est disponible pour le voyageur.'
        });
        if (this.selectedExpedition?.id) {
          this.loadReservations(this.selectedExpedition.id);
        }
      },
      error: (err) => {
        this.declaringReceptionId = null;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message || 'Impossible d\'enregistrer la réception'
        });
      }
    });

    if (uploads.length) {
      forkJoin(uploads).subscribe({
        next: () => finish(),
        error: (err) => {
          this.declaringReceptionId = null;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err?.error?.message || 'Impossible de charger les photos'
          });
        }
      });
    } else {
      finish();
    }
  }

  private loadReservations(expeditionId: string) {
    this.reservationsSub?.unsubscribe();
    this.picturesSub?.unsubscribe();
    this.revokeObjectUrls();
    this.pictureUrls.clear();
    this.reservations = [];
    this.reservationsError = null;
    this.picturesError = null;
    this.reservationsLoading = true;

    this.reservationsSub = this.reservationService.listByExpedition(expeditionId).subscribe({
      next: (data) => {
        this.reservations = [...(data || [])].reverse();
        this.reservationsLoading = false;
        this.loadPicturesForReservations(this.reservations);
      },
      error: () => {
        this.reservationsLoading = false;
        this.reservationsError = 'Impossible de charger les réservations de cette expédition';
      }
    });
  }

  private loadPicturesForReservations(reservations: Reservations[]) {
    const fileNames = new Set<string>();

    for (const reservation of reservations) {
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
          if (!blob) {
            return;
          }
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

  private revokeObjectUrls() {
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls = [];
  }
}
