import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent, SubscriptionCard } from './card/card.component';
import { OrderService, Order } from '../../services/order.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './subscription.component.html',
  styleUrl: './subscription.component.scss'
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private countdownInterval: any; // Para manejar el intervalo del countdown
  
  hasSubscriptions = false; // Inicialmente false hasta cargar datos
  isLoading = true; // Estado de carga
  loadingError = false; // Estado de error
  
  // Datos reales de suscripciones activas
  subscriptions: SubscriptionCard[] = [];
  
  // Datos mockeados para fallback (mantener por ahora)
  mockSubscriptions: SubscriptionCard[] = [
    {
      id: 'mock-netflix',
      detail_logo: 'https://static.gamsgocdn.com/image/9dbae2d076a256112ab6e8e2f9b764f1.webp',
      nombre: 'Netflix Premium',
      fecha_inicio: '2024-01-15',
      fecha_cobro: '2024-02-15',
      correo: 'usuario@ejemplo.com',
      contrasena: 'password123',
      tiempoRestante: '25 días 14 horas',
      expires_at: new Date('2025-09-01T12:00:00Z') // Fecha de ejemplo
    },
    {
      id: 'mock-disney',
      detail_logo: 'https://static.gamsgocdn.com/image/dd3ccaa4b722349e652071d2d3f55ef7.webp',
      nombre: 'Disney Plus',
      fecha_inicio: '2024-01-10',
      fecha_cobro: '2024-02-10',
      correo: 'usuario@ejemplo.com',
      contrasena: 'disney456',
      tiempoRestante: '18 días 6 horas',
      expires_at: new Date('2025-08-25T18:00:00Z') // Fecha de ejemplo
    }
  ];

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.loadActiveSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Limpiar el intervalo del countdown
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  /**
   * Cargar suscripciones activas del usuario
   */
  loadActiveSubscriptions(): void {
    this.isLoading = true;
    this.loadingError = false;

    this.orderService.getFullyActiveSubscriptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📦 Suscripciones completamente activas recibidas:', response);
          
          if (response.code === 0 && response.data?.orders) {
            this.subscriptions = this.mapOrdersToSubscriptions(response.data.orders);
            this.hasSubscriptions = this.subscriptions.length > 0;
            
            // Iniciar el countdown en tiempo real
            this.startCountdown();
            
            console.log('✅ Suscripciones mapeadas:', this.subscriptions);
          } else {
            console.warn('⚠️ No se encontraron suscripciones completamente activas');
            this.subscriptions = [];
            this.hasSubscriptions = false;
          }
          
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error cargando suscripciones:', error);
          this.loadingError = true;
          this.isLoading = false;
          
          // Usar datos mock en caso de error (temporal)
          this.subscriptions = this.mockSubscriptions;
          this.hasSubscriptions = true;
          
          // Iniciar countdown con datos mock
          this.startCountdown();
        }
      });
  }

  /**
   * Mapear órdenes del backend a formato SubscriptionCard
   */
  mapOrdersToSubscriptions(orders: Order[]): SubscriptionCard[] {
    return orders.map((order, index) => ({
      id: `subscription-${order._id || index}`, // ID único para trackBy
      detail_logo: this.getServiceLogo(order.service_name),
      nombre: `${order.service_name} - ${order.plan_name}`,
      fecha_inicio: this.formatDate(order.starts_at || new Date()),
      fecha_cobro: this.formatDate(order.expires_at || new Date()),
      correo: order.access_info?.access_credentials?.email || '',
      contrasena: order.access_info?.access_credentials?.password || '',
      tiempoRestante: this.calculateTimeRemaining(order.expires_at || new Date()),
      expires_at: typeof order.expires_at === 'string' ? new Date(order.expires_at) : (order.expires_at || new Date())
    }));
  }

  /**
   * Obtener logo del servicio basado en el nombre
   */
  getServiceLogo(serviceName: string): string {
    const logos: { [key: string]: string } = {
      'Netflix': 'https://static.gamsgocdn.com/image/9dbae2d076a256112ab6e8e2f9b764f1.webp',
      'Disney Plus': 'https://static.gamsgocdn.com/image/dd3ccaa4b722349e652071d2d3f55ef7.webp',
      'Disney+': 'https://static.gamsgocdn.com/image/dd3ccaa4b722349e652071d2d3f55ef7.webp',
      'Spotify': 'https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png',
      'Amazon Prime': 'https://m.media-amazon.com/images/G/01/digital/video/acquisition/PV_Logo_300.png'
    };

    return logos[serviceName] || 'https://via.placeholder.com/150x100?text=' + encodeURIComponent(serviceName);
  }

  /**
   * Formatear fecha a string
   */
  formatDate(date: Date | string): string {
    if (!date) return 'Fecha no disponible';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  /**
   * Calcular tiempo restante hasta la expiración
   */
  calculateTimeRemaining(expirationDate: Date | string): string {
    if (!expirationDate) return 'Fecha no disponible';
    
    const now = new Date();
    const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
    
    // Calcular diferencia en milisegundos
    const diffMs = expDate.getTime() - now.getTime();
    
    // Si ya expiró
    if (diffMs <= 0) {
      return 'Expirado';
    }
    
    // Convertir a días, horas, minutos y segundos
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    // Formatear el resultado (versión compacta para mejor visualización)
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMinutes}m ${diffSeconds}s`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ${diffSeconds}s`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ${diffSeconds}s`;
    } else {
      return `${diffSeconds}s`;
    }
  }

  /**
   * Iniciar el countdown en tiempo real
   */
  startCountdown(): void {
    // Limpiar cualquier intervalo anterior
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Actualizar cada segundo
    this.countdownInterval = setInterval(() => {
      let hasExpiredSubscriptions = false;

      // Actualizar el tiempo restante de cada suscripción SIN recrear el array
      this.subscriptions.forEach(subscription => {
        const newTimeRemaining = this.calculateTimeRemaining(subscription.expires_at);
        
        if (newTimeRemaining === 'Expirado') {
          hasExpiredSubscriptions = true;
        }

        // Solo actualizar la propiedad tiempoRestante, mantener la referencia del objeto
        subscription.tiempoRestante = newTimeRemaining;
      });

      // Si hay suscripciones expiradas, recargar la lista
      if (hasExpiredSubscriptions) {
        console.log('🔄 Detectadas suscripciones expiradas, recargando lista...');
        this.refreshSubscriptions();
      }
    }, 1000); // Actualizar cada 1000ms (1 segundo)
  }

  /**
   * Recargar suscripciones
   */
  refreshSubscriptions(): void {
    // Limpiar el countdown anterior
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.loadActiveSubscriptions();
  }

  /**
   * Obtener clase CSS para el tiempo restante basado en los días restantes
   */
  getCountdownClass(subscription: SubscriptionCard): string {
    if (subscription.tiempoRestante === 'Expirado') {
      return 'tiempo-restante expired';
    }

    const now = new Date();
    const diffMs = subscription.expires_at.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return 'tiempo-restante danger';
    } else if (diffDays <= 7) {
      return 'tiempo-restante warning';
    } else {
      return 'tiempo-restante';
    }
  }

  /**
   * TrackBy function para optimizar el ngFor y evitar recrear componentes
   */
  trackBySubscriptionId(index: number, subscription: SubscriptionCard): string {
    return subscription.id || index.toString();
  }

}
