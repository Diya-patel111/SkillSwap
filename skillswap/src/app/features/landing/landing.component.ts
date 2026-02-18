import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { SkillBadgeComponent } from '../../shared/components/skill-badge/skill-badge.component';

interface Feature { icon: string; title: string; description: string; }
interface Testimonial { name: string; role: string; text: string; avatar: string; }
interface SkillPill { label: string; icon: string; }

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent, SkillBadgeComponent],
  template: `
    <app-navbar />

    <main>
      <!-- Hero Section -->
      <section class="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div class="sm:text-center lg:text-left lg:col-span-6">
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Learn something <span class="text-primary">new</span>, share what you know.
              </h1>
              <p class="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl lg:mx-0 mx-auto leading-relaxed">
                The student platform where your skills are the currency. Trade knowledge, build your portfolio, and grow your network within your campus community.
              </p>
              <div class="mt-10 flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                <a routerLink="/auth/register"
                  class="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2">
                  Join Now <span class="material-symbols-outlined">arrow_forward</span>
                </a>
                <a routerLink="/skills"
                  class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center">
                  Explore Skills
                </a>
              </div>
              <div class="mt-8 flex items-center gap-4 sm:justify-center lg:justify-start text-slate-500 dark:text-slate-400 text-sm font-medium">
                <div class="flex -space-x-2">
                  <div class="h-8 w-8 rounded-full ring-2 ring-white dark:ring-background-dark bg-primary/20 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div class="h-8 w-8 rounded-full ring-2 ring-white dark:ring-background-dark bg-primary/30 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div class="h-8 w-8 rounded-full ring-2 ring-white dark:ring-background-dark bg-primary/40 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                </div>
                <span>Joined by 2,000+ students this week</span>
              </div>
            </div>
            <div class="mt-16 lg:mt-0 lg:col-span-6">
              <div class="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 bg-gradient-to-br from-primary/20 to-primary/5 aspect-square lg:aspect-[4/3] flex items-center justify-center">
                <div class="text-center p-12">
                  <span class="material-symbols-outlined text-primary" style="font-size: 6rem;">swap_calls</span>
                  <p class="text-primary font-bold text-xl mt-4">Skill Exchange Network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Decorative blobs -->
        <div class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
        <div class="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      </section>

      <!-- Skill Pills -->
      <section class="py-10 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark/50 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-3">
          @for (pill of skillPills; track pill.label) {
            <app-skill-badge [label]="pill.label" [icon]="pill.icon" variant="primary" />
          }
        </div>
      </section>

      <!-- Features -->
      <section class="py-24 bg-background-light dark:bg-background-dark">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-16">
            <h2 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Why SkillSwap?</h2>
            <p class="mt-4 text-lg text-slate-600 dark:text-slate-400">Experience the best way for students to level up their skills through community exchange.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @for (feature of features; track feature.title) {
              <div class="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group">
                <div class="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span class="material-symbols-outlined">{{ feature.icon }}</span>
                </div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3">{{ feature.title }}</h3>
                <p class="text-slate-600 dark:text-slate-400 leading-relaxed">{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="py-24 bg-white dark:bg-background-dark">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">What Students are Saying</h2>
              <p class="mt-4 text-lg text-slate-600 dark:text-slate-400">Join thousands of students who have already accelerated their learning journey.</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (t of testimonials; track t.name) {
              <div class="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                <div class="flex items-center gap-4 mb-6">
                  <div class="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <h4 class="font-bold text-slate-900 dark:text-white">{{ t.name }}</h4>
                    <p class="text-xs text-primary font-semibold uppercase tracking-wider">{{ t.role }}</p>
                  </div>
                </div>
                <p class="text-slate-700 dark:text-slate-300 italic leading-relaxed">"{{ t.text }}"</p>
                <div class="mt-6 flex text-primary">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span class="material-symbols-outlined text-sm">star</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="py-20">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-primary rounded-[2.5rem] p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
            <div class="relative z-10">
              <h2 class="text-3xl md:text-5xl font-black mb-6">Ready to swap your skills?</h2>
              <p class="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Join your fellow students and start trading knowledge today. It's free, it's fast, and it's fun.
              </p>
              <div class="flex flex-col sm:flex-row justify-center gap-4">
                <a routerLink="/auth/register" class="bg-white text-primary px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 transition-all shadow-xl">
                  Create Your Profile
                </a>
                <a routerLink="/skills" class="bg-primary/20 border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary/30 transition-all">
                  Explore Skills
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <app-footer />
  `,
})
export class LandingComponent {
  skillPills: SkillPill[] = [
    { label: 'Python', icon: 'code' },
    { label: 'Graphic Design', icon: 'brush' },
    { label: 'Guitar', icon: 'music_note' },
    { label: 'Spanish', icon: 'translate' },
    { label: 'Data Science', icon: 'data_thresholding' },
    { label: 'React', icon: 'rocket_launch' },
    { label: 'Marketing', icon: 'psychology' },
  ];

  features: Feature[] = [
    { icon: 'payments', title: 'Zero Cost', description: 'No money involved, just pure knowledge exchange. Your time and expertise are the only currency you need.' },
    { icon: 'verified_user', title: 'Build Portfolio', description: 'Get verified reviews and certificates for the skills you teach. Boost your resume with real-world mentoring experience.' },
    { icon: 'school', title: 'Student Only', description: 'A safe, high-trust community restricted to verified university emails. Connect with peers who share your goals.' },
  ];

  testimonials: Testimonial[] = [
    { name: 'Sarah Jenkins', role: 'Economics Major', text: 'I taught Spanish and learned React in two weeks! The platform is so intuitive, and I met a great study buddy.', avatar: '' },
    { name: 'Alex Rivera', role: 'CS Graduate', text: 'Building my teaching portfolio on SkillSwap actually helped me land my first internship. Companies love seeing mentoring skills!', avatar: '' },
    { name: 'Emily Chen', role: 'Fine Arts Major', text: 'I was struggling with Python for my digital art project. Within a day, I found someone to help in exchange for Photoshop lessons.', avatar: '' },
  ];
}
