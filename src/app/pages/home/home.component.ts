import { Component, Input, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContentService, HomeContent, StreamingProduct, ProductCategory } from '../../services/content.service';
import { register } from 'swiper/element/bundle';

// Registrar Swiper como Web Component
register();

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  
  @ViewChildren('swiperContainer') swiperContainers!: QueryList<ElementRef>;
  
  // Contenido precargado desde el componente padre
  @Input() preloadedContent: HomeContent | null = null;
  
  // Contenido dinámico del home
  homeContent: HomeContent | null = null;
  
  // Productos de streaming
  streamingProducts: StreamingProduct[] = [];
  
  // Propiedades para mostrar mientras carga el contenido
  isLoading: boolean = true;
  isLoadingProducts: boolean = true;

  // ===== PROPIEDADES DEL SWIPER =====
  currentOrderIndexes: { [productIndex: number]: number } = {};
  swiperIntervals: { [productIndex: number]: any } = {};
  swiperInstances: { [productIndex: number]: any } = {};

  // ===== PROPIEDADES DE EXPANSIÓN =====
  expandedProducts: { [productIndex: number]: boolean } = {};

  constructor(private contentService: ContentService) {}

  ngOnInit(): void {
    // Si hay contenido precargado, usarlo
    if (this.preloadedContent) {
      this.processPreloadedContent(this.preloadedContent);
    } else {
      // Cargar contenido del backend solo si no hay contenido precargado
      this.loadHomeContent();
    }
    
    // Cargar productos de streaming
    this.loadStreamingProducts();
  }

  ngOnDestroy(): void {
    // Limpiar todos los intervalos del swiper
    Object.values(this.swiperIntervals).forEach(interval => {
      if (interval) {
        clearInterval(interval);
      }
    });
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Inicializar swipers después de que la vista esté cargada y tengamos datos
    setTimeout(() => {
      if (this.streamingProducts.length > 0) {
        this.initializeSwipers();
      }
    }, 1000);
  }

  /**
   * Procesa el contenido precargado del home
   */
  private processPreloadedContent(content: HomeContent): void {
    this.homeContent = content;
    this.isLoading = false;
    console.log('Contenido del home precargado procesado:', content);
  }

  /**
   * Carga el contenido del home desde el backend
   */
  private loadHomeContent(): void {
    this.contentService.getHomeContent('es')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (homeData) => {
          this.homeContent = homeData;
          this.isLoading = false;
          console.log('Contenido del home cargado:', homeData);
        },
        error: (error) => {
          console.error('Error al cargar contenido del home:', error);
          this.isLoading = false;
          // Fallback con contenido por defecto
          this.homeContent = {
            home1: 'Proporcionando streaming asequible y de alta calidad durante 6 años',
            home2: 'Disfruta de tus servicios favoritos al mejor precio'
          };
        }
      });
  }

  /**
   * Carga los productos de streaming desde el backend
   */
  private loadStreamingProducts(): void {
    this.contentService.getStreamingProducts('es')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data?.list?.length > 0) {
            // Obtener los productos del primer grupo (id: 1 = "Todos")
            const allProductsCategory = response.data.list.find(category => category.id === 1);
            if (allProductsCategory?.spuList) {
              this.streamingProducts = allProductsCategory.spuList;
              // Inicializar los swipers después de que los datos estén listos
              setTimeout(() => {
                this.initializeSwipers();
              }, 500);
            }
          }
          this.isLoadingProducts = false;
          console.log('Productos de streaming cargados:', this.streamingProducts);
        },
        error: (error) => {
          console.error('Error al cargar productos de streaming:', error);
          this.isLoadingProducts = false;
        }
      });
  }

  /**
   * Maneja el click en el botón de compra
   */
  onBuyProduct(product: StreamingProduct): void {
    console.log('Comprar producto:', product);
    // Aquí implementarías la lógica de compra o abrir modal
  }

  /**
   * Expande/contrae los detalles del producto
   */
  toggleProductDetails(index: number): void {
    this.expandedProducts[index] = !this.expandedProducts[index];
    console.log('Toggle details for product:', index, 'expanded:', this.expandedProducts[index]);
  }

  /**
   * Verifica si un producto está expandido
   */
  isProductExpanded(index: number): boolean {
    return !!this.expandedProducts[index];
  }

  /**
   * Maneja errores de carga de imágenes
   */
  onImageError(event: any, fallbackSrc: string): void {
    if (event.target) {
      event.target.src = fallbackSrc;
    }
  }

  /**
   * Crea un array para mostrar avatares por defecto
   */
  createDefaultAvatarArray(count: number): number[] {
    return Array(count).fill(0);
  }

  /**
   * Calcula cuántos avatares por defecto mostrar
   */
  getDefaultAvatarCount(recentOrderCount: number): number {
    return Math.max(0, 5 - recentOrderCount);
  }

  // ===== MÉTODOS DEL SWIPER =====

  /**
   * Inicializa los swipers automáticos para todos los productos
   */
  initializeSwipers(): void {
    console.log('🔄 Inicializando swipers para productos:', this.streamingProducts.length);
    
    setTimeout(() => {
      this.streamingProducts.forEach((product, productIndex) => {
        console.log(`📦 Producto ${productIndex}:`, product.type_name, 'Orders:', product.recent_order?.length || 0);
        
        // Inicializar el índice del texto
        this.currentOrderIndexes[productIndex] = 0;
        
        // Buscar el elemento swiper
        const swiperElement = document.querySelector(`#swiper-${productIndex}`) as any;
        console.log(`🎯 Swiper element ${productIndex}:`, {
          exists: !!swiperElement,
          slides: swiperElement?.querySelectorAll('swiper-slide')?.length || 0,
          hasRecentOrders: product.recent_order?.length || 0
        });
        
        if (swiperElement && product.recent_order && product.recent_order.length > 0) {
          try {
            // Configuración del swiper para scroll individual de avatares con superposición controlada
            const swiperConfig = {
              slidesPerView: 4, // Mostrar exactamente 4 avatares
              spaceBetween: -8, // Espaciado negativo que coincide con margin-left de avatares
              centeredSlides: false,
              loop: true, // Loop infinito
              autoplay: {
                delay: 2000, // 2 segundos por avatar individual
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
                reverseDirection: false
              },
              allowTouchMove: true,
              grabCursor: false,
              speed: 800, // Transición suave
              effect: 'slide',
              watchSlidesProgress: true,
              freeMode: false,
              preventInteractionOnTransition: false,
              loopAdditionalSlides: 3, // Slides adicionales para un loop más suave
              loopFillGroupWithBlank: false
            };

            // Asignar configuración
            Object.assign(swiperElement, swiperConfig);

            // Inicializar
            swiperElement.initialize();
            console.log(`✅ Swiper ${productIndex} inicializado con config:`, swiperConfig);
            
            // Verificar que el swiper se inicializó correctamente
            setTimeout(() => {
              if (swiperElement.swiper) {
                console.log(`🎢 Swiper ${productIndex} estado:`, {
                  slides: swiperElement.swiper.slides?.length,
                  autoplayRunning: swiperElement.swiper.autoplay?.running,
                  activeIndex: swiperElement.swiper.activeIndex,
                  realIndex: swiperElement.swiper.realIndex
                });
                
                // Forzar inicio del autoplay si no está corriendo
                if (!swiperElement.swiper.autoplay?.running) {
                  console.log(`🔧 Forzando inicio de autoplay para swiper ${productIndex}`);
                  swiperElement.swiper.autoplay?.start();
                }
              }
            }, 100);
            
            // Guardar instancia
            this.swiperInstances[productIndex] = swiperElement;
            
            // Escuchar eventos de cambio de slide para actualizar el texto
            swiperElement.addEventListener('slidechange', (event: any) => {
              const swiper = event.detail?.[0] || swiperElement.swiper;
              if (swiper) {
                this.currentOrderIndexes[productIndex] = swiper.realIndex || swiper.activeIndex;
                console.log(`🔄 Slide changed para producto ${productIndex}, nuevo índice:`, this.currentOrderIndexes[productIndex]);
              }
            });

            // Event listener adicional para autoplay
            swiperElement.addEventListener('autoplay', (event: any) => {
              console.log(`▶️ Autoplay event para swiper ${productIndex}:`, event.detail);
            });
            
          } catch (error) {
            console.error(`❌ Error inicializando swiper ${productIndex}:`, error);
          }
        } else {
          console.warn(`⚠️ No se puede inicializar swiper ${productIndex}:`, {
            elementExists: !!swiperElement,
            hasOrders: !!product.recent_order?.length
          });
          
          // Si no hay swiper, crear un intervalo manual para el texto
          if (product.recent_order && product.recent_order.length > 1) {
            this.swiperIntervals[productIndex] = setInterval(() => {
              this.nextOrder(productIndex);
            }, 2000); // 2 segundos para mantener consistencia con el autoplay
            console.log(`⏲️ Intervalo manual creado para producto ${productIndex}`);
          }
        }
      });
    }, 200); // Reducir timeout inicial
  }

  /**
   * Avanza al siguiente order en el swiper (solo para el texto)
   */
  nextOrder(productIndex: number): void {
    const product = this.streamingProducts[productIndex];
    if (product && product.recent_order && product.recent_order.length > 0) {
      // Solo cambiamos el índice para el texto, Swiper maneja su propia navegación
      this.currentOrderIndexes[productIndex] = 
        (this.currentOrderIndexes[productIndex] + 1) % product.recent_order.length;
    }
  }

  /**
   * Obtiene el índice actual del order para un producto específico
   */
  getCurrentOrderIndex(productIndex: number): number {
    return this.currentOrderIndexes[productIndex] || 0;
  }

  /**
   * Genera el texto de actividad dinámico basado en el order actual
   */
  getActivityText(product: StreamingProduct, productIndex: number): string {
    if (!product.recent_order || product.recent_order.length === 0) {
      return 'Sé el primero en comprar';
    }

    const currentOrderIndex = this.getCurrentOrderIndex(productIndex);
    const currentOrder = product.recent_order[currentOrderIndex];
    
    if (currentOrder) {
      // Formatear el texto según el backend: "po***li compró hace 1 días"
      const userName = this.maskUserName(currentOrder.user_name);
      const timeText = this.formatTimeText(currentOrder.time);
      return `${userName} compró hace ${timeText}`;
    }

    return 'Actividad reciente';
  }

  /**
   * Enmascara el nombre de usuario (mantiene primeros y últimos caracteres)
   */
  private maskUserName(userName: string): string {
    if (!userName || userName.length <= 2) {
      return userName;
    }
    
    if (userName.length <= 4) {
      return userName.charAt(0) + '*'.repeat(userName.length - 2) + userName.charAt(userName.length - 1);
    }
    
    return userName.substring(0, 2) + '*'.repeat(userName.length - 4) + userName.substring(userName.length - 2);
  }

  /**
   * Formatea el texto de tiempo
   */
  private formatTimeText(time: string): string {
    const timeNum = parseInt(time);
    
    if (timeNum === 1) {
      return '1 día';
    } else {
      return `${timeNum} días`;
    }
  }
}
