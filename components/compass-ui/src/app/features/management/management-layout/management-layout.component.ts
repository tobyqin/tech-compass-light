import { Component, OnInit, OnDestroy } from "@angular/core";
import { MenuItem } from "primeng/api";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, Subscription } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "tc-management-layout",
  templateUrl: "./management-layout.component.html",
  styleUrls: ["./management-layout.component.scss"],
})
export class ManagementLayoutComponent implements OnInit, OnDestroy {
  breadcrumbItems: MenuItem[] = [];
  sideMenuItems: MenuItem[] = [];
  sidebarCollapsed = false;
  private routerSubscription: Subscription | undefined;
  private authSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.setupAuthSubscription();
    this.setupBreadcrumbSubscription();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  private setupAuthSubscription() {
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.initializeSideMenu(user?.is_superuser || false);
    });
  }

  private setupBreadcrumbSubscription() {
    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumb();
      });

    // Initial breadcrumb setup
    this.updateBreadcrumb();
  }

  private updateBreadcrumb() {
    const breadcrumbs: MenuItem[] = [
      { label: "Home", routerLink: "/" },
      { label: "Manage Content", routerLink: "/manage" },
    ];

    let route = this.activatedRoute.firstChild;
    let url = "/manage";

    while (route) {
      if (route.snapshot.data["breadcrumb"]) {
        const path = route.snapshot.url
          .map((segment) => segment.path)
          .join("/");
        if (path) {
          url += `/${path}`;
        }
        // Only add the breadcrumb if it's not already the last item
        const label = route.snapshot.data["breadcrumb"];
        if (breadcrumbs[breadcrumbs.length - 1]?.label !== label) {
          breadcrumbs.push({
            label: label,
            routerLink: url,
          });
        }
      }
      route = route.firstChild;
    }

    this.breadcrumbItems = breadcrumbs;
  }

  private initializeSideMenu(isAdmin: boolean) {
    this.sideMenuItems = [
      {
        label: "Dashboard",
        icon: "pi pi-chart-bar",
        routerLink: "/manage",
        routerLinkActiveOptions: { exact: true },
      },
    ];

    if (isAdmin) {
      this.sideMenuItems.push(
        {
          label: "All Items",
          icon: "pi pi-box",
          routerLink: "/manage/all-items",
        },
        {
          label: "All Categories",
          icon: "pi pi-folder",
          routerLink: "/manage/all-categories",
        },
        {
          label: "All Groups",
          icon: "pi pi-th-large",
          routerLink: "/manage/all-groups",
        },
        {
          label: "All Tags",
          icon: "pi pi-tags",
          routerLink: "/manage/all-tags",
        },
        {
          label: "All Users",
          icon: "pi pi-users",
          routerLink: "/manage/all-users",
        },
        {
          label: "All Assets",
          icon: "pi pi-images",
          routerLink: "/manage/all-assets",
        },
        {
          label: "Site Configuration",
          icon: "pi pi-cog",
          routerLink: "/manage/site-configuration",
        }
      );
    }

    this.sideMenuItems.push(
      {
        label: "My Items",
        icon: "pi pi-box",
        routerLink: "/manage/my-items",
      }
    );
  }
}
