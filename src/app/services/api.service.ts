import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, retry, catchError, timeout, tap, retryWhen, delay, concatMap, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoggerService } from './logger.service';

export interface ApiRequestOptions {
  headers?: { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> };
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  success?: boolean;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl: string;
  private readonly defaultTimeout = 10000; // 10 segundos
  private readonly defaultRetries = 2;

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {
    this.baseUrl = environment.apiUrl;
    this.logger.info('ApiService initialized', { 
      baseUrl: this.baseUrl,
      environment: environment.production ? 'production' : 'development'
    }, 'API_SERVICE');
  }

  /**
   * Construye la URL completa para un endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remover barras duplicadas y construir URL limpia
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${cleanEndpoint}`;
  }

  /**
   * Headers por defecto para las peticiones
   */
  private getDefaultHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Version': environment.apiVersion
    });
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
      this.logger.error('Client-side error', error.error, 'API_SERVICE');
    } else {
      // Error del lado del servidor
      errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      
      // Logging específico por código de error
      switch (error.status) {
        case 401:
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          this.logger.warn('Unauthorized access attempt', { url: error.url, status: error.status }, 'API_SERVICE');
          break;
        case 403:
          errorMessage = 'Acceso prohibido. No tienes permisos para esta acción.';
          this.logger.warn('Forbidden access attempt', { url: error.url, status: error.status }, 'API_SERVICE');
          break;
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          this.logger.warn('Resource not found', { url: error.url, status: error.status }, 'API_SERVICE');
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          this.logger.error('Internal server error', { url: error.url, status: error.status, error: error.error }, 'API_SERVICE');
          break;
        case 503:
          errorMessage = 'Servicio no disponible. Inténtalo más tarde.';
          this.logger.error('Service unavailable', { url: error.url, status: error.status }, 'API_SERVICE');
          break;
        default:
          this.logger.error(`HTTP Error ${error.status}`, { 
            url: error.url, 
            status: error.status, 
            message: error.message,
            error: error.error 
          }, 'API_SERVICE');
      }
    }

    return throwError(() => ({ message: errorMessage, originalError: error }));
  }

  /**
   * Procesa las headers de las opciones
   */
  private processHeaders(options?: ApiRequestOptions): HttpHeaders {
    let headers = this.getDefaultHeaders();
    
    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          headers = headers.set(key, value.join(', '));
        } else {
          headers = headers.set(key, value);
        }
      });
    }
    
    return headers;
  }

  /**
   * Petición GET genérica
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.processHeaders(options);
    
    this.logger.debug(`GET request to ${endpoint}`, { options }, 'API_SERVICE');

    return this.http.get<T>(url, {
      headers,
      params: options?.params
    }).pipe(
      timeout(options?.timeout || this.defaultTimeout),
      retryWhen(errors => this.retryStrategy(errors, options?.retries || this.defaultRetries)),
      tap(response => this.logger.debug(`GET response from ${endpoint}`, response, 'API_SERVICE')),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Petición POST genérica
   */
  post<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.processHeaders(options);
    
    this.logger.debug(`POST request to ${endpoint}`, { body, options }, 'API_SERVICE');

    return this.http.post<T>(url, body, {
      headers,
      params: options?.params
    }).pipe(
      timeout(options?.timeout || this.defaultTimeout),
      retryWhen(errors => this.retryStrategy(errors, options?.retries || this.defaultRetries)),
      tap(response => this.logger.debug(`POST response from ${endpoint}`, response, 'API_SERVICE')),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Petición PUT genérica
   */
  put<T>(endpoint: string, body: any, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.processHeaders(options);
    
    this.logger.debug(`PUT request to ${endpoint}`, { body, options }, 'API_SERVICE');

    return this.http.put<T>(url, body, {
      headers,
      params: options?.params
    }).pipe(
      timeout(options?.timeout || this.defaultTimeout),
      retryWhen(errors => this.retryStrategy(errors, options?.retries || this.defaultRetries)),
      tap(response => this.logger.debug(`PUT response from ${endpoint}`, response, 'API_SERVICE')),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Petición DELETE genérica
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.processHeaders(options);
    
    this.logger.debug(`DELETE request to ${endpoint}`, { options }, 'API_SERVICE');

    return this.http.delete<T>(url, {
      headers,
      params: options?.params
    }).pipe(
      timeout(options?.timeout || this.defaultTimeout),
      retryWhen(errors => this.retryStrategy(errors, options?.retries || this.defaultRetries)),
      tap(response => this.logger.debug(`DELETE response from ${endpoint}`, response, 'API_SERVICE')),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Métodos específicos para endpoints comunes
   */
  
  // SKU Service
  getSkuList(typeId: number, monthId?: number, screenId?: number): Observable<any> {
    const body = {
      language: "es",
      type_id: typeId,
      source: 1,
      type: 1,
      ...(monthId && { month_id: monthId }),
      ...(screenId && { screen_id: screenId })
    };

    return this.post(environment.endpoints.sku, body, {
      timeout: 15000, // SKU requiere más tiempo
      retries: 1 // Solo un reintento para SKU
    });
  }

  // Content Service
  getHomeContent(language: string = 'es'): Observable<any> {
    return this.get(`${environment.endpoints.content}/home`, {
      params: { language }
    });
  }

  // Streaming Products Service
  getStreamingProducts(language: string = 'es'): Observable<any> {
    return this.get(environment.endpoints.streaming, {
      params: { language }
    });
  }

  /**
   * Utilidades
   */
  
  /**
   * Estrategia de reintentos personalizada
   */
  private retryStrategy(errors: Observable<any>, maxRetries: number): Observable<any> {
    return errors.pipe(
      concatMap((error, index) => {
        const retryAttempt = index + 1;
        
        // No reintentar en ciertos errores
        if (error.status === 401 || error.status === 403 || error.status === 404) {
          this.logger.debug(`Not retrying error ${error.status} (attempt ${retryAttempt})`, error, 'API_SERVICE');
          return throwError(() => error);
        }
        
        // Si superamos el máximo de reintentos
        if (retryAttempt > maxRetries) {
          this.logger.warn(`Max retry attempts (${maxRetries}) reached`, error, 'API_SERVICE');
          return throwError(() => error);
        }
        
        // Calcular delay exponencial: 1s, 2s, 4s, 8s...
        const delayTime = Math.pow(2, retryAttempt - 1) * 1000;
        
        this.logger.debug(`Retrying request (attempt ${retryAttempt}/${maxRetries}) in ${delayTime}ms`, 
          { error: error.status, url: error.url }, 'API_SERVICE');
        
        return timer(delayTime);
      })
    );
  }

  /**
   * Verifica si la aplicación está en modo de desarrollo
   */
  isDevelopment(): boolean {
    return !environment.production;
  }

  /**
   * Obtiene la URL base de la API
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Logs de desarrollo (solo en dev)
   */
  devLog(message: string, data?: any): void {
    if (environment.features.enableLogging && this.isDevelopment()) {
      console.log(`[API Service] ${message}`, data || '');
    }
  }
}
