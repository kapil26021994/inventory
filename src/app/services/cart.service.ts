import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';
import { CartItem } from '../models/invoice.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);

  subtotal = computed(() => this.items().reduce((acc, item) => acc + (item.sellingPrice * item.cartQuantity), 0));

  totalDiscount = computed(() => this.items().reduce((acc, item) => {
      const discount = (item.sellingPrice * item.discountPercent / 100) * item.cartQuantity;
      return acc + discount;
  }, 0));

  totalAfterDiscount = computed(() => this.subtotal() - this.totalDiscount());

  total = computed(() => this.totalAfterDiscount());

  addToCart(product: Product) {
    this.items.update(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...currentItems, { ...product, cartQuantity: 1 }];
    });
  }

  removeFromCart(productId: string) {
    this.items.update(items => items.filter(item => item.id !== productId));
  }

  updateQuantity(productId: string, quantity: number) {
    this.items.update(items => items.map(item =>
      item.id === productId ? { ...item, cartQuantity: quantity } : item
    ).filter(item => item.cartQuantity > 0));
  }

  clearCart() {
    this.items.set([]);
  }
}