import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // Store the attempted URL for redirecting
    const fullUrl = state.url;
    const returnUrl = fullUrl.startsWith('/tech-radar/') ? fullUrl.substring('/tech-radar/'.length) : fullUrl;
    this.authService.redirectUrl = returnUrl;
    
    // Navigate to the login page with the return url
    this.router.navigate(["/"], { 
      queryParams: { returnUrl: returnUrl }
    });
    return false;
  }
}
