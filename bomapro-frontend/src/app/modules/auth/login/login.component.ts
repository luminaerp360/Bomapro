import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';
  success = '';
  mode: 'login' | 'signup' = 'login';
  signupName = '';
  signupEmail = '';
  signupPassword = '';
  showSignupPassword = false;

  constructor(
    private authService: AuthService,
    public themeService: ThemeService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Handle Google OAuth callback
    this.route.queryParams.subscribe((params) => {
      if (params['token'] && params['user']) {
        try {
          const user = JSON.parse(params['user']);
          const tenants = params['tenants'] ? JSON.parse(params['tenants']) : [];
          const activeTenantId = params['activeTenantId'] || '';
          this.authService.handleGoogleCallback(params['token'], user, tenants, activeTenantId);
          this.router.navigate(['/dashboard']);
        } catch (e) {
          this.error = 'Failed to process login';
        }
      }
      if (params['error']) {
        this.error = params['message'] || 'Authentication failed';
      }
      if (params['verify']) {
        this.authService.verifyEmail(params['verify']).subscribe({
          next: (res) => { this.success = res.message; },
          error: (err) => { this.error = err.error?.message || 'Verification failed'; },
        });
      }
    });
  }

  login(): void {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid credentials';
      },
    });
  }

  signup(): void {
    if (!this.signupName || !this.signupEmail || !this.signupPassword) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.loading = true;
    this.error = '';
    this.authService.signup(this.signupName, this.signupEmail, this.signupPassword).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message;
        this.mode = 'login';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Signup failed';
      },
    });
  }

  googleLogin(): void {
    this.authService.googleLogin();
  }
}
