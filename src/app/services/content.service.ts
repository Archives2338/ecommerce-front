import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ApiService } from './api.service';
import { LoggerService } from './logger.service';
import { environment } from '../../environments/environment';

export interface HeaderContent {
  head1?: string;
  head2?: string;
  head3?: string;
  head4?: string;
  head5?: string;
  head6?: string;
  head7?: string;
  head8?: string;
  head9?: string;
  head10?: string;
  params?: { [key: string]: string };
  [key: string]: any;
}

export interface HomeContent {
  home1?: string; // Título principal
  home2?: string; // Subtítulo o descripción de usuarios
  home3?: string; // Estadística 1 (usuarios)
  home4?: string; // Estadística 2 (años)
  home5?: string; // Estadística 3 (participaciones)
  home6?: string; // Texto adicional (participaciones label)
  home35?: string; // Subtítulo debajo del título principal
  params?: { [key: string]: string };
  [key: string]: any;
}

// Interfaces para productos/servicios de streaming
export interface RecentOrder {
  out_trade_no: string;
  user_name: string;
  avatar_url: string;
  create_time: string;
  show_status: number;
  time: string;
}

export interface StreamingProduct {
  id: number;
  type_name: string;
  detail_route: string;
  is_netflix: boolean;
  image: string;
  image_type: number;
  thumb_img: string;
  min_price: string;
  currency_icon1: string;
  currency_icon2: string;
  currency_show_type: number;
  vip_status: number;
  lock_status: number;
  rank: number;
  recent_order: RecentOrder[];
  description: string[];
  prompt: any[];
}

export interface ProductCategory {
  id: number;
  spuList: StreamingProduct[];
}

export interface ClassifyTab {
  id: number;
  name: string;
  icon?: string;
}

export interface ProductsResponse {
  code: number;
  message: string;
  toast: number;
  data: {
    classify_tab: ClassifyTab[];
    list: ProductCategory[];
  };
}

export interface HeaderItem {
  key: string;
  text: string;
  route?: string;
  href?: string;
  action?: string;
  isVisible: boolean;
  order: number;
}

export interface HeaderNavigationConfig {
  [key: string]: {
    route?: string;
    href?: string;
    action?: 'login' | 'logout' | 'profile' | 'orders' | 'search';
    icon?: string;
    isButton?: boolean;
    external?: boolean;
  };
}

export interface WebpageContentResponse {
  code: number;
  message: string;
  toast: number;
  redirect_url: string;
  type: string;
  data: {
    head?: HeaderContent;
    home?: HomeContent;
    auth?: any;
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private contentCache = new BehaviorSubject<any>({});
  
  // Observable para que los componentes puedan suscribirse a cambios
  public content$ = this.contentCache.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService,
    private logger: LoggerService
  ) {
    this.logger.info('ContentService initialized', {}, 'CONTENT_SERVICE');
  }

