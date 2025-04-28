import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MarkdownModule } from "ngx-markdown";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { AuthService } from "../../core/services/auth.service";
import { Group, GroupService } from "../../core/services/group.service";
import { SiteConfigService } from "../../core/services/site-config.service";

// External libraries
declare const d3: any;
declare const radar_visualization: any;

// Data interface definition
interface TechRadarEntry {
  quadrant: number; // Index of quadrant (0-3)
  ring: number; // Index of ring (0-3)
  label: string; // Technology name
  link: string; // Technology link
  active: boolean; // Active status
  moved: number; // Movement status
}

interface TechRadarData {
  date: string; // Radar chart date
  entries: TechRadarEntry[]; // Technology item list
}

interface Quadrant {
  name: string;
}

interface Ring {
  name: string;
}

// Interface for radar configuration from site config
interface RadarConfig {
    title: string;
    faqs: Array<{
      title: string;
      content: string;
    }>;
}

@Component({
  selector: "tc-tech-radar",
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, MarkdownModule, ButtonModule, TagModule],
  templateUrl: "./tech-radar.component.html",
  styleUrls: ["./tech-radar.component.scss"],
})
export class TechRadarComponent implements OnInit, OnDestroy {
  // Constant definition
  private readonly MAX_QUADRANTS = 4; // Maximum number of quadrants
  private readonly MAX_RINGS = 4; // Maximum number of rings
  private readonly SCRIPT_LOAD_DELAY = 100; // Script load delay (milliseconds)
  private readonly RING_COLORS = {
    ADOPT: "#00af68",
    TRIAL: "#255be3",
    ASSESS: "#ffcd00",
    HOLD: "#ff3c28",
  };

  // Component state
  private dataSubscription: Subscription | null = null;
  private quadrantsSubscription: Subscription | null = null;
  private ringsSubscription: Subscription | null = null;
  private configSubscription: Subscription | null = null;
  private groupsSubscription: Subscription | null = null;
  private scriptsLoaded = false;
  private quadrants: Quadrant[] = [];
  private rings: Ring[] = [];
  
  // Group related properties
  groups: Group[] = [];
  selectedGroup: Group | null = null;

  // Initialize with default values that will be overridden by config
  faqs: Array<{ title: string; content: string }> = [];
  title: string = "Tech Radar";

  constructor(
    private http: HttpClient,
    private siteConfigService: SiteConfigService,
    private groupService: GroupService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadConfig().then(() => this.initializeRadar());
  }

  ngOnDestroy() {
    this.cleanup();
  }

