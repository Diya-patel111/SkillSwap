import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StudentProfile } from '../../../core/models/skill.model';
import { SkillBadgeComponent } from '../skill-badge/skill-badge.component';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule, RouterLink, SkillBadgeComponent],
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="relative">
          <img
            [src]="student.avatar || 'assets/default-avatar.png'"
            [alt]="student.name"
            class="w-16 h-16 rounded-xl object-cover ring-2 ring-primary/10"
          />
          <div
            class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900"
            [class]="student.isOnline ? 'bg-green-500' : 'bg-slate-400'">
          </div>
        </div>
        <div class="flex items-center gap-1 bg-primary/5 px-2 py-1 rounded-lg">
          <span class="material-symbols-outlined text-primary text-sm">star</span>
          <span class="text-xs font-bold text-primary">{{ student.rating | number:'1.1-1' }}</span>
        </div>
      </div>

      <!-- Info -->
      <div class="flex-grow">
        <h4 class="text-lg font-bold text-slate-800 dark:text-white">{{ student.name }}</h4>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">{{ student.major }}</p>

        <div class="space-y-3 mb-6">
          <!-- Teaches -->
          <div>
            <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Teaches</span>
            <div class="flex flex-wrap gap-1.5">
              @for (skill of student.teaches.slice(0, 3); track skill) {
                <span class="bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-md">{{ skill }}</span>
              }
            </div>
          </div>
          <!-- Wants to Learn -->
          <div>
            <span class="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">Wants to learn</span>
            <div class="flex flex-wrap gap-1.5">
              @for (skill of student.wants.slice(0, 3); track skill) {
                <span class="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-semibold px-2 py-1 rounded-md">{{ skill }}</span>
              }
            </div>
          </div>
        </div>
      </div>

      <button
        (click)="onRequestSwap()"
        class="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2">
        <span class="material-symbols-outlined text-[18px]">handshake</span>
        Request Swap
      </button>
    </div>
  `,
})
export class StudentCardComponent {
  @Input({ required: true }) student!: StudentProfile;
  @Output() requestSwap = new EventEmitter<StudentProfile>();

  onRequestSwap(): void {
    this.requestSwap.emit(this.student);
  }
}
