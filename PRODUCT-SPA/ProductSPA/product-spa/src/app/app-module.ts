import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HomeComponent } from './home/home';
import { Product } from './product/product';

@NgModule({
  declarations: [App, HomeComponent, Product],
  imports: [BrowserModule, CommonModule, HttpClientModule, AppRoutingModule],
  providers: [provideBrowserGlobalErrorListeners(), CookieService],
  bootstrap: [App],
})
export class AppModule {}
