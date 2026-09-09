import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ArticlePreferenceCatalogEntry } from '../../../models/app-setting.model';
import { Country } from '../../../models/city.model';
import { CollectionPoint } from '../../../models/collectionPoint.model';
import { Profil } from '../../../models/profil.model';
import { ArticlePreferences, ExpeditionLists } from '../../../models/reservation.model';
import { AppSettingApiService } from '../../../services/app-setting-api.service';
import { CollectionPointApiService } from '../../../services/collection-point-api.service';
import { CountryApiService } from '../../../services/country-api.service';
import { ClientService } from '../../clients/client.service';
import { ExpeditionService } from '../expedition.service';

interface ClientOption extends Profil {
  searchLabel: string;
}

interface PreferenceOption {
  name: string;
  limitType: 'QUANTITY' | 'WEIGHT';
  maxValue: number;
}

@Component({
  selector: 'app-admin-create-expedition',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    SelectModule,
    AutoCompleteModule,
    MultiSelectModule,
    DatePicker,
    ToastModule
  ],
  templateUrl: './admin-create-expedition.component.html',
  styleUrl: './admin-create-expedition.component.scss',
  providers: [MessageService, DatePipe]
})
export class AdminCreateExpeditionComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<ExpeditionLists>();

  step = 1;
  loadingLists = false;
  loadingClients = false;
  submitting = false;
  result: ExpeditionLists | null = null;

  clients: ClientOption[] = [];
  filteredClients: ClientOption[] = [];
  countries: Country[] = [];
  depCollectionPoints: CollectionPoint[] = [];
  destCollectionPoints: CollectionPoint[] = [];
  catalog: PreferenceOption[] = [];
  selectedArticle = '';
  selectedMaxValue = 1;
  private lastAutoNomBillet = '';

  tvaRate = 0.21;
  commissionRate = 0.16;
  defaultFee = 10;
  minFee = 0;
  maxFee = 1000000;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private expeditionService: ExpeditionService,
    private clientService: ClientService,
    private countryService: CountryApiService,
    private collectionPointService: CollectionPointApiService,
    private appSettingService: AppSettingApiService,
    private messageService: MessageService,
    private datePipe: DatePipe
  ) {
    this.form = this.fb.group({
      client: [null as ClientOption | null, Validators.required],
      countryDep: [null as Country | null, Validators.required],
      countryArr: [null as Country | null, Validators.required],
      numVol: ['', Validators.required],
      nomBillet: ['', Validators.required],
      depatureDate: [null as Date | null, Validators.required],
      packageRetrivalDate: [null as Date | null, Validators.required],
      receiptDate: [null as Date | null, Validators.required],
      deliveryDate: [null as Date | null, Validators.required],
      collectionPointsIds: [[], Validators.required],
      destCollectionPointsId: [null as CollectionPoint | null],
      weight: [null as number | null, [Validators.required, Validators.min(0.1)]],
      fees: [this.defaultFee, [Validators.required, Validators.min(0.01)]],
      preferences: this.fb.array([], Validators.required),
      adminNote: ['']
    });
  }

  get preferencesFormArray(): FormArray {
    return this.form.get('preferences') as FormArray;
  }

  get selectedClient(): ClientOption | null {
    return this.form.get('client')?.value ?? null;
  }

  get selectedCatalogEntry(): PreferenceOption | undefined {
    return this.catalog.find((item) => item.name === this.selectedArticle);
  }

  get finalPrice(): number {
    const base = Number(this.form.get('fees')?.value || 0);
    const commission = base * this.commissionRate;
    const tvaOnCommission = commission * this.tvaRate;
    return +(base + commission + tvaOnCommission).toFixed(2);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetAndOpen();
    }
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
    this.applyClientFilter(event.query || '');
  }

  onClientDropdownClick(): void {
    this.applyClientFilter('');
  }

  private applyClientFilter(query: string): void {
    if (this.loadingClients) {
      this.filteredClients = [];
      return;
    }
    const q = query.toLowerCase().trim();
    this.filteredClients = !q
      ? this.clients.slice(0, 20)
      : this.clients.filter((client) => client.searchLabel.toLowerCase().includes(q)).slice(0, 20);
  }

  onClientSelected(client: ClientOption | null): void {
    if (!client) {
      const current = (this.form.get('nomBillet')?.value || '').trim();
      if (current === this.lastAutoNomBillet) {
        this.form.patchValue({ nomBillet: '' });
      }
      this.lastAutoNomBillet = '';
      return;
    }

    const fullName = this.clientFullName(client);
    const current = (this.form.get('nomBillet')?.value || '').trim();
    if (!current || current === this.lastAutoNomBillet) {
      this.form.patchValue({ nomBillet: fullName });
      this.lastAutoNomBillet = fullName;
    }
  }

  onDepCountryChange(country: Country | null): void {
    this.form.patchValue({ collectionPointsIds: [] });
    this.depCollectionPoints = [];
    if (country?.id) {
      this.collectionPointService.getByCountry(country.id).subscribe({
        next: (points) => {
          this.depCollectionPoints = points.filter((p) => p.status === 'ACTIVE');
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Points de collecte', detail: 'Chargement départ impossible.' });
        }
      });
    }
  }

  onArrCountryChange(country: Country | null): void {
    this.form.patchValue({ destCollectionPointsId: null });
    this.destCollectionPoints = [];
    if (country?.id) {
      this.collectionPointService.getByCountry(country.id).subscribe({
        next: (points) => {
          this.destCollectionPoints = points.filter((p) => p.status === 'ACTIVE');
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Points de collecte', detail: 'Chargement arrivée impossible.' });
        }
      });
    }
  }

  onDepartureDateChange(date: Date | null): void {
    if (!date) {
      return;
    }
    const dep = new Date(date);
    const retrait = new Date(dep);
    retrait.setDate(retrait.getDate() - 1);
    const receipt = new Date(retrait);
    receipt.setDate(receipt.getDate() - 1);
    const delivery = new Date(dep);
    delivery.setDate(delivery.getDate() + 1);
    this.form.patchValue({
      packageRetrivalDate: retrait,
      receiptDate: receipt,
      deliveryDate: delivery
    });
  }

  addPreference(): void {
    if (!this.selectedArticle || !this.selectedMaxValue || this.selectedMaxValue < 0.1) {
      return;
    }
    const existing = this.preferencesFormArray.value as ArticlePreferences[];
    if (existing.some((pref) => pref.categoryName === this.selectedArticle)) {
      this.messageService.add({ severity: 'warn', summary: 'Article', detail: 'Cet article est déjà ajouté.' });
      return;
    }
    const entry = this.catalog.find((item) => item.name === this.selectedArticle);
    const limitType = entry?.limitType ?? 'QUANTITY';
    this.preferencesFormArray.push(
      this.fb.group({
        categoryName: [this.selectedArticle],
        limitType: [limitType],
        maxQuantity: [limitType === 'QUANTITY' ? this.selectedMaxValue : null],
        maxWeight: [limitType === 'WEIGHT' ? this.selectedMaxValue : null]
      })
    );
    this.selectedArticle = '';
    this.selectedMaxValue = 1;
  }

  removePreference(index: number): void {
    this.preferencesFormArray.removeAt(index);
  }

  canGoNext(): boolean {
    if (this.step === 1) {
      return !!this.selectedClient
        && !!this.form.get('countryDep')?.value
        && !!this.form.get('countryArr')?.value
        && !!(this.form.get('numVol')?.value || '').trim()
        && !!(this.form.get('nomBillet')?.value || '').trim();
    }
    if (this.step === 2) {
      const weight = Number(this.form.get('weight')?.value || 0);
      const ids = this.form.get('collectionPointsIds')?.value as CollectionPoint[] | string[];
      return !!this.form.get('depatureDate')?.value
        && !!this.form.get('packageRetrivalDate')?.value
        && !!this.form.get('receiptDate')?.value
        && !!this.form.get('deliveryDate')?.value
        && Array.isArray(ids) && ids.length > 0
        && weight > 0;
    }
    return this.preferencesFormArray.length > 0;
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
    const client = this.selectedClient;
    const countryDep = this.form.get('countryDep')?.value as Country;
    const countryArr = this.form.get('countryArr')?.value as Country;
    if (!client || !countryDep || !countryArr) {
      return;
    }

    const depDate = this.toApiDate(this.form.get('depatureDate')?.value);
    const collectionPoints = this.form.get('collectionPointsIds')?.value as CollectionPoint[];
    const destPoint = this.form.get('destCollectionPointsId')?.value as CollectionPoint | null;
    const fees = Number(this.form.get('fees')?.value || 0);
    const weight = Number(this.form.get('weight')?.value || 0);

    this.submitting = true;
    this.expeditionService
      .createAdminExpedition({
        clientId: client.id,
        fees,
        totalFees: this.finalPrice,
        receiptDate: this.toApiDate(this.form.get('receiptDate')?.value),
        deliveryDate: this.toApiDate(this.form.get('deliveryDate')?.value),
        packageRetrivalDate: this.toApiDate(this.form.get('packageRetrivalDate')?.value),
        villeDep: '',
        villeArr: '',
        weight,
        depStartDate: depDate,
        depEndDate: depDate,
        arrivalStartDate: depDate,
        arrivalEndDate: depDate,
        preferences: this.preferencesFormArray.value,
        numVol: String(this.form.get('numVol')?.value || '').trim(),
        countryDep: countryDep.name,
        countryArr: countryArr.name,
        collectionPointsIds: collectionPoints.map((cp) => cp.id!).filter(Boolean),
        destCollectionPointsId: destPoint?.id ?? null,
        nomBillet: String(this.form.get('nomBillet')?.value || '').trim(),
        adminNote: String(this.form.get('adminNote')?.value || '').trim() || null
      })
      .subscribe({
        next: (expedition) => {
          this.submitting = false;
          this.result = expedition;
          this.created.emit(expedition);
          this.messageService.add({
            severity: 'success',
            summary: 'Trajet publié',
            detail: 'Le trajet a été créé au nom du voyageur et est en attente de validation.'
          });
        },
        error: (err) => {
          this.submitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Publication impossible',
            detail: this.translateError(err?.error?.message || err?.message)
          });
        }
      });
  }

  clientLabel(client: ClientOption | null): string {
    return client?.searchLabel ?? '';
  }

  private resetAndOpen(): void {
    this.step = 1;
    this.result = null;
    this.lastAutoNomBillet = '';
    this.preferencesFormArray.clear();
    this.form.reset({
      client: null,
      countryDep: null,
      countryArr: null,
      numVol: '',
      nomBillet: '',
      depatureDate: null,
      packageRetrivalDate: null,
      receiptDate: null,
      deliveryDate: null,
      collectionPointsIds: [],
      destCollectionPointsId: null,
      weight: null,
      fees: this.defaultFee,
      adminNote: ''
    });
    this.loadLists();
  }

  private loadLists(): void {
    this.loadingLists = true;
    this.loadingClients = true;
    this.clients = [];
    this.filteredClients = [];
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
        this.loadingClients = false;
        this.applyClientFilter('');
      },
      error: () => {
        this.loadingClients = false;
        this.messageService.add({ severity: 'error', summary: 'Clients', detail: 'Impossible de charger les clients.' });
      }
    });

    this.countryService.getCountries().subscribe({
      next: (countries) => {
        this.countries = (countries || []).filter((c) => c.status !== 'DISABLED');
        this.loadingLists = false;
      },
      error: () => {
        this.loadingLists = false;
        this.messageService.add({ severity: 'error', summary: 'Pays', detail: 'Impossible de charger les pays.' });
      }
    });

    this.appSettingService.getArticlePreferenceCatalog().subscribe({
      next: (entries: ArticlePreferenceCatalogEntry[]) => {
        this.catalog = entries.map((entry) => ({
          name: entry.categoryName,
          limitType: entry.limitType,
          maxValue: entry.limitType === 'WEIGHT' ? (entry.defaultMaxWeight ?? 1) : (entry.defaultMaxQuantity ?? 1)
        }));
      }
    });

    this.loadPricingSettings();
  }

  private loadPricingSettings(): void {
    this.appSettingService.getByKey('tva_rate').subscribe({
      next: (setting) => {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed)) {
          this.tvaRate = parsed;
        }
      }
    });
    this.appSettingService.getByKey('commission_rate').subscribe({
      next: (setting) => {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed)) {
          this.commissionRate = parsed;
        }
      }
    });
    this.appSettingService.getByKey('prix_kilo').subscribe({
      next: (setting) => {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed)) {
          this.defaultFee = parsed;
          this.form.patchValue({ fees: parsed });
        }
      }
    });
    this.appSettingService.getByKey('min_prix_kilo').subscribe({
      next: (setting) => {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed)) {
          this.minFee = parsed;
        }
      }
    });
    this.appSettingService.getByKey('max_prix_kilo').subscribe({
      next: (setting) => {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed)) {
          this.maxFee = parsed;
        }
      }
    });
  }

  private clientFullName(client: ClientOption): string {
    return `${client.firstname ?? ''} ${client.lastname ?? ''}`.trim();
  }

  private toApiDate(value: Date | string | null | undefined): string {
    return this.datePipe.transform(value, 'yyyy-MM-dd') ?? '';
  }

  private translateError(message?: string): string {
    if (!message) {
      return 'Une erreur est survenue.';
    }
    if (message.includes('existe déjà')) {
      return 'Un trajet identique existe déjà pour ce voyageur.';
    }
    if (message.includes('CLIENT NOT FOUND')) {
      return 'Client introuvable.';
    }
    return message;
  }
}
