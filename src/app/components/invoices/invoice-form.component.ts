import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../services/invoice.service';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';
import { Customer } from '../../models/customer.model';
import { Product } from '../../models/product.model';
import { Invoice, CartItem } from '../../models/invoice.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

// Declare global libraries for PDF generation
declare var jspdf: any;
declare var html2canvas: any;

@Component({
  selector: 'app-invoice-form',
  templateUrl: './invoice-form.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private invoiceService = inject(InvoiceService);
  customerService = inject(CustomerService);
  productService = inject(ProductService);

  @ViewChild('invoicePreview') invoicePreview!: ElementRef<HTMLDivElement>;

  invoiceForm: FormGroup = this.fb.group({
    customer: [null, Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    paymentMode: ['Cash' as const, Validators.required],
    items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
    amountPaid: [0, [Validators.required, Validators.min(0)]],
    dueAmount: [0],
  });
  
  // State
  invoiceId = toSignal(this.route.params.pipe(map(p => p['id'])));
  isEditMode = computed(() => !!this.invoiceId());
  pageTitle = computed(() => this.isEditMode() ? 'Edit Invoice' : 'Create Invoice');
  draftInvoiceId = `DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Customer Search & Quick Add
  customerSearchTerm = signal('');
  selectedCustomer = signal<Customer | null>(null);
  showCustomerDropdown = signal(false);
  showAddCustomerModal = signal(false);
  newCustomerForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
    email: ['', Validators.email]
  });

  // Product Search & Quick Add
  productSearchTerms = signal<string[]>([]);
  activeProductSearchIndex = signal<number | null>(null);
  showAddProductModal = signal(false);
  addProductItemIndex = signal<number | null>(null);
  newProductForm = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    category: ['Default', Validators.required],
    sellingPrice: [0, [Validators.required, Validators.min(0)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    size: ['Free Size' as Product['size'], Validators.required],
    color: [''],
    purchasePrice: [0],
    discountPercent: [0],
    minStockAlert: [5],
    imageUrl: [''],
  });

  // Share State
  isPreparingShare = signal(false);
  shareableFile = signal<File | null>(null);

  private itemsValue = toSignal(
    this.invoiceForm.get('items')!.valueChanges.pipe(startWith(this.invoiceForm.get('items')!.value))
  );

  private amountPaid = toSignal(
      this.invoiceForm.get('amountPaid')!.valueChanges.pipe(startWith(this.invoiceForm.get('amountPaid')!.value))
  );

  totals = computed(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    
    for (const item of this.itemsValue() as any[]) {
      if (item && item.product) {
        const price = Number(item.sellingPrice) || 0;
        const quantity = Number(item.cartQuantity) || 0;
        const discountPercent = Number(item.discountPercent) || 0;

        const lineSubtotal = price * quantity;
        const lineDiscount = (lineSubtotal * discountPercent) / 100;
        
        subtotal += lineSubtotal;
        totalDiscount += lineDiscount;
      }
    }

    const total = subtotal - totalDiscount;
    return { subtotal, discount: totalDiscount, total };
  });
  
  balance = computed(() => {
    const roundedTotal = Math.round(this.totals().total);
    const paid = Number(this.amountPaid()) || 0;
    return roundedTotal - paid;
  });

  ngOnInit() {
    if (this.isEditMode()) {
      const invoice = this.invoiceService.getInvoiceById(this.invoiceId()!);
      if (invoice) {
        this.populateForm(invoice);
      } else {
        this.router.navigate(['/invoices']);
      }
    } else {
      this.addItem(); // Start with one empty item line
    }

    // When items change, reset payment fields to match the new rounded total.
    this.invoiceForm.get('items')?.valueChanges.subscribe(() => {
        const roundedTotal = Math.round(this.totals().total);
        this.invoiceForm.patchValue({
          amountPaid: roundedTotal,
          dueAmount: 0
        }, { emitEvent: false });
    });

    // When amountPaid is edited by user, update dueAmount
    this.invoiceForm.get('amountPaid')?.valueChanges.subscribe(paid => {
      const roundedTotal = Math.round(this.totals().total);
      const due = roundedTotal - (paid || 0);
      this.invoiceForm.get('dueAmount')?.patchValue(due, { emitEvent: false });
    });
      
    // When dueAmount is edited by user, update amountPaid
    this.invoiceForm.get('dueAmount')?.valueChanges.subscribe(due => {
      const roundedTotal = Math.round(this.totals().total);
      const paid = roundedTotal - (due || 0);
      this.invoiceForm.get('amountPaid')?.patchValue(paid, { emitEvent: false });
    });
  }
  
  get items(): FormArray {
    return this.invoiceForm.get('items') as FormArray;
  }

  populateForm(invoice: Invoice) {
    const amountPaid = invoice.amountPaid ?? invoice.total;
    const roundedTotal = Math.round(invoice.total);
    const roundedAmountPaid = Math.round(amountPaid);
    const dueAmount = roundedTotal - roundedAmountPaid;

    this.invoiceForm.patchValue({
        date: new Date(invoice.date).toISOString().split('T')[0],
        paymentMode: invoice.paymentMode,
        amountPaid: roundedAmountPaid,
        dueAmount: dueAmount
    }, { emitEvent: false }); // Prevent triggering valueChanges on initial load
    this.selectCustomer(invoice.customer);
    
    const itemFGs = invoice.items.map(item => {
        const product = this.productService.getProductById(item.id);
        if(product) {
            this.productSearchTerms.update(terms => [...terms, product.name]);
            return this.fb.group({
                product: [product, Validators.required],
                cartQuantity: [item.cartQuantity, [Validators.required, Validators.min(1)]],
                sellingPrice: [item.sellingPrice, [Validators.required, Validators.min(0)]],
                discountPercent: [item.discountPercent, [Validators.min(0), Validators.max(100)]]
            });
        }
        return null;
    }).filter(fg => fg !== null) as FormGroup[];
    
    this.invoiceForm.setControl('items', this.fb.array(itemFGs), { emitEvent: false }); // Prevent triggering valueChanges on initial load
  }

  createItem(): FormGroup {
    return this.fb.group({
      product: [null, Validators.required],
      cartQuantity: [1, [Validators.required, Validators.min(1)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      discountPercent: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
    this.productSearchTerms.update(terms => [...terms, '']);
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    this.productSearchTerms.update(terms => terms.filter((_, i) => i !== index));
  }

  // --- Customer Logic ---
  filteredCustomers = computed(() => {
    const term = this.customerSearchTerm().toLowerCase();
    if (!term) return [];
    return this.customerService.customers().filter(
      c => c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
  });

  onCustomerSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.customerSearchTerm.set(term);
    this.showCustomerDropdown.set(term.length > 0);
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer.set(customer);
    this.invoiceForm.get('customer')?.setValue(customer);
    this.customerSearchTerm.set(customer.name);
    this.showCustomerDropdown.set(false);
  }

  openAddCustomerModal() {
    this.newCustomerForm.reset();
    this.newCustomerForm.patchValue({ name: this.customerSearchTerm() });
    this.showCustomerDropdown.set(false);
    this.showAddCustomerModal.set(true);
  }

  closeAddCustomerModal() {
    this.showAddCustomerModal.set(false);
  }

  saveNewCustomer() {
    if (this.newCustomerForm.invalid) return;
    const newCustomerData = this.newCustomerForm.value as Omit<Customer, 'id' | 'purchaseHistory'>;
    const newCustomer = this.customerService.addCustomer(newCustomerData);
    this.selectCustomer(newCustomer);
    this.closeAddCustomerModal();
  }
  
  // --- Product Logic ---
  filteredProducts(index: number) {
    const term = this.productSearchTerms()[index]?.toLowerCase() || '';
    if (!term) return [];
    return this.productService.products().filter(
      p => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
  }

  onProductSearch(event: Event, index: number) {
    const term = (event.target as HTMLInputElement).value;
    this.productSearchTerms.update(terms => {
        terms[index] = term;
        return [...terms];
    });
    this.activeProductSearchIndex.set(index);
  }

  selectProduct(product: Product, index: number) {
    const item = this.items.at(index) as FormGroup;
    item.patchValue({
      product: product,
      sellingPrice: product.sellingPrice,
      discountPercent: product.discountPercent,
    });
    this.productSearchTerms.update(terms => {
        terms[index] = product.name;
        return [...terms];
    });
    this.activeProductSearchIndex.set(null);
  }

  openAddProductModal(index: number) {
    this.addProductItemIndex.set(index);
    this.newProductForm.reset({
        size: 'Free Size',
        category: 'Default',
        sellingPrice: 0,
        quantity: 1,
        discountPercent: 0,
        minStockAlert: 5,
    });
    this.newProductForm.patchValue({ name: this.productSearchTerms()[index] });
    this.activeProductSearchIndex.set(null);
    this.showAddProductModal.set(true);
  }

  closeAddProductModal() {
    this.showAddProductModal.set(false);
    this.addProductItemIndex.set(null);
  }

  saveNewProduct() {
    if (this.newProductForm.invalid) return;
    
    const formValue = this.newProductForm.getRawValue();
    const imageUrl = formValue.imageUrl || `https://picsum.photos/seed/${formValue.sku || Date.now()}/400/400`;

    const productData:any= {
        name: formValue.name,
        category: formValue.category,
        sku: formValue.sku,
        size: formValue.size,
        color: formValue.color ?? '',
        purchasePrice: formValue.purchasePrice,
        sellingPrice: formValue.sellingPrice,
        discountPercent: formValue.discountPercent,
        quantity: formValue.quantity,
        minStockAlert: formValue.minStockAlert,
        imageUrl: imageUrl,
    };

    const newProduct :any= this.productService.addProduct(productData);
    const itemIndex = this.addProductItemIndex();
    if (itemIndex !== null) {
        this.selectProduct(newProduct, itemIndex);
    }
    this.closeAddProductModal();
  }

  // --- Save ---
  saveInvoice(): void {
    this.invoiceForm.markAllAsTouched();
    if (this.invoiceForm.invalid) {
      return;
    }

    const formValue = this.invoiceForm.getRawValue();
    
    const invoiceItems: CartItem[] = formValue.items
      .filter((item: any) => item.product)
      .map((item: any) => ({
        ...item.product,
        cartQuantity: Number(item.cartQuantity) || 1,
        sellingPrice: Number(item.sellingPrice) || 0,
        discountPercent: Number(item.discountPercent) || 0,
      }));
    
    if (invoiceItems.length === 0) {
        return;
    }
    
    const currentTotals = this.totals();
    const finalInvoice: Omit<Invoice, 'id'> = {
      date: new Date(formValue.date),
      customer: formValue.customer,
      items: invoiceItems,
      subtotal: currentTotals.subtotal,
      totalDiscount: currentTotals.discount,
      total: currentTotals.total,
      paymentMode: formValue.paymentMode,
      amountPaid: formValue.amountPaid
    };

    if (this.isEditMode()) {
      this.invoiceService.updateInvoice({ ...finalInvoice, id: this.invoiceId()! });
    } else {
      this.invoiceService.addInvoice({ ...finalInvoice, id: this.invoiceService.generateNewInvoiceId() });
    }

    this.router.navigate(['/invoices']);
  }
  
  // --- Payment Input Handling ---
  roundAndSync(controlName: 'amountPaid' | 'dueAmount'): void {
    const control = this.invoiceForm.get(controlName);
    if (control) {
        const roundedValue = Math.round(control.value || 0);
        // Only set value if it has changed to prevent potential cycles if blur fires unnecessarily
        if (control.value !== roundedValue) {
            control.setValue(roundedValue);
        }
    }
  }

  // --- PDF Generation & Sharing ---
  private async captureInvoiceAsCanvas(): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      if (!this.invoicePreview) {
        return reject('Invoice preview element not found.');
      }
      const content = this.invoicePreview.nativeElement;
      
      requestAnimationFrame(async () => {
        try {
          const canvas = await html2canvas(content, { scale: 2 });
          resolve(canvas);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async downloadInvoicePdf() {
    const invoiceId = this.isEditMode() ? this.invoiceId()! : this.draftInvoiceId;
    if (!this.invoiceForm.get('customer')?.value) {
        alert('Please select a customer before downloading the invoice.');
        return;
    }

    try {
      const canvas = await this.captureInvoiceAsCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${invoiceId}.pdf`);
    } catch(e) {
        console.error("Error generating PDF", e);
    }
  }

  async prepareShare() {
    const invoiceId = this.isEditMode() ? this.invoiceId()! : this.draftInvoiceId;
    if (!this.invoiceForm.get('customer')?.value) {
        alert('Please select a customer before sharing the invoice.');
        return;
    }
    if (this.isPreparingShare()) return;

    this.isPreparingShare.set(true);
    
    try {
      const canvas = await this.captureInvoiceAsCanvas();
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));

      if (blob) {
        const file = new File([blob], `Invoice-${invoiceId}.png`, { type: 'image/png' });
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
    if (!file) return;

    const customer = this.invoiceForm.get('customer')?.value;
    const total = this.totals().total;
    const invoiceId = this.isEditMode() ? this.invoiceId()! : this.draftInvoiceId;

    const fallbackShare = () => {
      const formattedTotal = `INR ${total.toFixed(2)}`;
      const invoiceText = `*Invoice Summary from Advika collection*\n-----------------------------\nInvoice ID: ${invoiceId}\nCustomer: ${customer.name}\nTotal Amount: ${formattedTotal}\n-----------------------------\nThank you for your business!`;
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
        title: `Invoice ${invoiceId}`,
        text: `Invoice for ${customer.name} from Advika collection.`,
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
