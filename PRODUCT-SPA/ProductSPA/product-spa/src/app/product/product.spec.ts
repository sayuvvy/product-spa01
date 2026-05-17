import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from './product';
import { AppService } from '../services/app';
import { of, throwError } from 'rxjs';
import { ProductModel } from '../models/product.model';
import { vi } from 'vitest';

describe('Product', () => {
  let component: Product;
  let fixture: ComponentFixture<Product>;
  let mockAppService: Partial<AppService>;

  const mockProducts: ProductModel[] = [
    { id: 1, name: 'Product A', description: 'Desc A', price: 29.99 },
    { id: 2, name: 'Product B', description: 'Desc B', price: 49.99 },
  ];

  beforeEach(async () => {
    mockAppService = {
      checkCredentials: vi.fn().mockReturnValue(true),
      getResource: vi.fn().mockReturnValue(of(mockProducts))
    };

    await TestBed.configureTestingModule({
      declarations: [Product],
      providers: [
        { provide: AppService, useValue: mockAppService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Product);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products when credentials exist', () => {
    expect(mockAppService.getResource).toHaveBeenCalledWith('/api/products');
    expect(component.products.length).toBe(2);
    expect(component.products[0].name).toBe('Product A');
  });

  it('should set errorMessage when not logged in', () => {
    (mockAppService.checkCredentials as ReturnType<typeof vi.fn>).mockReturnValue(false);
    component.ngOnInit();
    expect(component.errorMessage).toBe('You must be logged in to view products.');
    expect(component.products.length).toBe(0);
  });

  it('should set errorMessage on API error', () => {
    (mockAppService.checkCredentials as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (mockAppService.getResource as ReturnType<typeof vi.fn>).mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    component.products = [];
    component.ngOnInit();
    expect(component.errorMessage).toContain('Failed to load products');
  });
});
