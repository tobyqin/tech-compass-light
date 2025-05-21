import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private apiUrl = environment.apiUrl;
  private tokenKey = "auth_token";

  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    let req = request;
    // 只要是发往后端 API 的请求，都加 withCredentials 和 token
    if (request.url.startsWith(this.apiUrl)) {
      req = request.clone({ withCredentials: true });
      const token = this.getAuthToken();
      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    }
    return next.handle(req);
  }

  private getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
