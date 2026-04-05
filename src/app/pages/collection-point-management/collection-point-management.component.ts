import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import {
  CollectionPoint,
  CollectionPointCreateRequest,
  CollectionPointStatus,
  CollectionPointType,
  DayOfWeek,
  OpeningHoursEntry
} from '../../models/collectionPoint.model';
import { Country, City, Province } from '../../models/city.model';
import { CollectionPointApiService } from '../../services/collection-point-api.service';
import { CountryApiService } from '../../services/country-api.service';
import { CityApiService } from '../../services/city-api.service';
import { ProvinceApiService } from '../../services/province-api.service';

interface Stats {
  total: number;
  active: number;
  pending: number;
  individuals: number;
}

@Component({
  selector: 'app-collection-point-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    SelectButtonModule,
    TagModule,
    DividerModule,
    RadioButtonModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './collection-point-management.component.html',
  styleUrls: ['./collection-point-management.component.scss']
})
export class CollectionPointManagementComponent implements OnInit {

  // --- Data ---
  allCollectionPoints: CollectionPoint[] = [];
  filteredCollectionPoints: CollectionPoint[] = [];
  countries: Country[] = [];
  allCities: City[] = [];
  citiesForForm: City[] = [];
  provinces: Province[] = [];

  // --- Stats ---
  stats: Stats = { total: 0, active: 0, pending: 0, individuals: 0 };

  // --- Loading / state ---
  loading = false;
  saving = false;
  showDialog = false;
  statusDialog = false;
  editingId: string | null = null;
  statusChangeTarget: CollectionPoint | null = null;
  selectedNewStatus: CollectionPointStatus | null = null;

  // --- Filters ---
  filterType: CollectionPointType | null = null;
  filterCountryName: string | null = null;
  filterCityName: string | null = null;
  filterStatus: CollectionPointStatus | null = null;
  searchTerm = '';

  // --- Dropdown options ---
  countryOptions: { label: string; value: string; id: string }[] = [];
  cityOptions: { label: string; value: string; id: string }[] = [];
  provinceOptions: { label: string; value: string }[] = [];
  countryFilterOptions: { label: string; value: string }[] = [];
  cityFilterOptions: { label: string; value: string }[] = [];
  statusFilterOptions: { label: string; value: CollectionPointStatus }[] = [];

  readonly typeOptions = [
    { label: 'Particulier', value: 'INDIVIDUAL' as CollectionPointType, icon: 'pi-user', description: 'Une personne physique' },
    { label: 'Entreprise', value: 'COMPANY' as CollectionPointType, icon: 'pi-building', description: 'Société ou commerce' },
    { label: 'Point officiel', value: 'OFFICIAL_POINT' as CollectionPointType, icon: 'pi-verified', description: 'Point certifié WhoTraveling' }
  ];

  readonly allStatusOptions: { label: string; value: CollectionPointStatus; severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' }[] = [
    { label: 'Brouillon',      value: 'DRAFT',             severity: 'secondary' },
    { label: 'En attente',     value: 'PENDING_APPROVAL',  severity: 'warn' },
    { label: 'Actif',          value: 'ACTIVE',            severity: 'success' },
    { label: 'Suspendu',       value: 'SUSPENDED',         severity: 'danger' },
    { label: 'Archivé',        value: 'ARCHIVED',          severity: 'secondary' }
  ];

  readonly DAYS: { value: DayOfWeek; label: string; short: string }[] = [
    { value: 'MONDAY',    label: 'Lundi',    short: 'Lun' },
    { value: 'TUESDAY',   label: 'Mardi',    short: 'Mar' },
    { value: 'WEDNESDAY', label: 'Mercredi', short: 'Mer' },
    { value: 'THURSDAY',  label: 'Jeudi',    short: 'Jeu' },
    { value: 'FRIDAY',    label: 'Vendredi', short: 'Ven' },
    { value: 'SATURDAY',  label: 'Samedi',   short: 'Sam' },
    { value: 'SUNDAY',    label: 'Dimanche', short: 'Dim' }
  ];

  // --- Form ---
  form!: FormGroup;

  get openingHoursArray(): FormArray {
    return this.form.get('openingHours') as FormArray;
  }

