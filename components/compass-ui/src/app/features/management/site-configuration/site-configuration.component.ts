import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { MessageService } from "primeng/api";
import {
  SiteConfigService,
  SiteConfig,
  SiteConfigCreate,
  SiteConfigUpdate
} from "../../../core/services/site-config.service";
import { Subject, finalize } from "rxjs";

// PrimeNG Components
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { ToastModule } from "primeng/toast";
import { DialogModule } from "primeng/dialog";
import { InputTextareaModule } from "primeng/inputtextarea";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { TagModule } from "primeng/tag";
import { RadioButtonModule } from "primeng/radiobutton";
import { InputTextModule } from "primeng/inputtext";
import { DropdownModule } from "primeng/dropdown";
import { CheckboxModule } from "primeng/checkbox";

@Component({
  selector: "app-site-configuration",
  templateUrl: "./site-configuration.component.html",
  styleUrls: ["./site-configuration.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    TableModule,
    ToastModule,
    DialogModule,
    InputTextareaModule,
    ConfirmDialogModule,
    TagModule,
    RadioButtonModule,
    InputTextModule,
    DropdownModule,
    CheckboxModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class SiteConfigurationComponent implements OnInit, OnDestroy {
  configs: SiteConfig[] = [];
  loading = false;
  totalRecords = 0;
  pageSize = 10;
  currentPage = 0;
  rowsPerPageOptions: number[] = [5, 10, 20, 50];

  editDialogVisible = false;
  editingConfig: Partial<SiteConfig> = {};
  valueJsonError: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private siteConfigService: SiteConfigService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadConfigs();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConfigs() {
    this.loading = true;
    const skip = this.currentPage * this.pageSize;

    this.siteConfigService
      .getAllSiteConfigs(skip, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.configs = response.data;
            this.totalRecords = response.total || 0;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load configurations",
          });
        },
      });
  }

  onPageChange(event: any) {
    this.pageSize = event.rows;
    this.currentPage = Math.floor(event.first / event.rows);
    this.loadConfigs();
  }

  editConfig(config: SiteConfig) {
    this.editingConfig = { ...config };
    if (typeof this.editingConfig.value === 'object') {
      this.editingConfig.value = JSON.stringify(this.editingConfig.value, null, 2);
    }
    this.valueJsonError = null;
    this.editDialogVisible = true;
  }

  validateJson(): boolean {
    if (!this.editingConfig.value) {
      this.valueJsonError = "Value is required";
      return false;
    }

    try {
      const valueStr = this.editingConfig.value as string;
      JSON.parse(valueStr);
      this.valueJsonError = null;
      return true;
    } catch (e: any) {
      this.valueJsonError = `Invalid JSON format: ${e.message}`;
      return false;
    }
  }

  saveConfig() {
    if (!this.editingConfig.key?.trim()) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Key is required",
      });
      return;
    }

    if (!this.validateJson()) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: this.valueJsonError || "Invalid JSON format",
      });
      return;
    }

    this.loading = true;
    
    // Parse the JSON string to object
    const valueObj = JSON.parse(this.editingConfig.value as string);
    
    if (this.editingConfig._id || this.editingConfig.id) {
      // Update existing config
      const configId = this.editingConfig._id || this.editingConfig.id || '';
      const updateData: SiteConfigUpdate = {
        value: valueObj,
        active: this.editingConfig.active,
        description: this.editingConfig.description || ""
      };

      this.siteConfigService
        .updateSiteConfig(configId, updateData)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: "success",
                summary: "Success",
                detail: "Configuration updated successfully",
              });
              this.editDialogVisible = false;
              this.loadConfigs();
            }
            this.loading = false;
          },
          error: (error) => {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: error.error?.detail || "Failed to update configuration",
            });
            this.loading = false;
          },
        });
    } else {
      // Create new config
      const createData: SiteConfigCreate = {
        key: this.editingConfig.key,
        value: valueObj,
        active: this.editingConfig.active === undefined ? true : this.editingConfig.active,
        description: this.editingConfig.description || ""
      };

      this.siteConfigService
        .createSiteConfig(createData)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: "success",
                summary: "Success",
                detail: "Configuration created successfully",
              });
              this.editDialogVisible = false;
              this.loadConfigs();
            }
            this.loading = false;
          },
          error: (error) => {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: error.error?.detail || "Failed to create configuration",
            });
            this.loading = false;
          },
        });
    }
  }

  createNewConfig() {
    this.editingConfig = { 
      key: '',
      value: '{}',
      active: true,
      description: ''
    };
    this.valueJsonError = null;
    this.editDialogVisible = true;
  }

  confirmDelete(config: SiteConfig) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the configuration "${config.key}"?`,
      accept: () => {
        this.deleteConfig(config);
      },
    });
  }

  private deleteConfig(config: SiteConfig) {
    this.loading = true;
    const configId = config._id || config.id || '';

    this.siteConfigService.deleteSiteConfig(configId).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "Configuration deleted successfully",
        });
        this.loadConfigs();
      },
      error: (error) => {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: error.error?.detail || "Failed to delete configuration",
        });
        this.loading = false;
      },
    });
  }

  formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
