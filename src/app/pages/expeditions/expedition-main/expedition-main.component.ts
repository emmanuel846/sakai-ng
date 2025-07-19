import { Component } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { ExpeditionsComponent } from '../expeditions.component';
import { ExpeditionStatus } from '../expedition.enum';
@Component({
  selector: 'app-expedition-main',
  imports: [TabsModule,ExpeditionsComponent],
  templateUrl: './expedition-main.component.html',
  styleUrl: './expedition-main.component.scss'
})
export class ExpeditionMainComponent {
  expeditionStatus = ExpeditionStatus;
}
