import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { map, Observable, take } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable({
  providedIn: "root",
})
export class AdminGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          // Navigate directly to root path without parameters
          this.router.navigate(['/']);
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
