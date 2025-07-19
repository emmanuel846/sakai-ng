import { AfterContentInit, Component, input, OnInit } from '@angular/core';
import { Expedition, ExpeditionLists, ExpeditionStatus } from '../../models/reservation.model';
import { ExpeditionService } from './expedition.service';
import { Table, TableModule } from 'primeng/table';
// import { ExpeditionStatus } from './expedition.enum'; // Remove this line
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-expeditions',
  imports: [
    CommonModule,
        TableModule,
        FormsModule,
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
        SidebarModule
  ],
  templateUrl: './expeditions.component.html',
  styleUrl: './expeditions.component.scss'
})
export class ExpeditionsComponent implements OnInit, AfterContentInit {
  loading = false;
  expeditions: ExpeditionLists[] = [];
  expedtionStatus = ExpeditionStatus;
  selectedExpedition!: ExpeditionLists;
  drawerVisible = false;
  filterBy = input.required<ExpeditionStatus>();
  constructor(private expeditionService: ExpeditionService) { }

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
}
