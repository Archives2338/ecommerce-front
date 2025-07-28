import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SkuResponse } from '../interfaces/sku-response.interface';

export interface SkuRequestParams {
  language?: string;
  typeId: number;
  source?: number;
  type?: number;
  monthId?: number;
  screenId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SkuService {
  
  constructor(
    private apiService: ApiService,
    private http: HttpClient
  ) {}

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
   * Obtiene la lista de SKUs para un producto específico
   */
  getSkuList(params: SkuRequestParams): Observable<SkuResponse> {
    console.log('Obteniendo SKU List', params);
    
    const requestBody = {
      language: params.language || 'es',
      type_id: params.typeId,
      source: params.source || 1
      // Remover campos que causan error de validación
    };

    return this.http.post<SkuResponse>('http://localhost:3000/api/index/getSkuList', requestBody, this.getCorsCompatibleHeaders());
  }

  /**
   * Obtiene SKU con parámetros específicos (para cambios de selección)
   */
  getSkuWithSelection(typeId: number, monthId: number, screenId: number): Observable<SkuResponse> {
    return this.getSkuList({
      typeId,
      monthId,
      screenId
    });
  }

  /**
   * Obtiene SKU inicial (sin selecciones específicas)
   */
  getInitialSku(typeId: number): Observable<SkuResponse> {
    return this.getSkuList({
      typeId
    });
  }
}
