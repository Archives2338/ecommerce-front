import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { OrderService, Order } from '../../services/order.service';

export interface OrderItem {
  id: string;
  serviceName: string;
  planName: string;
  logo: string;
  price: number;
  currency: string;
  orderNumber: string;
  type: string;
  creationDate: string;
  totalAmount: number;
  status: 'Pago fallido' | 'Procesando' | 'Terminado' | 'Pendiente de resolución' | 'Reintegrado' | 'Cancelado';
  statusClass: string;
}

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss'
})
export class OrderComponent implements OnInit, OnDestroy {
  
  hasOrders = false; // Estado para mostrar/ocultar datos
  isLoading = true; // Estado de carga
  selectedTab = 'all'; // Tab activo
  searchQuery = ''; // Consulta de búsqueda
  error: string | null = null; // Error mensaje
  
  // Contadores por estado
  orderCounts = {
    all: 0,
    processing: 0,
    completed: 0,
    dispute: 0,
    refunded: 0,
    cancelled: 0
  };

  // Suscripciones
  private subscriptions: Subscription[] = [];

  // Datos de órdenes desde el backend
  allOrders: OrderItem[] = [];
  orders: OrderItem[] = [];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Cargar órdenes desde el backend
   */
  loadOrders(): void {
    this.isLoading = true;
    this.error = null;
    
    const subscription = this.orderService.getMyOrderHistory({
      page: 1,
      limit: 100 // Cargar hasta 100 órdenes
    }).subscribe({
      next: (response) => {
        console.log('🔍 Respuesta del backend:', response);
        
        if (response.code === 0 && response.data?.orders) {
          this.allOrders = this.mapBackendOrders(response.data.orders);
          this.calculateOrderCounts();
          this.filterOrders();
          this.hasOrders = this.allOrders.length > 0;
        } else {
          this.allOrders = [];
          this.orders = [];
          this.hasOrders = false;
          console.warn('⚠️ No se encontraron órdenes o respuesta inválida');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error cargando órdenes:', error);
        this.error = error.message || 'Error al cargar las órdenes';
        this.isLoading = false;
        this.hasOrders = false;
        this.allOrders = [];
        this.orders = [];
      }
    });
    
    this.subscriptions.push(subscription);
  }

  /**
   * Mapear órdenes del backend al formato del componente
   */
  private mapBackendOrders(backendOrders: Order[]): OrderItem[] {
    return backendOrders.map(order => ({
      id: order._id,
      serviceName: order.service_name || 'Servicio',
      planName: order.plan_name || 'Plan',
      logo: this.getServiceLogo(order),
      price: order.items[0]?.price || 0,
      currency: order.currency || 'PEN',
      orderNumber: order.out_trade_no,
      type: this.getOrderType(order),
      creationDate: this.formatDate(order.created_at),
      totalAmount: order.total,
      status: this.mapOrderStatus(order.order_status),
      statusClass: this.getStatusClass(this.mapOrderStatus(order.order_status))
    }));
  }

  /**
   * Obtener logo del servicio
   */
  private getServiceLogo(order: Order): string {
    // Usar el icono que viene del backend en el objeto service
    if (order.service?.icon) {
      console.log('🔍 Usando icono del backend:', order.service.icon, 'para servicio:', order.service.name);
      return order.service.icon;
    }
    
    // Fallback: mapeo manual por nombre de servicio
    console.log('🔍 Usando mapeo manual para el servicio:', order.service_name);
    const logoMap: { [key: string]: string } = {
      'Netflix': 'https://static.gamsgocdn.com/image/0f51929d358472fe7ab782257199e59d.webp',
      'Disney+': 'https://static.gamsgocdn.com/image/dd3ccaa4b722349e652071d2d3f55ef7.webp',
      'Spotify': 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
      'Amazon Prime': 'https://m.media-amazon.com/images/G/01/digital/video/acquisition/PV_Logo_300.png',
      'HBO Max': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/HBO_Max_Logo.svg/512px-HBO_Max_Logo.svg.png',
      'Paramount Plus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Paramount_Plus.svg/512px-Paramount_Plus.svg.png'
    };
    
    const serviceName = order.service?.name || order.service_name || 'Servicio';
    return logoMap[serviceName] || `https://via.placeholder.com/50x50?text=${encodeURIComponent(serviceName.charAt(0))}`;
  }

  /**
   * Mapear estado de orden del backend
   */
  private mapOrderStatus(orderStatus: string): 'Pago fallido' | 'Procesando' | 'Terminado' | 'Pendiente de resolución' | 'Reintegrado' | 'Cancelado' {
    // Según el schema del backend: pending, active, expired, paid
    switch (orderStatus) {
      case 'pending':
        return 'Procesando';
      case 'active':
      case 'paid':
        return 'Terminado';
      case 'expired':
        return 'Cancelado';
      default:
        return 'Pendiente de resolución';
    }
  }

  /**
   * Obtener tipo de orden
   */
  private getOrderType(order: Order): string {
    if (order.created_at && order.starts_at) {
      const created = new Date(order.created_at);
      const starts = new Date(order.starts_at);
      return created.getTime() === starts.getTime() ? 'Nueva compra' : 'Renovación';
    }
    return 'Nueva compra';
  }

  /**
   * Formatear fecha
   */
  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Obtener clase CSS del estado
   */
  private getStatusClass(status: string): string {
    const statusClassMap: { [key: string]: string } = {
      'Pago fallido': 'close',
      'Procesando': 'processing',
      'Terminado': 'complete',
      'Pendiente de resolución': 'dispute',
      'Reintegrado': 'refunded',
      'Cancelado': 'cancelled'
    };
    return statusClassMap[status] || 'default';
  }

  /**
   * Calcular contadores por estado
   */
  private calculateOrderCounts(): void {
    this.orderCounts = {
      all: this.allOrders.length,
      processing: this.allOrders.filter(order => order.status === 'Procesando').length,
      completed: this.allOrders.filter(order => order.status === 'Terminado').length,
      dispute: this.allOrders.filter(order => order.status === 'Pendiente de resolución').length,
      refunded: this.allOrders.filter(order => order.status === 'Reintegrado').length,
      cancelled: this.allOrders.filter(order => order.status === 'Cancelado').length
    };
  }

  /**
   * Filtrar órdenes por tab seleccionado
   */
  filterOrders(): void {
    switch (this.selectedTab) {
      case 'processing':
        this.orders = this.allOrders.filter((order: OrderItem) => order.status === 'Procesando');
        break;
      case 'completed':
        this.orders = this.allOrders.filter((order: OrderItem) => order.status === 'Terminado');
        break;
      case 'dispute':
        this.orders = this.allOrders.filter((order: OrderItem) => order.status === 'Pendiente de resolución');
        break;
      case 'refunded':
        this.orders = this.allOrders.filter((order: OrderItem) => order.status === 'Reintegrado');
        break;
      case 'cancelled':
        this.orders = this.allOrders.filter((order: OrderItem) => order.status === 'Cancelado');
        break;
      default:
        this.orders = [...this.allOrders];
    }

    // Aplicar filtro de búsqueda si existe
    if (this.searchQuery.trim()) {
      this.orders = this.orders.filter((order: OrderItem) => 
        order.orderNumber.includes(this.searchQuery) ||
        order.serviceName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    this.hasOrders = this.orders.length > 0;
  }

  /**
   * Cambiar tab activo
   */
  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.filterOrders();
  }

  /**
   * Buscar órdenes
   */
  searchOrders(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.filterOrders();
  }

  /**
   * Obtener conteo de órdenes por estado
   */
  getOrderCount(status: string): number {
    switch (status) {
      case 'processing': return this.orderCounts.processing;
      case 'completed': return this.orderCounts.completed;
      case 'dispute': return this.orderCounts.dispute;
      case 'refunded': return this.orderCounts.refunded;
      case 'cancelled': return this.orderCounts.cancelled;
      default: return this.orderCounts.all;
    }
  }

  /**
   * Gestionar orden (placeholder)
   */
  manageOrder(order: OrderItem): void {
    console.log('Gestionar orden:', order);
    // Aquí puedes agregar la lógica para gestionar la orden
    // Por ejemplo, navegar a una página de detalles de la orden
  }

  /**
   * Recargar órdenes desde el backend
   */
  reloadOrders(): void {
    this.loadOrders();
  }

  /**
   * Toggle para probar estados con/sin datos (para desarrollo)
   */
  toggleDataState(): void {
    if (this.hasOrders) {
      // Simular estado sin datos
      this.orders = [];
      this.hasOrders = false;
    } else {
      // Recargar datos reales
      this.reloadOrders();
    }
  }
}
