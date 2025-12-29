import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private initialProducts: Product[] = [
    { id: 'prod-001', name: 'Elegant Silk Saree', category: 'Saree', sku: 'SAR001', size: 'Free Size', color: 'Royal Blue', purchasePrice: 2500, sellingPrice: 4999, discountPercent: 10, quantity: 15, minStockAlert: 5, imageUrl: 'https://picsum.photos/seed/saree1/400/400' },
    { id: 'prod-002', name: 'Designer Anarkali Gown', category: 'Gown', sku: 'GWN001', size: 'M', color: 'Maroon', purchasePrice: 4000, sellingPrice: 7999, discountPercent: 15, quantity: 8, minStockAlert: 3, imageUrl: 'https://picsum.photos/seed/gown1/400/400' },
    { id: 'prod-003', name: 'Cotton Comfort Kurti', category: 'Kurti', sku: 'KUR001', size: 'L', color: 'Yellow', purchasePrice: 800, sellingPrice: 1499, discountPercent: 5, quantity: 25, minStockAlert: 10, imageUrl: 'https://picsum.photos/seed/kurti1/400/400' },
    { id: 'prod-004', name: 'Classic Bandhgala Suit', category: 'Suit', sku: 'SUT001', size: 'XL', color: 'Black', purchasePrice: 5000, sellingPrice: 9999, discountPercent: 0, quantity: 12, minStockAlert: 5, imageUrl: 'https://picsum.photos/seed/suit1/400/400' },
    { id: 'prod-005', name: 'Printed Georgette Saree', category: 'Saree', sku: 'SAR002', size: 'Free Size', color: 'Pink', purchasePrice: 1200, sellingPrice: 2499, discountPercent: 0, quantity: 5, minStockAlert: 5, imageUrl: 'https://picsum.photos/seed/saree2/400/400' },
    { id: 'prod-006', name: 'Hand-embroidered Kurti', category: 'Kurti', sku: 'KUR002', size: 'S', color: 'White', purchasePrice: 1500, sellingPrice: 2999, discountPercent: 10, quantity: 3, minStockAlert: 2, imageUrl: 'https://picsum.photos/seed/kurti2/400/400' },
  ];
  
  products = signal<Product[]>(this.initialProducts);

  addProduct(product: Omit<Product, 'id'>): Product {
    const newProduct: Product = { ...product, id: `prod-${Date.now()}` };
    this.products.update(products => [...products, newProduct]);
    return newProduct;
  }

  updateProduct(updatedProduct: Product) {
    this.products.update(products => products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  }

  deleteProduct(productId: string) {
    this.products.update(products => products.filter(p => p.id !== productId));
  }

  getProductById(id: string): Product | undefined {
    return this.products().find(p => p.id === id);
  }

  updateStock(productId: string, quantityChange: number) {
    this.products.update(products => products.map(p => 
        p.id === productId ? { ...p, quantity: p.quantity + quantityChange } : p
    ));
  }
}