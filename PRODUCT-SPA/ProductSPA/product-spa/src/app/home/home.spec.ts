import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';
import { AppService } from '../services/app';
import { vi } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockAppService: Partial<AppService>;

  beforeEach(async () => {
    mockAppService = {
      checkCredentials: vi.fn().mockReturnValue(false),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        { provide: AppService, useValue: mockAppService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isLoggedIn to false when no credentials', () => {
    (mockAppService.checkCredentials as ReturnType<typeof vi.fn>).mockReturnValue(false);
    component.ngOnInit();
    expect(component.isLoggedIn).toBe(false);
  });

  it('should set isLoggedIn to true when credentials exist', () => {
    (mockAppService.checkCredentials as ReturnType<typeof vi.fn>).mockReturnValue(true);
    component.ngOnInit();
    expect(component.isLoggedIn).toBe(true);
  });

  it('should call logout on AppService when logout() is called', () => {
    component.logout();
    expect(mockAppService.logout).toHaveBeenCalled();
  });
});
