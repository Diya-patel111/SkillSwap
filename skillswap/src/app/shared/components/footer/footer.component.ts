import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-slate-900 text-slate-400 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <!-- Brand -->
          <div class="col-span-2 lg:col-span-2">
            <div class="flex items-center gap-2 mb-6">
              <div class="bg-primary text-white p-1 rounded flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">swap_calls</span>
              </div>
              <span class="text-xl font-bold text-white">SkillSwap</span>
            </div>
            <p class="max-w-xs mb-6 text-sm leading-relaxed">
              The ultimate student-to-student learning network. Breaking barriers to education through collaborative exchange.
            </p>
            <div class="flex gap-4">
              <a href="#" class="hover:text-white transition-colors"><span class="material-symbols-outlined">public</span></a>
              <a href="#" class="hover:text-white transition-colors"><span class="material-symbols-outlined">mail</span></a>
              <a href="#" class="hover:text-white transition-colors"><span class="material-symbols-outlined">alternate_email</span></a>
            </div>
          </div>
          <!-- Platform -->
          <div>
            <h5 class="text-white font-bold mb-4">Platform</h5>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/skills" class="hover:text-primary transition-colors">Find Skills</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">How it Works</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Success Stories</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Community Guidelines</a></li>
            </ul>
          </div>
          <!-- Support -->
          <div>
            <h5 class="text-white font-bold mb-4">Support</h5>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Safety</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <!-- Company -->
          <div>
            <h5 class="text-white font-bold mb-4">Company</h5>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" class="hover:text-primary transition-colors">Careers</a></li>
            </ul>
          </div>
        </div>
        <div class="pt-8 border-t border-slate-800 text-center text-sm">
          <p>© 2024 SkillSwap. Built with love for students worldwide.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
