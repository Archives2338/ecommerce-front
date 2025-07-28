import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ContentService, HeaderContent, HeaderItem } from '../../services/content.service';

export interface HeaderConfig {
  backgroundColor: string;
  textColor: string;
  showSearch: boolean;
  showLanguageSelector: boolean;
  showPromotion: boolean;
  promotionText: string;
  affiliateLink: string;
  supportLink: string;
  // Nuevas propiedades para el ancho
  headerWidth?: 'normal' | 'expanded' | 'full-width';
  maxWidth?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Configuración del header personalizable
  @Input() headerConfig: HeaderConfig = {
    backgroundColor: '#ef5350',
    textColor: 'rgb(255, 255, 255)',
    showSearch: true,
    showLanguageSelector: true,
    showPromotion: false,
    promotionText: '🎉 Oferta especial - 50% de descuento',
    affiliateLink: '/affiliate',
    supportLink: '/support',
    headerWidth: 'normal', // Por defecto normal
    maxWidth: '1200px'
  };

  // Contenido precargado desde el componente padre
  @Input() preloadedContent: HeaderContent | null = null;

  // Contenido dinámico del header
  headerContent: HeaderContent | null = null;
  headerItems: HeaderItem[] = [];
  searchPlaceholder: string = 'Buscar...';
  searchNoResults: string = 'No se encontraron resultados';

  // Estado del componente
  @Input() userAvatar: string = '';
  @Input() isLoggedIn: boolean = false;
  
  // Configuraciones adicionales
  @Input() showSearch: boolean = true;
  @Input() showLanguageSelector: boolean = true;
  @Input() showPromotion: boolean = false;
  @Input() showNotification: boolean = false;

  // Propiedades dinámicas
  promotionText: string = '🎉 Oferta especial - 50% de descuento';
  affiliateLink: string = '/affiliate';
  supportLink: string = '/support';
  currentLanguage: string = 'es';
  notificationText: string = '';
  notificationClass: string = 'notification-info';

  constructor(
    private contentService: ContentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Si hay contenido precargado, usarlo
    if (this.preloadedContent) {
      this.processPreloadedContent(this.preloadedContent);
    } else {
      // Cargar contenido del backend solo si no hay contenido precargado
      this.loadHeaderContent();
    }

    // Suscribirse a cambios de contenido
    this.contentService.content$
      .pipe(takeUntil(this.destroy$))
      .subscribe(content => {
        if (content.header) {
          this.headerContent = content.header;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Obtiene las clases CSS para el header basado en la configuración
   */
  getHeaderClasses(): string {
    const classes = ['header', 'd-flex', 'justify-center'];
    
    if (this.headerConfig.headerWidth) {
      classes.push(this.headerConfig.headerWidth);
    }
    
    return classes.join(' ');
  }

  /**
   * Obtiene los estilos dinámicos para el header
   */
  getHeaderStyles(): any {
    const styles: any = {};
    
    if (this.headerConfig.maxWidth) {
      styles['--header-max-width'] = this.headerConfig.maxWidth;
    }
    
    return styles;
  }

  /**
   * Procesa el contenido precargado del header
   */
  private processPreloadedContent(content: HeaderContent): void {
    this.headerContent = content;
    this.headerItems = this.contentService.processHeaderItems(content);
    
    // Extraer textos especiales
    this.searchPlaceholder = content.head6 || 'Buscar...';
    this.searchNoResults = content.head7 || 'No se encontraron resultados';
    
    console.log('Contenido del header precargado procesado:', content);
    console.log('Items del header procesados:', this.headerItems);
  }

  /**
   * Carga el contenido del header desde el backend
   */
  private loadHeaderContent(): void {
    this.contentService.getHeaderContent(this.currentLanguage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (headerData) => {
          this.headerContent = headerData;
          this.headerItems = this.contentService.processHeaderItems(headerData);
          
          // Extraer textos especiales
          this.searchPlaceholder = headerData.head6 || 'Buscar...';
          this.searchNoResults = headerData.head7 || 'No se encontraron resultados';
          
          console.log('Contenido del header cargado:', headerData);
          console.log('Items del header procesados:', this.headerItems);
        },
        error: (error) => {
          console.error('Error al cargar contenido del header:', error);
          // Fallback con contenido por defecto (solo elementos esenciales)
          this.headerContent = {
            head1: 'PÁGINA DE INICIO',
            head3: 'SOPORTE-POSTVENTA',
            head4: 'SUSCRIPCIÓN'
          };
          this.headerItems = this.contentService.processHeaderItems(this.headerContent);
        }
      });
  }

  /**
   * Maneja el clic en un elemento del header
   */
  handleHeaderItemClick(item: HeaderItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.href) {
      window.open(item.href, '_blank');
    } else if (item.action) {
      this.handleHeaderAction(item.action);
    }
  }

  /**
   * Maneja acciones específicas del header
   */
  private handleHeaderAction(action: string): void {
    switch (action) {
      case 'search':
        // Implementar lógica de búsqueda
        console.log('Activar búsqueda');
        break;
      case 'login':
        this.login();
        break;
      case 'logout':
        this.logout();
        break;
      case 'profile':
        this.goToProfile();
        break;
      case 'orders':
        this.goToOrders();
        break;
      default:
        console.log('Acción no reconocida:', action);
    }
  }

  /**
   * Filtra los elementos de navegación principales (excluyendo elementos especiales)
   */
  getNavigationItems(): HeaderItem[] {
    return this.headerItems.filter(item => 
      !['search', 'login', 'logout', 'profile', 'orders'].includes(item.action || '') &&
      item.order <= 5 // Solo los primeros 5 elementos como navegación principal
    );
  }
  onLanguageChange(language: string): void {
    this.currentLanguage = language;
    
    // Cambiar idioma para múltiples secciones
    this.contentService.changeLanguage(language, ['head', 'home', 'auth'])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data.head) {
            this.headerContent = data.head;
            console.log('Header actualizado para idioma:', language);
          }
        },
        error: (error) => {
          console.error('Error al cambiar idioma:', error);
          // Recargar contenido como fallback
          this.loadHeaderContent();
        }
      });
  }

  /**
   * Navega al login
   */
  login(): void {
    this.router.navigate(['/auth/login']);
  }

  /**
   * Navega al perfil
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  /**
   * Navega a las órdenes
   */
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    // Lógica de logout
    this.isLoggedIn = false;
    this.userAvatar = '';
    this.router.navigate(['/']);
  }

  /**
   * Cierra notificación
   */
  closeNotification(): void {
    this.showNotification = false;
  }

  /**
   * Muestra notificación personalizada
   */
  showCustomNotification(text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.notificationText = text;
    this.notificationClass = `notification-${type}`;
    this.showNotification = true;

    // Auto ocultar después de 5 segundos
    setTimeout(() => {
      this.showNotification = false;
    }, 5000);
  }

  /**
   * Actualiza configuración del header
   */
  updateHeaderConfig(config: Partial<HeaderConfig>): void {
    this.headerConfig = { ...this.headerConfig, ...config };
  }
}
