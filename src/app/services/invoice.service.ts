import { Injectable, signal } from '@angular/core';
import { Invoice } from '../models/invoice.model';

// Self-contained dummy invoice data to prevent module initialization order issues.
const dummyInvoices: Invoice[] = [
    {
        id: 'INV-1001',
        date: new Date(new Date().setDate(new Date().getDate() - 1)),
        customer: { 
            id: 'cust-002', 
            name: 'Sunita Sharma', 
            phone: '9876543211', 
            email: 'sunita@example.com', 
            purchaseHistory: ['INV-1001'] 
        },
        items: [
            { 
                id: 'prod-002', 
                name: 'Designer Anarkali Gown', 
                category: 'Gown', 
                sku: 'GWN001', 
                size: 'M', 
                color: 'Maroon', 
                purchasePrice: 4000, 
                sellingPrice: 7999, 
                discountPercent: 15, 
                quantity: 8, 
                minStockAlert: 3, 
                imageUrl: 'https://picsum.photos/seed/gown1/400/400',
                cartQuantity: 1 
            }
        ],
        subtotal: 7999,
        totalDiscount: 1199.85,
        total: 6799.15,
        paymentMode: 'UPI',
        amountPaid: 7000,
    },
    {
        id: 'INV-1000',
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        customer: { 
            id: 'cust-001', 
            name: 'Ravi Kumar', 
            phone: '9876543210', 
            email: 'ravi@example.com', 
            purchaseHistory: ['INV-1000'] 
        },
        items: [
            { 
                id: 'prod-001', 
                name: 'Elegant Silk Saree', 
                category: 'Saree', 
                sku: 'SAR001', 
                size: 'Free Size', 
                color: 'Royal Blue', 
                purchasePrice: 2500, 
                sellingPrice: 4999, 
                discountPercent: 10, 
                quantity: 15, 
                minStockAlert: 5, 
                imageUrl: 'https://picsum.photos/seed/saree1/400/400',
                cartQuantity: 1 
            },
            { 
                id: 'prod-003', 
                name: 'Cotton Comfort Kurti', 
                category: 'Kurti', 
                sku: 'KUR001', 
                size: 'L', 
                color: 'Yellow', 
                purchasePrice: 800, 
                sellingPrice: 1499, 
                discountPercent: 5, 
                quantity: 25, 
                minStockAlert: 10, 
                imageUrl: 'https://picsum.photos/seed/kurti1/400/400',
                cartQuantity: 2 
            },
        ],
        subtotal: 7997,
        totalDiscount: 649.8,
        total: 7347.2,
        paymentMode: 'Card',
        amountPaid: 7347.2,
    },
];


@Injectable({ providedIn: 'root' })
export class InvoiceService {
  invoices = signal<Invoice[]>(dummyInvoices);
  private lastInvoiceNumber = signal(1001);

  generateNewInvoiceId(): string {
      this.lastInvoiceNumber.update(n => n + 1);
      return `INV-${this.lastInvoiceNumber()}`;
  }

  addInvoice(invoice: Invoice) {
    this.invoices.update(invoices => [invoice, ...invoices]);
  }
  
  getInvoiceById(id: string): Invoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }

  updateInvoice(updatedInvoice: Invoice) {
    this.invoices.update(invoices => 
      invoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv)
    );
  }
}