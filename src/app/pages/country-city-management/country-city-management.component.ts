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
import { TabViewModule } from 'primeng/tabview';
import { MessageService, ConfirmationService } from 'primeng/api';

import { Country, City, CountryCreateRequest, CityCreateRequest } from '../../models/city.model';
import { CountryApiService } from '../../services/country-api.service';
import { CityApiService } from '../../services/city-api.service';

@Component({
  selector: 'app-country-city-management',
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
    ConfirmDialogModule,
    TabViewModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './country-city-management.component.html',
  styleUrls: ['./country-city-management.component.scss']
})
export class CountryCityManagementComponent implements OnInit {
  countries: Country[] = [];
  cities: City[] = [];
  filteredCities: City[] = [];
  
  // Dialogues
  countryDialog = false;
  cityDialog = false;
  bulkCountryDialog = false;
  
  // Formulaires
  countryForm!: FormGroup;
  cityForm!: FormGroup;
  bulkCountryForm!: FormGroup;
  
  // États
  loading = false;
  editingCountry: Country | null = null;
  editingCity: City | null = null;
  selectedCountryForCities: Country | null = null;
  
  // Données pour les composants
  countryOptions: any[] = [];

  constructor(
    private countryService: CountryApiService,
    private cityService: CityApiService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initForms();
  }

  ngOnInit() {
    this.loadCountries();
    this.loadCities();
  }

  initForms() {
    this.countryForm = this.fb.group({
      iso2: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
      iso3: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3)]],
      name: ['', Validators.required]
    });

    this.cityForm = this.fb.group({
      country: ['', Validators.required],
      cities: ['', Validators.required] // Chaîne de caractères au lieu d'un tableau
    });

    this.bulkCountryForm = this.fb.group({
      countries: ['', Validators.required]
    });
  }

  // === GESTION DES PAYS ===
  
  loadCountries() {
    this.loading = true;
    this.countryService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.updateCountryOptions();
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des pays'
        });
        this.loading = false;
      }
    });
  }

  updateCountryOptions() {
    this.countryOptions = this.countries.map(country => ({
      label: country.name,
      value: country.name
    }));
  }

  openNewCountry() {
    this.editingCountry = null;
    this.countryForm.reset();
    this.countryDialog = true;
  }

  editCountry(country: Country) {
    this.editingCountry = country;
    this.countryForm.patchValue({
      iso2: country.iso2,
      iso3: country.iso3,
      name: country.name
    });
    this.countryDialog = true;
  }

  saveCountry() {
    if (this.countryForm.valid) {
      const countryData: CountryCreateRequest = this.countryForm.value;
      
      if (this.editingCountry) {
        // Mise à jour
        this.countryService.updateCountry(this.editingCountry.id!, countryData).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Pays mis à jour avec succès'
            });
            this.loadCountries();
            this.countryDialog = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la mise à jour du pays'
            });
          }
        });
      } else {
        // Création
        this.countryService.createCountry(countryData).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Pays créé avec succès'
            });
            this.loadCountries();
            this.countryDialog = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la création du pays'
            });
          }
        });
      }
    }
  }

  deleteCountry(country: Country) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer le pays "${country.name}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.countryService.deleteCountry(country.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Pays supprimé avec succès'
            });
            this.loadCountries();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la suppression du pays'
            });
          }
        });
      }
    });
  }

  // === CRÉATION EN MASSE DES PAYS ===
  
  openBulkCountryCreate() {
    this.bulkCountryForm.reset();
    this.bulkCountryDialog = true;
  }

  saveBulkCountries() {
    if (this.bulkCountryForm.valid) {
      const countriesText = this.bulkCountryForm.get('countries')?.value;
      
      try {
        const countries = JSON.parse(countriesText);
        
        this.countryService.createCountries(countries).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Pays créés avec succès'
            });
            this.loadCountries();
            this.bulkCountryDialog = false;
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la création des pays'
            });
          }
        });
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Format JSON invalide'
        });
      }
    }
  }

  // === GESTION DES VILLES ===
  
  loadCities() {
    this.loading = true;
    this.cityService.getCities().subscribe({
      next: (cities) => {
        this.cities = cities;
        this.filteredCities = cities;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des villes'
        });
        this.loading = false;
      }
    });
  }

  filterCitiesByCountry(country: Country | null) {
    this.selectedCountryForCities = country;
    if (country) {
      this.cityService.getCitiesByCountry(country.name).subscribe({
        next: (cities) => {
          this.filteredCities = cities;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors du filtrage des villes'
          });
        }
      });
    } else {
      this.filteredCities = this.cities;
    }
  }

  onCountryFilterChange(event: any) {
    const countryName = event.value;
    if (countryName) {
      const selectedCountry = this.countries.find(c => c.name === countryName);
      this.filterCitiesByCountry(selectedCountry || null);
    } else {
      this.filterCitiesByCountry(null);
    }
  }

  openNewCity() {
    this.editingCity = null;
    this.cityForm.reset();
    this.cityDialog = true;
  }

  editCity(city: City) {
    this.editingCity = city;
    const countryName = typeof city.country === 'string' ? city.country : city.country?.name;
    this.cityForm.patchValue({
      country: countryName,
      cities: city.name // Une seule ville pour l'édition
    });
    this.cityDialog = true;
  }

  saveCity() {
    if (this.cityForm.valid) {
      const formValue = this.cityForm.value;
      const citiesText = formValue.cities;
      
      // Convertir le texte en tableau de villes
      const citiesArray = citiesText
        .split('\n')
        .map((city: string) => city.trim())
        .filter((city: string) => city.length > 0);
      
      const cityData: CityCreateRequest = {
        country: formValue.country,
        cities: citiesArray
      };
      
      this.cityService.createCities(cityData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Villes créées avec succès'
          });
          this.loadCities();
          this.cityDialog = false;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la création des villes'
          });
        }
      });
    }
  }

  deleteCity(city: City) {
    this.confirmationService.confirm({
      message: `Êtes-vous sûr de vouloir supprimer la ville "${city.name}" ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.cityService.deleteCity(city.id!).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: 'Ville supprimée avec succès'
            });
            this.loadCities();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Erreur lors de la suppression de la ville'
            });
          }
        });
      }
    });
  }

  // === MÉTHODES UTILITAIRES ===
  
  hideDialog() {
    this.countryDialog = false;
    this.cityDialog = false;
    this.bulkCountryDialog = false;
  }

  getCityCountryName(city: City): string {
    return typeof city.country === 'string' ? city.country : city.country?.name || '';
  }
}
