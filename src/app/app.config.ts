import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';

// Interceptors
import { ApiInterceptor } from './interceptors/api.interceptor';

// Services
import { ApiService } from './services/api.service';
import { SkuService } from './services/sku.service';
import { ContentService } from './services/content.service';
import { LoggerService } from './services/logger.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    
    // Servicios principales
    ApiService,
    SkuService,
    ContentService,
    LoggerService,
    
    // HTTP Interceptor - DESACTIVADO TEMPORALMENTE PARA EVITAR CORS
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: ApiInterceptor,
    //   multi: true
    // }
  ]
};
