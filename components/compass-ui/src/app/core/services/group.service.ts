import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Group {
  _id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  usage_count: number;
}

export interface GroupResponse {
  success: boolean;
  data: Group[];
  detail: string | null;
  total: number;
  skip: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getGroups(): Observable<GroupResponse> {
    return this.http.get<GroupResponse>(`${this.apiUrl}/groups/`);
  }

  getAllGroups(
    skip: number = 0, 
    limit: number = 100
  ): Observable<GroupResponse> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<GroupResponse>(`${this.apiUrl}/groups/`, { params });
  }
}
