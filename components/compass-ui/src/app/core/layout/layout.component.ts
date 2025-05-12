import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MenuItem } from "primeng/api";
import { DialogService } from "primeng/dynamicdialog";
import { Menu } from "primeng/menu";
import { forkJoin, of, Subscription } from "rxjs";
import { catchError } from "rxjs/operators";
import { LoginDialogComponent } from "../components/login-dialog/login-dialog.component";
import {
  ExternalNavigationItem,
  InternalNavigationItem,
  NavigationItem,
  SubMenuNavigationItem,
} from "../interfaces/navigation.interface";
import { AuthService } from "../services/auth.service";
import { SiteConfigService } from "../services/site-config.service";

// Update NavigationConfig to include all site info
interface NavigationConfig {
  name: string;
  logo: {
    path: string;
    alt: string;
  };
  favicon: {
    svg: string;
  };
  navigation: NavigationItem[];
}

interface FooterConfig {
  aboutText: string;
  quickLinks: Array<{
    label: string;
    path: string;
  }>;
  copyright: string;
}

@Component({
  selector: "tc-layout",
  templateUrl: "./layout.component.html",
  styleUrls: ["./layout.component.scss"],
  providers: [DialogService],
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild("userMenu") userMenu!: Menu;

  // Initialize with empty values
  config = {
    logo: {
      path: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", // Default logo path, transparent pixel
      alt: "App Logo",
    },
    name: "", // Default app name
    navigation: [] as NavigationItem[],
    footer: {
      aboutText: "",
      quickLinks: [] as Array<{ label: string; path: string }>,
      copyright: "",
    },
  };
  menuItems: MenuItem[] = [];
  userMenuItems: MenuItem[] = [];
  configLoaded = false;
  hasError = false;
  errorMessage = "";
  private subscription: Subscription = new Subscription();
  private navigationConfig: NavigationItem[] = [];
  private footerConfig: FooterConfig | null = null;

  constructor(
    private dialogService: DialogService,
    private authService: AuthService,
    private siteConfigService: SiteConfigService
  ) {}

  ngOnInit() {
    this.loadConfigurations();

    const userSub = this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userMenuItems = [
          {
            label: user.full_name,
            items: [
              {
                label: "Logout",
                icon: "pi pi-sign-out",
                command: () => this.logout(),
              },
            ],
          },
        ];
      } else {
        this.userMenuItems = [];
      }
    });

    this.subscription.add(userSub);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**
   * Load all configurations from API
   */
  private loadConfigurations() {
    const navigationReq = this.siteConfigService
      .getConfig<NavigationConfig>("navigation")
      .pipe(
        catchError((error) => {
          console.error("Failed to load navigation configuration:", error);
          this.setErrorState(
            "Failed to connect to server: Navigation data could not be loaded"
          );
          return of(null);
        })
      );

    const footerReq = this.siteConfigService
      .getConfig<FooterConfig>("footer")
      .pipe(
        catchError((error) => {
          console.error("Failed to load footer configuration:", error);
          return of(null);
        })
      );

    // Load all configurations in parallel
    const configSub = forkJoin({
      navigation: navigationReq,
      footer: footerReq,
    }).subscribe((results) => {
      // Check if we have any successful response
      if (!results.navigation && !results.footer) {
        this.setErrorState(
          "Failed to connect to server: Configuration data could not be loaded" 
        );
        return;
      }

      // Process navigation config and app info
      if (results.navigation) {
        // Extract navigation items
        this.navigationConfig = results.navigation.navigation;
        this.config.navigation = this.navigationConfig;

        // Extract app info (name and logo) from navigation config
        if (results.navigation.name) {
          this.config.name = results.navigation.name;
        }

        if (results.navigation.logo) {
          this.config.logo = results.navigation.logo;
        }

        // Set favicon if available (not used in the component but good to have for future use)
        if (results.navigation.favicon) {
          // Set favicon dynamically
          this.setFavicon(results.navigation.favicon);
        }
      } else if (!this.hasError) {
        this.setErrorState("Failed to load navigation menu");
        return;
      }

      // Process footer config
      if (results.footer) {
        this.footerConfig = results.footer;
        this.config.footer = this.footerConfig;
      } else if (!this.hasError) {
        this.setErrorState("Failed to load footer information");
        return;
      }

      // If we reach here, at least configuration was loaded successfully
      this.configLoaded = true;
      this.initializeMenus();

      console.log("Loaded layout configurations:", results);
    });

    this.subscription.add(configSub);
  }

  /**
   * Set favicon based on config
   */
  private setFavicon(favicon: { svg: string }) {
    const faviconPath = favicon.svg;
    
    // Find existing favicon link element
    let link = document.querySelector('link[rel="icon"]');
    
    // If link exists, update its href
    if (link) {
      link.setAttribute("type", "image/svg+xml");
      link.setAttribute("href", faviconPath);
    } else {
      // Create new link element if it doesn't exist
      link = document.createElement("link");
      link.setAttribute("rel", "icon");
      link.setAttribute("type", "image/svg+xml");
      link.setAttribute("href", faviconPath);
      document.head.appendChild(link);
    }
  }

  /**
   * Set error state when API fails
   */
  private setErrorState(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.configLoaded = false;
  }

  /**
   * Retry loading configurations when there was an error
   */
  retryLoadingConfigurations() {
    this.hasError = false;
    this.errorMessage = "";
    this.loadConfigurations();
  }

  private initializeMenus() {
    if (!this.config.navigation || this.config.navigation.length === 0) {
      return;
    }

    this.menuItems = this.config.navigation.map((item) => {
      const menuItem: MenuItem = {
        label: item.label,
        icon: item.icon,
      };

      if (this.isInternalLink(item)) {
        menuItem.routerLink = item.path;
      } else if (this.isExternalLink(item)) {
        menuItem.url = item.url;
        menuItem.target = item.target;
      } else if (this.isSubMenu(item)) {
        menuItem.items = item.items.map(
          (subItem: InternalNavigationItem | ExternalNavigationItem) => {
            const subMenuItem: MenuItem = {
              label: subItem.label,
              icon: subItem.icon,
            };

            if ("url" in subItem) {
              subMenuItem.url = subItem.url;
              subMenuItem.target = subItem.target;
            } else if ("path" in subItem) {
              subMenuItem.routerLink = subItem.path;
            }

            return subMenuItem;
          }
        );
      }

      return menuItem;
    });
  }

  private isSubMenu(item: NavigationItem): item is SubMenuNavigationItem {
    return "items" in item && Array.isArray(item.items);
  }

  private isInternalLink(item: NavigationItem): item is InternalNavigationItem {
    return "path" in item;
  }

  private isExternalLink(item: NavigationItem): item is ExternalNavigationItem {
    return "url" in item;
  }

  isUserLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onUserIconClick(event: Event) {
    if (!this.authService.isLoggedIn()) {
      this.showLoginDialog();
    } else if (this.userMenu) {
      this.userMenu.toggle(event);
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
      // Handle successful login if needed
    });
  }

  logout() {
    this.authService.logout();
  }
}