  constructor(
    private cpService: CollectionPointApiService,
    private countryService: CountryApiService,
    private cityService: CityApiService,
    private provinceService: ProvinceApiService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.buildStatusFilterOptions();
    this.loadCountries();
    this.loadProvinces();
    this.loadAll();
  }

  // ===== INIT =====

  buildForm(): void {
    this.form = this.fb.group({
      type:               [null, Validators.required],
      name:               ['',   Validators.required],
      address:            ['',   Validators.required],
      locationUrl:        [''],
      contacts:           [''],
      openingHours:       this.buildOpeningHoursArray(),
      countryId:          [null],
      cityId:             [null],
      provinceId:         [null],
      // INDIVIDUAL
      email:              [''],
      firstName:          [''],
      lastName:           [''],
      // COMPANY / OFFICIAL_POINT
      companyName:        [''],
      registrationNumber: [''],
      website:            ['']
    });
  }

  buildStatusFilterOptions(): void {
    this.statusFilterOptions = this.allStatusOptions.map(s => ({ label: s.label, value: s.value }));
  }

  buildOpeningHoursArray(existing?: OpeningHoursEntry[]): FormArray {
    return this.fb.array(
      this.DAYS.map(d => {
        const entry = existing?.find(e => e.day === d.value);
        return this.fb.group({
          day:       [d.value],
          closed:    [entry?.closed ?? false],
          openTime:  [entry?.openTime ?? '09:00'],
          closeTime: [entry?.closeTime ?? '18:00']
        });
      })
    );
  }

  // ===== LOAD DATA =====

  loadAll(): void {
    this.loading = true;
    this.cpService.getAll().subscribe({
      next: (data) => {
        this.allCollectionPoints = data;
        this.filteredCollectionPoints = data;
        this.computeStats();
        this.buildCityFilterOptions();
        this.loading = false;
      },
      error: () => {
        this.toast('error', 'Erreur', 'Impossible de charger les points de collecte');
        this.loading = false;
      }
    });
  }

  loadCountries(): void {
    this.countryService.getCountries().subscribe({
      next: (data) => {
        this.countries = data;
        this.countryOptions = data.map(c => ({ label: c.name, value: c.name, id: c.id! }));
        this.countryFilterOptions = [{ label: 'Tous les pays', value: '' }, ...data.map(c => ({ label: c.name, value: c.name }))];
      }
    });
  }

  loadProvinces(): void {
    this.provinceService.getAll().subscribe({
      next: (data) => {
        this.provinces = data;
        this.provinceOptions = data.map(p => ({ label: p.name, value: p.id! }));
      }
    });
  }

  loadCitiesForCountry(countryName: string): void {
    this.cityService.getCitiesByCountry(countryName).subscribe({
      next: (data) => {
        this.citiesForForm = data;
        this.cityOptions = data.map(c => ({ label: c.name, value: c.id!, id: c.id! }));
      },
      error: () => { this.citiesForForm = []; this.cityOptions = []; }
    });
  }

  buildCityFilterOptions(): void {
    const cityNames = [...new Set(
      this.allCollectionPoints
        .filter(cp => !!cp.cityName)
        .map(cp => cp.cityName!)
    )];
    this.cityFilterOptions = [
      { label: 'Toutes les villes', value: '' },
      ...cityNames.map(n => ({ label: n, value: n }))
    ];
  }

  // ===== STATS =====

  computeStats(): void {
    this.stats = {
      total:       this.allCollectionPoints.length,
      active:      this.allCollectionPoints.filter(cp => cp.status === 'ACTIVE').length,
      pending:     this.allCollectionPoints.filter(cp => cp.status === 'PENDING_APPROVAL').length,
      individuals: this.allCollectionPoints.filter(cp => cp.type === 'INDIVIDUAL').length
    };
  }

  // ===== FILTERS =====

  applyFilters(): void {
    let result = [...this.allCollectionPoints];

    if (this.filterType) {
      result = result.filter(cp => cp.type === this.filterType);
    }
    if (this.filterCountryName) {
      result = result.filter(cp => cp.countryName === this.filterCountryName);
    }
    if (this.filterCityName) {
      result = result.filter(cp => cp.cityName === this.filterCityName);
    }
    if (this.filterStatus) {
      result = result.filter(cp => cp.status === this.filterStatus);
    }
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(cp =>
        cp.name?.toLowerCase().includes(q) ||
        cp.address?.toLowerCase().includes(q) ||
        cp.email?.toLowerCase().includes(q) ||
        cp.companyName?.toLowerCase().includes(q) ||
        cp.firstName?.toLowerCase().includes(q) ||
        cp.lastName?.toLowerCase().includes(q) ||
        cp.contacts?.toLowerCase().includes(q)
      );
    }

