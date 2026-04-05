import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService, ConfirmationService } from 'primeng/api';

import { AppSetting, AppSettingRequest, SettingValueType } from '../../models/app-setting.model';
import { AppSettingApiService } from '../../services/app-setting-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DropdownModule,
    SelectButtonModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    ToggleSwitchModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  settings: AppSetting[] = [];
  filteredSettings: AppSetting[] = [];
  loading = false;
  saving = false;

  showDialog = false;
  isEditing = false;
  editingKey: string | null = null;

  searchTerm = '';
  filterCategory: string | null = null;
  categoryOptions: { label: string; value: string | null }[] = [];

  form!: FormGroup;

  readonly valueTypeOptions: { label: string; value: SettingValueType; icon: string; description: string }[] = [
    { label: 'Texte',   value: 'STRING',  icon: 'pi-align-left',   description: 'Chaîne de caractères' },
    { label: 'Nombre',  value: 'NUMBER',  icon: 'pi-hashtag',      description: 'Entier ou décimal' },
    { label: 'Booléen', value: 'BOOLEAN', icon: 'pi-toggle-on',    description: 'Vrai / Faux' },
    { label: 'JSON',    value: 'JSON',    icon: 'pi-code',         description: 'Objet ou tableau JSON' },
  ];

  readonly booleanOptions = [
    { label: 'Vrai',  value: true },
    { label: 'Faux',  value: false },
  ];

  // ─── KPI ─────────────────────────────────────────────────────────────────

  get totalCount()   { return this.settings.length; }
  get publicCount()  { return this.settings.filter(s => s.isPublic).length; }
  get jsonCount()    { return this.settings.filter(s => s.valueType === 'JSON').length; }
  get categoryCount(){ return new Set(this.settings.map(s => s.category).filter(Boolean)).size; }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  constructor(
    private service: AppSettingApiService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadAll();
  }

  // ─── Form ─────────────────────────────────────────────────────────────────

  private buildForm(): void {
    this.form = this.fb.group({
      key:         ['', [Validators.required, Validators.pattern(/^[a-z0-9_]+$/)]],
      valueType:   ['STRING' as SettingValueType, Validators.required],
      valueString: [''],
      valueNumber: [null as number | null],
      valueBoolean:[true],
      valueJson:   [''],
      category:    [''],
      description: [''],
      isPublic:    [false],
    });

    // reset value fields when type changes
    this.form.get('valueType')!.valueChanges.subscribe(() => {
      this.form.patchValue({ valueString: '', valueNumber: null, valueBoolean: true, valueJson: '' });
    });
  }

  get selectedType(): SettingValueType {
    return this.form.get('valueType')!.value;
  }

  // ─── Data loading ─────────────────────────────────────────────────────────

  loadAll(): void {
    this.loading = true;
    this.service.getAll().subscribe({
      next: (data) => {
        this.settings = data;
        this.applyFilter();
        this.buildCategoryOptions();
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les paramètres' });
        this.loading = false;
      }
    });
  }

  private buildCategoryOptions(): void {
    const cats = [...new Set(this.settings.map(s => s.category).filter(Boolean))] as string[];
    this.categoryOptions = [
      { label: 'Toutes les catégories', value: null },
      ...cats.map(c => ({ label: c, value: c }))
    ];
  }

  applyFilter(): void {
    let result = [...this.settings];
    if (this.filterCategory) {
      result = result.filter(s => s.category === this.filterCategory);
    }
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(s =>
        s.key.toLowerCase().includes(term) ||
        (s.description ?? '').toLowerCase().includes(term)
      );
    }
    this.filteredSettings = result;
  }

  // ─── Dialog open ──────────────────────────────────────────────────────────

  openNew(): void {
    this.isEditing = false;
    this.editingKey = null;
    this.form.reset({ valueType: 'STRING', valueBoolean: true, isPublic: false });
    this.form.get('key')!.enable();
    this.showDialog = true;
  }

  openEdit(setting: AppSetting): void {
    this.isEditing = true;
    this.editingKey = setting.key;

    const patch: any = {
      key:         setting.key,
      valueType:   setting.valueType,
      category:    setting.category ?? '',
      description: setting.description ?? '',
      isPublic:    setting.isPublic,
      valueString: '',
      valueNumber: null,
      valueBoolean: true,
      valueJson:   '',
    };

    switch (setting.valueType) {
      case 'STRING':  patch.valueString  = setting.value; break;
      case 'NUMBER':  patch.valueNumber  = setting.value; break;
      case 'BOOLEAN': patch.valueBoolean = setting.value; break;
      case 'JSON':    patch.valueJson    = JSON.stringify(setting.value, null, 2); break;
    }

    this.form.patchValue(patch);
    this.form.get('key')!.disable(); // key non modifiable en édition
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const f = this.form.getRawValue();
    let value: any;
    let jsonError = false;

    switch (f.valueType as SettingValueType) {
      case 'STRING':  value = f.valueString;  break;
      case 'NUMBER':  value = f.valueNumber;  break;
      case 'BOOLEAN': value = f.valueBoolean; break;
      case 'JSON':
        try {
          value = JSON.parse(f.valueJson);
        } catch {
          this.messageService.add({ severity: 'error', summary: 'JSON invalide', detail: 'Le contenu JSON n\'est pas valide.' });
          jsonError = true;
        }
        break;
    }

    if (jsonError) return;

    const dto: AppSettingRequest = {
      key:         f.key,
      value,
      valueType:   f.valueType,
      category:    f.category || null,
      description: f.description || null,
      isPublic:    f.isPublic,
    };

    this.saving = true;
    this.service.upsert(dto).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: `Paramètre "${dto.key}" enregistré.` });
        this.showDialog = false;
        this.loadAll();
        this.saving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de l\'enregistrement.' });
        this.saving = false;
      }
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  confirmDelete(setting: AppSetting): void {
    this.confirmationService.confirm({
      message: `Supprimer le paramètre "<b>${setting.key}</b>" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonProps: { severity: 'danger' },
      accept: () => this.doDelete(setting.key)
    });
  }

  private doDelete(key: string): void {
    this.service.delete(key).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Supprimé', detail: `Paramètre "${key}" supprimé.` });
        this.loadAll();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la suppression.' });
      }
    });
  }

  // ─── Display helpers ──────────────────────────────────────────────────────

  formatDisplayValue(setting: AppSetting): string {
    if (setting.value === null || setting.value === undefined) return '—';
    switch (setting.valueType) {
      case 'JSON':    return JSON.stringify(setting.value);
      case 'BOOLEAN': return setting.value ? 'true' : 'false';
      default:        return String(setting.value);
    }
  }

  typeTagSeverity(type: SettingValueType): 'success' | 'info' | 'warn' | 'secondary' {
    switch (type) {
      case 'NUMBER':  return 'info';
      case 'BOOLEAN': return 'success';
      case 'JSON':    return 'warn';
      default:        return 'secondary';
    }
  }

  typeTagIcon(type: SettingValueType): string {
    switch (type) {
      case 'NUMBER':  return 'pi pi-hashtag';
      case 'BOOLEAN': return 'pi pi-toggle-on';
      case 'JSON':    return 'pi pi-code';
      default:        return 'pi pi-align-left';
    }
  }
}
