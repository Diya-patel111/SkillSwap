import {
  Component, OnInit, OnDestroy,
  inject, signal, computed,
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject }         from 'rxjs';
import { takeUntil }       from 'rxjs/operators';
import { SidebarComponent }    from '../../shared/components/sidebar/sidebar.component';
import { UserStateService }    from '../../core/services/user-state.service';
import { SwapRequestService }  from '../../core/services/swap-request.service';
import { DashboardService }    from '../../core/services/dashboard.service';
import { NotificationService } from '../../core/services/notification.service';
import { DashboardData }       from '../../core/models/dashboard.model';
import { SwapRequest, SwapStatus } from '../../core/models/swap-request.model';
import { StudentProfile }      from '../../core/models/skill.model';
import { AppNotification, NotifType } from '../../core/models/notification.model';

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m    = Math.floor(diff / 60_000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    Coding: 'code', Languages: 'translate', Music: 'music_note',
    Design: 'palette', Marketing: 'campaign', Writing: 'edit_note',
    Mathematics: 'functions', Science: 'science', Other: 'school',
  };
  return map[cat] ?? 'school';
}

function levelChip(level: string): string {
  const map: Record<string, string> = {
    beginner:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    intermediate: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400',
    advanced:     'bg-rose-100    text-rose-700    dark:bg-rose-900/40    dark:text-rose-400',
  };
  return map[level] ?? 'bg-slate-100 text-slate-600';
}

