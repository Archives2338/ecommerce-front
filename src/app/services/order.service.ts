import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ApiService, ApiResponse } from './api.service';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  duration?: string;
  profiles?: number;
}

export interface CreateOrderRequest {
  serviceId: string;
  type_plan_id: number;
  paymentMethod: 'yape' | 'plin' | 'transferencia';
  items: OrderItem[];
  total: number;
  promo_code?: string;
}

export interface Order {
  _id: string;
  customer: string;
  user_id: string;
  out_trade_no: string;
  service_name: string;
  plan_name: string;
  items: OrderItem[];
  total: number;
  order_status: 'pending' | 'active' | 'expired' | 'paid';
  paymentMethod: string;
  ostatus: number;
  currency?: string;
  starts_at?: Date;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
  service?: {
    _id: string;
    type_id: number;
    icon: string;
    name: string;
  };
  access_info?: {
    account_id: string;
    profile_name: string;
    slot_number: number;
    access_credentials: {
      email: string;
      password: string;
      profile_pin?: string;
    };
  };
  payment_info?: {
    transaction_id: string;
    payment_method: string;
    paid_at: Date;
  };
}

export interface OrderHistoryResponse {
  orders: Order[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface OrderStatistics {
  total_orders: number;
  active_orders: number;
  pending_orders: number;
  expired_orders: number;
  total_spent: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private currentOrderSubject = new BehaviorSubject<Order | null>(null);
  public currentOrder$ = this.currentOrderSubject.asObservable();

  private readonly endpoints = {
    orders: '/api/orders',
    myHistory: '/api/orders/my/history',
    myStatistics: '/api/orders/my/statistics'
  };

  constructor(
    private apiService: ApiService,
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Crear una nueva orden
   */
  createOrder(orderData: CreateOrderRequest): Observable<ApiResponse<Order>> {
    console.log('🚀 Creating order:', orderData);
    
    const corsHeaders = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    };
    
    return this.http.post<ApiResponse<Order>>(
      'http://localhost:3000/api/orders',
      orderData,
      corsHeaders
    ).pipe(
      catchError(error => {
        console.error('❌ Error creating order:', error);
        
        if (error.status === 401) {
          console.log('🔐 Token inválido (401) - Limpiando localStorage y redirigiendo a /auth');
          // Limpiar localStorage completamente
          localStorage.clear();
          // Redirigir a auth
          this.router.navigate(['/auth']);
        }
        
        return throwError(() => error);
      })
    );
  }  /**
   * Obtener orden por ID
   */
  getOrderById(orderId: string): Observable<ApiResponse<Order>> {
    return this.apiService.get<ApiResponse<Order>>(
      `${this.endpoints.orders}/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      }
    );
  }

  /**
   * Adjuntar comprobante de pago
   */
  attachComprobante(orderId: string, file: File, additionalData?: {
    paymentReference?: string;
    paymentAmount?: number;
  }): Observable<ApiResponse<Order>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData?.paymentReference) {
      formData.append('paymentReference', additionalData.paymentReference);
    }
    if (additionalData?.paymentAmount) {
      formData.append('paymentAmount', additionalData.paymentAmount.toString());
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getAuthToken()}`
    });

    return this.http.put<ApiResponse<Order>>(
      `${environment.apiUrl}${this.endpoints.orders}/${orderId}/comprobante`,
      formData,
      { headers }
    );
  }

  /**
   * Obtener historial de órdenes del usuario
   */
  getMyOrderHistory(filters?: {
    page?: number;
    limit?: number;
    order_status?: number;
    out_trade_no?: string;
    start_time?: string;
    end_time?: string;
  }): Observable<ApiResponse<OrderHistoryResponse>> {
    const params: any = {};
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value;
        }
      });
    }

    const corsHeaders = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      params
    };

    return this.http.get<ApiResponse<OrderHistoryResponse>>(
      'http://localhost:3000/api/orders/my/history',
      corsHeaders
    ).pipe(
      catchError(error => {
        console.error('❌ Error getting order history:', error);
        
        if (error.status === 401) {
          console.log('🔐 Token inválido (401) - Limpiando localStorage y redirigiendo a /auth');
          localStorage.clear();
          this.router.navigate(['/auth']);
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener solo las suscripciones activas (órdenes pagadas y vigentes)
   */
  getActiveSubscriptions(): Observable<ApiResponse<OrderHistoryResponse>> {
    return this.getMyOrderHistory({
      order_status: 2, // 2 = pagado según el schema
      page: 1,
      limit: 50 // Traer hasta 50 suscripciones activas
    });
  }

  /**
   * Obtener solo las suscripciones completamente activas (con credenciales asignadas)
   */
  getFullyActiveSubscriptions(): Observable<ApiResponse<OrderHistoryResponse>> {
    return this.getActiveSubscriptions().pipe(
      map((response: ApiResponse<OrderHistoryResponse>) => {
        if (response.code === 0 && response.data?.orders) {
          // Filtrar solo las órdenes que tienen credenciales de acceso asignadas
          const activeOrders = response.data.orders.filter((order: Order) => 
            order.access_info?.access_credentials?.email && 
            order.access_info?.access_credentials?.password &&
            order.access_info?.access_credentials?.email !== 'Pendiente de asignación' &&
            order.access_info?.access_credentials?.password !== 'Pendiente de asignación'
          );

          console.log(`🔍 Filtradas ${activeOrders.length} suscripciones con credenciales de ${response.data.orders.length} órdenes pagadas`);

          return {
            ...response,
            data: {
              ...response.data,
              orders: activeOrders,
              pagination: {
                ...response.data.pagination,
                total: activeOrders.length
              }
            }
          };
        }
        return response;
      })
    );
  }

  /**
   * Obtener estadísticas de órdenes del usuario
   */
  getMyOrderStatistics(): Observable<ApiResponse<OrderStatistics>> {
    return this.apiService.get<ApiResponse<OrderStatistics>>(
      this.endpoints.myStatistics,
      {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      }
    );
  }

  /**
   * Buscar orden por número de transacción
   */
  getOrderByTradeNo(tradeNo: string): Observable<ApiResponse<Order>> {
    return this.apiService.get<ApiResponse<Order>>(
      `/api/orders/trade-no/${tradeNo}`
    );
  }

  /**
   * Establecer la orden actual en el estado global
   */
  setCurrentOrder(order: Order | null): void {
    this.currentOrderSubject.next(order);
  }

  /**
   * Obtener la orden actual del estado
   */
  getCurrentOrder(): Order | null {
    return this.currentOrderSubject.value;
  }

  /**
   * Limpiar la orden actual
   */
  clearCurrentOrder(): void {
    this.currentOrderSubject.next(null);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Obtener token de autenticación del localStorage
   */
  private getAuthToken(): string {
    // El backend guarda el token con la key 'token'
    const token = localStorage.getItem('token');
    
    if (token) {
      console.log('🔑 Using real customer token from localStorage');
      return token;
    }
    
    // Fallback: buscar en otras posibles claves
    const fallbackToken = localStorage.getItem('auth_token') || 
                          localStorage.getItem('access_token');
    
    if (fallbackToken) {
      console.log('🔑 Using fallback token from localStorage');
      return fallbackToken;
    }
    
    // Token de desarrollo para customer (formato que espera el backend)
    console.log('🔑 Using development token - no real token found');
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Nzc3YzI4YzNlNzNkM2YxYjc4YjQ2N2YiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJ0eXBlIjoiY3VzdG9tZXIiLCJpYXQiOjE3MzYwMzg5MjcsImV4cCI6OTk5OTk5OTk5OX0.dummy-signature';
  }

  /**
   * Mapear datos del modal a formato de orden
   */
  mapModalDataToOrder(modalData: any, selectedPlan: any, selectedScreen: any): CreateOrderRequest {
    const planName = `${modalData?.type_name || 'Servicio'} ${selectedPlan?.month_content || 'Plan'}`;
    const profiles = selectedScreen?.screen || selectedPlan?.screen || 1;
    const price = parseFloat(selectedPlan?.sale_price || '0');
    console.log('🛒 Mapping modal data to order:', modalData)
    return {
      serviceId: modalData?._id?.toString(),
      type_plan_id: selectedPlan?.type_plan_id || selectedPlan?.id || 1,
      paymentMethod: 'yape', // Por defecto, se puede cambiar
      items: [{
        productId: `${modalData?.type_name?.toLowerCase() || 'service'}-${profiles}-profile`,
        name: planName,
        quantity: 1,
        price: price,
        duration: selectedPlan?.month_content || '1 mes',
        profiles: profiles
      }],
      total: price,
      promo_code: ''
    };
  }

  /**
   * Validar datos de orden antes de enviar
   */
  validateOrderData(orderData: CreateOrderRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!orderData.serviceId) {
      errors.push('ID del servicio es requerido');
    }

    if (!orderData.type_plan_id) {
      errors.push('ID del plan es requerido');
    }

    if (!orderData.paymentMethod) {
      errors.push('Método de pago es requerido');
    }

    if (!orderData.items || orderData.items.length === 0) {
      errors.push('Debe incluir al menos un item');
    }

    if (orderData.total <= 0) {
      errors.push('El total debe ser mayor a 0');
    }

    orderData.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: ID del producto es requerido`);
      }
      if (!item.name) {
        errors.push(`Item ${index + 1}: Nombre del producto es requerido`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      if (item.price <= 0) {
        errors.push(`Item ${index + 1}: Precio debe ser mayor a 0`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
