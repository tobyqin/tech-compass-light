import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { StandardResponse } from "../interfaces/standard-response.interface";

export interface ChangeField {
  field_name: string;
  old_value: any;
  new_value: any;
}

export interface HistoryRecord {
  id: string;
  object_type: string;
  object_id: string;
  object_name: string;
  change_type: "create" | "update" | "delete";
  changed_fields: ChangeField[];
  change_summary: string;
  status_change_justification: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

@Injectable({
  providedIn: "root",
})
export class HistoryService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Get history records for a solution with field filtering
   *
   * @param slug The solution slug
   * @param params Optional query parameters
   * @returns Observable of history records
   */
  getSolutionHistory(
    slug: string,
    params: {
      skip?: number;
      limit?: number;
      fields?: string[];
    } = {}
  ): Observable<StandardResponse<HistoryRecord[]>> {
    let httpParams = new HttpParams()
      .set("skip", params.skip?.toString() || "0")
      .set("limit", params.limit?.toString() || "20");

    // Add fields filter if provided
    if (params.fields && params.fields.length > 0) {
      httpParams = httpParams.set("fields", params.fields.join(","));
    }

    return this.http.get<StandardResponse<HistoryRecord[]>>(
      `${this.apiUrl}/solutions/${slug}/history`,
      { params: httpParams }
    );
  }
}
