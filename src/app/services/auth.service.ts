import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string; // Cambiado de access_token
  refreshToken: string; // Cambiado de refresh_token
  customer: User; // Cambiado de user
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private readonly TOKEN_KEY = 'token'; // Cambiado de 'auth_token' a 'token'
  private readonly REFRESH_TOKEN_KEY = 'refreshToken'; // Cambiado para coincidir con backend
  private readonly USER_KEY = 'customer'; // Cambiado de 'current_user' a 'customer'

  constructor(private apiService: ApiService) {
    this.loadStoredAuth();
  }

  /**
   * Cargar autenticación almacenada al inicializar
   */
  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Error loading stored user data:', error);
        this.clearAuth();
      }
    }
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.apiService.post<ApiResponse<LoginResponse>>('/api/customer/auth/login', credentials);
  }

  /**
   * Procesar respuesta de login exitoso
   */
  processLoginSuccess(response: LoginResponse): void {
    // Guardar tokens
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.customer));

    // Actualizar estado
    this.currentUserSubject.next(response.customer);
    this.isAuthenticatedSubject.next(true);

    console.log('✅ Login successful for user:', response.customer.email);
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.clearAuth();
    
    // Opcional: notificar al backend
    this.apiService.post('/api/customer/auth/logout', {}).subscribe({
      next: () => console.log('✅ Logout successful'),
      error: (error) => console.warn('⚠️ Logout request failed:', error)
    });
  }

  /**
   * Limpiar autenticación
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Obtener token de acceso
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Obtener ID del usuario actual
   */
  getCurrentUserId(): string | null {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  /**
   * Refresh token
   */
  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      this.clearAuth();
      throw new Error('No refresh token available');
    }

    return this.apiService.post<ApiResponse<LoginResponse>>('/api/customer/auth/refresh', {
      refresh_token: refreshToken
    });
  }

  /**
   * Verificar email para registro
   */
  checkEmail(email: string): Observable<ApiResponse<{ exists: boolean }>> {
    return this.apiService.post<ApiResponse<{ exists: boolean }>>('/api/customer/auth/check-email', { email });
  }

  /**
   * Enviar código de verificación
   */
  sendVerificationCode(email: string): Observable<ApiResponse<any>> {
    return this.apiService.post('/api/customer/auth/send-code', { email });
  }

  /**
   * Verificar código
   */
  verifyCode(email: string, code: string): Observable<ApiResponse<any>> {
    return this.apiService.post('/api/customer/auth/verify-code', { email, code });
  }

  /**
   * Completar registro
   */
  completeRegistration(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    verification_code: string;
  }): Observable<ApiResponse<LoginResponse>> {
    return this.apiService.post<ApiResponse<LoginResponse>>('/api/customer/auth/complete-registration', userData);
  }



  /**
   * Verificar si el token está próximo a expirar
   */
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decodificar JWT básico (sin verificación)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      const timeUntilExpiry = exp - now;
      
      // Considerar "próximo a expirar" si quedan menos de 5 minutos
      return timeUntilExpiry < 5 * 60 * 1000;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }
}
