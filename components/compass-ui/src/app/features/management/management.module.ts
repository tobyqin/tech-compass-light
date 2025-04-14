import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { ChipModule } from "primeng/chip";
import { ChipsModule } from "primeng/chips";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from "primeng/dropdown";
import { FileUploadModule } from "primeng/fileupload";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { InputTextareaModule } from "primeng/inputtextarea";
import { MenuModule } from "primeng/menu";
import { MessagesModule } from "primeng/messages";
import { PaginatorModule } from "primeng/paginator";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";

import { AdminGuard } from "../../core/guards/admin.guard";
import { SharedModule } from "../../shared/shared.module";
import { AllAssetsComponent } from './all-assets/all-assets.component';
import { AllCategoriesComponent } from "./all-categories/all-categories.component";
import { AllCommentsComponent } from "./all-comments/all-comments.component";
import { AllGroupsComponent } from "./all-groups/all-groups.component";
import { AllRatingsComponent } from "./all-ratings/all-ratings.component";
import { AllSolutionsComponent } from "./all-solutions/all-solutions.component";
import { AllTagsComponent } from "./all-tags/all-tags.component";
import { AllUsersComponent } from "./all-users/all-users.component";
import { EditSolutionComponent } from "./edit-solution/edit-solution.component";
import { ManagementDashboardComponent } from "./management-dashboard/management-dashboard.component";
import { ManagementLayoutComponent } from "./management-layout/management-layout.component";
import { MyCommentsComponent } from "./my-comments/my-comments.component";
import { MyRatingsComponent } from "./my-ratings/my-ratings.component";
import { MySolutionsComponent } from "./my-solutions/my-solutions.component";
import { SiteConfigurationComponent } from "./site-configuration/site-configuration.component";

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
        path: "all-assets",
        component: AllAssetsComponent,
        canActivate: [AdminGuard],
        data: { breadcrumb: "All Assets" },
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
  declarations: [
    ManagementLayoutComponent,
    ManagementDashboardComponent,
  ],
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
    AllAssetsComponent,
  ],
})
export class ManagementModule {}
