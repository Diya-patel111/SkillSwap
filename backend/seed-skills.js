/**
 * seed-skills.js
 * Run: node seed-skills.js
 * Seeds the Skill collection with sample skills across all categories.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Skill    = require('./src/models/Skill');

const SKILLS = [
  // ── Coding ───────────────────────────────────────────────────────────────
  { title: 'Python Programming',     category: 'Coding',      level: 'beginner',     description: 'Learn Python fundamentals including variables, loops, functions, and basic data structures.' },
  { title: 'JavaScript Basics',      category: 'Coding',      level: 'beginner',     description: 'Introduction to JavaScript: DOM manipulation, events, and modern ES6+ syntax.' },
  { title: 'React Development',      category: 'Coding',      level: 'intermediate', description: 'Build interactive UIs with React hooks, components, state management, and routing.' },
  { title: 'Node.js & Express',      category: 'Coding',      level: 'intermediate', description: 'Server-side JavaScript: REST APIs, middleware, authentication with Express and Node.' },
  { title: 'Data Structures & Algorithms', category: 'Coding', level: 'advanced',   description: 'Master trees, graphs, sorting, searching, dynamic programming and complexity analysis.' },
  { title: 'Machine Learning Basics', category: 'Coding',     level: 'intermediate', description: 'Intro to ML with scikit-learn: regression, classification, clustering and model evaluation.' },
  { title: 'SQL & Databases',        category: 'Coding',      level: 'beginner',     description: 'Write SQL queries, design relational schemas, and work with PostgreSQL/MySQL.' },
  { title: 'Flutter App Development', category: 'Coding',     level: 'intermediate', description: 'Build cross-platform mobile apps using Flutter and Dart.' },
  { title: 'TypeScript',             category: 'Coding',      level: 'intermediate', description: 'Add static typing to JavaScript with TypeScript interfaces, generics, and decorators.' },
  { title: 'DevOps & Docker',        category: 'Coding',      level: 'advanced',     description: 'Containerization with Docker, CI/CD pipelines, and basic Kubernetes orchestration.' },

  // ── Languages ────────────────────────────────────────────────────────────
  { title: 'Spanish for Beginners',  category: 'Languages',   level: 'beginner',     description: 'Conversational Spanish: greetings, everyday vocabulary, and basic sentence structure.' },
  { title: 'Mandarin Chinese',       category: 'Languages',   level: 'beginner',     description: 'Learn Mandarin pronunciation (pinyin), tones, and essential daily expressions.' },
  { title: 'French Conversation',    category: 'Languages',   level: 'intermediate', description: 'Improve your French speaking and listening through real-life conversation practice.' },
  { title: 'Japanese Hiragana & Katakana', category: 'Languages', level: 'beginner', description: 'Master the two Japanese phonetic alphabets and start reading simple texts.' },
  { title: 'German Grammar',         category: 'Languages',   level: 'intermediate', description: 'Deep dive into German cases, declensions, word order, and verb conjugations.' },
  { title: 'Arabic Script Reading',  category: 'Languages',   level: 'beginner',     description: 'Learn to read and write the Arabic script with correct pronunciation.' },
  { title: 'English Academic Writing', category: 'Languages', level: 'advanced',     description: 'Master essay structure, argumentation, citation styles, and academic vocabulary.' },

  // ── Music ─────────────────────────────────────────────────────────────────
  { title: 'Guitar for Beginners',   category: 'Music',       level: 'beginner',     description: 'Learn basic chords, strumming patterns, and your first songs on acoustic guitar.' },
  { title: 'Piano Fundamentals',     category: 'Music',       level: 'beginner',     description: 'Hand coordination, scales, basic music theory, and simple pieces.' },
  { title: 'Music Theory',           category: 'Music',       level: 'intermediate', description: 'Scales, intervals, chord progressions, harmony, and reading sheet music.' },
  { title: 'Music Production (DAW)', category: 'Music',       level: 'intermediate', description: 'Produce tracks using FL Studio or Ableton: beats, mixing, and basic sound design.' },
  { title: 'Singing & Vocal Technique', category: 'Music',    level: 'beginner',     description: 'Breathing, posture, pitch control, and warm-up exercises for better singing.' },
  { title: 'Drum Kit Basics',        category: 'Music',       level: 'beginner',     description: 'Learn basic rock beats, fills, and coordination on a full drum kit or practice pad.' },

  // ── Design ────────────────────────────────────────────────────────────────
  { title: 'Figma UI/UX Design',     category: 'Design',      level: 'beginner',     description: 'Design app interfaces and prototypes using Figma components and auto-layout.' },
  { title: 'Adobe Illustrator',      category: 'Design',      level: 'intermediate', description: 'Create vector illustrations, logos, and print-ready graphics in Illustrator.' },
  { title: 'Photoshop Photo Editing', category: 'Design',     level: 'beginner',     description: 'Retouch photos, remove backgrounds, and create compositions in Photoshop.' },
  { title: 'Brand Identity Design',  category: 'Design',      level: 'advanced',     description: 'Develop visual identities: logos, colour palettes, typography, and brand guidelines.' },
  { title: 'Video Editing (Premiere)', category: 'Design',    level: 'intermediate', description: 'Cut, colour grade, and deliver videos with Adobe Premiere Pro.' },
  { title: 'Motion Graphics',        category: 'Design',      level: 'advanced',     description: 'Animate text, icons, and infographics using After Effects and keyframe animation.' },

  // ── Marketing ─────────────────────────────────────────────────────────────
  { title: 'Social Media Marketing', category: 'Marketing',   level: 'beginner',     description: 'Grow an audience on Instagram, TikTok, and LinkedIn with content strategy tips.' },
  { title: 'SEO Fundamentals',       category: 'Marketing',   level: 'beginner',     description: 'On-page SEO, keyword research, link-building basics, and Google Search Console.' },
  { title: 'Google Ads (PPC)',       category: 'Marketing',   level: 'intermediate', description: 'Set up, optimise, and analyse Google Search and Display ad campaigns.' },
  { title: 'Email Marketing',        category: 'Marketing',   level: 'beginner',     description: 'Build lists, write effective emails, and automate sequences with Mailchimp or similar tools.' },
  { title: 'Content Marketing Strategy', category: 'Marketing', level: 'intermediate', description: 'Plan, create, and distribute content that attracts and converts your target audience.' },

  // ── Writing ───────────────────────────────────────────────────────────────
  { title: 'Creative Writing',       category: 'Writing',     level: 'beginner',     description: 'Craft compelling short stories and scenes through character, plot, and dialogue exercises.' },
  { title: 'Copywriting',            category: 'Writing',     level: 'intermediate', description: 'Write persuasive ad copy, landing pages, and CTAs that convert readers into customers.' },
  { title: 'Technical Writing',      category: 'Writing',     level: 'intermediate', description: 'Create clear documentation, API guides, user manuals, and how-to articles.' },
  { title: 'Blogging & SEO Writing', category: 'Writing',     level: 'beginner',     description: 'Write blog posts optimised for search engines while keeping them engaging for readers.' },
  { title: 'Screenplay Writing',     category: 'Writing',     level: 'advanced',     description: 'Structure scripts for film and TV using industry-standard format and story beats.' },

  // ── Mathematics ───────────────────────────────────────────────────────────
  { title: 'Calculus I & II',        category: 'Mathematics', level: 'intermediate', description: 'Limits, derivatives, integrals, and series — college-level calculus tutoring.' },
  { title: 'Linear Algebra',         category: 'Mathematics', level: 'intermediate', description: 'Vectors, matrices, eigenvalues, and their applications in data science and graphics.' },
  { title: 'Statistics & Probability', category: 'Mathematics', level: 'beginner',  description: 'Descriptive stats, distributions, hypothesis testing, and basic probability theory.' },
  { title: 'Discrete Mathematics',   category: 'Mathematics', level: 'intermediate', description: 'Logic, set theory, graph theory, and combinatorics for CS students.' },
  { title: 'GMAT / GRE Maths Prep', category: 'Mathematics',  level: 'advanced',    description: 'Intensive prep for the quantitative sections of GMAT and GRE standardised tests.' },

  // ── Science ───────────────────────────────────────────────────────────────
  { title: 'General Chemistry',      category: 'Science',     level: 'beginner',     description: 'Atoms, bonding, reactions, stoichiometry, and basic thermodynamics.' },
  { title: 'Biology (Cell & Molecular)', category: 'Science', level: 'intermediate', description: 'Cell biology, genetics, DNA replication, and protein synthesis.' },
  { title: 'Physics Mechanics',      category: 'Science',     level: 'intermediate', description: 'Kinematics, Newton\'s laws, energy, momentum, and rotational dynamics.' },
  { title: 'Organic Chemistry',      category: 'Science',     level: 'advanced',     description: 'Functional groups, reaction mechanisms, stereochemistry, and synthesis pathways.' },
  { title: 'Astronomy & Astrophysics', category: 'Science',   level: 'beginner',     description: 'Explore the solar system, stars, galaxies, and the fundamental laws of the universe.' },

  // ── Other ─────────────────────────────────────────────────────────────────
  { title: 'Public Speaking',        category: 'Other',       level: 'beginner',     description: 'Overcome anxiety, structure speeches, and deliver presentations with confidence.' },
  { title: 'Excel & Spreadsheets',   category: 'Other',       level: 'beginner',     description: 'Formulas, pivot tables, VLOOKUP, and data visualisation in Microsoft Excel.' },
  { title: 'Personal Finance',       category: 'Other',       level: 'beginner',     description: 'Budgeting, investing basics, debt management, and building an emergency fund.' },
  { title: 'Photography',            category: 'Other',       level: 'intermediate', description: 'Composition, lighting, exposure triangle, and editing RAW files in Lightroom.' },
  { title: 'Chess Strategy',         category: 'Other',       level: 'intermediate', description: 'Opening theory, middle-game tactics, endgame techniques, and positional understanding.' },
  { title: 'Cooking & Meal Prep',    category: 'Other',       level: 'beginner',     description: 'Learn essential cooking techniques, knife skills, and weekly meal planning strategies.' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Remove existing skills
    const deleted = await Skill.deleteMany({});
    console.log(`🗑  Removed ${deleted.deletedCount} existing skills`);

    // Insert using save() so the pre-save slug hook fires for each doc
    let count = 0;
    for (const s of SKILLS) {
      try {
        const skill = new Skill({ ...s, isApproved: true });
        await skill.save();
        count++;
      } catch (e) {
        console.warn(`  ⚠ Skipped "${s.title}": ${e.message}`);
      }
    }
    console.log(`🌱 Seeded ${count} skills`);

    await mongoose.disconnect();
    console.log('✅ Done — database disconnected');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