function statusChip(status: string): string {
  const map: Record<string, string> = {
    pending:   'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400',
    accepted:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    rejected:  'bg-rose-100    text-rose-700    dark:bg-rose-900/40    dark:text-rose-400',
    completed: 'bg-primary/10  text-primary',
    cancelled: 'bg-slate-100   text-slate-500   dark:bg-slate-800      dark:text-slate-400',
  };
  return map[status] ?? 'bg-slate-100 text-slate-500';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],

  template: `
    <div class="flex min-h-screen bg-slate-50 dark:bg-background-dark">
      <app-sidebar />

      <main class="flex-1 ml-64 min-h-screen flex flex-col">

        <!-- Top Nav Bar -->
        <header class="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
                        border-b border-slate-200/80 dark:border-slate-800 px-8 py-3.5
                        flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="flex flex-col min-w-0">
              <h2 class="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                Welcome back, <span class="text-primary">{{ userName() }}</span>
              </h2>
              <p class="text-slate-400 text-xs mt-0.5 leading-tight">
                @if (isLoading()) {
                  <span class="inline-flex items-center gap-1.5">
                    <span class="inline-block size-1.5 rounded-full bg-slate-300 animate-pulse"></span>
                    Loading your workspace&hellip;
                  </span>
                } @else if (pendingCount() > 0) {
                  <span class="inline-flex items-center gap-1.5">
                    <span class="inline-block size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span class="font-semibold text-amber-600 dark:text-amber-400">{{ pendingCount() }}</span>&nbsp;pending swap request{{ pendingCount() === 1 ? '' : 's' }} waiting
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1.5">
                    <span class="inline-block size-1.5 rounded-full bg-emerald-500"></span>
                    All caught up &mdash; you're good to go
                  </span>
                }
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <a routerLink="/skills/browse"
              class="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-primary text-white text-sm font-bold
                     hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/25">
              <span class="material-symbols-outlined text-[17px]">explore</span>
              Browse Skills
            </a>

            <!-- Notification Bell -->
            <div class="relative">
              <button (click)="toggleNotifications($event)"
                class="relative flex items-center justify-center size-10 rounded-xl
                       bg-slate-100 dark:bg-slate-800
                       text-slate-600 dark:text-slate-300
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       active:scale-95 transition-all">
                <span class="material-symbols-outlined text-[21px]">notifications</span>
                @if (unreadCount() > 0) {
                  <span class="absolute top-1.5 right-1.5 flex size-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full size-2 bg-red-500 border border-white dark:border-slate-900"></span>
                  </span>
                }
              </button>

              @if (showNotifications()) {
                <div class="fixed inset-0 z-40" (click)="showNotifications.set(false)"></div>
                <div class="absolute right-0 top-[calc(100%+8px)] w-[340px]
                            bg-white dark:bg-slate-900
                            border border-slate-200 dark:border-slate-800
                            rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/40
                            z-50 overflow-hidden">
                  <div class="flex items-center justify-between px-4 py-3.5
                              bg-slate-50 dark:bg-slate-800/60
                              border-b border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-[18px] text-primary">notifications</span>
                      <span class="text-sm font-extrabold text-slate-900 dark:text-white">Notifications</span>
                      @if (unreadCount() > 0) {
                        <span class="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400
                                     rounded-full text-[10px] font-extrabold">{{ unreadCount() }} new</span>
                      }
                    </div>
                    @if (unreadCount() > 0) {
                      <button (click)="notifMarkAllRead()"
                        class="text-[11px] text-primary font-bold hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                        Mark all read
                      </button>
                    }
                  </div>
                  <div class="max-h-[400px] overflow-y-auto">
                    @if (notifLoading()) {
                      @for (i of [1,2,3]; track i) {
                        <div class="flex gap-3 px-4 py-3.5 animate-pulse border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <div class="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                          <div class="flex-1 space-y-2 pt-0.5">
                            <div class="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                            <div class="h-2.5 w-44 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                          </div>
                        </div>
                      }
                    } @else if (notifications().length === 0) {
                      <div class="flex flex-col items-center gap-3 py-12 px-6 text-center">
                        <div class="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <span class="material-symbols-outlined text-[28px] text-slate-400">notifications_none</span>
                        </div>
                        <div>
                          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">You're all caught up!</p>
                          <p class="text-xs text-slate-400 mt-0.5">No new notifications right now.</p>
                        </div>
                      </div>
                    } @else {
                      @for (n of notifications(); track n._id) {
                        <button (click)="handleNotifClick(n)"
                          class="w-full flex gap-3 px-4 py-3.5 text-left transition-colors
                                 border-b border-slate-100 dark:border-slate-800 last:border-0
                                 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          [class.bg-blue-50]="!n.isRead">
                          <span class="flex items-center justify-center size-9 rounded-xl shrink-0 mt-0.5
                                       bg-primary/10 text-primary">
                            <span class="material-symbols-outlined text-[17px]">{{ notifIcon(n.type) }}</span>
                          </span>
                          <div class="flex-1 min-w-0">
                            <p class="text-[13px] leading-snug"
                               [class.font-extrabold]="!n.isRead"
                               [class.font-semibold]="n.isRead"
                               [class.text-slate-900]="true"
                               [class.dark:text-white]="true">{{ n.title }}</p>
                            <p class="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{{ n.message }}</p>
                            <p class="text-[10px] text-slate-400 mt-1.5 font-medium">{{ timeAgo(n.createdAt) }}</p>
                          </div>
                          @if (!n.isRead) {
                            <div class="size-2 rounded-full bg-primary shrink-0 mt-2.5"></div>
                          }
                        </button>
                      }
                    }
                  </div>
                  <div class="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <p class="text-center text-[11px] text-slate-400 font-semibold">
                      {{ unreadCount() }} unread &nbsp;&bull;&nbsp; {{ notifications().length }} total
                    </p>
                  </div>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page body -->
        <div class="flex-1 px-8 py-8 max-w-[1400px] w-full mx-auto space-y-8">

          <!-- KPI Stats Row -->
          <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <!-- Pending Requests card -->
            <div class="group relative bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-slate-800 rounded-2xl
                        p-5 overflow-hidden hover:shadow-lg hover:shadow-amber-500/5
                        hover:border-amber-200 dark:hover:border-amber-800/50 transition-all duration-200">
              <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-t-2xl"></div>
              <div class="flex items-start justify-between mb-4">
                <div class="size-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <span class="material-symbols-outlined text-amber-500 text-[22px]">pending_actions</span>
                </div>
                @if (pendingCount() > 0) {
                  <span class="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400
                               text-[10px] font-extrabold rounded-full uppercase tracking-wide">needs attention</span>
                }
              </div>
              @if (isLoading()) {
                <div class="space-y-2">
                  <div class="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                  <div class="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              } @else {
                <div>
                  <span class="text-[44px] font-black leading-none text-slate-900 dark:text-white">{{ pendingCount() }}</span>
                  <p class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-widest">Pending Requests</p>
                </div>
              }
            </div>

            <!-- Active Swaps card -->
            <div class="group relative bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-slate-800 rounded-2xl
                        p-5 overflow-hidden hover:shadow-lg hover:shadow-emerald-500/5
                        hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all duration-200">
              <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-t-2xl"></div>
              <div class="flex items-start justify-between mb-4">
                <div class="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <span class="material-symbols-outlined text-emerald-500 text-[22px]">swap_horiz</span>
                </div>
                @if (activeSwapsCount() > 0) {
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1
                               bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400
                               text-[10px] font-extrabold rounded-full">
                    <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Live
                  </span>
                }
              </div>
              @if (isLoading()) {
                <div class="space-y-2">
                  <div class="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                  <div class="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              } @else {
                <div>
                  <span class="text-[44px] font-black leading-none text-emerald-600 dark:text-emerald-400">{{ activeSwapsCount() }}</span>
                  <p class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-widest">Active Swaps</p>
                </div>
              }
            </div>

            <!-- Sent Requests card -->
            <div class="group relative bg-white dark:bg-slate-900
                        border border-slate-200 dark:border-slate-800 rounded-2xl
                        p-5 overflow-hidden hover:shadow-lg hover:shadow-primary/5
                        hover:border-primary/20 transition-all duration-200">
              <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-violet-500 rounded-t-2xl"></div>
              <div class="flex items-start justify-between mb-4">
                <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-primary text-[22px]">send</span>
                </div>
              </div>
              @if (isLoading()) {
                <div class="space-y-2">
                  <div class="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                  <div class="h-3 w-28 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              } @else {
                <div>
                  <span class="text-[44px] font-black leading-none text-slate-900 dark:text-white">{{ sentCount() }}</span>
                  <p class="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-widest">Sent Requests</p>
                </div>
              }
            </div>

          </section>

          <!-- Main content grid -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

            <!-- Left / Main column -->
            <div class="xl:col-span-2 space-y-8">

              <!-- Pending Requests section -->
              <section>
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2.5">
                    <span class="flex size-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[16px]">pending_actions</span>
                    </span>
                    <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Pending Requests</h3>
                    @if (pendingCount() > 0) {
                      <span class="px-2 py-0.5 bg-amber-100 text-amber-700
                                   dark:bg-amber-900/40 dark:text-amber-400 rounded-full text-[11px] font-extrabold">
                        {{ pendingCount() }}
                      </span>
                    }
                  </div>
                  <a routerLink="/swaps"
                    class="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline underline-offset-2">
                    See all <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>

                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  @if (isLoading()) {
                    @for (i of [1,2,3]; track i) {
                      <div class="flex items-center gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-pulse">
                        <div class="size-11 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                        <div class="flex-1 space-y-2">
                          <div class="h-3.5 w-32 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                          <div class="h-3 w-52 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        </div>
                        <div class="flex gap-2">
                          <div class="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                          <div class="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                        </div>
                      </div>
                    }
                  } @else if (pendingRequests().length === 0) {
                    <div class="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
                      <div class="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span class="material-symbols-outlined text-[28px] text-slate-400 dark:text-slate-600">inbox</span>
                      </div>
                      <div>
                        <p class="font-bold text-slate-600 dark:text-slate-400 text-sm">No pending requests</p>
                        <p class="text-xs text-slate-400 mt-0.5">Incoming swap requests will appear here.</p>
                      </div>
                    </div>
                  } @else {
                    <div class="divide-y divide-slate-100 dark:divide-slate-800">
                      @for (req of pendingRequests(); track req._id) {
                        <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <div class="relative shrink-0">
                            @if (req.senderId.avatar) {
                              <img [src]="req.senderId.avatar" [alt]="req.senderId.name"
                                   class="size-11 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm" />
                            } @else {
                              <div class="size-11 rounded-full bg-gradient-to-br from-primary/20 to-violet-200 dark:from-primary/30 dark:to-violet-900/40
                                          flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm">
                                <span class="text-primary font-extrabold text-sm">{{ initials(req.senderId.name) }}</span>
                              </div>
                            }
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="font-extrabold text-sm text-slate-900 dark:text-white truncate">{{ req.senderId.name }}</p>
                            <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                                <span class="material-symbols-outlined text-[11px]">school</span>{{ req.requestedSkill }}
                              </span>
                              <span class="material-symbols-outlined text-slate-300 text-[14px]">arrow_forward</span>
                              <span class="text-[11px] text-slate-500 font-semibold">{{ req.offeredSkill }}</span>
                            </div>
                          </div>
                          <span class="text-[11px] text-slate-400 font-medium hidden lg:block shrink-0">{{ req.createdAt | date:'MMM d' }}</span>
                          <div class="flex items-center gap-2 shrink-0">
                            <button (click)="acceptRequest(req._id!)"
                              class="px-3.5 py-1.5 bg-primary text-white text-[12px] font-extrabold rounded-xl
                                     hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/20">
                              Accept
                            </button>
                            <button (click)="rejectRequest(req._id!)"
                              class="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700
                                     text-slate-500 dark:text-slate-400 text-[12px] font-bold rounded-xl
                                     hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
                              Reject
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </section>

              <!-- Active Swaps section -->
              <section>
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2.5">
                    <span class="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[16px]">swap_horiz</span>
                    </span>
                    <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Active Swaps</h3>
                    @if (activeSwapsCount() > 0) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700
                                   dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full text-[11px] font-extrabold">
                        <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{{ activeSwapsCount() }}
                      </span>
                    }
                  </div>
                  <a routerLink="/swaps"
                    class="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline underline-offset-2">
                    View all <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>

                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  @if (isLoading()) {
                    @for (i of [1,2]; track i) {
                      <div class="flex items-center gap-4 px-5 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-pulse">
                        <div class="size-11 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"></div>
                        <div class="flex-1 space-y-2">
                          <div class="h-3.5 w-28 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                          <div class="h-7 w-52 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                        </div>
                      </div>
                    }
                  } @else if (activeSwaps().length === 0) {
                    <div class="flex flex-col items-center justify-center py-14 gap-3 text-center px-6">
                      <div class="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span class="material-symbols-outlined text-[28px] text-slate-400 dark:text-slate-600">handshake</span>
                      </div>
                      <div>
                        <p class="font-bold text-slate-600 dark:text-slate-400 text-sm">No active swaps yet</p>
                        <p class="text-xs text-slate-400 mt-0.5">Accept a request to start swapping skills.</p>
                      </div>
                    </div>
                  } @else {
                    <div class="divide-y divide-slate-100 dark:divide-slate-800">
                      @for (req of activeSwaps(); track req._id) {
                        <div class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <div class="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/20
                                      flex items-center justify-center shrink-0">
                            <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[22px]">handshake</span>
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="font-extrabold text-sm text-slate-900 dark:text-white truncate">{{ swapPartnerName(req) }}</p>
                            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                                <span class="material-symbols-outlined text-[11px]">arrow_upward</span>{{ req.offeredSkill }}
                              </span>
                              <span class="material-symbols-outlined text-slate-300 text-[13px]">sync_alt</span>
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-full">
                                <span class="material-symbols-outlined text-[11px]">arrow_downward</span>{{ req.requestedSkill }}
                              </span>
                            </div>
                          </div>
                          <div class="flex flex-col items-end gap-1 shrink-0">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1
                                         bg-emerald-100 dark:bg-emerald-900/40
                                         text-emerald-700 dark:text-emerald-400
                                         text-[11px] font-extrabold rounded-full">
                              <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Active
                            </span>
                            <span class="text-[10px] text-slate-400 font-medium">{{ req.updatedAt | date:'MMM d' }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              </section>

              <!-- Recommended Profiles section -->
              <section>
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2.5">
                    <span class="flex size-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <span class="material-symbols-outlined text-violet-600 dark:text-violet-400 text-[16px]">auto_awesome</span>
                    </span>
                    <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Recommended for You</h3>
                  </div>
                  <a routerLink="/skills/browse"
                    class="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline underline-offset-2">
                    Browse all <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>

                @if (isLoading()) {
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (i of [1,2,3,4,5,6]; track i) {
                      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-48 animate-pulse"></div>
                    }
                  </div>
                } @else if (recommendedUsers().length === 0) {
                  <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 py-14 text-center px-6">
                    <div class="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <span class="material-symbols-outlined text-[28px] text-slate-400">group</span>
                    </div>
                    <p class="text-slate-600 dark:text-slate-400 font-bold text-sm">No matches found yet.</p>
                    <p class="text-xs text-slate-400 mt-1">Add skills you want to learn and we'll find people who teach them.</p>
                    <a routerLink="/skills/browse" class="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline mt-3">
                      Browse all people <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </a>
                  </div>
                } @else {
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (user of recommendedUsers(); track user._id) {
                      <div class="group relative bg-white dark:bg-slate-900 rounded-2xl
                                  border border-slate-200 dark:border-slate-800
                                  p-5 flex flex-col gap-4
                                  hover:shadow-xl hover:shadow-slate-900/5 hover:-translate-y-0.5
                                  hover:border-primary/30 dark:hover:border-primary/20
                                  transition-all duration-200">
                        <div class="flex items-center gap-3">
                          <a [routerLink]="['/profile', user._id]" class="shrink-0">
                            @if (user.avatar) {
                              <img [src]="user.avatar" [alt]="user.name"
                                   class="size-12 rounded-full object-cover
                                          ring-2 ring-white dark:ring-slate-900 shadow-sm
                                          group-hover:ring-primary/30 transition-all" />
                            } @else {
                              <div class="size-12 rounded-full bg-gradient-to-br from-primary/20 to-violet-200
                                          dark:from-primary/30 dark:to-violet-900/40
                                          flex items-center justify-center
                                          ring-2 ring-white dark:ring-slate-900 shadow-sm
                                          group-hover:ring-primary/30 transition-all">
                                <span class="text-primary font-extrabold text-sm">{{ initials(user.name) }}</span>
                              </div>
                            }
                          </a>
                          <div class="min-w-0 flex-1">
                            <a [routerLink]="['/profile', user._id]"
                               class="block font-extrabold text-sm text-slate-900 dark:text-white
                                      hover:text-primary transition-colors truncate leading-tight">
                              {{ user.name }}
                            </a>
                            @if (user.university) {
                              <p class="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                <span class="material-symbols-outlined text-[11px]">school</span>{{ user.university }}
                              </p>
                            }
                          </div>
                        </div>

                        <div class="flex flex-wrap gap-1.5 min-h-[24px]">
                          @for (skill of user.teaches.slice(0, 3); track skill) {
                            <span class="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{{ skill }}</span>
                          }
                          @if (user.teaches.length > 3) {
                            <span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold rounded-full">+{{ user.teaches.length - 3 }}</span>
                          }
                          @if (user.teaches.length === 0) {
                            <span class="text-[11px] text-slate-400 italic">No skills listed</span>
                          }
                        </div>

                        <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                          <span class="flex items-center gap-1 text-[12px] font-extrabold text-amber-500">
                            <span class="material-symbols-outlined text-[15px]">star</span>
                            {{ user.rating.toFixed(1) }}
                          </span>
                          <a [routerLink]="['/swaps', 'propose', user._id]"
                             class="inline-flex items-center gap-1.5 px-3 py-1.5
                                    bg-primary text-white text-[11px] font-extrabold rounded-xl
                                    hover:bg-primary/90 active:scale-95 transition-all
                                    shadow-sm shadow-primary/20">
                            <span class="material-symbols-outlined text-[13px]">swap_horiz</span>
                            Propose
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>

            </div>

            <!-- Right Column: Activity Feed -->
            <div class="xl:col-span-1">
              <div class="sticky top-20">
                <div class="flex items-center gap-2.5 mb-4">
                  <span class="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <span class="material-symbols-outlined text-primary text-[16px]">history</span>
                  </span>
                  <h3 class="text-base font-extrabold text-slate-900 dark:text-white">Recent Activity</h3>
                </div>

                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  @if (isLoading()) {
                    @for (i of [1,2,3,4,5]; track i) {
                      <div class="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-pulse">
                        <div class="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5"></div>
                        <div class="flex-1 space-y-2 pt-0.5">
                          <div class="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                          <div class="h-2.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        </div>
                      </div>
                    }
                  } @else if (recentActivity().length === 0) {
                    <div class="flex flex-col items-center justify-center py-14 text-center px-6 gap-3">
                      <div class="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span class="material-symbols-outlined text-[24px] text-slate-400 dark:text-slate-600">history_toggle_off</span>
                      </div>
                      <div>
                        <p class="font-bold text-slate-600 dark:text-slate-400 text-sm">No activity yet</p>
                        <p class="text-xs text-slate-400 mt-0.5">Your swap history will appear here.</p>
                      </div>
                    </div>
                  } @else {
                    <div class="relative">
                      <div class="absolute left-[27px] top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-800 pointer-events-none"></div>
                      <ul class="divide-y divide-slate-100 dark:divide-slate-800">
                        @for (item of recentActivity(); track item._id) {
                          <li class="relative flex items-start gap-3 px-4 py-3.5
                                     hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div class="relative z-10 shrink-0">
                              <div [class]="item.role === 'sent'
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'"
                                   class="size-8 rounded-lg flex items-center justify-center">
                                <span class="material-symbols-outlined text-[15px]">
                                  {{ item.role === 'sent' ? 'send' : 'move_to_inbox' }}
                                </span>
                              </div>
                            </div>
                            <div class="flex-1 min-w-0 pt-0.5">
                              <p class="text-[12px] text-slate-700 dark:text-slate-300 leading-relaxed">
                                @if (item.role === 'sent') {
                                  You requested <span class="font-extrabold text-primary">{{ item.skill }}</span>
                                  from <span class="font-bold text-slate-800 dark:text-slate-200">{{ item.partnerName }}</span>
                                } @else {
                                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ item.partnerName }}</span>
                                  wants to learn <span class="font-extrabold text-primary">{{ item.skill }}</span>
                                }
                              </p>
                              <div class="flex items-center gap-2 mt-1.5">
                                <span [class]="statusChip(item.status)"
                                  class="px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize">{{ item.status }}</span>
                                <span class="text-[10px] text-slate-400 font-medium">{{ timeAgo(item.time) }}</span>
                              </div>
                            </div>
                          </li>
                        }
                      </ul>
                    </div>
                    <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                      <a routerLink="/swaps"
                        class="flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:underline underline-offset-2">
                        View all activity
                        <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </a>
                    </div>
                  }
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  `,
})

