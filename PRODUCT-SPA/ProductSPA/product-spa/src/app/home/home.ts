import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppService } from '../services/app';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  public isLoggedIn = false;

  constructor(private _service: AppService, private _route: ActivatedRoute) { }

  ngOnInit() {
    this.isLoggedIn = this._service.checkCredentials();

    // Use ActivatedRoute to reliably read query params after Angular routing
    this._route.queryParams.subscribe(params => {
      const code = params['code'];
      if (!this.isLoggedIn && code) {
        if (sessionStorage.getItem('code_exchanging')) {
          return;
        }
        sessionStorage.setItem('code_exchanging', 'true');
        this._service.retrieveToken(code);
      } else {
        sessionStorage.removeItem('code_exchanging');
      }
    });
  }

  login() {
    this._service.getAuthUrl().then(url => {
      console.log('[AUTH URL]', url);
      window.location.href = url;
    });
  }

  logout() {
    this._service.logout();
  }
}
