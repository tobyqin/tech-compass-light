import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../../environments/environment";

/**
 * Response interface for site configuration API
 */
export interface SiteConfigResponse<T> {
  success: boolean;
  data: Array<{
    _id: string;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string;
    key: string;
    value: T;
    active: boolean;
    description: string;
  }>;
  detail: string | null;
  total: number;
  skip: number;
  limit: number;
}

@Injectable({
  providedIn: "root",
})
export class SiteConfigService {
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
    const url = `${environment.apiUrl}/site-config/${key}`;
    const params = {
      active: active.toString(),
      skip: skip.toString(),
      limit: limit.toString(),
    };

    return this.http.get<SiteConfigResponse<T>>(url, { params }).pipe(
      map((response) => {
        if (!response.success || !response.data || response.data.length === 0) {
          throw new Error(`Failed to load site configuration for: ${key}`);
        }
        return response.data[0].value;
      })
    );
  }
}
