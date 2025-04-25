import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { DynamicDialogRef } from "primeng/dynamicdialog";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { PasswordModule } from "primeng/password";
import { RippleModule } from "primeng/ripple";
import { Subscription } from "rxjs";
import { AuthService } from "../../services/auth.service";
import { SiteConfigService } from "../../services/site-config.service";

// Interface for login configuration from site config
interface LoginConfig {
  title: string;
  subtitle: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  signInButton: string;
  cancelButton: string;
  errors: {
    emptyFields: string;
    inactiveUser: string;
    defaultError: string;
  };
}

@Component({
  selector: "app-login-dialog",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    RippleModule,
  ],
  template: `
    <div class="sign-in-dialog" (keydown.enter)="onSignIn()">
      <div class="dialog-header">
        <h2>{{ config?.title || "Sign In" }}</h2>
        <p class="subtitle">
          {{
            config?.subtitle || "Enter your credentials to access your account"
          }}
        </p>
      </div>

      <div class="dialog-content">
        <div class="field">
          <label for="username">{{
            config?.usernameLabel || "Username"
          }}</label>
          <span class="p-input-icon-left">
            <i class="pi pi-user"></i>
            <input
              id="username"
              type="text"
              pInputText
              [(ngModel)]="username"
              [class.ng-invalid]="submitted && !username"
              [placeholder]="
                config?.usernamePlaceholder || 'Enter your username'
              "
            />
          </span>
        </div>

        <div class="field">
          <label for="password">{{
            config?.passwordLabel || "Password"
          }}</label>
          <div class="password-wrapper">
            <i class="pi pi-lock"></i>
            <p-password
              id="password"
              [(ngModel)]="password"
              [feedback]="false"
              [toggleMask]="true"
              [class.ng-invalid]="submitted && !password"
              [placeholder]="
                config?.passwordPlaceholder || 'Enter your password'
              "
              [style]="{ width: '100%' }"
            ></p-password>
          </div>
        </div>

        <p-message
          *ngIf="errorMessage"
          severity="error"
          [text]="errorMessage"
          styleClass="w-full"
        ></p-message>
      </div>

      <div class="dialog-footer">
        <p-button
          [label]="config?.cancelButton || 'Cancel'"
          (click)="onCancel()"
          styleClass="p-button-text p-button-secondary"
        ></p-button>
        <p-button
          [label]="config?.signInButton || 'Sign In'"
          (click)="onSignIn()"
          [loading]="loading"
          icon="pi pi-sign-in"
          styleClass="p-button-primary"
          pRipple
        ></p-button>
      </div>
    </div>
  `,
  styles: [
    `
      .sign-in-dialog {
        padding: 1.5rem;
        min-width: 350px;
      }

      .dialog-header {
        text-align: center;
        margin-bottom: 2rem;

        h2 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 600;
          color: var(--text-color);
        }

        .subtitle {
          margin: 0.5rem 0 0 0;
          color: var(--text-color-secondary);
        }
      }

      .dialog-content {
        margin-bottom: 2rem;
      }

      .field {
        margin-bottom: 1.5rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-color-secondary);
          font-size: 0.875rem;
        }

        .p-input-icon-left {
          width: 100%;

          i {
            color: var(--text-color-secondary);
          }
        }

        input {
          width: 100%;
          padding-left: 2.5rem;
        }
      }

      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .password-wrapper {
        position: relative;
        width: 100%;

        i.pi-lock {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
          color: var(--text-color-secondary);
        }
      }

      :host ::ng-deep {
        .p-password {
          width: 100%;

          input {
            width: 100%;
            padding-left: 2.5rem;
          }
        }

        .p-message {
          margin-bottom: 1rem;
        }

        .p-button {
          .p-button-label {
            font-weight: 600;
          }

          &.p-button-primary {
            background: var(--primary-color);
            border-color: var(--primary-color);
            color: var(--primary-color-text);

            &:enabled:hover {
              background: var(--primary-600);
              border-color: var(--primary-600);
            }
          }

          &.p-button-secondary {
            color: var(--text-color-secondary);

            &:enabled:hover {
              background: rgba(0, 0, 0, 0.04);
              color: var(--text-color);
            }
          }
        }
      }
    `,
  ],
})
export class LoginDialogComponent implements OnInit, OnDestroy {
  // Replace direct reference with null-safe property
  config: LoginConfig | null = null;
  username = "";
  password = "";
  loading = false;
  errorMessage = "";
  submitted = false;
  private configSubscription: Subscription | null = null;

  // Default error messages
  private readonly defaultEmptyFieldsError =
    "Please enter both username and password";
  private readonly defaultInactiveUserError =
    "Your account is inactive. Please contact the administrator.";
  private readonly defaultError = "Invalid username or password";

  constructor(
    private authService: AuthService,
    private siteConfigService: SiteConfigService,
    private ref: DynamicDialogRef
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  ngOnDestroy(): void {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }

  /**
   * Load site configuration
   */
  private loadConfig(): void {
    this.configSubscription = this.siteConfigService
      .getConfig<LoginConfig>("login")
      .subscribe({
        next: (config) => {
          this.config = config;
          console.log("Loaded login configuration:", config);
        },
        error: (error) => {
          console.error("Failed to load login configuration:", error);
          // Keep config as null, app will use fallback values
        },
      });
  }

  onSignIn(): void {
    this.submitted = true;

    if (!this.username || !this.password) {
      this.errorMessage =
        this.config?.errors?.emptyFields || this.defaultEmptyFieldsError;
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.ref.close(true);
        // Refresh the page after successful login
        window.location.reload();
      },
      error: (error) => {
        this.loading = false;
        // Check for specific inactive user error message
        if (error.error?.detail && error.error.detail.includes("inactive")) {
          this.errorMessage =
            this.config?.errors?.inactiveUser || this.defaultInactiveUserError;
        } else {
          this.errorMessage =
            error.error?.detail ||
            this.config?.errors?.defaultError ||
            this.defaultError;
        }
      },
    });
  }

  onCancel(): void {
    this.ref.close(false);
  }
}
