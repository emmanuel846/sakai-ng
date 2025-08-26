import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { CollectionPoint, CollectionPointCreateRequest } from '../../models/collectionPoint.model';
import { Country } from '../../models/city.model';
import { CollectionPointApiService } from '../../services/collection-point-api.service';
import { CountryApiService } from '../../services/country-api.service';

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
    DropdownModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './collection-point-management.component.html',
  styleUrls: ['./collection-point-management.component.scss']
})
export class CollectionPointManagementComponent implements OnInit {
  collectionPoints: CollectionPoint[] = [];
  filteredCollectionPoints: CollectionPoint[] = [];
  countries: Country[] = [];
  
  // Dialogues
  collectionPointDialog = false;
  
  // Formulaires
  collectionPointForm!: FormGroup;
  
  // États
  loading = false;
  editingCollectionPoint: CollectionPoint | null = null;
  selectedCountryForFilter: Country | null = null;
  
  // Données pour les composants
  countryOptions: any[] = [];

  constructor(
    private collectionPointService: CollectionPointApiService,
    private countryService: CountryApiService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initForms();
  }

  ngOnInit() {
    this.loadCountries();
    this.loadCollectionPoints();
  }

  initForms() {
    this.collectionPointForm = this.fb.group({
      name: ['', Validators.required],
      google_location_url: ['', Validators.required],
      adresse: ['', Validators.required],
      contacts: ['', Validators.required],
      openHours: ['', Validators.required],
      country: ['', Validators.required]
    });
  }

  // === GESTION DES PAYS ===
  
  loadCountries() {
    this.countryService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.updateCountryOptions();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des pays'
        });
      }
    });
  }

  updateCountryOptions() {
    this.countryOptions = this.countries.map(country => ({
      label: country.name,
      value: country.name
    }));
  }

  // === GESTION DES POINTS DE COLLECTE ===
  
  loadCollectionPoints() {
    this.loading = true;
    this.collectionPointService.getCollectionPoints().subscribe({
      next: (collectionPoints) => {
        this.collectionPoints = collectionPoints;
        this.filteredCollectionPoints = collectionPoints;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des points de collecte'
        });
        this.loading = false;
      }
    });
  }

  filterCollectionPointsByCountry(country: Country | null) {
    this.selectedCountryForFilter = country;
    if (country) {
      this.collectionPointService.getCollectionPointsByCountry(country.name).subscribe({
        next: (collectionPoints) => {
          this.filteredCollectionPoints = collectionPoints;
        },
        error: () => {
          // Si l'endpoint n'existe pas, filtrer localement
          this.filteredCollectionPoints = this.collectionPoints.filter(cp => cp.country === country.name);
        }
      });
    } else {
      this.filteredCollectionPoints = this.collectionPoints;
    }
  }

  onCountryFilterChange(event: any) {
    const countryName = event.value;
    if (countryName) {
      const selectedCountry = this.countries.find(c => c.name === countryName);
      this.filterCollectionPointsByCountry(selectedCountry || null);
    } else {
      this.filterCollectionPointsByCountry(null);
    }
  }

  openNewCollectionPoint() {
    this.editingCollectionPoint = null;
    this.collectionPointForm.reset();
    this.collectionPointDialog = true;
  }

  editCollectionPoint(collectionPoint: CollectionPoint) {
    this.editingCollectionPoint = collectionPoint;
    this.collectionPointForm.patchValue({
      name: collectionPoint.name,
      google_location_url: collectionPoint.google_location_url || collectionPoint.location_url,
      adresse: collectionPoint.adresse,
      contacts: collectionPoint.contacts,
      openHours: collectionPoint.openHours,
      country: collectionPoint.country
    });
    this.collectionPointDialog = true;
  }

  saveCollectionPoint() {
    if (this.collectionPointForm.valid) {
      const collectionPointData: CollectionPointCreateRequest = this.collectionPointForm.value;
      
      if (this.editingCollectionPoint) {
        // Mise à jour
        this.collectionPointService.updateCollectionPoint(this.editingCollectionPoint.id!, collectionPointData).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Point de collecte mis à jour avec succès'
            });
            this.loadCollectionPoints();
            this.collectionPointDialog = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la mise à jour du point de collecte'
            });
          }
        });
      } else {
        // Création
        this.collectionPointService.createCollectionPoint(collectionPointData).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Point de collecte créé avec succès'
            });
            this.loadCollectionPoints();
            this.collectionPointDialog = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la création du point de collecte'
            });
          }
        });
      }
    }
  }

  deleteCollectionPoint(collectionPoint: CollectionPoint) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le point de collecte "${collectionPoint.name}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.collectionPointService.deleteCollectionPoint(collectionPoint.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Point de collecte supprimé avec succès'
            });
            this.loadCollectionPoints();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la suppression du point de collecte'
            });
          }
        });
      }
    });
  }

  // === MÉTHODES UTILITAIRES ===
  
  hideDialog() {
    this.collectionPointDialog = false;
  }

  getLocationUrl(collectionPoint: CollectionPoint): string {
    return collectionPoint.google_location_url || collectionPoint.location_url || '';
  }

  openLocationInNewTab(collectionPoint: CollectionPoint) {
    const url = this.getLocationUrl(collectionPoint);
    if (url) {
      window.open(url, '_blank');
    }
  }
}
