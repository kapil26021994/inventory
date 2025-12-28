import { Product } from './product.model';
import { Customer } from './customer.model';

export interface CartItem extends Product {
  cartQuantity: number;
}

export interface Invoice {
  id: string;
  date: Date;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMode: 'Cash' | 'UPI' | 'Card';
  totalDiscount: number;
  amountPaid: number;
}