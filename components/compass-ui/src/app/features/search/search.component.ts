import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CarouselModule } from "primeng/carousel";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { Subject, Subscription } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { SiteConfigService } from "../../core/services/site-config.service";
import { SolutionService } from "../../core/services/solution.service";
import { SolutionCardComponent } from "../../shared/components/solution-card/solution-card.component";
import { Solution } from "../../shared/interfaces/solution.interface";

// Interface for search configuration
interface SearchConfig {
  name: string;
  logo: {
    path: string;
    alt: string;
  };
  favicon: {
    svg: string;
    png: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
  };
  intro: {
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  benefits: {
    title: string;
    image: string;
    items: Array<{
      icon: string;
      text: string;
    }>;
  };
  testimonials: {
    title: string;
    items: Array<{
      quote: string;
      author: {
        name: string;
        title: string;
        company: string;
        avatar: string;
      };
    }>;
  };
}

@Component({
  selector: "tc-search",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CarouselModule,
    ProgressSpinnerModule,
    MessageModule,
    SolutionCardComponent,
    InputTextModule,
    FormsModule,
  ],
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
})
export class SearchComponent implements OnInit, OnDestroy {
  // Replace static config with dynamic one that will be loaded from API
  config: SearchConfig | null = null;
  recommendedSolutions: Solution[] = [];
  newSolutions: Solution[] = [];
  searchResults: Solution[] = [];
  loading = true;
  loadingNew = true;
  loadingSearch = false;
  error: string | null = null;
  newSolutionsError: string | null = null;
  searchError: string | null = null;
  searchKeyword = "";
  private searchSubject = new Subject<string>();
  private configSubscription: Subscription | null = null;

  responsiveOptions = [
    {
      breakpoint: "1400px",
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: "1024px",
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: "768px",
      numVisible: 1,
      numScroll: 1,
    },
  ];

  constructor(
    private solutionService: SolutionService,
    private siteConfigService: SiteConfigService
  ) {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((keyword) => {
        if (keyword.trim()) {
          this.performSearch(keyword);
        } else {
          this.searchResults = [];
          this.loadingSearch = false;
        }
      });
  }

  ngOnInit(): void {
    // Load configuration first
    this.loadConfig().then(() => {
      // Then load data
      this.loadRecommendedSolutions();
      this.loadNewSolutions();
    });
  }

  ngOnDestroy(): void {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }

  /**
   * Load search page configuration
   */
  private loadConfig(): Promise<void> {
    return new Promise((resolve) => {
      this.configSubscription = this.siteConfigService
        .getConfig<SearchConfig>("search")
        .subscribe({
          next: (config) => {
            this.config = config;
            console.log("Loaded search configuration:", config);
            resolve();
          },
          error: (error) => {
            console.error("Failed to load search configuration:", error);
            // Even if config fails, we can still proceed with loading solutions
            resolve();
          },
        });
    });
  }

  private loadRecommendedSolutions(): void {
    this.solutionService.getRecommendedSolutions().subscribe({
      next: (response) => {
        this.recommendedSolutions = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.error = "Failed to load recommended solutions";
        this.loading = false;
        console.error("Error loading solutions:", error);
      },
    });
  }

  private loadNewSolutions(): void {
    this.loadingNew = true;
    this.solutionService.getNewSolutions().subscribe({
      next: (response) => {
        this.newSolutions = response.data;
        this.loadingNew = false;
      },
      error: (error) => {
        this.newSolutionsError = "Failed to load new solutions";
        this.loadingNew = false;
        console.error("Error loading new solutions:", error);
      },
    });
  }

  onSearch(event: Event): void {
    const keyword = (event.target as HTMLInputElement).value;
    this.searchKeyword = keyword;
    this.searchSubject.next(keyword);
  }

  private performSearch(keyword: string): void {
    this.loadingSearch = true;
    this.searchError = null;
    this.solutionService.searchSolutions(keyword).subscribe({
      next: (response) => {
        this.searchResults = response.data;
        this.loadingSearch = false;
      },
      error: (error) => {
        this.searchError = "Failed to search solutions. Please try again.";
        this.loadingSearch = false;
        console.error("Search error:", error);
      },
    });
  }
}
