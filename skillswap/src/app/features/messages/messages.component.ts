import {
  Component, OnInit, OnDestroy, signal, computed,
  inject, ElementRef, ViewChild, AfterViewChecked,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { environment } from '../../../environments/environment';

interface MessageDoc {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  createdAt: string;
}

interface Partner {
  _id: string;
  name: string;
  avatar: string;
  university?: string;
  major?: string;
}

interface Conversation {
  partnerId: string;
  partner: Partner | null;
  lastMessage: { text: string; createdAt: string; isMine: boolean };
  unread: number;
}

interface StudentResult {
  _id: string;
  name: string;
  avatar: string;
  university?: string;
  teaches?: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, DatePipe],
  template: `
    <div class="flex min-h-screen bg-slate-50 dark:bg-background-dark">
      <app-sidebar />

      <main class="flex-1 ml-64 min-h-screen flex flex-col">

        <!-- Header -->
        <header class="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md
                        border-b border-slate-200 dark:border-slate-800 px-8 py-4
                        flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Messages</h2>
            <p class="text-slate-500 text-sm mt-0.5">Chat with your swap partners</p>
          </div>
          <button (click)="showNewMsg.set(true)"
            class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm
                   font-semibold rounded-xl hover:opacity-90 transition">
            <span class="material-symbols-outlined text-[18px]">edit_square</span>
            New Message
          </button>
        </header>

        <!-- Chat layout -->
        <div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 73px)">

          <!-- ── Left panel: conversations ─────────────────────── -->
          <aside class="w-80 border-r border-slate-200 dark:border-slate-800
                         bg-white dark:bg-slate-900 flex flex-col shrink-0">

            <!-- Search conversations -->
            <div class="p-3 border-b border-slate-100 dark:border-slate-800">
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                             text-slate-400 text-[18px]">search</span>
                <input [(ngModel)]="searchQuery"
                  placeholder="Search conversations…"
                  class="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800
                         border border-transparent focus:border-primary rounded-xl
                         outline-none text-slate-800 dark:text-white
                         placeholder:text-slate-400 transition" />
              </div>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto">
              @if (loadingConvs()) {
                <div class="flex items-center justify-center py-16">
                  <div class="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              } @else if (filteredConvs().length === 0) {
                <div class="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                  <span class="material-symbols-outlined text-slate-300 text-5xl">chat_bubble_outline</span>
                  <p class="text-slate-500 text-sm leading-relaxed">
                    No conversations yet.<br>Click <strong>New Message</strong> to start chatting!
                  </p>
                </div>
              } @else {
                @for (conv of filteredConvs(); track conv.partnerId) {
                  <button (click)="openThread(conv)"
                    class="w-full flex items-start gap-3 px-4 py-3 transition text-left
                           border-b border-slate-50 dark:border-slate-800/60"
                    [class.bg-indigo-50]="activeConv()?.partnerId === conv.partnerId"
                    [class.dark:bg-slate-800]="activeConv()?.partnerId === conv.partnerId"
                    [class.hover:bg-slate-50]="activeConv()?.partnerId !== conv.partnerId"
                    [class.dark:hover:bg-slate-800]="activeConv()?.partnerId !== conv.partnerId">

                    <div class="relative shrink-0">
                      <img [src]="avatar(conv.partner)"
                           [alt]="conv.partner?.name"
                           class="size-10 rounded-full object-cover border border-slate-200" />
                      @if (conv.unread > 0) {
                        <span class="absolute -top-1 -right-1 size-4 bg-red-500 text-white
                                     text-[10px] font-bold rounded-full flex items-center justify-center">
                          {{ conv.unread > 9 ? '9+' : conv.unread }}
                        </span>
                      }
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-baseline justify-between gap-1">
                        <span class="text-sm font-semibold truncate"
                              [class.text-slate-900]="true"
                              [class.dark:text-white]="true">
                          {{ conv.partner?.name || 'Unknown' }}
                        </span>
                        <span class="text-[10px] text-slate-400 shrink-0">
                          {{ conv.lastMessage.createdAt | date:'shortTime' }}
                        </span>
                      </div>
                      <p class="text-xs truncate mt-0.5"
                         [class.text-slate-900]="conv.unread > 0"
                         [class.font-semibold]="conv.unread > 0"
                         [class.text-slate-400]="conv.unread === 0">
                        @if (conv.lastMessage.isMine) { <span class="text-slate-400">You: </span> }
                        {{ conv.lastMessage.text || '…' }}
                      </p>
                    </div>

                  </button>
                }
              }
            </div>
          </aside>

          <!-- ── Right panel: thread ────────────────────────────── -->
          <div class="flex-1 flex flex-col bg-slate-50 dark:bg-background-dark">

            @if (!activeConv()) {
              <div class="flex-1 flex flex-col items-center justify-center gap-5 text-center px-8">
                <span class="flex items-center justify-center size-24 rounded-3xl bg-primary/10">
                  <span class="material-symbols-outlined text-primary" style="font-size:52px">forum</span>
                </span>
                <div>
                  <h3 class="text-xl font-extrabold text-slate-900 dark:text-white">Your Messages</h3>
                  <p class="text-slate-500 text-sm mt-1 max-w-xs">
                    Select a conversation or start a new one to chat with your swap partners
                  </p>
                </div>
                <button (click)="showNewMsg.set(true)"
                  class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white
                         text-sm font-semibold rounded-xl hover:opacity-90 transition">
                  <span class="material-symbols-outlined text-[18px]">edit_square</span>
                  New Message
                </button>
              </div>
            } @else {

              <!-- Thread header -->
              <div class="flex items-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-900
                          border-b border-slate-200 dark:border-slate-800 shrink-0">
                <img [src]="avatar(activeConv()!.partner)"
                     [alt]="activeConv()!.partner?.name"
                     class="size-10 rounded-full object-cover border border-slate-200" />
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                    {{ activeConv()!.partner?.name }}
                  </p>
                  <p class="text-xs text-slate-400 truncate">
                    {{ activeConv()!.partner?.university }}
                    @if (activeConv()!.partner?.major) { &nbsp;·&nbsp;{{ activeConv()!.partner?.major }} }
                  </p>
                </div>
              </div>

              <!-- Messages area -->
              <div #scrollContainer
                   class="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-1.5">
                @if (loadingThread()) {
                  <div class="flex justify-center py-12">
                    <div class="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                } @else if (messages().length === 0) {
                  <div class="flex flex-col items-center justify-center flex-1 gap-3 py-16">
                    <span class="material-symbols-outlined text-slate-300 text-5xl">waving_hand</span>
                    <p class="text-slate-400 text-sm">No messages yet — say hello!</p>
                  </div>
                } @else {
                  @for (msg of messages(); track msg._id; let i = $index) {
                    <!-- Date separator -->
                    @if (i === 0 || isDifferentDay(messages()[i-1].createdAt, msg.createdAt)) {
                      <div class="flex items-center gap-3 my-3">
                        <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                        <span class="text-[11px] text-slate-400 font-medium shrink-0">
                          {{ msg.createdAt | date:'mediumDate' }}
                        </span>
                        <div class="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                      </div>
                    }

                    <div class="flex items-end gap-2"
                         [class.flex-row-reverse]="msg.senderId === myId()"
                         [class.flex-row]="msg.senderId !== myId()">

                      <!-- Avatar (receiver side only) -->
                      @if (msg.senderId !== myId()) {
                        <img [src]="avatar(activeConv()!.partner)"
                             class="size-7 rounded-full object-cover border border-slate-200 mb-1 shrink-0" />
                      }

                      <div class="max-w-xs lg:max-w-md xl:max-w-lg">
                        <div class="px-4 py-2.5 rounded-2xl text-sm shadow-sm"
                             [class.bg-primary]="msg.senderId === myId()"
                             [class.text-white]="msg.senderId === myId()"
                             [class.rounded-br-sm]="msg.senderId === myId()"
                             [class.bg-white]="msg.senderId !== myId()"
                             [class.dark:bg-slate-800]="msg.senderId !== myId()"
                             [class.text-slate-800]="msg.senderId !== myId()"
                             [class.dark:text-white]="msg.senderId !== myId()"
                             [class.rounded-bl-sm]="msg.senderId !== myId()">
                          <p class="leading-relaxed break-words whitespace-pre-wrap">{{ msg.text }}</p>
                        </div>
                        <div class="flex items-center gap-1 mt-0.5 px-1"
                             [class.justify-end]="msg.senderId === myId()">
                          <span class="text-[10px] text-slate-400">
                            {{ msg.createdAt | date:'shortTime' }}
                          </span>
                          @if (msg.senderId === myId()) {
                            <span class="material-symbols-outlined text-[13px]"
                                  [class.text-primary]="msg.read"
                                  [class.text-slate-400]="!msg.read">
                              {{ msg.read ? 'done_all' : 'done' }}
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- Input bar -->
              <div class="px-4 py-3 bg-white dark:bg-slate-900
                          border-t border-slate-200 dark:border-slate-800 shrink-0">
                <form (ngSubmit)="sendMessage()" class="flex items-end gap-2">
                  <textarea
                    [(ngModel)]="newMessage" name="newMessage"
                    (keydown.enter)="onEnterKey($event)"
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    rows="1"
                    class="flex-1 resize-none px-4 py-3 text-sm bg-slate-100 dark:bg-slate-800
                           border border-transparent focus:border-primary rounded-2xl
                           outline-none text-slate-900 dark:text-white
                           placeholder:text-slate-400 transition leading-relaxed"
                    style="max-height:120px"
                  ></textarea>
                  <button type="submit"
                    [disabled]="!newMessage.trim() || sending()"
                    class="flex items-center justify-center size-11 bg-primary text-white
                           rounded-2xl hover:opacity-90 transition disabled:opacity-40
                           disabled:cursor-not-allowed shrink-0">
                    @if (sending()) {
                      <div class="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    } @else {
                      <span class="material-symbols-outlined text-[20px]">send</span>
                    }
                  </button>
                </form>
              </div>
            }
          </div>
        </div>
      </main>
    </div>

    <!-- ── New Message Modal ─────────────────────────────────────────── -->
    @if (showNewMsg()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
           (click)="closeNewMsg()">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md
                    border border-slate-200 dark:border-slate-700 flex flex-col"
             style="max-height:80vh"
             (click)="$event.stopPropagation()">

          <!-- Modal header -->
          <div class="flex items-center justify-between px-5 py-4 border-b
                      border-slate-200 dark:border-slate-700">
            <h3 class="font-extrabold text-slate-900 dark:text-white">New Message</h3>
            <button (click)="closeNewMsg()"
              class="flex items-center justify-center size-8 rounded-lg text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Search -->
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                           text-slate-400 text-[18px]">search</span>
              <input #newMsgSearch
                     [(ngModel)]="userSearchQuery"
                     (ngModelChange)="searchUsers()"
                     placeholder="Search by name or university…"
                     class="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800
                            border border-transparent focus:border-primary rounded-xl
                            outline-none text-slate-800 dark:text-white
                            placeholder:text-slate-400 transition" />
            </div>
          </div>

          <!-- Results -->
          <div class="overflow-y-auto flex-1 py-2">
            @if (searchingUsers()) {
              <div class="flex justify-center py-8">
                <div class="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else if (userResults().length === 0 && userSearchQuery.length > 1) {
              <p class="text-center text-slate-400 text-sm py-8">No users found</p>
            } @else if (userResults().length === 0) {
              <p class="text-center text-slate-400 text-sm py-8">Type a name to search for peers</p>
            } @else {
              @for (u of userResults(); track u._id) {
                <button (click)="startConversation(u)"
                  class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50
                         dark:hover:bg-slate-800 transition text-left">
                  <img [src]="avatarByName(u.name, u.avatar)"
                       [alt]="u.name"
                       class="size-10 rounded-full object-cover border border-slate-200 shrink-0" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ u.name }}</p>
                    <p class="text-xs text-slate-400 truncate">
                      {{ u.university }}
                      @if (u.teaches) { · {{ u.teaches }} }
                    </p>
                  </div>
                  <span class="material-symbols-outlined text-slate-400 ml-auto shrink-0">chevron_right</span>
                </button>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class MessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollEl!: ElementRef<HTMLDivElement>;

  private readonly http  = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly apiBase = environment.apiUrl;

  // ── State ──────────────────────────────────────────────────────────────
  conversations  = signal<Conversation[]>([]);
  activeConv     = signal<Conversation | null>(null);
  messages       = signal<MessageDoc[]>([]);
  myId           = signal<string>('');
  searchQuery    = '';
  newMessage     = '';
  loadingConvs   = signal(true);
  loadingThread  = signal(false);
  sending        = signal(false);

  // New message modal
  showNewMsg       = signal(false);
  userSearchQuery  = '';
  userResults      = signal<StudentResult[]>([]);
  searchingUsers   = signal(false);
  private searchTimer?: ReturnType<typeof setTimeout>;

  private shouldScroll = false;
  private pollInterval?: ReturnType<typeof setInterval>;

  filteredConvs = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.conversations();
    return this.conversations().filter(c =>
      (c.partner?.name ?? '').toLowerCase().includes(q)
    );
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit() {
    this.loadMyId();
    this.loadConversations();
    this.pollInterval = setInterval(() => this.poll(), 5000);

    this.route.queryParams.subscribe(params => {
      const pid = params['partner'];
      if (pid) this.openThreadById(pid);
    });
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
    clearTimeout(this.searchTimer);
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────
  avatar(partner: Partner | null): string {
    if (partner?.avatar && partner.avatar.startsWith('http')) return partner.avatar;
    const name = encodeURIComponent(partner?.name ?? 'U');
    return `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${name}&size=128`;
  }

  avatarByName(name: string, av?: string): string {
    if (av && av.startsWith('http')) return av;
    return `https://ui-avatars.com/api/?background=6366f1&color=fff&name=${encodeURIComponent(name)}&size=128`;
  }

  isDifferentDay(a: string, b: string): boolean {
    return new Date(a).toDateString() !== new Date(b).toDateString();
  }

  // ── ID loading ─────────────────────────────────────────────────────────
  private loadMyId() {
    try {
      const token = localStorage.getItem(environment.jwtTokenKey) ?? '';
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.myId.set(payload.id ?? payload.sub ?? payload._id ?? '');
      }
    } catch { /* ignore */ }
  }

  // ── Conversations ──────────────────────────────────────────────────────
  loadConversations() {
    this.http.get<Conversation[]>(`${this.apiBase}/messages/conversations`).subscribe({
      next:  convs => { this.conversations.set(convs); this.loadingConvs.set(false); },
      error: ()    =>   this.loadingConvs.set(false),
    });
  }

  openThread(conv: Conversation) {
    this.activeConv.set(conv);
    this.fetchThread(conv.partnerId);
  }

  openThreadById(partnerId: string) {
    this.loadingThread.set(true);
    this.http.get<{ partner: Partner; messages: MessageDoc[] }>(
      `${this.apiBase}/messages/${partnerId}`
    ).subscribe({
      next: res => {
        const last = res.messages.at(-1);
        const conv: Conversation = {
          partnerId,
          partner: res.partner,
          lastMessage: last
            ? { text: last.text, createdAt: last.createdAt, isMine: last.senderId === this.myId() }
            : { text: '', createdAt: new Date().toISOString(), isMine: false },
          unread: 0,
        };
        // Add to list if not already there
        this.conversations.update(cs =>
          cs.find(c => c.partnerId === partnerId) ? cs : [conv, ...cs]
        );
        this.activeConv.set(conv);
        this.messages.set(res.messages);
        this.loadingThread.set(false);
        this.shouldScroll = true;
      },
      error: () => this.loadingThread.set(false),
    });
  }

  fetchThread(partnerId: string) {
    this.loadingThread.set(true);
    this.http.get<{ partner: Partner; messages: MessageDoc[] }>(
      `${this.apiBase}/messages/${partnerId}`
    ).subscribe({
      next: res => {
        this.messages.set(res.messages);
        this.loadingThread.set(false);
        this.shouldScroll = true;
        this.conversations.update(cs =>
          cs.map(c => c.partnerId === partnerId ? { ...c, unread: 0 } : c)
        );
      },
      error: () => this.loadingThread.set(false),
    });
  }

  private poll() {
    if (!this.activeConv()) { this.loadConversations(); return; }
    const partnerId = this.activeConv()!.partnerId;
    this.http.get<{ partner: Partner; messages: MessageDoc[] }>(
      `${this.apiBase}/messages/${partnerId}`
    ).subscribe(res => {
      const prev = this.messages().length;
      this.messages.set(res.messages);
      if (res.messages.length > prev) this.shouldScroll = true;
      this.loadConversations();
    });
  }

  // ── Send ───────────────────────────────────────────────────────────────
  sendMessage() {
    const text = this.newMessage.trim();
    if (!text || !this.activeConv() || this.sending()) return;
    this.sending.set(true);
    const partnerId = this.activeConv()!.partnerId;

    this.http.post<MessageDoc>(`${this.apiBase}/messages/${partnerId}`, { text }).subscribe({
      next: msg => {
        this.messages.update(ms => [...ms, msg]);
        this.newMessage = '';
        this.sending.set(false);
        this.shouldScroll = true;
        const preview = { text: msg.text, createdAt: msg.createdAt, isMine: true };
        this.conversations.update(cs => {
          const idx = cs.findIndex(c => c.partnerId === partnerId);
          if (idx >= 0) {
            const updated = cs.map(c => c.partnerId === partnerId ? { ...c, lastMessage: preview } : c);
            // Move to top
            const [item] = updated.splice(idx, 1);
            return [{ ...item, lastMessage: preview }, ...updated.filter(c => c.partnerId !== partnerId)];
          }
          return [{ ...this.activeConv()!, lastMessage: preview, unread: 0 }, ...cs];
        });
      },
      error: () => this.sending.set(false),
    });
  }

  onEnterKey(e: Event) {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  // ── New Message Modal ──────────────────────────────────────────────────
  closeNewMsg() {
    this.showNewMsg.set(false);
    this.userSearchQuery = '';
    this.userResults.set([]);
  }

  searchUsers() {
    clearTimeout(this.searchTimer);
    if (this.userSearchQuery.length < 2) { this.userResults.set([]); return; }
    this.searchTimer = setTimeout(() => {
      this.searchingUsers.set(true);
      this.http.get<{ data: StudentResult[] }>(
        `${this.apiBase}/users?search=${encodeURIComponent(this.userSearchQuery)}&limit=20`
      ).subscribe({
        next:  r => { this.userResults.set(r.data ?? []); this.searchingUsers.set(false); },
        error: () => this.searchingUsers.set(false),
      });
    }, 300);
  }

  startConversation(u: StudentResult) {
    this.closeNewMsg();
    this.openThreadById(u._id);
  }

  // ── Scroll ─────────────────────────────────────────────────────────────
  private scrollToBottom() {
    try {
      const el = this.scrollEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch { /* ignore */ }
  }
}

interface MessageDoc {
  _id: string;
  senderId: string;
  receiverId: string;
  text: string;
  read: boolean;
  createdAt: string;
}

interface Partner {
  _id: string;
  name: string;
  avatar: string;
  university?: string;
  major?: string;
}
