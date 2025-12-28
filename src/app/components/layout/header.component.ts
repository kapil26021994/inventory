
import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone:true,
  template: `
    <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold tracking-wider bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-xy">Advika collection</h1>
          <div class="w-px h-6 bg-slate-200 hidden sm:block"></div>
          <h2 class="text-xl font-semibold text-slate-700 hidden sm:block">{{ pageTitle() }}</h2>
      </div>
      <div class="flex items-center">
        <p class="text-sm font-medium text-slate-700 mr-3 hidden sm:block">Aditi Sharma</p>
        <img class="h-10 w-10 rounded-full object-cover ring-2 ring-offset-2 ring-indigo-500" src="https://picsum.photos/seed/user/100/100" alt="User avatar">
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  pageTitle = input.required<string>();
}
