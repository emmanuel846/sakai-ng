import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpeditionMainComponent } from './expedition-main.component';

describe('ExpeditionMainComponent', () => {
  let component: ExpeditionMainComponent;
  let fixture: ComponentFixture<ExpeditionMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpeditionMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpeditionMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