  /**
   * Load site configuration
   */
  private loadConfig(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.configSubscription = this.siteConfigService
        .getConfig<RadarConfig>("radar")
        .subscribe({
          next: (config) => {
            if (config && config) {
              this.title = config.title;
              this.faqs = config.faqs;
            }
            resolve();
          },
          error: (error) => {
            console.error("Failed to load radar configuration:", error);
            // Continue with initialization even if config fails
            resolve();
          },
        });
    });
  }

  /**
   * Load quadrants data from API
   */
  private loadQuadrants(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.quadrantsSubscription = this.http
        .get<Quadrant[]>(`${environment.apiUrl}/tech-radar/quadrants`)
        .subscribe({
          next: (data) => {
            this.quadrants = data;
            resolve();
          },
          error: reject,
        });
    });
  }

  /**
   * Load rings data from API
   */
  private loadRings(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ringsSubscription = this.http
        .get<Ring[]>(`${environment.apiUrl}/tech-radar/rings`)
        .subscribe({
          next: (data) => {
            this.rings = data;
            resolve();
          },
          error: reject,
        });
    });
  }

  /**
   * Load groups data from API
   */
  private loadGroups(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.groupsSubscription = this.groupService.getAllGroups().subscribe({
        next: (response) => {
          this.groups = response.data;
          
          // Check if there's a group parameter in the URL
          const groupParam = this.route.snapshot.queryParamMap.get('group');
          
          if (groupParam && this.groups.length > 0) {
            // Convert hyphens back to spaces for matching
            const normalizedGroupParam = groupParam.replace(/-/g, ' ');
            
            // Find the group by name
            const foundGroup = this.groups.find(g => g.name === normalizedGroupParam);
            if (foundGroup) {
              this.selectedGroup = foundGroup;
            } else {
              // If group not found, default to first group
              this.selectedGroup = this.groups[0];
            }
          } else if (this.groups.length > 0) {
            // No group parameter, default to first group
            this.selectedGroup = this.groups[0];
          }
          
          resolve();
        },
        error: reject,
      });
    });
  }

  /**
   * Initialize radar visualization:
   * 1. Load required scripts
   * 2. Fetch and display data
   */
  private initializeRadar(): void {
    this.loadScripts()
      .then(() => this.loadQuadrants())
      .then(() => this.loadRings())
      .then(() => this.loadGroups())
      .then(() => this.loadTechRadarData());
  }

  /**
   * Load required JavaScript files
   */
  private loadScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.scriptsLoaded) {
        resolve();
        return;
      }

      const d3Script = this.createScript("assets/js/d3.v4.min.js");
      const radarScript = this.createScript("assets/js/radar.js");

      d3Script.onerror = reject;
      radarScript.onerror = reject;

      // Load scripts sequentially
      d3Script.onload = () => document.body.appendChild(radarScript);
      radarScript.onload = () => {
        this.scriptsLoaded = true;
        setTimeout(() => resolve(), this.SCRIPT_LOAD_DELAY);
      };

      document.body.appendChild(d3Script);
    });
  }

  /**
   * Create script element
   * @param src Script source path
   * @returns HTMLScriptElement
   */
  private createScript(src: string): HTMLScriptElement {
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    return script;
  }

  /**
   * Load technology radar data
   */
  private loadTechRadarData(): void {
    if (!this.scriptsLoaded || typeof radar_visualization === "undefined") {
      return;
    }

    const url = this.selectedGroup 
      ? `${environment.apiUrl}/tech-radar/data?group=${this.selectedGroup.name}` 
      : `${environment.apiUrl}/tech-radar/data`;

    this.dataSubscription = this.http
      .get<TechRadarData>(url)
      .subscribe({
        next: (data) => {
          if (this.isValidData(data)) {
            const validEntries = this.processEntries(data.entries);
            this.visualizeRadar({ date: data.date, entries: validEntries });
          }
        },
      });
  }

  /**
   * Verify data format is valid
   * @param data Radar chart data
   * @returns boolean
   */
  private isValidData(data: any): data is TechRadarData {
    return data && data.entries && Array.isArray(data.entries);
  }

  /**
   * Process and verify data items
   * @param entries Original item data
   * @returns TechRadarEntry[]
   */
  private processEntries(entries: TechRadarEntry[]): TechRadarEntry[] {
    return entries
      .map((entry) => this.validateAndCleanEntry(entry))
      .filter((entry): entry is TechRadarEntry => entry !== null);
  }

  /**
   * Verify and clean single item data
   * @param entry Original item
   * @returns TechRadarEntry | null
   */
  private validateAndCleanEntry(entry: TechRadarEntry): TechRadarEntry | null {
    const quadrant = Number(entry.quadrant);
    const ring = Number(entry.ring);

    if (quadrant >= this.MAX_QUADRANTS || ring >= this.MAX_RINGS) {
      return null;
    }

    return {
      quadrant,
      ring,
      label: String(entry.label),
      link: String(entry.link),
      active: Boolean(entry.active),
      moved: Number(entry.moved),
    };
  }

  /**
   * Visualize radar chart
   * @param data Processed radar chart data
   */
  private visualizeRadar(data: TechRadarData): void {
    const svgElement = document.getElementById("radar");
    if (!svgElement) {
      return;
    }

    try {
      svgElement.innerHTML = "";
      radar_visualization(this.createRadarConfig(data));
    } catch (error) {}
  }

  /**
   * Create radar chart configuration
   * @param data Radar chart data
   * @returns Radar chart configuration object
   */
  private createRadarConfig(data: TechRadarData): any {
    return {
      svg_id: "radar",
      scale: 0.92,
      title: this.title,
      date: data.date,
      quadrants: this.quadrants,
      rings: this.rings.map((ring) => ({
        name: ring.name,
        color: this.RING_COLORS[ring.name as keyof typeof this.RING_COLORS],
      })),
      entries: data.entries,
      print_layout: true,
    };
  }

  /**
   * Select a group and reload the radar data
   * @param group Selected group
   */
  selectGroup(group: Group): void {
    this.selectedGroup = group;
    
    // Update URL with the selected group, replacing spaces with hyphens
    const urlFriendlyGroupName = group.name.replace(/ /g, '-');
    
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { group: urlFriendlyGroupName },
      queryParamsHandling: 'merge'
    });
    
    this.loadTechRadarData();
  }

  /**
   * Clean component resources
   */
  private cleanup(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    if (this.quadrantsSubscription) {
      this.quadrantsSubscription.unsubscribe();
    }
    if (this.ringsSubscription) {
      this.ringsSubscription.unsubscribe();
    }
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
    if (this.groupsSubscription) {
      this.groupsSubscription.unsubscribe();
    }
    this.removeScripts();
  }

  /**
   * Remove loaded scripts
   */
  private removeScripts(): void {
    if (this.scriptsLoaded) {
      const scripts = document.querySelectorAll(
        'script[src*="d3.v4.min.js"], script[src*="radar.js"]'
      );
      scripts.forEach((script) => script.remove());
      this.scriptsLoaded = false;
    }
  }
}
