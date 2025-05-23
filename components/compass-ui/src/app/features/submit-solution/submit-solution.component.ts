import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { MessageService } from "primeng/api";
import { DialogService } from "primeng/dynamicdialog";

import { BreadcrumbModule } from "primeng/breadcrumb";
import { ButtonModule } from "primeng/button";
import { ChipsModule } from "primeng/chips";
import { DropdownModule } from "primeng/dropdown";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { MessagesModule } from "primeng/messages";

import { LoginDialogComponent } from "../../core/components/login-dialog/login-dialog.component";
import { AuthService } from "../../core/services/auth.service";
import { CategoryService } from "../../core/services/category.service";
import { DepartmentService } from "../../core/services/department.service";
import { Group, GroupService } from "../../core/services/group.service";
import { SolutionService } from "../../core/services/solution.service";

@Component({
  selector: "app-submit-solution",
  templateUrl: "./submit-solution.component.html",
  styleUrls: ["./submit-solution.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    ChipsModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    MessagesModule,
  ],
  providers: [MessageService, DialogService],
})
export class SubmitSolutionComponent implements OnInit {
  categories: { name: string }[] = [];
  departments: string[] = [];
  groups: Group[] = [];
  submitting = false;
  isLoggedIn = false;

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
    { label: "EXIT", value: "EXIT" },
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

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private departmentService: DepartmentService,
    private solutionService: SolutionService,
    private messageService: MessageService,
    private dialogService: DialogService,
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
      provider_type: ["INTERNAL"],
      vendor_product_url: [""],
      version: ["", Validators.required],
      tags: [[]],
      pros: ["", Validators.required],
      cons: ["", Validators.required],
      stage: ["", Validators.required],
      recommend_status: ["", Validators.required],
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
    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe((response) => {
      if (response.success) {
        this.categories = response.data;

        // Set category from query param if available
        this.route.queryParams.subscribe((params) => {
          if (params["category"]) {
            this.solutionForm.patchValue({ category: params["category"] });
          }
        });
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

        // Set default group if available
        if (this.groups.length > 0) {
          this.solutionForm.patchValue({ group: this.groups[0].name });
        }
      }
    });
  }

  onSubmit() {
    if (this.solutionForm.valid) {
      this.submitting = true;

      // Convert multiline text to arrays for pros and cons
      const formValue = this.solutionForm.value;
      const pros =
        formValue.pros?.split("\n").filter((line: string) => line.trim()) || [];
      const cons =
        formValue.cons?.split("\n").filter((line: string) => line.trim()) || [];

      const solution = {
        ...formValue,
        pros,
        cons,
      };

      this.solutionService.createSolution(solution).subscribe({
        next: (response) => {
          this.router.navigate(["/new/success"]);
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: error.error?.detail || "Failed to create new item",
          });
          this.submitting = false;
        },
      });
    }
  }

  showLoginDialog() {
    const ref = this.dialogService.open(LoginDialogComponent, {
      width: "400px",
      header: " ",
      contentStyle: { padding: 0 },
      baseZIndex: 1000,
      style: {
        "box-shadow": "0 4px 20px rgba(0, 0, 0, 0.1)",
      },
    });

    ref.onClose.subscribe((success: boolean) => {
      if (success) {
        this.messageService.add({
          severity: "success",
          summary: "Success",
          detail: "You are now logged in",
        });
      }
    });
  }
}
