import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppService } from './app';
import { CookieService } from 'ngx-cookie-service';
import { vi } from 'vitest';

describe('AppService', () => {
  let service: AppService;
  let httpMock: HttpTestingController;
  let mockCookieService: Partial<CookieService>;

  beforeEach(() => {
    mockCookieService = {
      set: vi.fn(),
      get: vi.fn().mockReturnValue('mock-token'),
      check: vi.fn().mockReturnValue(true),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AppService,
        { provide: CookieService, useValue: mockCookieService }
      ]
    });

    service = TestBed.inject(AppService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save token using CookieService', () => {
    const mockToken = { access_token: 'abc123', expires_in: 3600 };
    service.saveToken(mockToken);
    expect(mockCookieService.set).toHaveBeenCalledWith(
      'access_token', 'abc123', expect.any(Number)
    );
  });

  it('should retrieve token from CookieService', () => {
    const token = service.retrieveToken;
    expect(mockCookieService.get).toBeDefined();
  });

  it('should return true from checkCredentials when cookie exists', () => {
    expect(service.checkCredentials()).toBe(true);
    expect(mockCookieService.check).toHaveBeenCalledWith('access_token');
  });

  it('should delete cookie on logout', () => {
    service.logout();
    expect(mockCookieService.delete).toHaveBeenCalledWith('access_token');
  });
});
