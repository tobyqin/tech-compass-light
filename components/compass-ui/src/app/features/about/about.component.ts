import { Component, OnDestroy, OnInit } from "@angular/core";
// Remove hardcoded config import
// import { siteConfig } from "../../core/config/site.config";
import { Subscription } from "rxjs";
import { SiteConfigService } from "../../core/services/site-config.service";

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  url?: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
  url?: string;
}

interface AboutConfig {
  hero: {
    title: string;
    subtitle: string;
  };
  team: {
    title: string;
    members: TeamMember[];
  };
  features: {
    title: string;
    items: Feature[];
  };
  engagement: {
    title: string;
    cards: Array<{
      icon: string;
      title: string;
      description: string;
      url?: string;
    }>;
  };
}

@Component({
  selector: "tc-about",
  templateUrl: "./about.component.html",
  styleUrls: ["./about.component.scss"],
})
export class AboutComponent implements OnInit, OnDestroy {
  aboutConfig: AboutConfig | null = null;
  window = window;
  private configSubscription: Subscription | null = null;

  // Default configuration in case API fails
  private defaultAboutConfig: AboutConfig = {
    hero: {
      title: "About Tech Compass",
      subtitle: "Your guide to technology solutions",
    },
    team: {
      title: "Our Sponsors",
      members: [],
    },
    features: {
      title: "Our Mission",
      items: [],
    },
    engagement: {
      title: "Get Involved",
      cards: [],
    },
  };

  constructor(private siteConfigService: SiteConfigService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  ngOnDestroy(): void {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }

  /**
   * Load site configuration for About page
   */
  private loadConfig(): void {
    this.configSubscription = this.siteConfigService
      .getConfig<AboutConfig>("about")
      .subscribe({
        next: (config) => {
          this.aboutConfig = config;
          console.log("Loaded about configuration:", config);
        },
        error: (error) => {
          console.error("Failed to load about configuration:", error);
          // Use default configuration if API fails
          this.aboutConfig = this.defaultAboutConfig;
        },
      });
  }
}
