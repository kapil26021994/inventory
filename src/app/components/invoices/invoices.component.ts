import { Component, ChangeDetectionStrategy, inject, signal, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InvoiceService } from '../../services/invoice.service';
import { Invoice } from '../../models/invoice.model';
import { RouterLink } from '@angular/router';

// Declare global libraries for PDF generation
declare var jspdf: any;
declare var html2canvas: any;

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicesComponent {
  invoiceService = inject(InvoiceService);

  selectedInvoice = signal<Invoice | null>(null);
  showModal = signal(false);

  @ViewChild('invoiceDetailContent') invoiceContent!: ElementRef<HTMLDivElement>;

  isPreparingShare = signal(false);
  shareableFile = signal<File | null>(null);

  dueInfo = computed(() => {
    const invoice = this.selectedInvoice();
    if (!invoice || typeof invoice.amountPaid !== 'number') {
      return null;
    }
    const due = invoice.total - invoice.amountPaid;
    return {
      isDue: due >= 0.01,
      label: due >= 0.01 ? 'Balance Due:' : 'Change:',
      value: Math.abs(due)
    };
  });

  viewInvoiceDetails(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedInvoice.set(null);
  }
  
  private async captureInvoiceAsCanvas(): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      if (!this.invoiceContent) {
        return reject('Invoice content element not found.');
      }
      const content = this.invoiceContent.nativeElement;
      const originalStyles = {
        maxHeight: content.style.maxHeight,
        overflowY: content.style.overflowY
      };

      // Temporarily adjust styles for full capture
      content.style.maxHeight = 'none';
      content.style.overflowY = 'visible';

      requestAnimationFrame(async () => {
        try {
          const canvas = await html2canvas(content, { scale: 2 });
          resolve(canvas);
        } catch (e) {
          reject(e);
        } finally {
          // Restore original styles
          content.style.maxHeight = originalStyles.maxHeight;
          content.style.overflowY = originalStyles.overflowY;
        }
      });
    });
  }


  async downloadInvoice() {
    const invoice = this.selectedInvoice();
    if (!invoice) return;

    try {
      const canvas = await this.captureInvoiceAsCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${invoice.id}.pdf`);
    } catch(e) {
        console.error("Error generating PDF", e);
    }
  }

  async prepareShare() {
    const invoice = this.selectedInvoice();
    if (!invoice || this.isPreparingShare()) return;

    this.isPreparingShare.set(true);
    
    try {
      const canvas = await this.captureInvoiceAsCanvas();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

      if (blob) {
        const file = new File([blob], `Invoice-${invoice.id}.png`, { type: 'image/png' });
        this.shareableFile.set(file);
      } else {
        console.error('Could not create blob from canvas for sharing.');
      }
    } catch (err) {
      console.error("Error preparing shareable image:", err);
    } finally {
      this.isPreparingShare.set(false);
    }
  }

  async executeShare() {
    const file = this.shareableFile();
    const invoice = this.selectedInvoice();
    if (!file || !invoice) return;

    const fallbackShare = () => {
      const formattedTotal = `INR ${invoice.total.toFixed(2)}`;
      const invoiceText = `*Invoice Summary from Advika collection*\n-----------------------------\nInvoice ID: ${invoice.id}\nCustomer: ${invoice.customer.name}\nTotal Amount: ${formattedTotal}\n-----------------------------\nThank you for your business!`;
      const encodedText = encodeURIComponent(invoiceText);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };
    
    if (!navigator.share || !navigator.canShare || !navigator.canShare({ files: [file] })) {
      fallbackShare();
      this.clearShare();
      return;
    }

    try {
      await navigator.share({
        files: [file],
        title: `Invoice ${invoice.id}`,
        text: `Invoice for ${invoice.customer.name} from Advika collection.`,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Error sharing invoice image:", err);
        fallbackShare();
      }
    } finally {
        this.clearShare();
    }
  }

  clearShare() {
    this.shareableFile.set(null);
  }
}