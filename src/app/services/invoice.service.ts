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
                sellingPrice: 7999, 
                discountPercent: 15,
                cartQuantity: 1,
                isCustom: false,
                sku: 'GWN001',
                imageUrl: 'https://picsum.photos/seed/gown1/400/400'
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
                sellingPrice: 4999, 
                discountPercent: 10,
                cartQuantity: 1,
                isCustom: false,
                sku: 'SAR001',
                imageUrl: 'https://picsum.photos/seed/saree1/400/400'
            },
            { 
                id: 'prod-003', 
                name: 'Cotton Comfort Kurti',
                sellingPrice: 1499, 
                discountPercent: 5, 
                cartQuantity: 2,
                isCustom: false,
                sku: 'KUR001',
                imageUrl: 'https://picsum.photos/seed/kurti1/400/400'
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