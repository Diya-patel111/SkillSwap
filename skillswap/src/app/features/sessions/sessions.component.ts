import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { SessionService } from '../../core/services/session.service';
import { SwapRequestService } from '../../core/services/swap-request.service';
import { ToastService } from '../../core/services/toast.service';
import { Session, UpdateSessionPayload, CreateSessionPayload } from '../../core/models/session.model';
import { SwapRequest } from '../../core/models/swap-request.model';
import { environment } from '../../../environments/environment';

type ActiveTab = 'upcoming' | 'past';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, DatePipe],
  template: `
    <div class="min-h-screen flex bg-slate-50 dark:bg-background-dark">
      <app-sidebar />

      <div class="flex-1 ml-64 flex flex-col min-h-screen">

        <!-- Header -->
        <header class="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 py-4">
          <h1 class="text-xl font-bold text-slate-900 dark:text-white">Sessions</h1>
          <p class="text-sm text-slate-500">Schedule and manage your learning sessions</p>
        </header>

        <main class="flex-1 p-8 space-y-8">

          <!-- ── ACTIVE SWAP PARTNERS ────────────────────────────────── -->
          @if (!loading()) {
            <section>
              <div class="flex items-center gap-2 mb-3">
                <span class="flex items-center justify-center size-7 rounded-lg bg-emerald-100">
                  <span class="material-symbols-outlined text-emerald-600 text-[18px]">handshake</span>
                </span>
                <h2 class="font-bold text-slate-900 dark:text-white text-base">Active Swap Partners</h2>
                @if (acceptedSwaps().length > 0) {
                  <span class="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                    {{ acceptedSwaps().length }} active
                  </span>
                }
              </div>
              <p class="text-sm text-slate-500 mb-4">Schedule as many sessions as you like with any of your active swap partners.</p>

              @if (acceptedSwaps().length === 0) {
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200
                            dark:border-slate-700 flex flex-col items-center justify-center py-12 text-center gap-3">
                  <span class="flex items-center justify-center size-14 rounded-2xl bg-emerald-50">
                    <span class="material-symbols-outlined text-emerald-400 text-3xl">group_add</span>
                  </span>
                  <div>
                    <h3 class="font-bold text-slate-800 dark:text-white">No active swap partners yet</h3>
                    <p class="text-slate-500 text-sm mt-1 max-w-sm">
                      Once both you and another user accept a swap request, their profile will appear here so you can schedule sessions together.
                    </p>
                  </div>
                </div>
              }

              @if (acceptedSwaps().length > 0) {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (swap of acceptedSwaps(); track swap._id) {
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100
                                dark:border-slate-800 p-5 flex flex-col gap-4
                                hover:shadow-md hover:border-emerald-200 transition-all">

                      <!-- Partner profile -->
                      <div class="flex items-center gap-3">
                        <a [routerLink]="['/profile', partnerOf(swap)._id]" class="relative shrink-0 cursor-pointer">
                          <img [src]="avatarOfUser(partnerOf(swap))" [alt]="partnerOf(swap).name"
                               class="size-14 rounded-2xl object-cover ring-2 ring-emerald-100
                                      hover:ring-primary transition-all" />
                          <span class="absolute -bottom-1 -right-1 flex items-center justify-center
                                       size-5 rounded-full bg-emerald-500 ring-2 ring-white">
                            <span class="material-symbols-outlined text-white text-[11px]">check</span>
                          </span>
                        </a>
                        <div class="min-w-0">
                          <a [routerLink]="['/profile', partnerOf(swap)._id]"
                             class="font-bold text-slate-900 dark:text-white truncate hover:text-primary
                                    transition-colors cursor-pointer">
                            {{ partnerOf(swap).name }}
                          </a>
                          @if (partnerOf(swap).university) {
                            <p class="text-xs text-slate-400 truncate mt-0.5">
                              <span class="material-symbols-outlined text-[12px] align-middle">school</span>
                              {{ partnerOf(swap).university }}
                            </p>
                          }
                        </div>
                      </div>

                      <!-- Skill exchange -->
                      <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2">
                        <span class="text-xs font-semibold text-primary truncate flex-1">{{ swap.offeredSkill }}</span>
                        <span class="material-symbols-outlined text-slate-400 text-[16px] shrink-0">sync_alt</span>
                        <span class="text-xs font-semibold text-emerald-600 truncate flex-1 text-right">{{ swap.requestedSkill }}</span>
                      </div>

                      <!-- Session count badge -->
                      @if ((sessionCountBySwap().get(swap._id!) ?? 0) > 0) {
                        <div class="flex items-center gap-1.5 text-xs text-slate-500">
                          <span class="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
                          {{ sessionCountBySwap().get(swap._id!) }} session{{ (sessionCountBySwap().get(swap._id!) ?? 0) > 1 ? 's' : '' }} scheduled so far
                        </div>
                      }

                      <!-- Action -->
                      <button (click)="openSchedule(swap)"
                        class="mt-auto w-full flex items-center justify-center gap-2 bg-primary text-white
                               px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90
                               active:scale-95 transition-all">
                        <span class="material-symbols-outlined text-[18px]">event_available</span>
                        Schedule a Session
                      </button>
                    </div>
                  }
                </div>
              }

            </section>
          }

          <!-- ── MY SESSIONS ─────────────────────────────────────────── -->
          <section>
          <div class="flex items-center gap-2 mb-4">
            <span class="flex items-center justify-center size-7 rounded-lg bg-primary/10">
              <span class="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
            </span>
            <h2 class="font-bold text-slate-900 dark:text-white text-base">My Sessions</h2>
          </div>

          <!-- Tabs -->
          <div class="flex gap-2 bg-white dark:bg-slate-900 rounded-2xl p-1.5 w-fit border border-slate-100 dark:border-slate-800 mb-5">
            <button (click)="activeTab.set('upcoming')"
              [class]="activeTab() === 'upcoming'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <span class="material-symbols-outlined text-[18px]">upcoming</span>
              Upcoming
              @if (upcomingSessions().length > 0) {
                <span class="bg-white/20 text-current text-xs rounded-full px-1.5 py-0.5">
                  {{ upcomingSessions().length }}
                </span>
              }
            </button>
            <button (click)="activeTab.set('past')"
              [class]="activeTab() === 'past'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all">
              <span class="material-symbols-outlined text-[18px]">history</span>
              Past
            </button>
          </div>

          <!-- Loading -->
          @if (loading()) {
            <div class="flex justify-center py-20">
              <div class="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }

          <!-- Empty state -->
          @if (!loading() && activeList().length === 0) {
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800
                        flex flex-col items-center justify-center py-14 text-center gap-3">
              <span class="flex items-center justify-center size-14 rounded-2xl bg-primary/10">
                <span class="material-symbols-outlined text-primary text-3xl">
                  {{ activeTab() === 'upcoming' ? 'event_upcoming' : 'event_note' }}
                </span>
              </span>
              <div>
                <h3 class="font-bold text-slate-900 dark:text-white">
                  {{ activeTab() === 'upcoming' ? 'No upcoming sessions' : 'No past sessions' }}
                </h3>
                <p class="text-slate-500 text-sm mt-1">
                  {{ activeTab() === 'upcoming'
                    ? 'Schedule a session from an accepted swap above.'
                    : 'Completed sessions will appear here.' }}
                </p>
              </div>
            </div>
          }

          <!-- Session cards -->
          @if (!loading() && activeList().length > 0) {
            <div class="space-y-4 mt-0">
              @for (session of activeList(); track session._id) {
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                  <div class="flex items-start gap-5">

                    <!-- Date box -->
                    <div class="shrink-0 flex flex-col items-center justify-center
                                w-16 h-16 rounded-2xl text-center shadow-sm"
                         [class.bg-primary]="session.status === 'scheduled'"
                         [class.text-white]="session.status === 'scheduled'"
                         [class.bg-slate-100]="session.status !== 'scheduled'"
                         [class.text-slate-500]="session.status !== 'scheduled'">
                      <span class="text-xs font-semibold uppercase opacity-80">
                        {{ session.scheduledAt | date:'MMM' }}
                      </span>
                      <span class="text-2xl font-black leading-tight">
                        {{ session.scheduledAt | date:'d' }}
                      </span>
                    </div>

                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-1">
                        <h3 class="font-bold text-slate-900 dark:text-white">{{ session.title }}</h3>
                        <span [class]="statusBadge(session.status)"
                              class="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {{ session.status | titlecase }}
                        </span>
                      </div>

                      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mb-3">
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-[16px]">schedule</span>
                          {{ session.scheduledAt | date:'EEE, MMM d · h:mm a' }}
                        </span>
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-[16px]">timer</span>
                          {{ session.durationMins }} min
                        </span>
                        <span class="flex items-center gap-1">
                          <span class="material-symbols-outlined text-[16px]">location_on</span>
                          {{ session.location || 'Online' }}
                        </span>
                      </div>

                      <!-- Participants -->
                      <div class="flex items-center gap-2 mb-3">
                        @for (p of session.participants; track p._id) {
                          <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800
                                      rounded-full px-3 py-1">
                            <img [src]="avatarOf(p)" [alt]="p.name"
                                 class="size-5 rounded-full object-cover" />
                            <span class="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {{ p.name }}
                            </span>
                          </div>
                        }
                      </div>

                      <!-- Notes preview -->
                      @if (session.notes) {
                        <p class="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800
                                  rounded-xl px-4 py-2.5 italic line-clamp-2">
                          "{{ session.notes }}"
                        </p>
                      }
                    </div>

                    <!-- Actions -->
                    <div class="flex flex-col gap-2 shrink-0">
                      @if (session.status === 'scheduled') {
                        @if (session.meetLink) {
                          <a [href]="session.meetLink" target="_blank" rel="noopener"
                             class="flex items-center gap-1.5 bg-emerald-50 text-emerald-700
                                    hover:bg-emerald-100 px-4 py-2 rounded-xl text-sm font-semibold transition">
                            <span class="material-symbols-outlined text-[18px]">video_call</span>
                            Join
                          </a>
                        }
                        <button (click)="openEdit(session)"
                          class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700
                                 text-slate-600 dark:text-slate-300 hover:bg-slate-200 px-4 py-2
                                 rounded-xl text-sm font-semibold transition">
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                          Edit
                        </button>
                        <button (click)="confirmCancel(session)"
                          class="flex items-center gap-1.5 bg-red-50 text-red-600
                                 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-semibold transition">
                          <span class="material-symbols-outlined text-[18px]">cancel</span>
                          Cancel
                        </button>
                      }
                      @if (session.status === 'scheduled' && isOverdue(session)) {
                        <button (click)="markDone(session)"
                          class="flex items-center gap-1.5 bg-blue-50 text-blue-700
                                 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-semibold transition">
                          <span class="material-symbols-outlined text-[18px]">task_alt</span>
                          Mark Done
                        </button>
                      }
                    </div>

                  </div>
                </div>
              }
            </div>
          }

          </section>

        </main>
      </div>
    </div>

    <!-- ── Schedule Session Modal ─────────────────────────────────── -->
    @if (scheduleTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
           (click)="closeSchedule()">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg
                    border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
             (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 class="font-extrabold text-slate-900 dark:text-white">Schedule a Session</h3>
            <button (click)="closeSchedule()"
              class="flex items-center justify-center size-8 rounded-lg text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Partner banner -->
          <div class="mx-6 mt-5 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20
                      border border-emerald-100 dark:border-emerald-800 rounded-xl px-4 py-3">
            <img [src]="avatarOfUser(partnerOf(scheduleTarget()!))"
                 [alt]="partnerOf(scheduleTarget()!).name"
                 class="size-9 rounded-full object-cover ring-2 ring-emerald-200" />
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-800 dark:text-white truncate">
                {{ partnerOf(scheduleTarget()!).name }}
              </p>
              <p class="text-xs text-slate-500">
                <span class="text-primary font-medium">{{ scheduleTarget()!.offeredSkill }}</span>
                <span class="mx-1">⇄</span>
                <span class="text-emerald-600 font-medium">{{ scheduleTarget()!.requestedSkill }}</span>
              </p>
            </div>
          </div>

          <!-- Form -->
          <div class="px-6 py-5 space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Title <span class="text-red-400">*</span>
              </label>
              <input [(ngModel)]="scheduleForm.title" placeholder="e.g. React Hooks with Sneha"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date & Time <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="scheduleForm.scheduledAt" type="datetime-local"
                  class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                         dark:border-slate-700 rounded-xl outline-none focus:border-primary
                         text-slate-800 dark:text-white transition" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Duration
                </label>
                <select [(ngModel)]="scheduleForm.durationMins"
                  class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                         dark:border-slate-700 rounded-xl outline-none focus:border-primary
                         text-slate-800 dark:text-white transition">
                  <option [ngValue]="30">30 min</option>
                  <option [ngValue]="45">45 min</option>
                  <option [ngValue]="60">1 hour</option>
                  <option [ngValue]="90">1.5 hours</option>
                  <option [ngValue]="120">2 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Meet Link <span class="text-slate-400 font-normal">(Google Meet / Zoom)</span>
              </label>
              <input [(ngModel)]="scheduleForm.meetLink" type="url" placeholder="https://meet.google.com/…"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition" />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </label>
              <input [(ngModel)]="scheduleForm.location" placeholder="Online / Library / Cafe…"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition" />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Agenda
              </label>
              <textarea [(ngModel)]="scheduleForm.notes" rows="3"
                placeholder="What topics will you cover?"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition resize-none"></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button (click)="closeSchedule()" type="button"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                     text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50
                     dark:hover:bg-slate-800 transition">
              Cancel
            </button>
            <button (click)="submitSchedule()" type="button"
              [disabled]="!scheduleForm.title?.trim() || !scheduleForm.scheduledAt || scheduleSaving()"
              class="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold
                     hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {{ scheduleSaving() ? 'Scheduling…' : 'Schedule Session' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Edit Session Modal ──────────────────────────────────────── -->
    @if (editTarget()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
           (click)="closeEdit()">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg
                    border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto"
             (click)="$event.stopPropagation()">

          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h3 class="font-extrabold text-slate-900 dark:text-white">Edit Session</h3>
            <button (click)="closeEdit()"
              class="flex items-center justify-center size-8 rounded-lg text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Session Title <span class="text-red-400">*</span>
              </label>
              <input [(ngModel)]="editForm.title" placeholder="e.g. React Hooks with Aarav"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date & Time <span class="text-red-400">*</span>
                </label>
                <input [(ngModel)]="editForm.scheduledAt" type="datetime-local"
                  class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                         dark:border-slate-700 rounded-xl outline-none focus:border-primary
                         text-slate-800 dark:text-white transition" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Duration (minutes)
                </label>
                <select [(ngModel)]="editForm.durationMins"
                  class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                         dark:border-slate-700 rounded-xl outline-none focus:border-primary
                         text-slate-800 dark:text-white transition">
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Meet Link (Google Meet / Zoom)
              </label>
              <input [(ngModel)]="editForm.meetLink" type="url" placeholder="https://meet.google.com/…"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition" />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location
              </label>
              <input [(ngModel)]="editForm.location" placeholder="Online / Library / Cafe…"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition" />
            </div>

            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes / Agenda
              </label>
              <textarea [(ngModel)]="editForm.notes" rows="3"
                placeholder="What topics will you cover?"
                class="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200
                       dark:border-slate-700 rounded-xl outline-none focus:border-primary
                       text-slate-800 dark:text-white transition resize-none"></textarea>
            </div>
          </div>

          <div class="flex gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button (click)="closeEdit()" type="button"
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                     text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50
                     dark:hover:bg-slate-800 transition">
              Cancel
            </button>
            <button (click)="saveEdit()" type="button"
              [disabled]="!editForm.title?.trim() || !editForm.scheduledAt || saving()"
              class="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold
                     hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {{ saving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SessionsComponent implements OnInit {
  private sessionSvc = inject(SessionService);
  private swapSvc    = inject(SwapRequestService);
  private toast      = inject(ToastService);

  private myId = (() => {
    try {
      const token = localStorage.getItem(environment.jwtTokenKey);
      if (!token) return '';
      return JSON.parse(atob(token.split('.')[1]))?.id ?? '';
    } catch { return ''; }
  })();

  readonly loading    = signal(true);
  readonly sessions   = signal<Session[]>([]);
  readonly allSwaps   = signal<SwapRequest[]>([]);
  readonly activeTab  = signal<ActiveTab>('upcoming');

  // schedule modal
  readonly scheduleTarget = signal<SwapRequest | null>(null);
  readonly scheduleSaving = signal(false);
  scheduleForm: { title?: string; scheduledAt?: string; durationMins?: number; meetLink?: string; location?: string; notes?: string } = {};

  // edit modal
  readonly editTarget = signal<Session | null>(null);
  readonly saving     = signal(false);

  editForm: UpdateSessionPayload & { title?: string; scheduledAt?: string; durationMins?: number } = {};

  /** All accepted swaps — shown always so user can schedule multiple sessions per partner.
   *  Swaps where either party's account was deleted (null after populate) are excluded.
   */
  readonly acceptedSwaps = computed(() =>
    this.allSwaps().filter(s => s.status === 'accepted' && s.senderId != null && s.receiverId != null)
  );

  /** Count of sessions per swapRequestId — shown as a badge on each partner card */
  readonly sessionCountBySwap = computed(() => {
    const map = new Map<string, number>();
    this.sessions().forEach(s => {
      const id = typeof s.swapRequestId === 'string' ? s.swapRequestId : s.swapRequestId?._id;
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    });
    return map;
  });

  readonly upcomingSessions = computed(() =>
    this.sessions().filter(s =>
      s.status === 'scheduled' && new Date(s.scheduledAt) >= new Date(Date.now() - 60 * 60 * 1000)
    ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  );

  readonly pastSessions = computed(() =>
    this.sessions().filter(s =>
      s.status === 'completed' || s.status === 'cancelled' ||
      (s.status === 'scheduled' && new Date(s.scheduledAt) < new Date(Date.now() - 60 * 60 * 1000))
    ).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  );

  readonly activeList = computed(() =>
    this.activeTab() === 'upcoming' ? this.upcomingSessions() : this.pastSessions()
  );

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);

    forkJoin({
      sessions: this.sessionSvc.getMySessions().pipe(catchError(() => of({ data: [], total: 0 }))),
      swaps:    this.swapSvc.getMyRequests({ status: 'accepted' }).pipe(catchError(() => of({ data: [], sent: [], received: [], total: 0 }))),
    }).subscribe(({ sessions, swaps }) => {
      this.sessions.set(sessions.data ?? []);

      // Combine sent + received, deduplicate by _id
      const combined = [...(swaps.sent ?? []), ...(swaps.received ?? swaps.data ?? [])];
      const seen = new Set<string>();
      this.allSwaps.set(combined.filter(s => {
        const id = s._id!;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }));

      this.loading.set(false);
    });
  }

  partnerOf(swap: SwapRequest): { _id: string; name: string; avatar?: string; university?: string } {
    // senderId / receiverId can be null when a user account is deleted;
    // fall back to a placeholder so the template never crashes.
    const partner = swap.senderId?._id === this.myId ? swap.receiverId : swap.senderId;
    return partner ?? { _id: '', name: 'Deleted User' };
  }

  avatarOfUser(u: { name: string; avatar?: string }): string {
    if (u?.avatar && u.avatar.startsWith('http')) return u.avatar;
    return `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(u?.name ?? 'U')}&size=64`;
  }

  openSchedule(swap: SwapRequest) {
    this.scheduleTarget.set(swap);
    const partner = this.partnerOf(swap).name;
    this.scheduleForm = {
      title: `${swap.offeredSkill} ↔ ${swap.requestedSkill} with ${partner}`,
      scheduledAt: '', durationMins: 60, meetLink: '', location: 'Online', notes: '',
    };
  }

  closeSchedule() { this.scheduleTarget.set(null); }

  submitSchedule() {
    const target = this.scheduleTarget();
    if (!target || !this.scheduleForm.title?.trim() || !this.scheduleForm.scheduledAt) return;
    this.scheduleSaving.set(true);
    const payload: CreateSessionPayload = {
      swapRequestId: target._id!,
      title:         this.scheduleForm.title,
      scheduledAt:   new Date(this.scheduleForm.scheduledAt!).toISOString(),
      durationMins:  Number(this.scheduleForm.durationMins ?? 60),
      meetLink:      this.scheduleForm.meetLink,
      location:      this.scheduleForm.location ?? 'Online',
      notes:         this.scheduleForm.notes,
    };
    this.sessionSvc.createSession(payload).subscribe({
      next: r => {
        this.sessions.update(ss => [...ss, r.session]);
        this.scheduleSaving.set(false);
        this.closeSchedule();
        this.toast.success('Session scheduled successfully!');
      },
      error: err => {
        this.scheduleSaving.set(false);
        this.toast.error(err?.error?.message ?? 'Failed to schedule session.');
      },
    });
  }

  statusBadge(s: string): string {
    const map: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-slate-100 text-slate-500',
    };
    return map[s] ?? 'bg-slate-100 text-slate-500';
  }

  isOverdue(session: Session): boolean {
    return new Date(session.scheduledAt) < new Date();
  }

  avatarOf(p: any): string {
    return this.avatarOfUser(p);
  }

  openEdit(session: Session) {
    this.editTarget.set(session);
    // Convert ISO to datetime-local format (YYYY-MM-DDThh:mm)
    const dt = new Date(session.scheduledAt);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);
    this.editForm = {
      title:       session.title,
      scheduledAt: local,
      durationMins: session.durationMins,
      meetLink:    session.meetLink ?? '',
      location:    session.location ?? 'Online',
      notes:       session.notes ?? '',
    };
  }

  closeEdit() { this.editTarget.set(null); }

  saveEdit() {
    const target = this.editTarget();
    if (!target || !this.editForm.title?.trim() || !this.editForm.scheduledAt) return;
    this.saving.set(true);
    const payload: UpdateSessionPayload = {
      title:        this.editForm.title,
      scheduledAt:  new Date(this.editForm.scheduledAt!).toISOString(),
      durationMins: Number(this.editForm.durationMins),
      meetLink:     this.editForm.meetLink,
      location:     this.editForm.location,
      notes:        this.editForm.notes,
    };
    this.sessionSvc.updateSession(target._id, payload).subscribe({
      next: r => {
        this.sessions.update(ss => ss.map(s => s._id === target._id ? r.session : s));
        this.saving.set(false);
        this.closeEdit();
        this.toast.success('Session updated!');
      },
      error: () => { this.saving.set(false); this.toast.error('Failed to update session.'); },
    });
  }

  confirmCancel(session: Session) {
    if (!confirm(`Cancel "${session.title}"?`)) return;
    this.sessionSvc.cancelSession(session._id).subscribe({
      next: () => {
        this.sessions.update(ss => ss.map(s => s._id === session._id ? { ...s, status: 'cancelled' } : s));
        this.toast.info('Session cancelled.');
      },
      error: () => this.toast.error('Failed to cancel session.'),
    });
  }

  markDone(session: Session) {
    this.sessionSvc.updateSession(session._id, { status: 'completed' }).subscribe({
      next: r => {
        this.sessions.update(ss => ss.map(s => s._id === session._id ? r.session : s));
        this.toast.success('Session marked as completed!');
      },
      error: () => this.toast.error('Failed to update session.'),
    });
  }
}
