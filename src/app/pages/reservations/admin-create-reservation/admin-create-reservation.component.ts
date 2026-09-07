import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { Profil } from '../../../models/profil.model';
import { ExpeditionLists, ExpeditionStatus } from '../../../models/reservation.model';
import { ClientService } from '../../clients/client.service';
import { ExpeditionService } from '../../expeditions/expedition.service';
import { AdminPaymentMode, AdminReservationCreateResponse, Reservations } from '../reservation.model';
import { ReservationService } from '../reservations.service';

interface ClientOption extends Profil {
  searchLabel: string;
}

@Component({
  selector: 'app-admin-create-reservation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    AutoCompleteModule,
    ToastModule
  ],
  templateUrl: './admin-create-reservation.component.html',
  styleUrl: './admin-create-reservation.component.scss',
  providers: [MessageService]
})
export class AdminCreateReservationComponent implements OnChanges {
  @Input() visible = false;
  @Input() expedition: ExpeditionLists | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<Reservations>();

  step = 1;
  loadingLists = false;
  submitting = false;
  copied = false;

  clients: ClientOption[] = [];
  filteredClients: ClientOption[] = [];
  bookableExpeditions: ExpeditionLists[] = [];
  filteredExpeditions: ExpeditionLists[] = [];
  expeditionQuery = '';

  result: AdminReservationCreateResponse | null = null;

