import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { MessageService } from "primeng/api";
import {
  GroupService,
  Group,
} from "../../../core/services/group.service";
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
import { InputNumberModule } from "primeng/inputnumber";

@Component({
  selector: "app-all-groups",
  templateUrl: "./all-groups.component.html",
  styleUrls: ["./all-groups.component.scss"],
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
    InputNumberModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class AllGroupsComponent implements OnInit, OnDestroy {
  groups: Group[] = [];
  loading = false;
  totalRecords = 0;
  pageSize = 10;
  currentPage = 0;
  rowsPerPageOptions: number[] = [5, 10, 20, 50];

  editDialogVisible = false;
  editingGroup: Partial<Group> = {};

  private destroy$ = new Subject<void>();

  constructor(
    private groupService: GroupService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadGroups();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGroups() {
    this.loading = true;
    const skip = this.currentPage * this.pageSize;

    this.groupService
      .getAllGroups(skip, this.pageSize)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.groups = response.data;
            this.totalRecords = response.total;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load groups",
          });
        },
      });
  }

  onPageChange(event: any) {
    this.pageSize = event.rows;
    this.currentPage = Math.floor(event.first / event.rows);
    this.loadGroups();
  }

  editGroup(group: Group) {
    this.editingGroup = { ...group };
    this.editDialogVisible = true;
  }

  saveGroup() {
    if (!this.editingGroup.name?.trim()) {
      return;
    }

    this.loading = true;
    
    if (this.editingGroup._id) {
      // Update existing group
      this.groupService
        .updateGroup(this.editingGroup._id, {
          name: this.editingGroup.name,
          description: this.editingGroup.description || "",
          order: this.editingGroup.order || 0
        })
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: "success",
                summary: "Success",
                detail: "Group updated successfully",
              });
              this.editDialogVisible = false;
              this.loadGroups();
            }
            this.loading = false;
          },
          error: (error) => {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: error.error?.detail || "Failed to update group",
            });
            this.loading = false;
          },
        });
    } else {
      // Create new group
      this.groupService
        .createGroup({
          name: this.editingGroup.name,
          description: this.editingGroup.description || "",
          order: this.editingGroup.order || 0
        })
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.messageService.add({
                severity: "success",
                summary: "Success",
                detail: "Group created successfully",
              });
              this.editDialogVisible = false;
              this.loadGroups();
            }
            this.loading = false;
          },
          error: (error) => {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: error.error?.detail || "Failed to create group",
            });
            this.loading = false;
          },
        });
    }
  }

  createNewGroup() {
    this.editingGroup = { 
      name: '',
      description: '',
      order: 0
    };
    this.editDialogVisible = true;
  }

  confirmDelete(group: Group) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the group "${group.name}"?`,
      accept: () => {
        this.deleteGroup(group);
      },
    });
  }

  private deleteGroup(group: Group) {
    this.loading = true;

    this.groupService.deleteGroup(group._id).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "Group deleted successfully",
        });
        this.loadGroups();
      },
      error: (error) => {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: error.error?.detail || "Failed to delete group",
        });
        this.loading = false;
      },
    });
  }
}
