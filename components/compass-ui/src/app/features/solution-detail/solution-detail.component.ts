import { CommonModule, DatePipe } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { MessageService } from "primeng/api";
import { DialogService } from "primeng/dynamicdialog";
import { BehaviorSubject, Subject, finalize, take, takeUntil } from "rxjs";
import { environment } from "../../../environments/environment";
import { LoginDialogComponent } from "../../core/components/login-dialog/login-dialog.component";
import { AssetService } from '../../core/services/asset.service';
import { AuthService } from "../../core/services/auth.service";
import { Comment, CommentService } from "../../core/services/comment.service";
import {
  HistoryRecord,
  HistoryService,
} from "../../core/services/history.service";
import type { Rating } from "../../core/services/rating.service";
import { RatingService } from "../../core/services/rating.service";
import {
  AdoptedUser,
  SolutionService,
} from "../../core/services/solution.service";
import { Solution } from "../../shared/interfaces/solution.interface";

// PrimeNG Components
import { BreadcrumbModule } from "primeng/breadcrumb";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { CheckboxModule } from "primeng/checkbox";
import { ChipModule } from "primeng/chip";
import { InputTextareaModule } from "primeng/inputtextarea";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { RatingModule } from "primeng/rating";
import { TableModule } from "primeng/table";
import { TabViewModule } from "primeng/tabview";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

// Markdown
import { MarkdownModule } from "ngx-markdown";
import { JustificationEditDialogComponent } from './justification-edit-dialog.component';

type Severity =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "secondary"
  | "contrast";

