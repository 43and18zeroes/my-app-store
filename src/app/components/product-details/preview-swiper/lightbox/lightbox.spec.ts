import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lightbox } from './lightbox';

describe('Lightbox', () => {
  let component: Lightbox;
  let fixture: ComponentFixture<Lightbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Lightbox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Lightbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
