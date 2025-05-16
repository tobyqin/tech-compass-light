import { CommonModule } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { MessageService } from "primeng/api";
import { take } from "rxjs/operators";
import { AuthService } from "../../../core/services/auth.service";
import { StatusChangeDialogComponent } from './status-change-dialog.component';

import { ButtonModule } from "primeng/button";
import { ChipsModule } from "primeng/chips";
import { DropdownModule } from "primeng/dropdown";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { MessagesModule } from "primeng/messages";

import { StandardResponse } from "../../../core/interfaces/standard-response.interface";
import { CategoryService } from "../../../core/services/category.service";
import { DepartmentService } from "../../../core/services/department.service";
import { Group, GroupService } from "../../../core/services/group.service";
import { SolutionService } from "../../../core/services/solution.service";
import { Solution } from "../../../shared/interfaces/solution.interface";

@Component({
  selector: "tc-edit-solution",
  templateUrl: "./edit-solution.component.html",
  styleUrls: ["./edit-solution.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ButtonModule,
    ChipsModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    MessagesModule,
    StatusChangeDialogComponent
  ],
  providers: [MessageService]
})
export class EditSolutionComponent implements OnInit {
  @ViewChild('statusChangeDialog') statusChangeDialog!: StatusChangeDialogComponent;

  categories: { name: string }[] = [];
  departments: string[] = [];
  groups: Group[] = [];
  loading = false;
  slug!: string;
  isAdmin = false;

  stageOptions = [
    { label: "DEVELOPING", value: "DEVELOPING" },
    { label: "UAT", value: "UAT" },
    { label: "PRODUCTION", value: "PRODUCTION" },
    { label: "DEPRECATED", value: "DEPRECATED" },
    { label: "RETIRED", value: "RETIRED" },
  ];

  recommendStatusOptions = [
    { label: "ADOPT", value: "ADOPT" },
    { label: "TRIAL", value: "TRIAL" },
    { label: "ASSESS", value: "ASSESS" },
    { label: "HOLD", value: "HOLD" },
    { label: "EXIT", value: "EXIT" }
  ];

  reviewStatusOptions = [
    { label: "PENDING", value: "PENDING" },
    { label: "APPROVED", value: "APPROVED" },
    { label: "REJECTED", value: "REJECTED" },
  ];

  adoptionLevelOptions = [
    { label: "PILOT", value: "PILOT" },
    { label: "TEAM", value: "TEAM" },
    { label: "DEPARTMENT", value: "DEPARTMENT" },
    { label: "ENTERPRISE", value: "ENTERPRISE" },
    { label: "INDUSTRY", value: "INDUSTRY" },
  ];

  adoptionComplexityOptions = [
    { label: "AUTOMATED", value: "AUTOMATED" },
    { label: "EASY", value: "EASY" },
    { label: "SUPPORT_REQUIRED", value: "SUPPORT_REQUIRED" },
  ];

  providerTypeOptions = [
    { label: "VENDOR", value: "VENDOR" },
    { label: "INTERNAL", value: "INTERNAL" },
  ];

  solutionForm: FormGroup;

  private pendingStatusChange: {
    field: string;
    oldValue: string;
    newValue: string;
    justification: string;
  } | null = null;

  private initStatusChangeTracking() {
    const recommendStatusControl = this.solutionForm.get('recommend_status');
    const reviewStatusControl = this.solutionForm.get('review_status');

    // Store original values
    let originalRecommendStatus = recommendStatusControl?.value;
    let originalReviewStatus = reviewStatusControl?.value;

    recommendStatusControl?.valueChanges.subscribe(async (newValue) => {
      if (newValue !== originalRecommendStatus) {
        try {
          const justification = await this.statusChangeDialog.show('Recommend Status', originalRecommendStatus, newValue);
          this.pendingStatusChange = {
            field: 'recommend_status',
            oldValue: originalRecommendStatus,
            newValue,
            justification
          };
          originalRecommendStatus = newValue;
        } catch {
          // If dialog is cancelled, revert the value
          recommendStatusControl?.setValue(originalRecommendStatus, { emitEvent: false });
        }
      }
    });

    reviewStatusControl?.valueChanges.subscribe(async (newValue) => {
      if (newValue !== originalReviewStatus) {
        try {
          const justification = await this.statusChangeDialog.show('Review Status', originalReviewStatus, newValue);
          this.pendingStatusChange = {
            field: 'review_status',
            oldValue: originalReviewStatus,
            newValue,
            justification
          };
          originalReviewStatus = newValue;
        } catch {
          // If dialog is cancelled, revert the value
          reviewStatusControl?.setValue(originalReviewStatus, { emitEvent: false });
        }
      }
    });
  }