  readonly paymentModes: Array<{
    value: AdminPaymentMode;
    title: string;
    detail: string;
    icon: string;
    warning?: string;
  }> = [
    {
      value: 'STRIPE_LINK',
      title: 'Lien Stripe',
      detail: 'Le client paie en ligne. Les kilos sont bloqués. Le voyageur est payé après encaissement.',
      icon: 'pi-credit-card'
    },
    {
      value: 'PAID_OFFLINE',
      title: 'Payé hors plateforme',
      detail: 'Argent déjà reçu (virement, cash, WhatsApp). La réservation est confirmée et le voyageur sera crédité.',
      icon: 'pi-wallet'
    },
    {
      value: 'COMPLIMENTARY',
      title: 'Offerte',
      detail: 'Réservation interne ou geste commercial. Confirmée, le voyageur ne gagne rien.',
      icon: 'pi-gift',
      warning: 'Aucun crédit voyageur ne sera généré.'
    }
  ];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private expeditionService: ExpeditionService,
    private clientService: ClientService,
    private messageService: MessageService
  ) {
    this.form = this.fb.group({
      expedition: [null as ExpeditionLists | null, Validators.required],
      client: [null as ClientOption | null, Validators.required],
      totalWeight: [null as number | null, [Validators.required, Validators.min(0.1)]],
      contains: ['', Validators.required],
      articleCategory: [null as string | null],
      shippingMode: ['SELF_DROP', Validators.required],
      collectionPointsId: [null as string | null],
      receiverName: ['', Validators.required],
      receiverPhone: ['', Validators.required],
      receiverEmail: [''],
      receiverAddress: [''],
      paymentMode: ['PAID_OFFLINE' as AdminPaymentMode, Validators.required],
      adminNote: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetAndOpen();
    }
    if (changes['expedition'] && this.visible && this.expedition) {
      this.form.patchValue({ expedition: this.expedition });
    }
  }

  get selectedExpedition(): ExpeditionLists | null {
    return this.form.get('expedition')?.value ?? null;
  }

  get selectedClient(): ClientOption | null {
    return this.form.get('client')?.value ?? null;
  }

  get remainingKg(): number {
    const exp = this.selectedExpedition;
    if (!exp) {
      return 0;
    }
    return Math.max(0, (exp.weightToLoad || 0) - (exp.weightReserved || 0));
  }

  get collectionPoints() {
    const exp = this.selectedExpedition;
    if (!exp) {
      return [];
    }
    if (exp.departureCollectionPoints?.length) {
      return exp.departureCollectionPoints;
    }
    return exp.collectionPoints ? [exp.collectionPoints] : [];
  }

  get categoryOptions(): Array<{ label: string; value: string }> {
    return (this.selectedExpedition?.preferences ?? [])
      .filter((pref) => !!pref.categoryName)
      .map((pref) => ({ label: pref.categoryName, value: pref.categoryName }));
  }

  get estimatedAmount(): number {
    const exp = this.selectedExpedition;
    const weight = Number(this.form.get('totalWeight')?.value || 0);
    const fee = exp?.totalFees ?? exp?.fees ?? 0;
    return Math.round(weight * fee * 100) / 100;
  }

  get estimatedTravelerShare(): number {
    const exp = this.selectedExpedition;
    const weight = Number(this.form.get('totalWeight')?.value || 0);
    const fee = exp?.customsFees ?? 0;
    return Math.round(weight * fee * 100) / 100;
  }

  get paymentMode(): AdminPaymentMode {
    return this.form.get('paymentMode')?.value;
  }

  get stripeUrl(): string | null {
    return this.result?.data || null;
  }

  expeditionLabel(exp: ExpeditionLists | null): string {
    if (!exp) {
      return '';
    }
    const route = `${exp.villeDep || exp.countryDep} → ${exp.villeArr || exp.countryArr}`;
    const traveler = [exp.clients?.firstname, exp.clients?.lastname].filter(Boolean).join(' ');
    return traveler ? `${route} · ${traveler}` : route;
  }

  clientLabel(client: ClientOption | null): string {
    if (!client) {
      return '';
    }
    return client.searchLabel;
  }

  onVisibleChange(visible: boolean): void {
    this.visible = visible;
    this.visibleChange.emit(visible);
    if (!visible) {
      this.result = null;
      this.step = 1;
    }
  }

  close(): void {
    this.onVisibleChange(false);
  }

  searchClients(event: AutoCompleteCompleteEvent): void {
    const q = (event.query || '').toLowerCase().trim();
    this.filteredClients = !q
      ? this.clients.slice(0, 20)
      : this.clients.filter((client) => client.searchLabel.toLowerCase().includes(q)).slice(0, 20);
  }

  filterExpeditions(): void {
    const q = this.expeditionQuery.toLowerCase().trim();
    this.filteredExpeditions = !q
      ? this.bookableExpeditions
      : this.bookableExpeditions.filter((exp) => {
          const hay = [
            exp.villeDep,
            exp.villeArr,
            exp.countryDep,
            exp.countryArr,
            exp.clients?.firstname,
            exp.clients?.lastname,
            exp.numVol
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(q);
        });
  }

  selectExpedition(exp: ExpeditionLists): void {
    this.form.patchValue({
      expedition: exp,
      collectionPointsId: this.defaultCollectionPointId(exp),
      articleCategory: null
    });
  }

  selectPayment(mode: AdminPaymentMode): void {
    this.form.patchValue({ paymentMode: mode });
  }

  canGoNext(): boolean {
    if (this.step === 1) {
      return !!this.selectedExpedition && !!this.selectedClient;
    }
    if (this.step === 2) {
      const weight = Number(this.form.get('totalWeight')?.value || 0);
      const name = (this.form.get('receiverName')?.value || '').trim();
      const phone = (this.form.get('receiverPhone')?.value || '').trim();
      const contains = (this.form.get('contains')?.value || '').trim();
      if (!weight || weight <= 0 || weight > this.remainingKg + 0.001) {
        return false;
      }
      if (this.collectionPoints.length > 1 && !this.form.get('collectionPointsId')?.value) {
        return false;
      }
      return !!name && !!phone && !!contains;
    }
    return !!this.form.get('paymentMode')?.value;
  }

  next(): void {
    if (!this.canGoNext()) {
      this.form.markAllAsTouched();
      return;
    }
    this.step = Math.min(3, this.step + 1);
  }

  back(): void {
    this.step = Math.max(1, this.step - 1);
  }

  submit(): void {
    if (!this.canGoNext() || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }
    const exp = this.selectedExpedition;
    const client = this.selectedClient;
    if (!exp || !client) {
      return;
    }

    const weight = Number(this.form.value.totalWeight);
    const category = this.form.value.articleCategory as string | null;
    const paymentMode = this.form.value.paymentMode as AdminPaymentMode;

    this.submitting = true;
    this.reservationService
      .createAdminReservation({
        expeditionId: exp.id,
        clientId: client.id,
        totalWeight: weight,
        receiver: {
          fullName: this.form.value.receiverName.trim(),
          phoneNumber: this.form.value.receiverPhone.trim(),
          email: this.form.value.receiverEmail?.trim() || null,
          address: this.form.value.receiverAddress?.trim() || null
        },
        colis: [
          {
            weight,
            type: 'COLIS',
            declaredPrice: 0,
            contains: this.form.value.contains.trim(),
            description: this.form.value.adminNote?.trim() || null,
            reservedArticles: category
              ? [{ articleCategory: category, quantity: 1, weight }]
              : undefined
          }
        ],
        shippingMode: this.form.value.shippingMode,
        collectionPointsId: this.form.value.collectionPointsId || null,
        paymentMode,
        adminNote: this.form.value.adminNote?.trim() || null
      })
      .subscribe({
        next: (response) => {
          this.submitting = false;
          this.result = response;
          if (response.reservation) {
            this.created.emit(response.reservation);
          }
          this.messageService.add({
            severity: 'success',
            summary: 'Réservation créée',
            detail: this.successDetail(paymentMode)
          });
        },
        error: (err) => {
          this.submitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Impossible de créer la réservation',
            detail: this.translateError(err?.error?.message || err?.message)
          });
        }
      });
  }

  async copyStripeLink(): Promise<void> {
    if (!this.stripeUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.stripeUrl);
      this.copied = true;
      this.messageService.add({ severity: 'success', summary: 'Lien copié', detail: 'Envoyez-le au client pour le paiement.' });
    } catch {
      this.messageService.add({ severity: 'warn', summary: 'Copie impossible', detail: this.stripeUrl });
    }
  }

  paymentLabel(mode?: string | null): string {
    return this.paymentModes.find((item) => item.value === mode)?.title ?? mode ?? '—';
  }

  private resetAndOpen(): void {
    this.step = 1;
    this.result = null;
    this.copied = false;
    this.expeditionQuery = '';
    this.form.reset({
      expedition: this.expedition,
      client: null,
      totalWeight: null,
      contains: '',
      articleCategory: null,
      shippingMode: 'SELF_DROP',
      collectionPointsId: this.defaultCollectionPointId(this.expedition),
      receiverName: '',
      receiverPhone: '',
      receiverEmail: '',
      receiverAddress: '',
      paymentMode: 'PAID_OFFLINE',
      adminNote: ''
    });
    this.loadLists();
  }

  private loadLists(): void {
    this.loadingLists = true;
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = (clients || []).map((client) => ({
          ...client,
          searchLabel: [
            client.firstname,
            client.lastname,
            client.phoneNumber,
            client.public_pseudo,
            client.whotraveling_id,
            client.users?.email
          ]
            .filter(Boolean)
            .join(' · ')
        }));
        this.filteredClients = this.clients.slice(0, 20);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Clients',
          detail: 'Impossible de charger les clients.'
        });
      }
    });

    this.expeditionService.getExpeditons().subscribe({
      next: (expeditions) => {
        this.bookableExpeditions = (expeditions || [])
          .filter((exp) => exp.expeditionStatus === ExpeditionStatus.VALIDATED)
          .filter((exp) => (exp.weightToLoad || 0) - (exp.weightReserved || 0) > 0)
          .sort((a, b) => new Date(b.depDateStart).getTime() - new Date(a.depDateStart).getTime());
        this.filterExpeditions();
        this.loadingLists = false;
        if (this.expedition) {
          const match = this.bookableExpeditions.find((exp) => exp.id === this.expedition!.id) ?? this.expedition;
          this.form.patchValue({
            expedition: match,
            collectionPointsId: this.defaultCollectionPointId(match)
          });
        }
      },
      error: () => {
        this.loadingLists = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Trajets',
          detail: 'Impossible de charger les trajets disponibles.'
        });
      }
    });
  }

  private defaultCollectionPointId(exp: ExpeditionLists | null): string | null {
    if (!exp) {
      return null;
    }
    const points = exp.departureCollectionPoints?.length
      ? exp.departureCollectionPoints
      : exp.collectionPoints
        ? [exp.collectionPoints]
        : [];
    return points.length === 1 ? points[0].id : null;
  }

  private successDetail(mode: AdminPaymentMode): string {
    if (mode === 'STRIPE_LINK') {
      return 'Lien de paiement prêt à envoyer au client.';
    }
    if (mode === 'COMPLIMENTARY') {
      return 'Réservation offerte : le voyageur ne sera pas crédité.';
    }
    return 'Réservation confirmée. Le voyageur sera crédité à la fin du trajet.';
  }

  private translateError(message?: string): string {
    if (!message) {
      return 'Une erreur est survenue.';
    }
    if (message.includes('TOO MANY RESERVATION')) {
      return 'Ce client a déjà une réservation active sur ce trajet.';
    }
    if (message.toLowerCase().includes('weight exceeds')) {
      return 'Le poids dépasse la capacité restante de ce trajet.';
    }
    if (message.includes("n'est pas disponible")) {
      return 'Ce trajet n’est plus ouvert aux réservations.';
    }
    return message;
  }
}