    this.filteredCollectionPoints = result;
  }

  resetFilters(): void {
    this.filterType = null;
    this.filterCountryName = null;
    this.filterCityName = null;
    this.filterStatus = null;
    this.searchTerm = '';
    this.filteredCollectionPoints = [...this.allCollectionPoints];
  }

  // ===== FORM EVENTS =====

  get dialogTitle(): string {
    return this.editingId ? 'Modifier le point de collecte' : 'Nouveau point de collecte';
  }

  selectType(type: CollectionPointType): void {
    this.form.get('type')?.setValue(type);
    this.updateConditionalValidators(type);
  }

  onTypeChange(): void {
    const type = this.form.get('type')?.value;
    if (type) this.updateConditionalValidators(type);
  }

  updateConditionalValidators(type: CollectionPointType): void {
    const individualFields = ['email', 'firstName', 'lastName'];
    const businessFields = ['companyName'];

    if (type === 'INDIVIDUAL') {
      individualFields.forEach(f => this.form.get(f)?.setValidators([Validators.required]));
      this.form.get('email')?.addValidators(Validators.email);
      businessFields.forEach(f => { this.form.get(f)?.clearValidators(); this.form.get(f)?.setValue(''); });
    } else {
      businessFields.forEach(f => this.form.get(f)?.setValidators([Validators.required]));
      individualFields.forEach(f => { this.form.get(f)?.clearValidators(); this.form.get(f)?.setValue(''); });
    }

    [...individualFields, ...businessFields].forEach(f => this.form.get(f)?.updateValueAndValidity());
  }

  onCountryChangeInForm(event: any): void {
    const countryName = event.value;
    this.form.get('cityId')?.setValue(null);
    this.form.get('provinceId')?.setValue(null);
    if (countryName) {
      this.loadCitiesForCountry(countryName);
    } else {
      this.citiesForForm = [];
      this.cityOptions = [];
    }
  }

  // ===== CRUD =====

  openNew(): void {
    this.editingId = null;
    this.form.reset();
    this.form.setControl('openingHours', this.buildOpeningHoursArray());
    this.citiesForForm = [];
    this.cityOptions = [];
    this.showDialog = true;
  }

  edit(cp: CollectionPoint): void {
    this.editingId = cp.id!;

    const country = this.countries.find(c => c.name === cp.countryName);
    if (country?.name) this.loadCitiesForCountry(country.name);

    setTimeout(() => {
      const city = this.allCities.find(c => c.name === cp.cityName);
      const province = this.provinces.find(p => p.name === cp.provinceName);

      this.form.patchValue({
        type:               cp.type,
        name:               cp.name,
        address:            cp.address ?? '',
        locationUrl:        cp.locationUrl ?? '',
        contacts:           cp.contacts ?? '',
        countryId:          country?.name ?? null,
        cityId:             city?.id ?? null,
        provinceId:         province?.id ?? null,
        email:              cp.email ?? '',
        firstName:          cp.firstName ?? '',
        lastName:           cp.lastName ?? '',
        companyName:        cp.companyName ?? '',
        registrationNumber: cp.registrationNumber ?? '',
        website:            cp.website ?? ''
      });

      this.form.setControl('openingHours', this.buildOpeningHoursArray(cp.openingHours));

      if (cp.type) this.updateConditionalValidators(cp.type);
    }, 50);

    this.showDialog = true;
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const v = this.form.value;
    const countryObj = this.countries.find(c => c.name === v.countryId);

    const payload: CollectionPointCreateRequest = {
      type:               v.type,
      name:               v.name,
      address:            v.address,
      locationUrl:        v.locationUrl || undefined,
      contacts:           v.contacts || undefined,
      openingHours:       this.openingHoursArray.getRawValue() as OpeningHoursEntry[],
      countryId:          countryObj?.id ?? undefined,
      cityId:             v.cityId ?? undefined,
      provinceId:         v.provinceId ?? undefined,
      email:              v.type === 'INDIVIDUAL' ? v.email : undefined,
      firstName:          v.type === 'INDIVIDUAL' ? v.firstName : undefined,
      lastName:           v.type === 'INDIVIDUAL' ? v.lastName : undefined,
      companyName:        v.type !== 'INDIVIDUAL' ? v.companyName : undefined,
      registrationNumber: v.type !== 'INDIVIDUAL' ? v.registrationNumber : undefined,
      website:            v.type !== 'INDIVIDUAL' ? v.website : undefined
    };

    this.saving = true;
    const call$ = this.editingId
      ? this.cpService.update(this.editingId, payload)
      : this.cpService.create(payload);

    call$.subscribe({
      next: () => {
        this.toast('success', 'Succès', this.editingId ? 'Point de collecte modifié' : 'Point de collecte créé');
        this.hideDialog();
        this.loadAll();
      },
      error: () => {
        this.toast('error', 'Erreur', 'Une erreur est survenue');
        this.saving = false;
      }
    });
  }

  delete(cp: CollectionPoint): void {
    this.confirmationService.confirm({
      message: `Supprimer le point de collecte <strong>${cp.name}</strong> ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.cpService.delete(cp.id!).subscribe({
          next: () => { this.toast('success', 'Supprimé', `"${cp.name}" a été supprimé`); this.loadAll(); },
          error: () => this.toast('error', 'Erreur', 'Impossible de supprimer ce point de collecte')
        });
      }
    });
  }

  // ===== STATUS CHANGE =====

  openStatusChange(cp: CollectionPoint): void {
    this.statusChangeTarget = cp;
    this.selectedNewStatus = cp.status ?? null;
    this.statusDialog = true;
  }

  confirmStatusChange(): void {
    if (!this.statusChangeTarget?.id || !this.selectedNewStatus) return;
    this.cpService.changeStatus(this.statusChangeTarget.id, this.selectedNewStatus).subscribe({
      next: () => {
        this.toast('success', 'Statut modifié', `Nouveau statut : ${this.getStatusLabel(this.selectedNewStatus!)}`);
        this.statusDialog = false;
        this.loadAll();
      },
      error: () => this.toast('error', 'Erreur', 'Impossible de changer le statut')
    });
  }

  // ===== UTILS =====

  formatOpeningHours(cp: CollectionPoint): string {
    if (cp.openingHours?.length) {
      const open = cp.openingHours.filter(h => !h.closed);
      if (!open.length) return 'Fermé 7j/7';
      const parts = open.map(h =>
        `${this.getDayShort(h.day)} ${(h.openTime ?? '').substring(0, 5)}-${(h.closeTime ?? '').substring(0, 5)}`
      );
      return parts.length > 3
        ? parts.slice(0, 3).join(' · ') + ` +${parts.length - 3}`
        : parts.join(' · ');
    }
    return cp.openHours || '—';
  }

  getDayShort(day: DayOfWeek): string {
    return this.DAYS.find(d => d.value === day)?.short ?? day;
  }

  hideDialog(): void {
    this.showDialog = false;
    this.saving = false;
    this.editingId = null;
    this.form.reset();
    this.form.setControl('openingHours', this.buildOpeningHoursArray());
    this.citiesForForm = [];
    this.cityOptions = [];
  }

  openMap(cp: CollectionPoint): void {
    if (cp.locationUrl) window.open(cp.locationUrl, '_blank');
  }

  getTypeLabel(type: CollectionPointType): string {
    return { INDIVIDUAL: 'Particulier', COMPANY: 'Entreprise', OFFICIAL_POINT: 'Point officiel' }[type] ?? type;
  }

  getTypeSeverity(type: CollectionPointType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<CollectionPointType, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      INDIVIDUAL: 'info',
      COMPANY: 'warn',
      OFFICIAL_POINT: 'success'
    };
    return map[type] ?? 'secondary';
  }

  getStatusLabel(status: CollectionPointStatus): string {
    return this.allStatusOptions.find(s => s.value === status)?.label ?? status;
  }

  getStatusSeverity(status: CollectionPointStatus | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    return this.allStatusOptions.find(s => s.value === status)?.severity ?? 'secondary';
  }

  private toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({ severity, summary, detail, life: 4000 });
  }
}
