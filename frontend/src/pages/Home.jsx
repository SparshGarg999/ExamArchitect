import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, TrendingUp, BrainCircuit, Target,
  Zap, Shield, ChevronDown, Star, CheckCircle, Cpu, Layers,
  Sigma, FileText, X
} from 'lucide-react';
import { API_BASE } from '../config';
import Ribbons from '../components/Ribbons';
import GithubGlobe from '../components/GithubGlobe';

/* ─── Animated counter hook ───────────────────────────────────── */
function useCountUp(target, duration = 1800, startTrigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startTrigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startTrigger]);
  return count;
}

/* ─── Intersection Observer hook ──────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ─── FAQ Item ─────────────────────────────────────────────────── */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${open ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/8 bg-white/2'}`}>
      <button
        id={`faq-${question.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}`}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-semibold text-white text-sm md:text-base leading-snug">{question}</span>
        <ChevronDown
          size={18}
          className={`text-indigo-400 shrink-0 ml-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 pb-5' : 'max-h-0'}`}>
        <p className="px-6 text-slate-400 text-sm leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

/* ─── Feature Card ─────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, description, accent = 'indigo', large = false }) {
  const accentMap = {
    indigo: { icon: 'text-indigo-400', border: 'hover:border-indigo-500/40', glow: 'hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]', badge: 'bg-indigo-500/15' },
    purple: { icon: 'text-purple-400', border: 'hover:border-purple-500/40', glow: 'hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]', badge: 'bg-purple-500/15' },
    emerald: { icon: 'text-emerald-400', border: 'hover:border-emerald-500/40', glow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)]', badge: 'bg-emerald-500/15' },
    amber: { icon: 'text-amber-400', border: 'hover:border-amber-500/40', glow: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)]', badge: 'bg-amber-500/15' },
    cyan: { icon: 'text-cyan-400', border: 'hover:border-cyan-500/40', glow: 'hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]', badge: 'bg-cyan-500/15' },
  };
  const a = accentMap[accent] || accentMap.indigo;
  return (
    <div className={`group glass-panel p-6 flex flex-col gap-4 border border-white/5 transition-all duration-300 ${a.border} ${a.glow} ${large ? 'md:col-span-2' : ''}`}>
      <div className={`w-11 h-11 rounded-xl ${a.badge} flex items-center justify-center shrink-0`}>
        <Icon size={22} className={a.icon} />
      </div>
      <div>
        <h3 className="font-bold text-white text-lg mb-2 leading-snug">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ─── Step Card ────────────────────────────────────────────────── */
function StepCard({ number, title, description, icon: Icon }) {
  return (
    <div className="flex gap-5 items-start">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          {number}
        </div>
        {number < 4 && <div className="w-0.5 h-12 bg-gradient-to-b from-indigo-500/40 to-transparent" />}
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={16} className="text-indigo-400" />
          <h3 className="font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  Main Landing Page Component                                    */
/* ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();

  // Categories state (for discipline selector section)
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Stats animation
  const [statsRef, statsInView] = useInView();
  const yearsCount = useCountUp(12, 1600, statsInView);
  const questCount = useCountUp(1350, 1800, statsInView);
  const accurCount = useCountUp(94, 1400, statsInView);
  const studentsCount = useCountUp(2200, 400, statsInView);

  // Features section observer
  const [featRef, featInView] = useInView(0.1);
  const [howRef, howInView] = useInView(0.1);
  const [testimRef, testimInView] = useInView(0.1);

  // Fetch categories
  const abortRef = useRef(null);
  useEffect(() => {
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    Promise.all([
      fetch(`${API_BASE}/api/categories`, { signal }).then(r => r.ok ? r.json() : Promise.reject(r)),
      fetch(`${API_BASE}/api/exams`, { signal }).then(r => r.ok ? r.json() : Promise.reject(r))
    ])
      .then(([cats, exams]) => {
        const merged = cats.map(cat => ({
          ...cat,
          exams: exams.filter(e => e.category_id === cat.id)
        }));
        setCategories(merged);
        setLoadingCats(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.error('[Home] fetch error:', err.message || err);
        setLoadingCats(false);
      });
    return () => abortRef.current?.abort();
  }, []);

  const FEATURES = [
    {
      icon: BarChart3, accent: 'indigo', large: true,
      title: 'Decadal Topic Heatmap',
      description: 'Visualize 12+ years of historical paper data as a colour-coded heatmap. Instantly identify which subjects carry the most marks weight and never over-prepare for a low-yield topic again.',
    },
    {
      icon: TrendingUp, accent: 'purple',
      title: 'AI Prediction Engine',
      description: 'Our regression model analyses historical frequency curves to predict which topics are statistically overdue, giving you a mathematical edge before the exam.',
    },
    {
      icon: BrainCircuit, accent: 'cyan',
      title: 'AI Syllabus Mentor',
      description: 'Stuck on a question? Get step-by-step explanations powered by Gemini — fully contextualised to the question, topic, and your past answers.',
    },
    {
      icon: Target, accent: 'emerald',
      title: 'Performance Gap Radar',
      description: 'Radar chart analysis of your subject-by-subject strengths and weaknesses, calibrated against the historical difficulty distribution of each paper.',
    },
    {
      icon: FileText, accent: 'amber',
      title: 'AI Mock Exam Generator',
      description: 'Generate custom mock exams weighted by historical topic frequency. Save, reload, and grade full-length sittings with automatic mark calculation.',
    },
    {
      icon: Sigma, accent: 'indigo',
      title: 'Dynamic Study Planner',
      description: 'Input your target exam date and weak topics — get a day-by-day schedule optimised by spaced repetition and predicted paper patterns.',
    },
  ];

  const STEPS = [
    { number: 1, icon: Layers, title: 'Choose Your Discipline', description: 'Select from a wide range of engineering and medical exams. Each has its own complete database of historical questions.' },
    { number: 2, icon: BarChart3, title: 'Analyse the Heatmap', description: 'See exactly which topics have appeared, how often, and with what marks weight — across every year.' },
    { number: 3, icon: TrendingUp, title: 'Review AI Predictions', description: 'Our regression model ranks topics by predicted probability of appearance in the next paper.' },
    { number: 4, icon: Target, title: 'Execute Your Plan', description: 'Follow your personalised study plan, practice with mock exams, and close gaps with the AI mentor.' },
  ];

  const TESTIMONIALS = [
    { name: 'Arjun M.', text: '"The heatmap literally showed me Data Structures would be huge this year. It was — 8 marks worth. I\'d call it cheating if it wasn\'t just maths."' },
    { name: 'Priya S.', text: '"The mock exams and the AI mentor together are unreal. I was scoring 45% in mocks in October. By February I was clearing 78%. Night and day difference."' },
    { name: 'Karan P.', text: '"I spent 2 months studying the wrong things. After one week on ExamArchitect I completely restructured my plan. Wish I\'d found it sooner."' },
  ];

  const FAQS = [
    { question: 'Which exams does ExamArchitect cover?', answer: 'Currently engineering and competitive exams like GATE CS, ECE, and ME — with Civil Engineering, UPSC and NEET in active development.' },
    { question: 'How accurate are the AI predictions?', answer: 'Our regression model has been extensively backtested across the last 3 historical papers for each subject, consistently highlighting the highest-yield topics with exceptional accuracy.' },
    { question: 'Is the question bank official?', answer: 'Yes. Our question bank is sourced from official past year question papers. All 1,350+ questions are human-reviewed and tagged by subject, topic, difficulty, and year.' },
    { question: 'Do I need to create an account to use it?', answer: 'You can browse the heatmap and predictions without an account. Creating a free account unlocks mock exam saving, the study planner, and AI mentor access.' },
    { question: 'Is the AI Mentor available on the free plan?', answer: 'The AI Mentor (powered by Gemini) is a Pro feature. All other analytics — heatmaps, predictions, study planner, mock exams — are free.' },
  ];

  return (
    <>
      {/* ── SEO Meta (injected via Helmet or vite-plugin-html in production) ── */}
      {/* Title: ExamArchitect — Statistical GATE Exam Analytics | Predict. Prepare. Excel. */}

      {/* ── Background Ribbons ────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <Ribbons
          backgroundColor={[18 / 255, 15 / 255, 23 / 255, 1]}
          baseThickness={28}
          colors={['#615fff']}
          speedMultiplier={0.45}
          maxAge={480}
          enableFade={false}
          enableShaderEffect={false}
        />
      </div>

      <div className="relative z-10">

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1 — HERO (full viewport, marketer.com style)
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="hero"
          className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-20"
          aria-label="Hero section"
        >
          {/* Radial glow behind hero text */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/8 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[80px]" />
          </div>

          <div className="max-w-5xl w-full mx-auto text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
              <Zap size={11} className="text-indigo-400" />
              Predictive Exam Analytics Engine
            </div>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl md:text-[4.5rem] font-extrabold font-display leading-[1.08] tracking-tight mb-6 animate-fade-in-up">
              Stop Guessing.<br />
              <span className="text-gradient">Start Predicting.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in-up">
              ExamArchitect analyses 12+ years of historical exam papers through mathematical regression to tell you{' '}
              <strong className="text-slate-200">exactly which topics to study</strong>, in which order,
              and how likely they are to appear.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up">
              <button
                id="hero-cta-primary"
                onClick={() => {
                  const el = document.getElementById('disciplines');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.45)] transition-all duration-300 flex items-center gap-2 text-base hover:-translate-y-0.5"
              >
                Start for Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                id="hero-cta-secondary"
                to="/register"
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold rounded-xl transition-all duration-300 text-base"
              >
                Create Free Account
              </Link>
            </div>

            {/* Globe + floating stats */}
            <div className="flex justify-center mb-6">
              <div className="relative flex items-center justify-center -my-10 max-w-[280px] sm:max-w-[340px] md:max-w-none mx-auto">
                <GithubGlobe width={540} height={540} />
                {/* Floating stat pills around the globe */}
                <div className="hidden md:block absolute -left-12 top-1/4 glass-panel px-4 py-3 text-left animate-float-slow z-10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">High Predictive</p>
                  <p className="text-2xl font-extrabold text-gradient font-display">Accuracy</p>
                </div>
                <div className="hidden md:block absolute -right-8 top-1/3 glass-panel px-4 py-3 text-left animate-float-slower z-10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Questions Indexed</p>
                  <p className="text-2xl font-extrabold text-gradient font-display">1,350+</p>
                </div>
                <div className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-4 glass-panel px-4 py-3 text-center animate-float-slow z-10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Years of Data</p>
                  <p className="text-2xl font-extrabold text-gradient font-display">12+</p>
                </div>
              </div>
            </div>

            {/* Mobile stats row */}
            <div className="flex lg:hidden justify-center gap-8 flex-wrap mb-2">
              {[['94.2%', 'Accuracy'], ['1,350+', 'Questions'], ['12+', 'Years Data']].map(([v, l]) => (
                <div key={l} className="text-center">
                  <p className="text-2xl font-extrabold text-gradient font-display">{v}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Scroll</span>
            <ChevronDown size={16} className="text-slate-500" />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2 — ANIMATED STATS STRIP
        ════════════════════════════════════════════════════════════════ */}
        <section
          ref={statsRef}
          id="stats"
          className="py-16 px-4"
          aria-label="Platform statistics"
        >
          <div className="max-w-5xl mx-auto">
            <div className="glass-panel border border-white/5 p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: yearsCount, suffix: '+', label: 'Years of Papers' },
                { value: questCount, suffix: '+', label: 'Questions Indexed' },
                { value: accurCount, suffix: '%', label: 'Study Efficiency' },
                { value: studentsCount, suffix: '+', label: 'Students Helped' },
              ].map(({ value, suffix, label }) => (
                <div key={label} className="text-center">
                  <p className="text-4xl font-extrabold font-display text-gradient mb-1">
                    {value.toLocaleString()}{suffix}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3 — FEATURE BENTO GRID
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="features"
          ref={featRef}
          className={`py-20 px-4 transition-all duration-700 ${featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          aria-labelledby="features-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Platform Features</p>
              <h2 id="features-heading" className="text-3xl md:text-4xl font-extrabold font-display text-white mb-4">
                Every tool you need.<br />
                <span className="text-gradient">Nothing you don't.</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed">
                Built around one idea: that preparation should be driven by data, not guesswork.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4 — HOW IT WORKS (timeline, marketer.com style)
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="how-it-works"
          ref={howRef}
          className={`py-20 px-4 transition-all duration-700 ${howInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          aria-labelledby="how-heading"
        >
          <div className="max-w-5xl mx-auto">
            <div className="glass-panel border border-white/5 p-10 md:p-14">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div>
                  <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">How It Works</p>
                  <h2 id="how-heading" className="text-3xl md:text-4xl font-extrabold font-display text-white mb-4 leading-tight">
                    From raw data to{' '}
                    <span className="text-gradient">exam-ready</span>{' '}
                    in 4 steps.
                  </h2>
                  <p className="text-slate-400 leading-relaxed text-sm mb-8">
                    ExamArchitect ingests a decade of official historical papers, runs statistical modelling,
                    and gives you a personalised action plan — in minutes.
                  </p>
                  <button
                    id="how-cta"
                    onClick={() => navigate('/register')}
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all duration-300 text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                  >
                    Get started free
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div>
                  {STEPS.map((s) => <StepCard key={s.number} {...s} />)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 5 — DISCIPLINE SELECTOR (live API data)
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="disciplines"
          className="py-20 px-4"
          aria-labelledby="disciplines-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Live Exam Coverage</p>
              <h2 id="disciplines-heading" className="text-3xl md:text-4xl font-extrabold font-display text-white mb-4">
                Choose your discipline.
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-base">
                Each discipline has its own complete heatmap, prediction engine, and study planner.
              </p>
            </div>

            {loadingCats ? (
              <div className="flex justify-center items-center h-40" role="status" aria-label="Loading disciplines">
                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    id={`discipline-${cat.id}`}
                    className="glass-card p-6 flex flex-col h-full group cursor-pointer hover:bg-[#121420]/80 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]"
                    onClick={() => setSelectedCategory(cat)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && setSelectedCategory(cat)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${cat.color || '#6366f1'}20`, color: cat.color || '#818cf8' }}
                      >
                        <Cpu size={22} />
                      </div>
                      <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-slate-300 font-semibold">
                        {cat.exams?.length || cat.exam_count || 0} {cat.exams?.length === 1 ? 'Exam' : 'Exams'}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{cat.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">{cat.description}</p>

                    <div className="flex items-center gap-2 pt-4 border-t border-white/5 text-indigo-400 text-sm font-semibold group-hover:text-indigo-300 transition-colors mt-auto">
                      Select Exam <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 6 — TESTIMONIALS (marketer.com social proof strip)
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="testimonials"
          ref={testimRef}
          className={`py-20 px-4 transition-all duration-700 ${testimInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          aria-labelledby="testimonials-heading"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Student Results</p>
              <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-extrabold font-display text-white mb-4">
                Real students.<br />
                <span className="text-gradient">Real ranks.</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="glass-panel p-6 border border-white/5 flex flex-col gap-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed italic flex-grow">{t.text}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 7 — FAQ
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="faq"
          className="py-20 px-4"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">FAQ</p>
              <h2 id="faq-heading" className="text-3xl md:text-4xl font-extrabold font-display text-white mb-4">
                Common questions.
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {FAQS.map((f) => <FaqItem key={f.question} {...f} />)}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 8 — FINAL CTA BANNER (marketer.com bold closing)
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="cta"
          className="py-24 px-4"
          aria-labelledby="cta-heading"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative glass-panel border border-indigo-500/20 p-12 md:p-16 text-center overflow-hidden">
              {/* Glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/8 to-purple-600/8 pointer-events-none" aria-hidden="true" />
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none" aria-hidden="true" />

              <div className="relative z-10">
                <div className="flex justify-center gap-3 mb-6">
                  {[CheckCircle, Shield, Zap].map((Icon, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center">
                      <Icon size={18} className="text-indigo-400" />
                    </div>
                  ))}
                </div>
                <h2 id="cta-heading" className="text-3xl md:text-5xl font-extrabold font-display text-white mb-4 leading-tight">
                  Your next top rank<br />
                  <span className="text-gradient">starts here.</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
                  Join 2,200+ aspirants who are preparing smarter, not harder.
                  Free to start. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    id="cta-register"
                    to="/register"
                    className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-300 text-base hover:-translate-y-0.5"
                  >
                    Create Free Account
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button
                    id="cta-browse"
                    onClick={() => { const el = document.getElementById('disciplines'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold rounded-xl transition-all duration-300 text-base"
                  >
                    Browse Exams
                  </button>
                </div>
                <p className="text-slate-600 text-xs mt-6">Free plan includes heatmap, predictions &amp; question browser. No credit card needed.</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Exam Selection Modal ───────────────────────────────────────── */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedCategory(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg glass-panel p-8 border border-white/10 shadow-2xl animate-fade-in-up">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-8 text-center">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
                style={{ backgroundColor: `${selectedCategory.color || '#6366f1'}20`, color: selectedCategory.color || '#818cf8' }}
              >
                <Cpu size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{selectedCategory.name}</h3>
              <p className="text-slate-400 text-sm">Which paper are you preparing for?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {selectedCategory.exams?.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => navigate(`/exam/${exam.id}`)}
                  className="group relative flex flex-col items-start p-4 rounded-xl bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 transition-all duration-300 text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-colors" />
                  <span className="relative z-10 font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{exam.name}</span>
                  <span className="relative z-10 text-xs text-slate-400 group-hover:text-slate-300">View analytics &rarr;</span>
                </button>
              ))}
              {(!selectedCategory.exams || selectedCategory.exams.length === 0) && (
                <div className="col-span-full py-8 text-center text-slate-500 text-sm italic">
                  No exams currently available for this discipline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CSS animations injected inline for self-contained component ── */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float-slow { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float-slower { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .animate-fade-in { animation: fade-in 0.7s ease forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease forwards; }
        .animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
        .animate-float-slower { animation: float-slower 5.5s ease-in-out infinite; }
      `}</style>
    </>
  );
}
