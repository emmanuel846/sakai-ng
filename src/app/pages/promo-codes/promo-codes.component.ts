import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PromoCode, PromoCodeRequest, PromoCodeType } from '../../models/promo-code.model';
import { PromoCodeApiService } from '../../services/promo-code-api.service';

@Component({
  selector: 'app-promo-codes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DropdownModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ToggleSwitchModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './promo-codes.component.html',
  styleUrls: ['./promo-codes.component.scss']
})
export class PromoCodesComponent implements OnInit {
  codes: PromoCode[] = [];
  loading = false;
  saving = false;
  showDialog = false;
  isEditing = false;
  editingId: string | null = null;

  readonly typeOptions = [
    { label: 'Pourcentage', value: 'PERCENT' as PromoCodeType },
    { label: 'Montant fixe (€)', value: 'FIXED' as PromoCodeType }
  ];

  form: PromoCodeRequest = this.emptyForm();
  validFromLocal = '';
  validUntilLocal = '';

  constructor(
    private api: PromoCodeApiService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get activeCount(): number {
    return this.codes.filter(c => c.active && !c.expired && !c.notYetValid).length;
  }

  get expiredCount(): number {
    return this.codes.filter(c => c.expired).length;
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (codes) => {
        this.codes = codes;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les codes promo' });
      }
    });
  }

  openNew(): void {
    this.isEditing = false;
    this.editingId = null;
    this.form = this.emptyForm();
    this.validFromLocal = '';
    this.validUntilLocal = '';
    this.showDialog = true;
  }

  openEdit(code: PromoCode): void {
    this.isEditing = true;
    this.editingId = code.id;
    this.form = {
      code: code.code,
      type: code.type,
      value: code.value,
      fundedBy: 'PLATFORM',
      validFrom: code.validFrom,
      validUntil: code.validUntil,
      maxUses: code.maxUses,
      maxUsesPerClient: code.maxUsesPerClient,
      minAmount: code.minAmount,
      minWeight: code.minWeight,
      countryDep: code.countryDep,
      countryArr: code.countryArr,
      active: code.active,
      description: code.description
    };
    this.validFromLocal = this.toDatetimeLocal(code.validFrom);
    this.validUntilLocal = this.toDatetimeLocal(code.validUntil);
    this.showDialog = true;
  }

  save(): void {
    this.form.code = (this.form.code || '').trim().toUpperCase();
    this.form.validFrom = this.fromDatetimeLocal(this.validFromLocal);
    this.form.validUntil = this.fromDatetimeLocal(this.validUntilLocal);
    this.saving = true;
    const request$ = this.isEditing && this.editingId
      ? this.api.update(this.editingId, this.form)
      : this.api.create(this.form);
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.showDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: this.isEditing ? 'Code promo mis à jour' : 'Code promo créé'
        });
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err?.error?.message || 'Enregistrement impossible'
        });
      }
    });
  }

  confirmDelete(code: PromoCode): void {
    this.confirmationService.confirm({
      message: `Supprimer le code ${code.code} ? Les réservations déjà payées conservent leur réduction.`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.delete(code.id)
    });
  }

  statusLabel(code: PromoCode): string {
    if (!code.active) return 'Inactif';
    if (code.expired) return 'Expiré';
    if (code.notYetValid) return 'Programmé';
    return 'Actif';
  }

  statusSeverity(code: PromoCode): 'success' | 'warn' | 'danger' | 'secondary' {
    if (!code.active) return 'secondary';
    if (code.expired) return 'danger';
    if (code.notYetValid) return 'warn';
    return 'success';
  }

  valueLabel(code: PromoCode): string {
    return code.type === 'PERCENT' ? `${code.value} %` : `${code.value} €`;
  }

  private delete(id: string): void {
    this.api.delete(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: 'Code promo désactivé' });
        this.load();
      },
      error: (err) => this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: err?.error?.message || 'Suppression impossible'
      })
    });
  }

  private emptyForm(): PromoCodeRequest {
    return {
      code: '',
      type: 'PERCENT',
      value: 10,
      fundedBy: 'PLATFORM',
      validFrom: null,
      validUntil: null,
      maxUses: null,
      maxUsesPerClient: 1,
      minAmount: null,
      minWeight: null,
      countryDep: null,
      countryArr: null,
      active: true,
      description: null
    };
  }

  private toDatetimeLocal(value: string | null): string {
    if (!value) return '';
    return value.length >= 16 ? value.substring(0, 16) : value;
  }

  private fromDatetimeLocal(value: string): string | null {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
  }
}
