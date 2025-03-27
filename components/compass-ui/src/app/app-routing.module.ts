import { Injectable, NgModule } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterModule, Routes, TitleStrategy } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";
import { SiteConfigService } from "./core/services/site-config.service";

// Interface for navigation config
interface NavigationConfig {
  name: string;
  logo: {
    path: string;
    alt: string;
  };
  favicon: {
    svg: string;
    png: string;
  };
  navigation: Array<any>; // Simplified for this use case
}

@Injectable()
class CustomTitleStrategy extends TitleStrategy {
  private appName = "Tech Compass"; // Default fallback value

  constructor(
    private readonly title: Title,
    private siteConfigService: SiteConfigService
  ) {
    super();
    // Load application name from site config
    this.loadAppName();
  }

  /**
   * Load application name from site config
   */
  private loadAppName(): void {
    this.siteConfigService.getConfig<NavigationConfig>("navigation").subscribe({
      next: (config) => {
        if (config && config.name) {
          this.appName = config.name;
        }
      },
      error: (error) => {
        console.error("Failed to load app name for title:", error);
        // Keep using the default appName
      },
    });
  }

  override updateTitle(routerState: any) {
    const title = this.buildTitle(routerState);
    if (title) {
      this.title.setTitle(`${title} - ${this.appName}`);
    } else {
      this.title.setTitle(this.appName);
    }
  }
}

const routes: Routes = [
  {
    path: "",
    children: [
      {
        path: "",
        pathMatch: "full",
        redirectTo: "tech-radar",
      },
      {
        path: "tech-radar",
        title: "Technology Radar",
        loadComponent: () =>
          import("./features/tech-radar/tech-radar.component").then(
            (m) => m.TechRadarComponent
          ),
      },
      {
        path: "tech-radar/search",
        title: "Search",
        loadComponent: () =>
          import("./features/search/search.component").then(
            (m) => m.SearchComponent
          ),
      },
      {
        path: "tech-radar/new",
        title: "Submit Solution",
        loadChildren: () =>
          import("./features/submit-solution/submit-solution.module").then(
            (m) => m.SubmitSolutionModule
          ),
      },
      {
        path: "tech-radar/items",
        title: "Technology Catalog",
        loadComponent: () =>
          import("./features/solution-catalog/solution-catalog.component").then(
            (m) => m.SolutionCatalogComponent
          ),
      },
      {
        path: "tech-radar/items/:slug",
        title: "Technology Item",
        loadComponent: () =>
          import("./features/solution-detail/solution-detail.component").then(
            (m) => m.SolutionDetailComponent
          ),
      },
      {
        path: "tech-radar/categories",
        title: "Technology Categories",
        loadChildren: () =>
          import("./features/categories/categories.module").then(
            (m) => m.CategoriesModule
          ),
      },
      {
        path: "tech-radar/about",
        title: "About",
        loadChildren: () =>
          import("./features/about/about.module").then((m) => m.AboutModule),
      },
      {
        path: "manage",
        title: "Manage Content",
        canActivate: [AuthGuard],
        loadChildren: () =>
          import("./features/management/management.module").then(
            (m) => m.ManagementModule
          ),
      },
    ],
  },
  {
    path: "**",
    title: "404 Not Found",
    loadComponent: () =>
      import("./features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent
      ),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: TitleStrategy, useClass: CustomTitleStrategy },
    // SiteConfigService is already provided with providedIn: 'root' in the service
  ],
})
export class AppRoutingModule {}
