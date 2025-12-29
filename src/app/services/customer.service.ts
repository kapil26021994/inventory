
import { Injectable, signal } from '@angular/core';
import { Customer } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
    private initialCustomers: Customer[] = [
        { id: 'cust-001', name: 'Ravi Kumar', phone: '9876543210', email: 'ravi@example.com', purchaseHistory: [] },
        { id: 'cust-002', name: 'Sunita Sharma', phone: '9876543211', email: 'sunita@example.com', purchaseHistory: [] },
        { id: 'cust-003', name: 'Anjali Verma', phone: '9876543212', email: 'anjali@example.com', purchaseHistory: [] },
    ];
  customers = signal<Customer[]>(this.initialCustomers);
  
  addCustomer(customer: Omit<Customer, 'id' | 'purchaseHistory'>): Customer {
      const newCustomer: Customer = {
          ...customer,
          id: `cust-${Date.now()}`,
          purchaseHistory: [],
      };
      this.customers.update(customers => [...customers, newCustomer]);
      return newCustomer;
  }

  updateCustomer(updatedCustomer: Customer) {
    this.customers.update(customers => 
      customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
  }

  deleteCustomer(customerId: string) {
    this.customers.update(customers => customers.filter(c => c.id !== customerId));
  }
  
  getCustomerByPhone(phone: string): Customer | undefined {
      return this.customers().find(c => c.phone === phone);
  }
}