export class DashboardComponent implements OnInit, OnDestroy {
  private readonly dashSvc   = inject(DashboardService);
  private readonly swapSvc   = inject(SwapRequestService);
  private readonly userState = inject(UserStateService);
  private readonly notifSvc  = inject(NotificationService);
  private readonly router    = inject(Router);
  private readonly destroy$  = new Subject<void>();

  // Expose pure functions for template use
  readonly categoryIcon = categoryIcon;
  readonly levelChip    = levelChip;
  readonly statusChip   = statusChip;
  readonly timeAgo      = timeAgo;

  // â”€â”€ State signals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  isLoading       = signal(true);
  private data    = signal<DashboardData | null>(null);
  pendingRequests = signal<SwapRequest[]>([]);  // mutable for optimistic updates

  // ── Notification state ─────────────────────────────────────────────────────
  showNotifications = signal(false);
  notifications     = signal<AppNotification[]>([]);
  unreadCount       = signal(0);
  notifLoading      = signal(false);

  // â”€â”€ Computed views â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  readonly pendingCount      = computed(() => this.pendingRequests().length);
  readonly activeSwapsCount  = computed(() => this.data()?.stats.activeSwaps       ?? 0);
  readonly sentCount         = computed(() => this.data()?.stats.sentRequests       ?? 0);
  readonly activeSwaps       = computed(() => this.data()?.activeSwaps              ?? []);
  readonly recommendedUsers  = computed(() => this.data()?.recommendedUsers          ?? []);
  readonly recentActivity    = computed(() => this.data()?.recentActivity            ?? []);

