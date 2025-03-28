import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StandardResponse } from '../interfaces/standard-response.interface';

export interface Group {
  _id: string;
  name: string;
  description: string;
  order: number;
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

export interface GroupCreate {
  name: string;
  description: string;
  order: number;
}

export interface GroupUpdate {
  name?: string;
  description?: string;
  order?: number;
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
    limit: number = 100,
    sort: string = 'order'
  ): Observable<GroupResponse> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString())
      .set('sort', sort);

    return this.http.get<GroupResponse>(`${this.apiUrl}/groups/`, { params });
  }
  
  getGroup(id: string): Observable<StandardResponse<Group>> {
    return this.http.get<StandardResponse<Group>>(`${this.apiUrl}/groups/${id}`);
  }
  
  createGroup(group: GroupCreate): Observable<StandardResponse<Group>> {
    return this.http.post<StandardResponse<Group>>(`${this.apiUrl}/groups/`, group);
  }
  
  updateGroup(id: string, group: GroupUpdate): Observable<StandardResponse<Group>> {
    return this.http.put<StandardResponse<Group>>(`${this.apiUrl}/groups/${id}`, group);
  }
  
  deleteGroup(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/groups/${id}`);
  }
}
