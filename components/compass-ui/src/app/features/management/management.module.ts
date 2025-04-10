import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { MenuModule } from "primeng/menu";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { ChipModule } from "primeng/chip";
import { TagModule } from "primeng/tag";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ToastModule } from "primeng/toast";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { DropdownModule } from "primeng/dropdown";
import { InputNumberModule } from "primeng/inputnumber";
import { ChipsModule } from "primeng/chips";
import { PaginatorModule } from "primeng/paginator";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { MessagesModule } from "primeng/messages";

import { ManagementLayoutComponent } from "./management-layout/management-layout.component";
import { ManagementDashboardComponent } from "./management-dashboard/management-dashboard.component";
import { MySolutionsComponent } from "./my-solutions/my-solutions.component";
import { EditSolutionComponent } from "./edit-solution/edit-solution.component";
import { MyCommentsComponent } from "./my-comments/my-comments.component";
import { MyRatingsComponent } from "./my-ratings/my-ratings.component";
import { AllSolutionsComponent } from "./all-solutions/all-solutions.component";
import { AllCommentsComponent } from "./all-comments/all-comments.component";
import { AllRatingsComponent } from "./all-ratings/all-ratings.component";
import { AllUsersComponent } from "./all-users/all-users.component";
import { AllCategoriesComponent } from "./all-categories/all-categories.component";
import { AllTagsComponent } from "./all-tags/all-tags.component";
import { AllGroupsComponent } from "./all-groups/all-groups.component";
import { SiteConfigurationComponent } from "./site-configuration/site-configuration.component";
import { AdminGuard } from "../../core/guards/admin.guard";
import { SharedModule } from "../../shared/shared.module";

const routes: Routes = [
  {
    path: "",
    component: ManagementLayoutComponent,
    children: [
      {
        path: "",
        component: ManagementDashboardComponent,
        data: { breadcrumb: "Dashboard" },
      },
      {
        path: "all-items",
        data: { breadcrumb: "All Items" },
        canActivate: [AdminGuard],
        children: [
          {
            path: "",
            component: AllSolutionsComponent,
          },
          {
            path: "edit/:slug",
            component: EditSolutionComponent,
            data: { breadcrumb: "Edit Item" },
          },
        ],
      },
      {
        path: "all-comments",
        component: AllCommentsComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "All Comments" },
      },
      {
        path: "all-ratings",
        component: AllRatingsComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "All Ratings" },
      },
      {
        path: "all-categories",
        component: AllCategoriesComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "All Categories" },
      },
      {
        path: "all-groups",
        component: AllGroupsComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "All Groups" },
      },
      {
        path: "all-tags",
        component: AllTagsComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "All Tags" },
      },
      {
        path: "site-configuration",
        component: SiteConfigurationComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "Site Configuration" },
      },
      {
        path: "all-users",
        component: AllUsersComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "All Users" },
      },
      {
        path: "my-items",
        data: { breadcrumb: "My Items" },
        children: [
          {
            path: "",
            component: MySolutionsComponent,
          },
          {
            path: "edit/:slug",
            component: EditSolutionComponent,
            data: { breadcrumb: "Edit Item" },
          },
        ],
      },
      {
        path: "my-comments",
        component: MyCommentsComponent,
        data: { breadcrumb: "My Comments" },
      },
      {
        path: "my-ratings",
        component: MyRatingsComponent,
        data: { breadcrumb: "My Ratings" },
      },
    ],
  },
];

@NgModule({
  declarations: [ManagementLayoutComponent, ManagementDashboardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    BreadcrumbModule,
    MenuModule,
    CardModule,
    ButtonModule,
    TableModule,
    ChipModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    InputNumberModule,
    ChipsModule,
    PaginatorModule,
    ProgressSpinnerModule,
    MessagesModule,
    SharedModule,
    EditSolutionComponent,
    MySolutionsComponent,
    MyCommentsComponent,
    MyRatingsComponent,
    AllSolutionsComponent,
    AllCommentsComponent,
    AllRatingsComponent,
    AllUsersComponent,
    AllCategoriesComponent,
    AllGroupsComponent,
    AllTagsComponent,
    SiteConfigurationComponent,
  ],
})
export class ManagementModule {}
