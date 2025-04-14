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
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Upload single image
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/assets/upload`, formData);
  }

  // Upload multiple images
  uploadMultipleImages(files: File[]): Observable<any> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return this.http.post<any>(`${this.apiUrl}/assets/upload-multiple`, formData);
  }

  // Get all assets
  getAllAssets(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/assets/`);
  }

  // Get single asset by id
  getAssetById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/assets/${id}`);
  }

  // Get asset image url
  getAssetImageUrl(id: string): string {
    return `${this.apiUrl}/assets/${id}`;
  }

  // Delete single asset
  deleteAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/assets/${id}`);
  }

  // Delete multiple assets
  deleteMultipleAssets(ids: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/assets/delete-multiple`, { asset_ids: ids });
  }
} 