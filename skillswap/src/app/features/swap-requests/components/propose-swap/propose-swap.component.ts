import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SkillService } from '../../../../core/services/skill.service';
import { SwapRequestService } from '../../../../core/services/swap-request.service';
import { AuthService } from '../../../../core/services/auth.service';
import { StudentProfile, Skill } from '../../../../core/models/skill.model';

@Component({
  selector: 'app-propose-swap',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar />

    <main class="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Back -->
        <a routerLink="/skills" class="flex items-center gap-1.5 text-slate-500 hover:text-primary text-sm font-medium mb-8 transition-all">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span> Back to Browse
        </a>

        @if (isLoading) {
          <div class="bg-white dark:bg-slate-900 rounded-2xl p-10 animate-pulse h-96 border border-slate-100 dark:border-slate-800"></div>
        } @else if (partner) {
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <!-- Partner Header -->
            <div class="bg-gradient-to-r from-primary/10 to-primary/5 px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-5">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl font-extrabold text-primary">
                {{ getInitials(partner.name) }}
              </div>
              <div>
                <p class="text-xs text-primary font-semibold uppercase tracking-widest mb-0.5">Propose a Skill Swap</p>
                <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">{{ partner.name }}</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ partner.university }}</p>
              </div>
            </div>

            <div class="p-8 space-y-8">
              <form [formGroup]="swapForm" (ngSubmit)="submit()">

                <!-- Their skill you want -->
                <div class="space-y-3">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="material-symbols-outlined text-primary text-[22px]">school</span>
                    <h3 class="font-bold text-slate-900 dark:text-white">I want to learn from <span class="text-primary">{{ partner.name }}</span></h3>
                  </div>
                  <p class="text-sm text-slate-400 mb-3">Select one skill you'd like {{ partner.name }} to teach you:</p>

                  @if (partner.teaches.length === 0) {
                    <p class="text-sm text-slate-400 italic">This user hasn't listed any skills to teach.</p>
                  }
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    @for (skill of partner.teaches; track skill) {
                      <label [class]="swapForm.get('skillRequested')?.value === skill ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-primary/40'"
                        class="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all">
                        <input type="radio" formControlName="skillRequested" [value]="skill" class="accent-primary w-4 h-4" />
                        <span class="material-symbols-outlined text-primary text-[20px]">auto_stories</span>
                        <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ skill }}</span>
                      </label>
                    }
                  </div>
                  @if (swapForm.get('skillRequested')?.invalid && swapForm.get('skillRequested')?.touched) {
                    <p class="text-red-500 text-xs mt-1">Please select a skill you want to learn.</p>
                  }
                </div>

                <!-- My skill I'll teach -->
                <div class="space-y-3">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="material-symbols-outlined text-emerald-500 text-[22px]">emoji_objects</span>
                    <h3 class="font-bold text-slate-900 dark:text-white">In exchange, I'll teach</h3>
                  </div>
                  <p class="text-sm text-slate-400 mb-3">Select one of your skills to offer:</p>

                  @if (mySkills.length === 0) {
                    <p class="text-sm text-amber-500 italic">You haven't added any skills to your profile yet. <a routerLink="/profile" class="underline">Add skills</a></p>
                  }
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    @for (skill of mySkills; track skill) {
                      <label [class]="swapForm.get('skillOffered')?.value === skill ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-100 dark:shadow-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400/60'"
                        class="flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all">
                        <input type="radio" formControlName="skillOffered" [value]="skill" class="accent-emerald-500 w-4 h-4" />
                        <span class="material-symbols-outlined text-emerald-500 text-[20px]">auto_fix_high</span>
                        <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ skill }}</span>
                      </label>
                    }
                  </div>
                  @if (swapForm.get('skillOffered')?.invalid && swapForm.get('skillOffered')?.touched) {
                    <p class="text-red-500 text-xs mt-1">Please select a skill you'll offer.</p>
                  }
                </div>

                <!-- Message -->
                <div class="space-y-2">
                  <label class="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">chat</span>
                    Personal Message <span class="text-xs text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    formControlName="message"
                    rows="4"
                    placeholder="Hi! I saw you teach Spanish — I'd love to exchange Python lessons. I'm currently at intermediate level and available on evenings..."
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-slate-400">
                  </textarea>
                </div>

                <!-- Error -->
                @if (errorMsg) {
                  <div class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-4 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-800">
                    <span class="material-symbols-outlined text-[18px]">error</span> {{ errorMsg }}
                  </div>
                }

                <!-- Buttons -->
                <div class="flex gap-3 pt-2">
                  <a routerLink="/skills" class="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Cancel
                  </a>
                  <button type="submit" [disabled]="isSubmitting"
                    class="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed">
                    @if (isSubmitting) {
                      <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    } @else {
                      <span class="material-symbols-outlined text-[20px]">send</span>
                    }
                    Send Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        } @else {
          <div class="text-center py-16 text-slate-400">
            <span class="material-symbols-outlined" style="font-size:3rem">person_off</span>
            <p class="mt-4">User not found.</p>
          </div>
        }
      </div>
    </main>
  `,
})
export class ProposeSwapComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private skillService = inject(SkillService);
  private swapService = inject(SwapRequestService);
  private authService = inject(AuthService);

  partner: StudentProfile | null = null;
  mySkills: string[] = [];
  isLoading = true;
  isSubmitting = false;
  errorMsg = '';

  swapForm: FormGroup = this.fb.group({
    skillRequested: ['', Validators.required],
    skillOffered: ['', Validators.required],
    message: [''],
  });

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.router.navigate(['/skills']);
      return;
    }

    this.skillService.getStudentById(userId).subscribe({
      next: (student) => {
        this.partner = student;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });

    const me = this.authService.getCurrentUser();
    this.mySkills = me?.skillsOffered?.map(s => (typeof s === 'string' ? s : (s as any).name)) ?? [];
  }

  submit(): void {
    this.swapForm.markAllAsTouched();
    if (this.swapForm.invalid || !this.partner) return;

    this.isSubmitting = true;
    this.errorMsg = '';
    const { skillRequested, skillOffered, message } = this.swapForm.value;

    this.swapService.createRequest({
      receiverId:     this.partner._id,
      offeredSkill:   skillOffered,
      requestedSkill: skillRequested,
      message,
    }).subscribe({
      next: () => this.router.navigate(['/swaps']),
      error: (err) => {
        this.errorMsg = err?.error?.message ?? 'Failed to send request. Please try again.';
        this.isSubmitting = false;
      },
    });
  }

  getInitials(name: string | undefined | null): string {
    if (!name) return '?';
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?';
  }
}
