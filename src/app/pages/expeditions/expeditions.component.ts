import { AfterContentInit, Component, input, OnInit } from '@angular/core';
import { Expedition, ExpeditionLists, ExpeditionStatus } from '../../models/reservation.model';
import { ExpeditionService } from './expedition.service';
import { Table, TableModule } from 'primeng/table';
// import { ExpeditionStatus } from './expedition.enum'; // Remove this line
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
import { SidebarModule } from 'primeng/sidebar';
import { DatePicker } from 'primeng/datepicker';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';

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
        SidebarModule,
        DatePicker,
        CheckboxModule
  ],
  providers: [MessageService],
  templateUrl: './expeditions.component.html',
  styleUrl: './expeditions.component.scss'
})
export class ExpeditionsComponent implements OnInit, AfterContentInit {
  loading = false;
  expeditions: ExpeditionLists[] = [];
  expedtionStatus = ExpeditionStatus;
  selectedExpedition!: ExpeditionLists;
  drawerVisible = false;
  editDialogVisible = false;
  editForm!: FormGroup;
  saving = false;
  filterBy = input.required<ExpeditionStatus>();
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
  selectedPreferences: Array<{selected: boolean, categoryName: string, maxQuantity: number}> = [];
  constructor(
    private expeditionService: ExpeditionService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.getAllExpeditions();
  }
  ngAfterContentInit() {
    // Any additional initialization after content is loaded can go here
  }
  getAllExpeditions() {
    this.loading = true;
    this.expeditionService.getExpeditons().subscribe({
      next: (data) => {
        this.expeditions = data.reverse().filter(exp => exp.expeditionStatus === this.filterBy());
        this.loading = false;
        console.log(this.expeditions);
      },
      error:()=>{
        this.loading = false;
      }
    });
  }
  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }
  validate(expedtionStatus:ExpeditionStatus){
    this.expeditionService.validate(this.selectedExpedition.id,expedtionStatus).subscribe({
      next: (data) => {
        this.getAllExpeditions();
      }
    });
  }
  openDetails(expedition: ExpeditionLists) {
    this.selectedExpedition = expedition;
    this.drawerVisible = true;
  }
  
  openEditDialog(expedition: ExpeditionLists) {
    this.selectedExpedition = expedition;
    
    // Initialiser les préférences
    this.selectedPreferences = this.categories.map(cat => {
      const existingPref = expedition.preferences?.find(p => p.categoryName === cat.name);
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
      customsFees: [expedition.customsFees, [Validators.required, Validators.min(0)]],
      depDateStart: [new Date(expedition.depDateStart), Validators.required],
      arrivalStartDate: [new Date(expedition.arrivalStartDate), Validators.required],
      receiptDate: [new Date(expedition.receiptDate), Validators.required],
      deliveryDate: [new Date(expedition.deliveryDate), Validators.required],
      deliverySteps: [expedition.deliverySteps || '']
    });
    this.editDialogVisible = true;
  }
  
  saveExpedition() {
    if (this.editForm.valid) {
      this.saving = true;
      const formValue = this.editForm.value;
      
      // Construire le tableau de préférences
      const preferencesArray = this.selectedPreferences
        .filter(pref => pref.selected)
        .map(pref => ({
          categoryName: pref.categoryName,
          maxQuantity: pref.maxQuantity
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
        depEndDate: this.selectedExpedition.depDateEnd,
        arrivalStartDate: formValue.arrivalStartDate.toISOString(),
        arrivalEndDate: this.selectedExpedition.arrivalEndDate,
        receiptDate: formValue.receiptDate.toISOString(),
        deliveryDate: formValue.deliveryDate.toISOString(),
        packageRetrivalDate: formValue.receiptDate.toISOString(),
        clientId: this.selectedExpedition.clients.id,
        collectionPointsId: this.selectedExpedition.collectionPoints.id
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
            detail: 'Erreur lors de la modification de l\'expédition' 
          });
          this.saving = false;
          console.error('Error updating expedition:', error);
        }
      });
    }
  }
}