@Component({
  selector: "app-solution-detail",
  templateUrl: "./solution-detail.component.html",
  styleUrls: ["./solution-detail.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    DatePipe,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ChipModule,
    InputTextareaModule,
    ProgressSpinnerModule,
    RatingModule,
    TabViewModule,
    TagModule,
    ToastModule,
    TooltipModule,
    MarkdownModule,
    TableModule,
    JustificationEditDialogComponent,
  ],
  providers: [DialogService],
})
export class SolutionDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private userCommentsPage = 0;
  private ratingsPage = 0;
  private historyPage = 0;

  solution$ = new BehaviorSubject<Solution | null>(null);
  officialComments$ = new BehaviorSubject<Comment[]>([]);
  userComments$ = new BehaviorSubject<Comment[]>([]);
  ratings$ = new BehaviorSubject<Rating[]>([]);
  history$ = new BehaviorSubject<HistoryRecord[]>([]);

  loading = true;
  loadingOfficialComments = false;
  loadingUserComments = false;
  loadingRatings = false;
  loadingHistory = false;
  hasMoreUserComments = true;
  hasMoreRatings = true;
  hasMoreHistory = true;
  totalOfficialComments = 0;
  totalUserComments = 0;
  totalRatings = 0;
  totalHistory = 0;
  activeTab = 0;

  /**
   * Handles the Get It button click
   * If how_to_use_url exists, opens it in a new tab
   * Always activates the How to Use tab
   */
  onGetItClick(): void {
    const solution = this.solution$.getValue();
    if (solution?.how_to_use_url) {
      window.open(solution.how_to_use_url, "_blank");
    }
    this.activateHowToUseTab();
  }

  /**
   * Activates the How to Use tab
   */
  activateHowToUseTab(): void {
    this.activeTab = 1; // Index 1 corresponds to the How to Use tab
  }

  newComment = "";
  newCommentIsAdopted = false;
  newRating = {
    score: 0,
    comment: "",
    is_adopted_user: false,
  };
  isLoggedIn = false;

  adoptedUsers$ = new BehaviorSubject<AdoptedUser[]>([]);
  loadingAdoptedUsers = false;
  totalAdoptedUsers = 0;
  adoptedUsersPage = 0;
  hasMoreAdoptedUsers = true;

  environment = environment;

  isAdmin = false;

  showJustificationDialog = false;
  justificationDialogValue = '';
  justificationDialogRecord: HistoryRecord | null = null;
  justificationDialogField: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private messageService: MessageService,
    private authService: AuthService,
    private dialogService: DialogService,
    private commentService: CommentService,
    private ratingService: RatingService,
    private solutionService: SolutionService,
    private historyService: HistoryService,
    private router: Router,
    public assetService: AssetService
  ) {}

  ngOnInit() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params["slug"];
      this.loadSolution(slug);
      this.loadComments(slug);
      this.loadRatings(slug);
      this.loadAdoptedUsers(slug);
      this.loadHistory(slug);
    });

    this.authService.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });

    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      this.isAdmin = user?.is_superuser || false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getStageSeverity(stage: string): Severity {
    const severityMap: { [key: string]: Severity } = {
      DEVELOPING: "warning",
      UAT: "info",
      PRODUCTION: "success",
      DEPRECATED: "danger",
      RETIRED: "danger",
    };
    return severityMap[stage] || "info";
  }

  getRecommendStatusSeverity(status: string): Severity {
    const severityMap: { [key: string]: Severity } = {
      ADOPT: "success",
      TRIAL: "info",
      ASSESS: "warning",
      HOLD: "danger",
      EXIT: "danger",
    };
    return severityMap[status] || "info";
  }

  getAdoptionLevelSeverity(level: string): Severity {
    const severityMap: { [key: string]: Severity } = {
      PILOT: "warning",
      TEAM: "info",
      DEPARTMENT: "success",
      ENTERPRISE: "success",
      INDUSTRY: "success",
    };
    return severityMap[level] || "info";
  }

  getAdoptionComplexitySeverity(complexity: string): Severity {
    const severityMap: { [key: string]: Severity } = {
      AUTOMATED: "success",
      EASY: "info",
      SUPPORT_REQUIRED: "warning",
    };
    return severityMap[complexity] || "info";
  }

  /**
   * Get the severity color for a review status
   */
  getReviewStatusSeverity(status: string): Severity {
    const severityMap: { [key: string]: Severity } = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "danger",
    };
    return severityMap[status] || "secondary";
  }

  private loadSolution(slug: string) {
    this.loading = true;
    this.http
      .get<any>(`${environment.apiUrl}/solutions/${slug}`)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.solution$.next(response.data);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load details",
          });
        },
      });
  }

  loadComments(slug: string, loadMore = false) {
    if (!loadMore) {
      this.userCommentsPage = 0;
      this.officialComments$.next([]);
      this.userComments$.next([]);
    }

    // Load OFFICIAL comments (max 10)
    this.loadingOfficialComments = true;
    this.commentService
      .getSolutionComments(slug, 0, 10, "OFFICIAL")
      .pipe(
        finalize(() => {
          this.loadingOfficialComments = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.officialComments$.next(response.data);
            this.totalOfficialComments = response.total;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load official comments",
          });
        },
      });

    // Load USER comments
    if (!loadMore) {
      this.userCommentsPage = 0;
      this.userComments$.next([]);
    }

    this.loadingUserComments = true;
    this.commentService
      .getSolutionComments(slug, this.userCommentsPage * 10, 10, "USER")
      .pipe(
        finalize(() => {
          this.loadingUserComments = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            const currentComments = this.userComments$.value;
            this.userComments$.next([...currentComments, ...response.data]);
            this.totalUserComments = response.total;
            this.hasMoreUserComments =
              currentComments.length + response.data.length < response.total;
            this.userCommentsPage++;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load user comments",
          });
        },
      });
  }

  loadRatings(slug: string, loadMore = false) {
    if (!loadMore) {
      this.ratingsPage = 0;
      this.ratings$.next([]);
      this.hasMoreRatings = true;
    }

    if (!this.hasMoreRatings || this.loadingRatings) {
      return;
    }

    this.loadingRatings = true;
    const skip = this.ratingsPage * 10;

    this.ratingService
      .getSolutionRatings(slug, skip, 10)
      .pipe(finalize(() => (this.loadingRatings = false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const currentRatings = this.ratings$.value;
            this.ratings$.next([...currentRatings, ...response.data]);
            this.totalRatings = response.total;
            this.hasMoreRatings =
              currentRatings.length + response.data.length < response.total;
            this.ratingsPage++;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load ratings",
          });
        },
      });
  }

  submitComment(slug: string) {
    if (!this.newComment.trim()) return;

    this.commentService
      .addComment(slug, {
        content: this.newComment,
        is_adopted_user: this.newCommentIsAdopted,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Comment added successfully",
            });
            this.newComment = "";
            this.newCommentIsAdopted = false;
            this.loadComments(slug);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to add comment",
          });
        },
      });
  }

  submitRating(slug: string) {
    if (this.newRating.score === 0) return;

    this.ratingService
      .addRating(
        slug,
        this.newRating.score,
        this.newRating.comment,
        this.newRating.is_adopted_user
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.messageService.add({
              severity: "success",
              summary: "Success",
              detail: "Rating submitted successfully",
            });
            this.newRating = { score: 0, comment: "", is_adopted_user: false };
            this.loadRatings(slug);
            this.loadSolution(slug);
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to submit rating",
          });
        },
      });
  }

  showLoginDialog() {
    this.dialogService.open(LoginDialogComponent, {
      header: "Login Required",
      width: "400px",
    });
  }

  canEditSolution(): boolean {
    let canEdit = false;
    this.authService.currentUser$.subscribe((currentUser) => {
      const solution = this.solution$.value;

      if (currentUser && solution) {
        // Check if current user is the maintainer or a superuser
        canEdit =
          currentUser.username === solution.maintainer_id ||
          currentUser.is_superuser;
      }
    });
    return canEdit;
  }

  navigateToEditSolution() {
    this.authService.currentUser$.subscribe((currentUser) => {
      const solution = this.solution$.value;
      if (!solution || !currentUser) return;

      const slug = solution.slug;
      if (currentUser.is_superuser) {
        this.router.navigate(["/manage/all-items/edit/", slug]);
      } else if (currentUser.username === solution.maintainer_id) {
        this.router.navigate(["/manage/my-items/edit/", slug]);
      }
    });
  }

  loadAdoptedUsers(slug: string, loadMore = false) {
    if (!loadMore) {
      this.adoptedUsersPage = 0;
      this.adoptedUsers$.next([]);
      this.hasMoreAdoptedUsers = true;
    }

    if (!this.hasMoreAdoptedUsers || this.loadingAdoptedUsers) {
      return;
    }

    this.loadingAdoptedUsers = true;
    const skip = this.adoptedUsersPage * 10;

    this.solutionService
      .getAdoptedUsers(slug, skip, 10)
      .pipe(finalize(() => (this.loadingAdoptedUsers = false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const currentUsers = this.adoptedUsers$.value;
            this.adoptedUsers$.next([...currentUsers, ...response.data]);
            this.totalAdoptedUsers = response.total;
            this.hasMoreAdoptedUsers =
              currentUsers.length + response.data.length < response.total;
            this.adoptedUsersPage++;
          }
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load adopted users",
          });
        },
      });
  }

  sendEmail(email: string) {
    const solution = this.solution$.value;
    if (!solution) return;

    const subject = encodeURIComponent(
      `Reach out for tech solution: ${solution.name}`
    );
    window.location.href = `mailto:${email}?subject=${subject}`;
  }

  /**
   * Load history records for changes to recommend_status and review_status
   */
  loadHistory(slug: string, loadMore = false) {
    if (this.loadingHistory) {
      return;
    }

    if (loadMore) {
      this.historyPage++;
    } else {
      this.historyPage = 0;
      this.history$.next([]);
    }

    this.loadingHistory = true;

    this.historyService
      .getSolutionHistory(slug, {
        skip: this.historyPage * 20,
        limit: 20,
        fields: ["recommend_status", "review_status"],
      })
      .pipe(
        finalize(() => {
          this.loadingHistory = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          const records = (response.data || []).map((rec: any) => ({
            ...rec,
            id: rec.id || rec._id
          }));
          if (loadMore) {
            this.history$.next([...this.history$.getValue(), ...records]);
          } else {
            this.history$.next(records);
          }
          this.totalHistory = response.total;
          this.hasMoreHistory =
            this.history$.getValue().length < response.total;
        },
        error: (error) => {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load history records",
          });
        },
      });
  }

  /**
   * Format the value for display in the history table
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return "N/A";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return value.toString();
  }

  /**
   * Get a user-friendly field name for display
   */
  getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      recommend_status: "Recommend Status",
      review_status: "Review Status",
    };
    return displayNames[fieldName] || fieldName;
  }

  navigateToReplacedSolution(name: string) {
    if (!name || name === 'default solution') return;
    
    this.http.get<any>(`${environment.apiUrl}/solutions/`, {
      params: { name }
    }).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          const solution = response.data[0];
          this.router.navigate(['/items', solution.slug]);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Replacement solution not found'
          });
        }
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load replacement solution'
        });
      }
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Copied to clipboard'
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy to clipboard'
      });
    });
  }

  editJustification(record: HistoryRecord, field: any) {
    if (!this.isAdmin) return;
    this.justificationDialogValue = field.status_change_justification || '';
    this.justificationDialogRecord = record;
    this.justificationDialogField = field;
    this.showJustificationDialog = true;
  }

  onJustificationDialogConfirm(newJustification: string) {
    if (!this.justificationDialogRecord || !this.justificationDialogField) return;
    this.historyService.updateJustification(
      this.solution$.value?.slug || '',
      this.justificationDialogRecord.id,
      this.justificationDialogField.field_name,
      newJustification
    ).subscribe({
      next: () => {
        this.loadHistory(this.solution$.value?.slug || '', false);
        this.showJustificationDialog = false;
      },
      error: err => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.detail || 'Failed to update justification'
        });
        this.showJustificationDialog = false;
      }
    });
  }

  onJustificationDialogCancel() {
    this.showJustificationDialog = false;
  }
}
