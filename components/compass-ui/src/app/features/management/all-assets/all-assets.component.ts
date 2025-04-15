import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Asset, AssetService } from '../../../core/services/asset.service';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-all-assets',
  templateUrl: './all-assets.component.html',
  styleUrls: ['./all-assets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    FileUploadModule,
    InputTextModule,
    ToastModule,
    TooltipModule,
  ],
  providers: [MessageService]
})
export class AllAssetsComponent implements OnInit {
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  
  assets: Asset[] = [];
  selectedAssets: Asset[] = [];
  loading = false;
  uploadDialog = false;
  uploadedFiles: File[] = [];
  uploadUrl = `${environment.apiUrl}/assets/upload`;
  maxFileSize = 15 * 1024 * 1024; // 15MB in bytes

  // File exists dialog state
  duplicateDialog = {
    visible: false,
    message: '',
    existingFile: null as Asset | null
  };

  constructor(
    public assetService: AssetService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  // Check if file name already exists
  checkDuplicateFileName(fileName: string): Asset | null {
    return this.assets.find(asset => asset.name.toLowerCase() === fileName.toLowerCase()) || null;
  }

  // Check for duplicate files in a batch
  checkDuplicateFiles(files: File[]): { duplicates: { file: File, existing: Asset }[], valid: File[] } {
    const duplicates: { file: File, existing: Asset }[] = [];
    const valid: File[] = [];

    for (const file of files) {
      const existingAsset = this.checkDuplicateFileName(file.name);
      if (existingAsset) {
        duplicates.push({ file, existing: existingAsset });
      } else {
        valid.push(file);
      }
    }

    return { duplicates, valid };
  }

  loadAssets(): void {
    this.loading = true;
    this.assetService.getAllAssets()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.assets = response.data;
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load assets'
          });
        }
      });
  }

  onUpload(event: any): void {
    const files = event.files;
    
    if (files.length === 1) {
      // Single file upload
      const existingAsset = this.checkDuplicateFileName(files[0].name);
      if (existingAsset) {
        this.duplicateDialog = {
          visible: true,
          message: `File "${files[0].name}" already exists`,
          existingFile: existingAsset
        };
        this.fileUpload.clear();
        return;
      }

      this.assetService.uploadImage(files[0])
        .subscribe({
          next: (response) => {
            this.assets = [...this.assets, response.data];
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'File uploaded successfully'
            });
            this.uploadDialog = false;
            this.fileUpload.clear();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.detail || 'Failed to upload file'
            });
          }
        });
    } else if (files.length > 1) {
      // Multiple files upload
      const { duplicates, valid } = this.checkDuplicateFiles(files);
      
      if (duplicates.length > 0) {
        const duplicateNames = duplicates.map(d => d.file.name).join('\n');
        this.duplicateDialog = {
          visible: true,
          message: `The following files already exist:\n${duplicateNames}`,
          existingFile: null
        };
        this.fileUpload.clear();
        return;
      }

      this.assetService.uploadMultipleImages(valid)
        .subscribe({
          next: (response) => {
            this.assets = [...this.assets, ...response.data];
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Files uploaded successfully'
            });
            this.uploadDialog = false;
            this.fileUpload.clear();
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.detail || 'Failed to upload files'
            });
          }
        });
    }
  }

  onUploadComplete(event: any): void {
    // This is called after the upload is complete
    this.loadAssets();
  }

  deleteAsset(asset: Asset): void {
    if (!asset._id) return;
    
    this.assetService.deleteAsset(asset._id)
      .subscribe({
        next: () => {
          this.assets = this.assets.filter(a => a._id !== asset._id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Asset deleted successfully'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.detail || 'Failed to delete asset'
          });
        }
      });
  }

  deleteSelectedAssets(): void {
    const ids = this.selectedAssets.map(asset => asset._id).filter(id => id) as string[];
    if (ids.length === 0) return;

    this.assetService.deleteMultipleAssets(ids)
      .subscribe({
        next: (response) => {
          this.assets = this.assets.filter(asset => !ids.includes(asset._id!));
          this.selectedAssets = [];
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message || 'Selected assets deleted successfully'
          });
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.detail || 'Failed to delete selected assets'
          });
        }
      });
  }

  showUploadDialog(): void {
    this.uploadDialog = true;
  }

  cancelUpload(): void {
    this.fileUpload.clear();
    this.uploadDialog = false;
  }

  onError(event: any): void {
    if (event.files) {
      const oversizedFiles = event.files.filter((file: File) => file.size > this.maxFileSize);
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map((file: File) => file.name).join(', ');
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `File(s) too large: ${fileNames}. Maximum file size is ${this.formatFileSize(this.maxFileSize)}`
        });
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  copyAssetName(name: string): void {
    navigator.clipboard.writeText(name).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Asset name copied to clipboard'
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy asset name'
      });
    });
  }
} 