import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';
import { environment } from '../../environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private pendingRequests = new Set<string>();

  constructor(private logger: LoggerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Crear request modificado con headers comunes
    const modifiedReq = this.addCommonHeaders(req);

    // Log del request
    this.logger.apiRequest(modifiedReq.url, modifiedReq.method, modifiedReq.body);
    
    // Agregar a requests pendientes
    this.pendingRequests.add(requestId);

    return next.handle(modifiedReq).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          const duration = Date.now() - startTime;
          this.logger.apiResponse(
            modifiedReq.url, 
            event.status, 
            { 
              duration,
              responseSize: this.getResponseSize(event.body)
            }
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const duration = Date.now() - startTime;
        this.handleError(error, modifiedReq, duration);
        return throwError(() => error);
      }),
      finalize(() => {
        // Remover de requests pendientes
        this.pendingRequests.delete(requestId);
      })
    );
  }

  /**
   * Agregar headers comunes a todas las requests
   */
  private addCommonHeaders(req: HttpRequest<any>): HttpRequest<any> {
    // Headers mínimos para evitar problemas de CORS
    const headers: { [key: string]: string } = {};

    // Solo agregar Content-Type si no es GET y si hay body
    if (req.method !== 'GET' && req.body) {
      headers['Content-Type'] = 'application/json';
    }

    // Headers adicionales solo en desarrollo y si no causan CORS
    if (!environment.production) {
      // Evitar headers custom que pueden causar preflight
      // headers['X-Request-Time'] = new Date().toISOString();
    }

    // Agregar headers de autenticación si están disponibles
    const authToken = this.getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Solo agregar headers si son necesarios para evitar CORS preflight
    return req.clone({
      setHeaders: Object.keys(headers).length > 0 ? headers : undefined
    });
  }

  /**
   * Manejar errores HTTP de forma centralizada
   */
  private handleError(error: HttpErrorResponse, req: HttpRequest<any>, duration: number): void {
    let errorMessage = 'Error desconocido';
    let errorDetails: any = { duration, url: req.url, method: req.method };

    switch (error.status) {
      case 0:
        errorMessage = 'No se pudo conectar al servidor';
        errorDetails.type = 'NETWORK_ERROR';
        break;
      case 400:
        errorMessage = 'Solicitud inválida';
        errorDetails.type = 'BAD_REQUEST';
        errorDetails.validation = error.error;
        break;
      case 401:
        errorMessage = 'No autorizado';
        errorDetails.type = 'UNAUTHORIZED';
        this.handleUnauthorized();
        break;
      case 403:
        errorMessage = 'Acceso denegado';
        errorDetails.type = 'FORBIDDEN';
        break;
      case 404:
        errorMessage = 'Recurso no encontrado';
        errorDetails.type = 'NOT_FOUND';
        break;
      case 409:
        errorMessage = 'Conflicto de datos';
        errorDetails.type = 'CONFLICT';
        break;
      case 422:
        errorMessage = 'Error de validación';
        errorDetails.type = 'VALIDATION_ERROR';
        errorDetails.validation = error.error;
        break;
      case 429:
        errorMessage = 'Demasiadas solicitudes';
        errorDetails.type = 'RATE_LIMIT';
        break;
      case 500:
        errorMessage = 'Error interno del servidor';
        errorDetails.type = 'INTERNAL_ERROR';
        break;
      case 502:
        errorMessage = 'Servidor no disponible';
        errorDetails.type = 'BAD_GATEWAY';
        break;
      case 503:
        errorMessage = 'Servicio no disponible';
        errorDetails.type = 'SERVICE_UNAVAILABLE';
        break;
      case 504:
        errorMessage = 'Tiempo de espera agotado';
        errorDetails.type = 'TIMEOUT';
        break;
      default:
        errorMessage = `Error HTTP ${error.status}`;
        errorDetails.type = 'HTTP_ERROR';
    }

    errorDetails.message = error.message;
    errorDetails.error = error.error;

    this.logger.apiError(req.url, {
      message: errorMessage,
      ...errorDetails
    });

    // En producción, enviar métricas de error
    if (environment.production) {
      this.sendErrorMetrics(errorDetails);
    }
  }

  /**
   * Manejar falta de autorización
   */
  private handleUnauthorized(): void {
    // Limpiar token de autenticación
    this.clearAuthToken();
    
    // Redirigir al login si es necesario
    // this.router.navigate(['/auth/login']);
    
    this.logger.warn('Session expired, redirecting to login', {}, 'AUTH');
  }

  /**
   * Obtener token de autenticación
   */
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    } catch (error) {
      this.logger.warn('Error accessing auth token from storage', error, 'AUTH');
      return null;
    }
  }

  /**
   * Limpiar token de autenticación
   */
  private clearAuthToken(): void {
    try {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    } catch (error) {
      this.logger.warn('Error clearing auth token from storage', error, 'AUTH');
    }
  }

  /**
   * Obtener ID de correlación para tracking
   */
  private getCorrelationId(): string | null {
    try {
      return sessionStorage.getItem('correlation_id');
    } catch (error) {
      return null;
    }
  }

  /**
   * Generar ID único para la request
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calcular tamaño aproximado de la respuesta
   */
  private getResponseSize(body: any): number {
    try {
      return JSON.stringify(body).length;
    } catch {
      return 0;
    }
  }

  /**
   * Enviar métricas de error (para producción)
   */
  private sendErrorMetrics(errorDetails: any): void {
    // Implementar envío de métricas a servicio de analytics
    // Por ejemplo: Google Analytics, DataDog, etc.
    try {
      // analytics.track('api_error', errorDetails);
    } catch (error) {
      console.error('Failed to send error metrics:', error);
    }
  }

  /**
   * Obtener número de requests pendientes
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Verificar si hay requests pendientes
   */
  hasPendingRequests(): boolean {
    return this.pendingRequests.size > 0;
  }
}
