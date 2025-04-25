import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from "@angular/router";
import { map, Observable, take } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class AdminGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          // Save the attempted URL for redirecting
          this.authService.redirectUrl = state.url;
          this.router.navigate(['/'], { 
            queryParams: { returnUrl: state.url },
            replaceUrl: true 
          });
          return false;
        }
        
        if (user.is_superuser) {
          return true;
        }
        
        this.router.navigate(["/manage"]);
        return false;
      })
    );
  }
}