  /**
   * Headers compatibles con CORS
   */
  private getCorsCompatibleHeaders() {
    return {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
  }

  /**
   * Configuración por defecto para elementos del header
   */
  private getHeaderNavigationConfig(): HeaderNavigationConfig {
    return {
      head1: { route: '/' },
      head2: { href: '/affiliate', external: true },
      head3: { href: '/support', external: true },
      head4: { route: '/subscription' },
      head5: { href: '/sell', external: true },
      head6: { action: 'search' },
      head7: { action: 'search' }, // Mensaje de búsqueda
      head8: { action: 'profile' },
      head9: { action: 'orders' },
      head10: { action: 'logout' }
    };
  }

  /**
   * Obtiene contenido del home desde el backend
   */
  getHomeContent(language: string = 'es'): Observable<HomeContent> {
    this.logger.debug('Getting home content', { language }, 'CONTENT_SERVICE');

    // Usar HttpClient directo temporalmente para evitar CORS
    return this.http.post<WebpageContentResponse>('http://localhost:3000/api/webpage/key', {
      key: ['home'],
      language: language
    }, this.getCorsCompatibleHeaders()).pipe(
      map(response => {
        if (response.code === 0 && response.data?.home) {
          const homeData = response.data.home as HomeContent;
          
          // Procesar parámetros dinámicos si existen
          if (homeData.params) {
            Object.keys(homeData).forEach(key => {
              if (key !== 'params' && typeof homeData[key] === 'string') {
                let text = homeData[key] as string;
                Object.entries(homeData.params!).forEach(([param, value]) => {
                  text = text.replace(new RegExp(param.replace(/[{}]/g, '\\$&'), 'g'), value);
                });
                (homeData as any)[key] = text;
              }
            });
          }
          
          // Actualizar cache
          const currentContent = this.contentCache.value;
          this.contentCache.next({
            ...currentContent,
            home: homeData
          });
          
          this.logger.debug('Home content loaded successfully', homeData, 'CONTENT_SERVICE');
          return homeData;
        }
        throw new Error(response.message || 'Error al obtener contenido del home');
      }),
      catchError(error => {
        this.logger.error('Error loading home content', error, 'CONTENT_SERVICE');
        // Fallback con contenido por defecto
        return of({
          home1: 'Proporcionando streaming asequible y de alta calidad durante 6 años',
          home2: 'Disfruta de tus servicios favoritos al mejor precio',
          home3: '250,000+',
          home4: '6',
          home5: '500,000+',
          home6: 'años de experiencia'
        });
      })
    );
  }
  processHeaderItems(headerContent: HeaderContent): HeaderItem[] {
    const config = this.getHeaderNavigationConfig();
    const items: HeaderItem[] = [];

    Object.keys(headerContent).forEach(key => {
      if (key.startsWith('head') && headerContent[key] && key !== 'params') {
        const order = parseInt(key.replace('head', '')) || 999;
        const text = headerContent[key] as string;
        const navConfig = config[key] || {};

        // Solo agregar si el texto no está vacío
        if (text && text.trim() !== '') {
          items.push({
            key,
            text: text.trim(),
            route: navConfig.route,
            href: navConfig.href,
            action: navConfig.action,
            isVisible: true,
            order
          });
        }
      }
    });

    // Ordenar por número de head (head1, head2, etc.)
    return items.sort((a, b) => a.order - b.order);
  }

  /**
   * Obtiene contenido del header desde el backend
   * @param language - Idioma del contenido (ej: 'es', 'en')
   * @param sections - Secciones a obtener (ej: ['head', 'home', 'auth'])
   */
  getHeaderContent(language: string = 'es', sections: string[] = ['head']): Observable<any> {
    this.logger.debug('Getting header content', { language, sections }, 'CONTENT_SERVICE');

    return this.http.post<WebpageContentResponse>('http://localhost:3000/api/webpage/key', {
      key: sections,
      language: language
    }, this.getCorsCompatibleHeaders()).pipe(
      map(response => {
        if (response.code === 0 && response.data?.head) {
          // Procesar parámetros dinámicos si existen
          const headerData = response.data.head as HeaderContent;
          
          // Solo procesar parámetros si hay contenido que reemplazar
          if (headerData.params) {
            Object.keys(headerData).forEach(key => {
              if (key !== 'params' && typeof headerData[key] === 'string') {
                let text = headerData[key] as string;
                Object.entries(headerData.params!).forEach(([param, value]) => {
                  text = text.replace(new RegExp(param.replace(/[{}]/g, '\\$&'), 'g'), value);
                });
                (headerData as any)[key] = text;
              }
            });
          }
          
          // Filtrar solo las claves que realmente existen en la respuesta
          const filteredHeaderData: HeaderContent = {};
          Object.keys(headerData).forEach(key => {
            if (headerData[key] !== undefined && headerData[key] !== null && headerData[key] !== '') {
              (filteredHeaderData as any)[key] = headerData[key];
            }
          });
          
          // Actualizar cache con todas las secciones
          const currentContent = this.contentCache.value;
          this.contentCache.next({
            ...currentContent,
            ...response.data // Incluir todas las secciones (head, home, auth, etc.)
          });
          
          this.logger.debug('Header content loaded successfully', filteredHeaderData, 'CONTENT_SERVICE');
          return filteredHeaderData;
        }
        throw new Error(response.message || 'Error al obtener contenido del header');
      }),
      catchError(error => {
        this.logger.error('Error loading header content', error, 'CONTENT_SERVICE');
        // Devolver contenido por defecto en caso de error
        return of({
          head1: 'PÁGINA DE INICIO',
          head2: 'AFILIATE', 
          head3: 'SOPORTE-POSTVENTA',
          head4: 'SUSCRIPCIÓN',
          head5: 'CONTACTO',
          head6: 'Buscar...',
          head7: 'MI CUENTA'
        });
      })
    );
  }

  /**
   * Obtiene contenido de secciones específicas
   * @param language - Idioma del contenido
   * @param sections - Secciones a obtener (ej: ['head', 'home', 'auth'])
   */
  getContent(language: string = 'es', sections: string[]): Observable<any> {
    this.logger.debug('Getting content', { language, sections }, 'CONTENT_SERVICE');

    return this.http.post<WebpageContentResponse>('http://localhost:3000/api/webpage/key', {
      key: sections,
      language: language
    }, this.getCorsCompatibleHeaders()).pipe(
      map(response => {
        if (response.code === 0) {
          // Actualizar cache con todas las secciones
          const currentContent = this.contentCache.value;
          this.contentCache.next({
            ...currentContent,
            ...response.data
          });

          this.logger.debug('Content loaded successfully', response.data, 'CONTENT_SERVICE');
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener contenido');
      }),
      catchError(error => {
        this.logger.error('Error getting content', error, 'CONTENT_SERVICE');
        return of({});
      })
    );
  }

  /**
   * Obtiene contenido específico de la sección auth
   * @param language - Idioma del contenido
   */
  getAuthContent(language: string = 'es'): Observable<any> {
    return this.getContent(language, ['auth']).pipe(
      map(data => data.auth || {})
    );
  }

  /**
   * Obtiene múltiples secciones de una vez
   * @param language - Idioma del contenido
   * @param sections - Array de secciones ['head', 'home', 'auth', etc.]
   */
  getMultipleSections(language: string = 'es', sections: string[] = ['head', 'home', 'auth']): Observable<any> {
    return this.getContent(language, sections);
  }

  /**
   * Obtiene todo el contenido de la página principal en una sola petición (head + home)
  /**
   * Obtiene contenido de la página principal (head + home)
   * @param language - Idioma del contenido
   */
  getMainPageContent(language: string = 'es'): Observable<{head: HeaderContent, home: HomeContent}> {
    this.logger.debug('Getting main page content', { language }, 'CONTENT_SERVICE');

    return this.http.post<WebpageContentResponse>('http://localhost:3000/api/webpage/key', {
      key: ['head', 'home'],
      language: language
    }, this.getCorsCompatibleHeaders()).pipe(
      map(response => {
        if (response.code === 0 && response.data) {
          // Procesar el contenido del header
          let headerData: HeaderContent = {};
          if (response.data.head) {
            headerData = response.data.head as HeaderContent;
            
            // Procesar parámetros dinámicos del header
            if (headerData.params) {
              Object.keys(headerData).forEach(key => {
                if (key !== 'params' && typeof headerData[key] === 'string') {
                  let text = headerData[key] as string;
                  Object.entries(headerData.params!).forEach(([param, value]) => {
                    text = text.replace(new RegExp(param.replace(/[{}]/g, '\\$&'), 'g'), value);
                  });
                  (headerData as any)[key] = text;
                }
              });
            }
          }

          // Procesar el contenido del home
          let homeData: HomeContent = {};
          if (response.data.home) {
            homeData = response.data.home as HomeContent;
            
            // Procesar parámetros dinámicos del home
            if (homeData.params) {
              Object.keys(homeData).forEach(key => {
                if (key !== 'params' && typeof homeData[key] === 'string') {
                  let text = homeData[key] as string;
                  Object.entries(homeData.params!).forEach(([param, value]) => {
                    text = text.replace(new RegExp(param.replace(/[{}]/g, '\\$&'), 'g'), value);
                  });
                  (homeData as any)[key] = text;
                }
              });
            }
          }
          
          // Actualizar cache con ambas secciones
          const currentContent = this.contentCache.value;
          this.contentCache.next({
            ...currentContent,
            head: headerData,
            home: homeData
          });
          
          this.logger.debug('Main page content loaded successfully', { head: headerData, home: homeData }, 'CONTENT_SERVICE');
          return { head: headerData, home: homeData };
        }
        throw new Error(response.message || 'Error al obtener contenido de la página principal');
      }),
      catchError(error => {
        this.logger.error('Error loading main page content', error, 'CONTENT_SERVICE');
        // Fallback con contenido por defecto
        const fallbackHeader: HeaderContent = {
          head1: 'PÁGINA DE INICIO',
          head2: 'AFILIATE', 
          head3: 'SOPORTE-POSTVENTA',
          head4: 'SUSCRIPCIÓN',
          head5: 'CONTACTO',
          head6: 'Buscar...',
          head7: 'MI CUENTA'
        };
        
        const fallbackHome: HomeContent = {
          home1: 'Proporcionando streaming asequible y de alta calidad durante 6 años',
          home2: 'Disfruta de tus servicios favoritos al mejor precio',
          home3: '250,000+',
          home4: '6',
          home5: '500,000+',
          home6: 'años de experiencia'
        };
        
        return of({ head: fallbackHeader, home: fallbackHome });
      })
    );
  }

  /**
   * Cambia el idioma y actualiza todo el contenido
   * @param language - Nuevo idioma
   * @param sections - Secciones a actualizar (por defecto: head, home, auth)
   */
  changeLanguage(language: string, sections: string[] = ['head', 'home', 'auth']): Observable<any> {
    return this.getMultipleSections(language, sections).pipe(
      map(data => {
        console.log('Contenido actualizado para idioma:', language, data);
        return data;
      }),
      catchError(error => {
        console.error('Error al cambiar idioma:', error);
        return of({});
      })
    );
  }

  /**
   * Obtiene el contenido actual del cache
   */
  getCurrentContent(): any {
    return this.contentCache.value;
  }

  /**
   * Obtiene la lista de productos/servicios de streaming
   * @param language - Idioma para el contenido
   * @param promote - Promoción específica (null por defecto)
   */
  getStreamingProducts(language: string = 'es', promote: any = null): Observable<ProductsResponse> {
    this.logger.debug('Getting streaming products', { language, promote }, 'CONTENT_SERVICE');

    return this.http.post<ProductsResponse>('http://localhost:3000/index/getTypeClassifyList', {
      language: language,
      promote: promote
    }, this.getCorsCompatibleHeaders()).pipe(
      map(response => {
        if (response.code === 0 && response.data) {
          this.logger.debug('Streaming products loaded successfully', response.data, 'CONTENT_SERVICE');
          return response;
        }
        throw new Error(response.message || 'Error al obtener productos de streaming');
      }),
      catchError(error => {
        this.logger.error('Error loading streaming products', error, 'CONTENT_SERVICE');
        // Fallback con datos de ejemplo
        const fallbackData: ProductsResponse = {
          code: 0,
          message: 'Datos de ejemplo',
          toast: 0,
          data: {
            classify_tab: [
              { id: 1, name: 'Todos' }
            ],
            list: [
              {
                id: 1,
                spuList: [
                  {
                    id: 1,
                    type_name: 'Netflix',
                    detail_route: 'netflix',
                    is_netflix: true,
                    image: 'assets/img/services/netflix.webp',
                    image_type: 1,
                    thumb_img: 'assets/img/services/netflix.webp',
                    min_price: '14.87',
                    currency_icon1: 'S/.',
                    currency_icon2: 'PEN(S/.)',
                    currency_show_type: 1,
                    vip_status: 0,
                    lock_status: 0,
                    rank: 99,
                    recent_order: [],
                    description: [
                      'Renovar la misma cuenta de por vida',
                      'Mantenga todos sus favoritos y listas',
                      'Entrega en tiempo real',
                      'Compatible con dispositivos móviles, PC y TV',
                      'Garantía, garantía de reembolso.'
                    ],
                    prompt: []
                  },
                  {
                    id: 2,
                    type_name: 'YouTube Premium',
                    detail_route: 'youtube',
                    is_netflix: false,
                    image: 'assets/img/services/youtube.webp',
                    image_type: 0,
                    thumb_img: 'assets/img/services/youtube.webp',
                    min_price: '13.87',
                    currency_icon1: 'S/.',
                    currency_icon2: 'PEN(S/.)',
                    currency_show_type: 1,
                    vip_status: 0,
                    lock_status: 0,
                    rank: 73,
                    recent_order: [],
                    description: [
                      'YouTube Premium sin anuncios',
                      'Acceso a YouTube Music incluido',
                      'Descargas para ver sin conexión',
                      'Reproducción en segundo plano'
                    ],
                    prompt: []
                  }
                ]
              }
            ]
          }
        };
        return of(fallbackData);
      })
    );
  }
}
