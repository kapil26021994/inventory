import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export interface Sender {
  name: string;
  mobile: string;
  address: string;
}

export interface Client {
  name: string;
  mobile: string;
  address: string;
}

export interface Item {
  description: string;
  qty: number;
  rate: number;
}

export interface Invoice {
  invoiceNumber: string;
  currency: string;
  dateIssued: string;
  dueDate: string;
  sender: Sender;
  client: Client;
  items: Item[];
  taxRate: number; // as a percentage
  notes: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
i: any;
  private getTodayString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  private readonly initialInvoice: Invoice = {
    invoiceNumber: 'INV-2024-01',
    currency: 'USD',
    dateIssued: this.getTodayString(),
    dueDate: this.getTodayString(),
    sender: {
      name: 'Advika Collection',
      mobile: '7898546131',
      address: '71,C Suvidhi Nagar,Indore',
    },
    client: {
      name: '',
      mobile: '',
      address: '',
    },
    items: [
      { description: 'Web Design Consultation', qty: 4, rate: 150.00 },
      { description: 'UI Implementation', qty: 10, rate: 85.00 },
    ],
    taxRate: 0,
    notes: 'Thank you for your business. Please contact us for any questions regarding this invoice.',
  };

  invoice = signal<Invoice>(this.initialInvoice);

  subtotal = computed(() => {
    return this.invoice().items.reduce((acc, item) => acc + (item.qty || 0) * (item.rate || 0), 0);
  });

  taxAmount = computed(() => {
    return this.subtotal() * (this.invoice().taxRate / 100);
  });

  total = computed(() => {
    return this.subtotal() + this.taxAmount();
  });

  // Expose as observables for template compatibility with async pipe
  invoice$: Observable<Invoice> = toObservable(this.invoice);
  subtotal$: Observable<number> = toObservable(this.subtotal);
  taxAmount$: Observable<number> = toObservable(this.taxAmount);
  total$: Observable<number> = toObservable(this.total);

  addItem(): void {
    this.invoice.update(currentInvoice => ({
      ...currentInvoice,
      items: [...currentInvoice.items, { description: '', qty: 1, rate: 0 }],
    }));
  }

  removeItem(index: number): void {
    this.invoice.update(currentInvoice => ({
      ...currentInvoice,
      items: currentInvoice.items.filter((_, i) => i !== index),
    }));
  }

  updateField<K extends keyof Invoice>(field: K, value: Invoice[K]) {
    this.invoice.update(currentInvoice => ({ ...currentInvoice, [field]: value }));
  }

  updateSenderField(field: keyof Sender, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.invoice.update(currentInvoice => ({
      ...currentInvoice,
      sender: { ...currentInvoice.sender, [field]: value },
    }));
  }

  updateClientField(field: keyof Client, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.invoice.update(currentInvoice => ({
      ...currentInvoice,
      client: { ...currentInvoice.client, [field]: value },
    }));
  }

  updateItem(index: number, field: keyof Item, event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;

    this.invoice.update(invoice => {
      const newItems = [...invoice.items];
      const itemToUpdate = { ...newItems[index] };

      if (field === 'description') {
        itemToUpdate.description = value;
      } else {
        const numericValue = parseFloat(value);
        itemToUpdate[field] = isNaN(numericValue) ? 0 : numericValue;
      }

      newItems[index] = itemToUpdate;
      return { ...invoice, items: newItems };
    });
  }

  async downloadAsPdf(): Promise<void> {
    const jsPDF = (await import('jspdf')).jsPDF;
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
    // Calculate width/height to fit A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = canvas.height * (imgWidth / canvas.width);
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('invoice.pdf');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const timeZoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.valueOf() + timeZoneOffset);

    // FIX: Corrected typo from `toLocaleDateDateString` to `toLocaleDateString`.
    return adjustedDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
async shareInvoiceMobile() {
  const jsPDF = (await import('jspdf')).jsPDF;
  const html2canvas = (await import('html2canvas')).default;

  const element = document.getElementById('invoice-preview');
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'pt', 'a4');
  pdf.addImage(imgData, 'PNG', 0, 0, 595, 842);

  const blob = pdf.output('blob');

  if ((navigator as any).share) {
    const file = new File([blob], 'invoice.pdf', {
      type: 'application/pdf'
    });

    await (navigator as any).share({
      files: [file],
      title: 'Invoice',
      text: 'Invoice PDF'
    });
  } else {
    alert('Direct file sharing works only on mobile');
  }
}

}
