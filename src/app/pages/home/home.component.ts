import { Component, Input, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ContentService, HomeContent, StreamingProduct, ProductCategory } from '../../services/content.service';
import { SkuResponse, SkuData, SkuPlan } from '../../interfaces/sku-response.interface';
import { ApiService } from '../../services/api.service';
import { SkuService } from '../../services/sku.service';
import { OrderService, CreateOrderRequest, Order } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { register } from 'swiper/element/bundle';

// Registrar Swiper como Web Component
register();

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  // Estado para la vista de pago mock
  showCheckoutMock: boolean = false;
  
    // Propiedades para el modal de pago
  showCheckoutModal = false;
  selectedPaymentMethod = '';
  selectedPaymentReceipt: File | null = null;
  paymentReceiptPreview: string | null = null;
  showPaymentSuccess = false;
  showUploadView: boolean = false;
  showQRCode: boolean = true;
  
  // Estado de la orden actual
  currentOrder: Order | null = null;
  isCreatingOrder: boolean = false;
  isUploadingReceipt: boolean = false;
  
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

  // ===== PROPIEDADES DEL MODAL =====
  showServiceModal: boolean = false;
  isLoadingModalData: boolean = false;
  modalData: SkuResponse | null = null;
  selectedProductId: number | null = null;
  modalError: string | null = null;
  
  // ===== PROPIEDADES DE NOTIFICACIONES =====
  showErrorToast: boolean = false;
  errorToastMessage: string = '';
  showSuccessToast: boolean = false;
  successToastMessage: string = '';
  
  // ===== PROPIEDADES DE SELECCIÓN DEL SKU =====
  selectedMonthId: number | null = null;
  selectedScreenId: number | null = null;
  currentSelectedPlan: SkuPlan | null = null;
  isAutoRenewEnabled: boolean = true;

  // ===== PROPIEDADES DEL SWIPER =====
  currentOrderIndexes: { [productIndex: number]: number } = {};
  swiperIntervals: { [productIndex: number]: any } = {};
  swiperInstances: { [productIndex: number]: any } = {};

  // ===== PROPIEDADES DE EXPANSIÓN =====
  expandedProducts: { [productIndex: number]: boolean } = {};

  constructor(
    private contentService: ContentService,
    private http: HttpClient,
    private apiService: ApiService,
    private skuService: SkuService,
    private orderService: OrderService,
    private authService: AuthService
  ) {}

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

  // ===== MÉTODOS DEL MODAL =====
  
  /**
   * Abre el modal del servicio y hace la petición a la API (solo una vez)
   */
  openServiceModal(productId: number): void {
    console.log('Abriendo modal para producto ID:', productId);
    
    this.selectedProductId = productId;
    this.showServiceModal = true;
    this.isLoadingModalData = true;
    this.modalError = null;

    // Solo hacer la petición inicial
    this.skuService.getSkuList({
      language: 'es',
      typeId: productId,
      source: 1
    }).subscribe({
      next: (response: SkuResponse) => {
        console.log('✅ SKU Response:', response);
        
        if (response.code === 0 && response.data) {
          this.modalData = response;
          
          // Establecer valores por defecto desde la respuesta
          this.selectedMonthId = response.data.plan.default_month_id;
          this.selectedScreenId = response.data.plan.default_screen_id;
          
          // Actualizar el plan seleccionado inicial
          this.updateSelectedPlan();
          
          this.isLoadingModalData = false;
        } else {
          this.handleModalError(response.message || 'Error al obtener detalles del servicio');
        }
      },
      error: (error) => {
        console.error('❌ Error al obtener SKU:', error);
        this.handleModalError('Error de conexión. Por favor, inténtelo de nuevo.');
      }
    });
  }
  
  /**
   * Cierra el modal
   */
  closeModal(event?: Event): void {
    if (event) {
      // Si se hizo click en el overlay, cerrar el modal
      if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
        this.showServiceModal = false;
        this.showCheckoutMock = false;
        this.showPaymentSuccess = false;
        this.resetModalData();
      }
    } else {
      // Cerrar modal desde el botón de cerrar
      this.showServiceModal = false;
      this.showCheckoutMock = false;
      this.showPaymentSuccess = false;
      this.resetModalData();
    }
  }
  
  /**
   * Maneja la selección de archivo de comprobante de pago
   */
  onReceiptFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.showTemporaryErrorMessage('Solo se permiten archivos JPG, PNG, JPEG y WEBP');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showTemporaryErrorMessage('El archivo no puede ser mayor a 5MB');
        return;
      }
      
      this.selectedPaymentReceipt = file;
      
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        this.paymentReceiptPreview = e.target?.result as string;
        // Ocultar QR cuando se carga la imagen
        this.showQRCode = false;
      };
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * Regresa a la vista del QR y limpia la imagen seleccionada
   */
  goBackToQR(): void {
    this.selectedPaymentReceipt = null;
    this.paymentReceiptPreview = null;
    this.showQRCode = true;
    
    // Limpiar el input file
    const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  /**
   * Cierra el modal de checkout y resetea el estado
   */
  closeCheckoutModal(): void {
    this.showCheckoutModal = false;
    this.selectedPaymentMethod = '';
    this.selectedPaymentReceipt = null;
    this.paymentReceiptPreview = null;
    this.showPaymentSuccess = false;
    this.showQRCode = true;
    
    // Limpiar el input file
    const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
  
  /**
   * Procesa la orden de pago (mock)
   */
  processPaymentOrder(): void {
    if (!this.selectedPaymentReceipt) {
      this.showTemporaryErrorMessage('Por favor, suba el comprobante de pago');
      return;
    }

    if (!this.currentOrder) {
      this.showTemporaryErrorMessage('No hay orden activa');
      return;
    }

    // Subir comprobante
    this.uploadPaymentReceipt();
  }

  /**
   * Crear orden en el backend
   */
  private createOrder(): void {
    if (!this.modalData?.data || !this.currentSelectedPlan) {
      this.showTemporaryErrorMessage('Faltan datos para crear la orden');
      return;
    }

    this.isCreatingOrder = true;

    // Buscar la pantalla seleccionada
    const selectedScreen = this.getSelectedScreen();
    
    // Mapear datos a formato de orden
    const orderData: CreateOrderRequest = this.orderService.mapModalDataToOrder(
      this.modalData.data,
      this.currentSelectedPlan,
      selectedScreen
    );

    // Validar datos
    const validation = this.orderService.validateOrderData(orderData);
    if (!validation.isValid) {
      this.showTemporaryErrorMessage(`Error en datos: ${validation.errors.join(', ')}`);
      this.isCreatingOrder = false;
      return;
    }

    console.log('🚀 Creando orden:', orderData);

    // Crear orden
    this.orderService.createOrder(orderData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isCreatingOrder = false;
          
          if (response.code === 0 && response.data) {
            console.log('✅ Orden creada exitosamente:', response.data);
            this.currentOrder = response.data;
            this.orderService.setCurrentOrder(response.data);
            
            // Mostrar vista de pago
            this.showCheckoutMock = true;
            
            this.showTemporarySuccessMessage('Orden creada exitosamente');
          } else {
            console.error('❌ Error en respuesta:', response);
            this.showTemporaryErrorMessage(response.message || 'Error al crear la orden');
          }
        },
        error: (error) => {
          this.isCreatingOrder = false;
          console.error('❌ Error creando orden:', error);
          this.showTemporaryErrorMessage(error.message || 'Error al crear la orden');
        }
      });
  }

  /**
   * Subir comprobante de pago
   */
  private uploadPaymentReceipt(): void {
    if (!this.currentOrder || !this.selectedPaymentReceipt) {
      return;
    }

    this.isUploadingReceipt = true;

    const additionalData = {
      paymentReference: this.currentOrder.out_trade_no,
      paymentAmount: this.currentOrder.total
    };

    this.orderService.attachComprobante(this.currentOrder._id, this.selectedPaymentReceipt, additionalData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isUploadingReceipt = false;
          
          if (response.code === 0) {
            console.log('✅ Comprobante subido exitosamente');
            this.showPaymentSuccess = true;
            
            // Auto cerrar después de 3 segundos y redirigir a subscriptions
            // setTimeout(() => {
            //   this.closeModal();
            //   window.location.href = '/order';
            // }, 3000);
          } else {
            this.showTemporaryErrorMessage(response.message || 'Error al subir comprobante');
          }
        },
        error: (error) => {
          this.isUploadingReceipt = false;
          console.error('❌ Error subiendo comprobante:', error);
          this.showTemporaryErrorMessage(error.message || 'Error al subir comprobante');
        }
      });
  }

  /**
   * Obtener pantalla seleccionada
   */
  private getSelectedScreen(): any {
    if (!this.modalData?.data?.plan?.screen || !this.selectedScreenId) {
      return this.modalData?.data?.plan?.screen?.[0] || { screen_id: 1, screen_content: '1 Pantalla' };
    }

    return this.modalData.data.plan.screen.find((screen: any) => screen.screen_id === this.selectedScreenId) ||
           this.modalData.data.plan.screen[0];
  }

  /**
   * Mostrar mensaje de éxito temporal
   */
  private showTemporarySuccessMessage(message: string): void {
    // Reutilizar el sistema de notificaciones existente pero con estilo de éxito
    this.successToastMessage = message;
    this.showSuccessToast = true;
    
    setTimeout(() => {
      this.showSuccessToast = false;
      this.successToastMessage = '';
    }, 3000);
  }
  
  /**
   * Resetea los datos del modal
   */
  private resetModalData(): void {
    this.selectedProductId = null;
    this.modalData = null;
    this.isLoadingModalData = false;
    this.selectedMonthId = null;
    this.selectedScreenId = null;
    this.currentSelectedPlan = null;
    this.modalError = null;
    this.isAutoRenewEnabled = true;
    
    // Limpiar datos del comprobante de pago
    this.selectedPaymentReceipt = null;
    this.paymentReceiptPreview = null;
    this.showPaymentSuccess = false;
    this.showCheckoutMock = false;
    this.showQRCode = true;
    
    // Limpiar orden actual
    this.currentOrder = null;
    this.orderService.clearCurrentOrder();
    this.isCreatingOrder = false;
    this.isUploadingReceipt = false;
  }

  // ===== MÉTODOS DE MANEJO DEL SKU =====

  /**
   * Actualiza el plan seleccionado basado en las selecciones actuales
   * Usa SOLO los datos ya cargados en modalData
   */
  private updateSelectedPlan(): void {
    if (!this.modalData?.data) return;

    // Buscar el plan en la estructura de datos ya cargada
    const monthData = this.modalData.data.plan.month.find(m => m.month_id === this.selectedMonthId);
    if (monthData) {
      const screenData = monthData.screen.find(s => s.screen_id === this.selectedScreenId);
      if (screenData) {
        this.currentSelectedPlan = screenData;
        console.log('✅ Plan actualizado dinámicamente:', this.currentSelectedPlan);
        return;
      }
    }

    // Fallback: buscar en la estructura por screen
    const screenData = this.modalData.data.plan.screen.find(s => s.screen_id === this.selectedScreenId);
    if (screenData) {
      const monthPlan = screenData.month.find(m => m.month_id === this.selectedMonthId);
      if (monthPlan) {
        this.currentSelectedPlan = monthPlan;
        console.log('✅ Plan actualizado dinámicamente (fallback):', this.currentSelectedPlan);
      }
    }
  }

  /**
   * Maneja la selección de un período de tiempo (mes) - SIN CONSULTA ADICIONAL
   */
  onMonthSelect(monthId: number): void {
    if (this.selectedMonthId === monthId) return;
    
    console.log('Seleccionando mes:', monthId);
    this.selectedMonthId = monthId;
    this.updateSelectedPlan();
    
    // Ya no recargamos datos - todo es dinámico desde la respuesta inicial
  }

  /**
   * Maneja la selección de tipo de pantalla (screen) - SIN CONSULTA ADICIONAL
   */
  onScreenSelect(screenId: number): void {
    if (this.selectedScreenId === screenId) return;
    
    console.log('Seleccionando screen:', screenId);
    this.selectedScreenId = screenId;
    this.updateSelectedPlan();
    
    // Ya no recargamos datos - todo es dinámico desde la respuesta inicial
  }

  /**
   * Obtiene las opciones de meses disponibles desde los datos ya cargados
   */
  getAvailableMonths(): any[] {
    return this.modalData?.data?.plan?.month || [];
  }

  /**
   * Obtiene las opciones de pantalla disponibles desde los datos ya cargados
   */
  getAvailableScreens(): any[] {
    return this.modalData?.data?.plan?.screen || [];
  }

  /**
   * Verifica si un mes está seleccionado
   */
  isMonthSelected(monthId: number): boolean {
    return this.selectedMonthId === monthId;
  }

  /**
   * Verifica si una pantalla está seleccionada
   */
  isScreenSelected(screenId: number): boolean {
    return this.selectedScreenId === screenId;
  }

  /**
   * Obtiene el plan para mostrar en el header (prioriza repayment)
   */
  getHeaderPlan(): SkuPlan | null {
    if (!this.modalData?.data) return null;

    // Priorizar repayment si existe
    if (this.modalData.data.repayment) {
      const repaymentMonth = this.modalData.data.repayment.month.find(m => m.month_id === this.selectedMonthId);
      if (repaymentMonth) {
        const repaymentScreen = repaymentMonth.screen.find(s => s.screen_id === this.selectedScreenId);
        if (repaymentScreen) {
          return repaymentScreen;
        }
      }
    }

    // Fallback al plan normal
    return this.currentSelectedPlan;
  }

  /**
   * Formatea precio con símbolo de moneda
   */
  formatPrice(price: string, currencyIcon: string): string {
    return `${currencyIcon}${price}`;
  }

  /**
   * Maneja errores del modal
   */
  private handleModalError(message: string): void {
    this.isLoadingModalData = false;
    this.showServiceModal = false;
    this.modalError = message;
    this.showTemporaryErrorMessage(message);
  }

  /**
   * Procesa el pago con el plan seleccionado
   */
  onPayNow(): void {
    if (!this.currentSelectedPlan) {
      this.showTemporaryErrorMessage('No hay plan seleccionado');
      return;
    }

    if (!this.modalData?.data) {
      this.showTemporaryErrorMessage('No hay datos del servicio');
      return;
    }



    // Crear orden
    this.createOrder();
  }

  /**
   * Muestra un mensaje de error temporal
   */
  showTemporaryErrorMessage(message: string): void {
    this.errorToastMessage = message;
    this.showErrorToast = true;
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      this.showErrorToast = false;
      this.errorToastMessage = '';
    }, 3000);
  }
}
