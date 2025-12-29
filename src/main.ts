import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, withHashLocation, RouterModule } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom, isDevMode } from '@angular/core';
import {routes } from './app/app.routes';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideHttpClient(),
    importProvidersFrom(ReactiveFormsModule),
    importProvidersFrom(RouterModule),
    CurrencyPipe,
    DatePipe,
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
],
}).catch((err) => console.error(err))