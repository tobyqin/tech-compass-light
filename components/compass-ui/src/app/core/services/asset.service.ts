import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Asset {
  _id?: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private apiUrl = `${environment.apiUrl}/assets`;

  constructor(private http: HttpClient) {}

  // Upload single image
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  // Upload multiple images
  uploadMultipleImages(files: File[]): Observable<any> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http.post<any>(`${this.apiUrl}/upload-multiple`, formData);
  }

  // Get all assets
  getAllAssets(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  // Get single asset by id
  getAssetById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Delete single asset
  deleteAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Delete multiple assets
  deleteMultipleAssets(ids: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-multiple`, { asset_ids: ids });
  }
} 