  private initialFormValues: {
    recommend_status: string | null;
    review_status: string | null;
  } | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private departmentService: DepartmentService,
    private solutionService: SolutionService,
    private messageService: MessageService,
    private authService: AuthService,
    private groupService: GroupService
  ) {
    this.solutionForm = this.fb.group({
      name: ["", Validators.required],
      brief: ["", [Validators.required, Validators.maxLength(200)]],
      description: ["", Validators.required],
      how_to_use: [""],
      how_to_use_url: [""],
      faq: [""],
      about: [""],
      upskilling: [""],
      category: ["", Validators.required],
      group: ["Default"],
      logo: [""],
      department: ["", Validators.required],
      team: ["", Validators.required],
      team_email: [""],
      service_now_group: [""],
      maintainer_id: ["", Validators.required],
      maintainer_name: ["", Validators.required],
      maintainer_email: ["", [Validators.required, Validators.email]],
      official_website: [""],
      documentation_url: [""],
      demo_url: [""],
      support_url: [""],
      vendor_product_url: [""],
      provider_type: ["INTERNAL"],
      version: ["", Validators.required],
      tags: [[]],
      pros: ["", Validators.required],
      cons: ["", Validators.required],
      stage: ["", Validators.required],
      recommend_status: [{ value: "", disabled: true }],
      review_status: [{ value: "", disabled: true }],
      replaced_by: ["default solution"],
      adoption_level: ["", Validators.required],
      adoption_complexity: ["", Validators.required],
      adoption_user_count: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit() {
    this.loadCategories();
    this.loadDepartments();
    this.loadGroups();
    this.checkAdminStatus();
    this.loadSolution();
  }

  private checkAdminStatus() {
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.isAdmin = user?.is_superuser || false;
      if (this.isAdmin) {
        this.solutionForm.get("recommend_status")?.enable();
        this.solutionForm.get("review_status")?.enable();
      }
    });
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe((response) => {
      if (response.success) {
        this.categories = response.data;
      }
    });
  }

  private loadDepartments() {
    this.departmentService.getDepartments().subscribe((response) => {
      if (response.success) {
        this.departments = response.data;
      }
    });
  }

  private loadGroups() {
    this.groupService.getAllGroups().subscribe((response) => {
      if (response.success) {
        this.groups = response.data;
      }
    });
  }

  private loadSolution() {
    this.slug = this.route.snapshot.params["slug"];
    if (!this.slug) {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "No slug provided",
      });
      this.router.navigate(["/manage/my-items"]);
      return;
    }

    this.loading = true;
    this.solutionService.getSolution(this.slug).subscribe({
      next: (response: StandardResponse<Solution>) => {
        if (response.success && response.data) {
          // Convert arrays back to newline-separated strings for pros and cons
          const formValue = {
            ...response.data,
            pros: response.data.pros?.join("\n") || "",
            cons: response.data.cons?.join("\n") || "",
          };
          this.solutionForm.patchValue(formValue);
          
          // Store initial values after form is populated
          this.initialFormValues = {
            recommend_status: formValue.recommend_status || null,
            review_status: formValue.review_status || null
          };
          
          // Initialize status change tracking after form is populated
          setTimeout(() => {
            this.initStatusChangeTracking();
          });
          
          this.loading = false;
        } else {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load solution",
          });
          this.router.navigate(["/manage/my-items"]);
        }
      },
      error: (error: { error?: { detail: string } }) => {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: error.error?.detail || "Failed to load solution",
        });
        this.router.navigate(["/manage/my-items"]);
        this.loading = false;
      },
    });
  }

  private hasStatusChanged(): boolean {
    if (!this.initialFormValues) return false;
    const currentRecommendStatus = this.solutionForm.get('recommend_status')?.value;
    const currentReviewStatus = this.solutionForm.get('review_status')?.value;
    return currentRecommendStatus !== this.initialFormValues.recommend_status || 
           currentReviewStatus !== this.initialFormValues.review_status;
  }

  onSubmit() {
    if (this.solutionForm.valid) {
      this.loading = true;

      // Convert multiline text to arrays for pros and cons
      const formValue = this.solutionForm.getRawValue();
      const pros =
        formValue.pros?.split("\n").filter((line: string) => line.trim()) || [];
      const cons =
        formValue.cons?.split("\n").filter((line: string) => line.trim()) || [];

      // Create solution object, excluding admin-only fields for non-admins
      const { recommend_status, review_status, ...baseData } = formValue;
      let solutionData = {
        ...baseData,
        pros,
        cons,
      };

      // Only include admin fields if user is admin
      if (this.isAdmin) {
        solutionData = {
          ...solutionData,
          recommend_status,
          review_status,
        };
      }

      // Add status_change_justification if there's a pending status change
      if (this.pendingStatusChange) {
        solutionData.status_change_justification = this.pendingStatusChange.justification;
      }

      // Create headers object for status change justification
      const headers: { [key: string]: string } = {};
      if (this.pendingStatusChange) {
        headers['X-Status-Change-Justification'] = this.pendingStatusChange.justification;
      }

      this.solutionService.updateSolution(this.slug, solutionData, headers).subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Solution updated successfully",
              life: 3000,
            });
            // Reset pending status change after successful update
            this.pendingStatusChange = null;
          } else {
            this.messageService.add({
              severity: "error",
              summary: "Error",
              detail: response.detail || "Failed to update solution",
            });
          }
          this.loading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: error.error?.detail || "Failed to update solution",
          });
          this.loading = false;
        },
      });
    }
  }
}
