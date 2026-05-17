import { Component, OnInit } from '@angular/core';
import { AppService } from '../services/app';
import { ProductModel } from '../models/product.model';

@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product implements OnInit {

  products: ProductModel[] = [];
  errorMessage: string = '';

  constructor(private appService: AppService) { }

  ngOnInit(): void {
    if (this.appService.checkCredentials()) {
      this.appService.getResource<ProductModel[]>('/api/v1/products').subscribe({
        next: (data) => this.products = data,
        error: (err) => this.errorMessage = 'Failed to load products: ' + err.message
      });
    } else {
      this.errorMessage = 'You must be logged in to view products.';
    }
  }
}