  readonly userName = this.userState.userName;

  ngOnInit(): void {
    this.dashSvc.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => {
          this.data.set(d);
          this.pendingRequests.set(d.pendingRequests ?? []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });

    // Pre-fetch unread badge count
    this.loadUnreadCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Notification methods ──────────────────────────────────────────────────

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    const opening = !this.showNotifications();
    this.showNotifications.set(opening);
    if (opening) { this.loadNotifications(); }
  }

  loadUnreadCount(): void {
    this.notifSvc.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (r) => this.unreadCount.set(r.count), error: () => {} });
  }

  loadNotifications(): void {
    this.notifLoading.set(true);
    this.notifSvc.getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r) => {
          this.notifications.set(r.notifications);
          this.unreadCount.set(r.unreadCount);
          this.notifLoading.set(false);
        },
        error: () => this.notifLoading.set(false),
      });
  }

  handleNotifClick(n: AppNotification): void {
    if (!n.isRead) {
      this.notifSvc.markRead(n._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.notifications.update(list =>
              list.map(x => x._id === n._id ? { ...x, isRead: true } : x)
            );
            this.unreadCount.update(c => Math.max(0, c - 1));
          },
          error: () => {},
        });
    }
    this.showNotifications.set(false);
    if (n.link) { this.router.navigateByUrl(n.link); }
  }

  notifMarkAllRead(): void {
    this.notifSvc.markAllRead()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.notifications.update(list => list.map(x => ({ ...x, isRead: true })));
          this.unreadCount.set(0);
        },
        error: () => {},
      });
  }

  notifIcon(type: NotifType): string {
    const map: Record<NotifType, string> = {
      swap_request:      'swap_horiz',
      swap_accepted:     'check_circle',
      swap_rejected:     'cancel',
      session_scheduled: 'event',
      session_reminder:  'alarm',
      review_received:   'star',
    };
    return map[type] ?? 'notifications';
  }

  // â”€â”€ Optimistic accept / reject â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  acceptRequest(id: string): void {
    const prev = this.pendingRequests();
    this.pendingRequests.update(list => list.filter(r => r._id !== id));
    this.data.update(d => d ? {
      ...d,
      stats: { ...d.stats, incomingRequests: Math.max(0, d.stats.incomingRequests - 1), activeSwaps: d.stats.activeSwaps + 1 },
    } : d);
    this.swapSvc.acceptSwap(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: () => this.pendingRequests.set(prev) });
  }

  rejectRequest(id: string): void {
    const prev = this.pendingRequests();
    this.pendingRequests.update(list => list.filter(r => r._id !== id));
    this.data.update(d => d ? {
      ...d,
      stats: { ...d.stats, incomingRequests: Math.max(0, d.stats.incomingRequests - 1) },
    } : d);
    this.swapSvc.rejectSwap(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: () => this.pendingRequests.set(prev) });
  }

  initials(name: string | undefined | null): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
  }

  /** Returns the swap partner's name depending on whether the current user is sender or receiver. */
  swapPartnerName(req: SwapRequest): string {
    const myId = this.userState.currentUser()?._id;
    const senderId = (req.senderId as any)?._id ?? req.senderId;
    return senderId?.toString() === myId
      ? (req.receiverId as any)?.name ?? 'Partner'
      : (req.senderId  as any)?.name ?? 'Partner';
  }
}
