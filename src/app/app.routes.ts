import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'invoices', pathMatch: 'full' },
    {
        path: 'invoices',
        loadComponent: () => import('./components/invoices/invoices.component').then(c => c.InvoicesComponent),
        title: 'Invoices'
    },
    {
        path: 'invoices/new',
        loadComponent: () => import('./components/invoices/invoice-form.component').then(c => c.InvoiceFormComponent),
        title: 'Create Invoice'
    },
    {
        path: 'invoices/edit/:id',
        loadComponent: () => import('./components/invoices/invoice-form.component').then(c => c.InvoiceFormComponent),
        title: 'Edit Invoice'
    },]
