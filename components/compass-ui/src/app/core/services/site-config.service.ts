import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../../environments/environment";

/**
 * Standard API response interface
 */
export interface StandardResponse<T> {
  success: boolean;
  data: T;
  detail: string | null;
  total?: number;
  skip?: number;
  limit?: number;
}

/**
 * Site configuration interface
 */
export interface SiteConfig {
  _id?: string;
  id?: string;
  key: string;
  value: any;
  active: boolean;
  description?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

/**
 * Site configuration create interface
 */
export interface SiteConfigCreate {
  key: string;
  value: any;
  active: boolean;
  description?: string;
}

/**
 * Site configuration update interface
 */
export interface SiteConfigUpdate {
  value?: any;
  active?: boolean;
  description?: string;
}

@Injectable({
  providedIn: "root",
})
export class SiteConfigService {
  private apiUrl = `${environment.apiUrl}/site-config`;

  constructor(private http: HttpClient) {}

  /**
   * Get site configuration by key
   * @param key Configuration key (e.g., 'radar', 'home', 'about', 'footer')
   * @param active Return only active configurations
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @returns Observable with configuration data
   */
  getConfig<T>(
    key: string,
    active: boolean = true,
    skip: number = 0,
    limit: number = 1
  ): Observable<T> {
    const url = `${this.apiUrl}/${key}`;
    const params = {
      active: active.toString(),
      skip: skip.toString(),
      limit: limit.toString(),
    };

    return this.http.get<StandardResponse<SiteConfig[]>>(url, { params }).pipe(
      map((response) => {
        if (!response.success || !response.data || response.data.length === 0) {
          throw new Error(`Failed to load site configuration for: ${key}`);
        }
        return response.data[0].value as T;
      })
    );
  }

  /**
   * Get all site configurations
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @returns Observable with all site configurations
   */
  getAllSiteConfigs(skip: number = 0, limit: number = 100): Observable<StandardResponse<SiteConfig[]>> {
    const params = {
      skip: skip.toString(),
      limit: limit.toString(),
    };
    return this.http.get<StandardResponse<SiteConfig[]>>(this.apiUrl, { params });
  }

  /**
   * Get site configurations by key
   * @param key Configuration key
   * @param active Return only active configurations
   * @param skip Number of items to skip
   * @param limit Maximum number of items to return
   * @returns Observable with site configurations
   */
  getSiteConfigsByKey(
    key: string,
    active?: boolean,
    skip: number = 0,
    limit: number = 100
  ): Observable<StandardResponse<SiteConfig[]>> {
    const url = `${this.apiUrl}/${key}`;
    const params: any = {
      skip: skip.toString(),
      limit: limit.toString(),
    };
    
    if (active !== undefined) {
      params.active = active.toString();
    }
    
    return this.http.get<StandardResponse<SiteConfig[]>>(url, { params });
  }

  /**
   * Create a new site configuration
   * @param config Site configuration to create
   * @returns Observable with created site configuration
   */
  createSiteConfig(config: SiteConfigCreate): Observable<StandardResponse<SiteConfig>> {
    return this.http.post<StandardResponse<SiteConfig>>(this.apiUrl, config);
  }

  /**
   * Update a site configuration
   * @param id Site configuration ID
   * @param config Site configuration update data
   * @returns Observable with updated site configuration
   */
  updateSiteConfig(id: string, config: SiteConfigUpdate): Observable<StandardResponse<SiteConfig>> {
    return this.http.put<StandardResponse<SiteConfig>>(`${this.apiUrl}/${id}`, config);
  }

  /**
   * Delete a site configuration
   * @param id Site configuration ID
   * @returns Observable with deletion result
   */
  deleteSiteConfig(id: string): Observable<StandardResponse<boolean>> {
    return this.http.delete<StandardResponse<boolean>>(`${this.apiUrl}/${id}`);
  }
}
