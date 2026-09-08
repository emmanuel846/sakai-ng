import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import {
  ReferralAccess,
  ReferralAccessMode,
  ReferralAdmin,
  ReferralBenefitKind,
  ReferralRewardBeneficiary,
  ReferralRewardRule,
  ReferralRewardTrigger,
  ReferralStatus
} from '../../models/referral.model';
import { EMPTY } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { ReferralApiService } from '../../services/referral-api.service';
import { ClientService } from '../clients/client.service';
import { Profil } from '../../models/profil.model';

interface ClientOption {
  label: string;
  value: string;
}

interface RuleRow {
  trigger: ReferralRewardTrigger;
  label: string;
}

@Component({
  selector: 'app-referrals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ToastModule,
    ButtonModule,
    ToggleSwitchModule,
    SelectButtonModule,
    MultiSelectModule,
    InputNumberModule
  ],
  providers: [MessageService],
  templateUrl: './referrals.component.html',
  styleUrls: ['./referrals.component.scss']
})
export class ReferralsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  referrals: ReferralAdmin[] = [];
  loading = false;
  accessLoading = false;
  accessSaving = false;
  rulesLoading = false;

  enabled = true;
  accessMode: ReferralAccessMode = 'ALL';
  allowedClientIds: string[] = [];
  clientOptions: ClientOption[] = [];
  rules: ReferralRewardRule[] = [];

  readonly accessModeOptions: { label: string; value: ReferralAccessMode }[] = [
    { label: 'Tout le monde', value: 'ALL' },
    { label: 'Utilisateurs sélectionnés', value: 'SELECTED' }
  ];

  readonly triggerRows: RuleRow[] = [
    { trigger: 'REGISTRATION', label: 'Inscription' },
    { trigger: 'FIRST_RESERVATION', label: '1re réservation' },
    { trigger: 'FIRST_EXPEDITION', label: '1re publication' }
  ];

  constructor(
    private api: ReferralApiService,
    private clientService: ClientService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadAccess();
    this.loadRules();
    this.loadClients();
  }

  get totalCount(): number {
    return this.referrals.length;
  }

  get pendingCount(): number {
    return this.referrals.filter(item => item.status === 'PENDING').length;
  }

  get rewardedCount(): number {
    return this.referrals.filter(item => item.status === 'REWARDED').length;
  }

  load(): void {
    this.loading = true;
    this.api.list().subscribe({
      next: (items) => {
        this.referrals = items || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les parrainages.'
        });
      }
    });
  }

  loadAccess(): void {
    this.accessLoading = true;
    this.api.getAccess().subscribe({
      next: (access) => {
        this.applyAccess(access);
        this.accessLoading = false;
      },
      error: () => {
        this.accessLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger la configuration du parrainage.'
        });
      }
    });
  }

  loadRules(): void {
    this.rulesLoading = true;
    this.api.getRules().subscribe({
      next: (payload) => {
        this.rules = payload?.rules || [];
        this.rulesLoading = false;
      },
      error: () => {
        this.rulesLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les règles de rémunération.'
        });
      }
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clientOptions = (clients || [])
          .filter(client => !!client?.id)
          .map(client => ({
            label: this.clientLabel(client),
            value: client.id
          }))
          .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger la liste des utilisateurs.'
        });
      }
    });
  }

  saveConfiguration(): void {
    if (this.accessSaving) {
      return;
    }
    this.accessSaving = true;
    const accessPayload: ReferralAccess = {
      enabled: this.enabled,
      accessMode: this.accessMode,
      allowedClientIds: this.accessMode === 'SELECTED' ? [...this.allowedClientIds] : this.allowedClientIds
    };
    this.api.updateAccess(accessPayload).pipe(
      tap(access => this.applyAccess(access)),
      switchMap(() =>
        this.api.updateRules({ rules: this.rules }).pipe(
          catchError(() => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Accès enregistré, mais les règles n’ont pas pu être sauvegardées.'
            });
            return EMPTY;
          })
        )
      ),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => {
        this.accessSaving = false;
      })
    ).subscribe({
      next: (payload) => {
        this.rules = payload?.rules || this.rules;
        this.messageService.add({
          severity: 'success',
          summary: 'Enregistré',
          detail: 'Configuration du parrainage mise à jour.'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible d’enregistrer la configuration.'
        });
      }
    });
  }

  ruleFor(trigger: ReferralRewardTrigger, beneficiary: ReferralRewardBeneficiary): ReferralRewardRule | undefined {
    return this.rules.find(item => item.trigger === trigger && item.beneficiary === beneficiary);
  }

  benefitLabel(kind: ReferralBenefitKind | undefined): string {
    return kind === 'DISCOUNT' ? 'Réduction' : 'Crédit';
  }

  showMaxPerMonth(rule: ReferralRewardRule | undefined): boolean {
    return !!rule?.enabled
      && rule.trigger === 'FIRST_RESERVATION'
      && rule.beneficiary === 'REFERRER'
      && rule.benefitKind === 'CREDIT';
  }

  statusSeverity(status: ReferralStatus): 'success' | 'info' | 'warn' {
    if (status === 'REWARDED') {
      return 'success';
    }
    if (status === 'PENDING') {
      return 'info';
    }
    return 'warn';
  }

  statusLabel(status: ReferralStatus): string {
    if (status === 'REWARDED') {
      return 'Récompensé';
    }
    if (status === 'PENDING') {
      return 'En attente';
    }
    return 'Non éligible';
  }

  private applyAccess(access: ReferralAccess): void {
    this.enabled = !!access?.enabled;
    this.accessMode = access?.accessMode === 'SELECTED' ? 'SELECTED' : 'ALL';
    this.allowedClientIds = [...(access?.allowedClientIds || [])];
  }

  private clientLabel(client: Profil): string {
    const name = `${client.firstname || ''} ${client.lastname || ''}`.trim();
    const pseudo = client.public_pseudo?.trim();
    const email = client.users?.email?.trim();
    const suffix = pseudo || email;
    if (name && suffix) {
      return `${name} · ${suffix}`;
    }
    return name || suffix || client.id;
  }
}
