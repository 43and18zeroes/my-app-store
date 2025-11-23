import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightboxDialog } from './lightbox-dialog';

describe('LightboxDialog', () => {
  let component: LightboxDialog;
  let fixture: ComponentFixture<LightboxDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightboxDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LightboxDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
