import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import OnboardingView from './OnboardingView';
import ProfileView from './ProfileView';
import {
    MessageSquare,
    Home,
    LayoutDashboard,
    Star,
    ShieldCheck,
    Upload,
    Zap,
    CheckCircle,
    ArrowRight,
    User,
    Database,
    MessageCircle,
    LogOut,
    ChevronDown,
    Clock,
    Instagram,
    Linkedin,
    Twitter,
    Trash2,
    UserPlus,
    UserMinus,
    MapPin,
    AlertTriangle,
    Pencil,
    Plus,
    Settings,
} from 'lucide-react';
import { dbService } from './dbService';
import { supabase } from './supabaseClient';
import { translations, LANGUAGES, RTL_LANGS } from './translations';
import SignupModal from './SignupModal';
import HowItWorksModal from './HowItWorksModal';
import AuthView from './AuthView';

const FEATURE_ICONS = [MessageSquare, Home, LayoutDashboard, Clock, Star, ShieldCheck];
const STEP_ICONS = [Upload, MessageSquare, Zap, CheckCircle];
const TESTIMONIAL_IMAGES = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150',
];

function App() {
    const [user, setUser] = useState(null);
    const [authLoaded, setAuthLoaded] = useState(false);
    const [lang, setLang] = useState('PT');
    const [signupOpen, setSignupOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [howOpen, setHowOpen] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    const t = translations[lang];

    useEffect(() => {
        const fetchProfile = async (userId) => {
            try {
                const { data, error } = await Promise.race([
                    supabase.from('users').select('role_id').eq('id', userId).maybeSingle(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
                ]);
                if (data) setUserProfile(data);
            } catch (err) {
                console.error('profile fetch threw:', err);
            }
        };

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setUser(session?.user || null);
            if (session?.user) await fetchProfile(session.user.id);
            setAuthLoaded(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setUserProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

    return (
        <div dir={dir} className="bg-brand-light min-h-screen text-brand-dark font-sans selection:bg-brand-primary/10 flex flex-col">
            <SignupModal
                open={signupOpen}
                onClose={() =>{ setSignupOpen(false); setSelectedPlan(null); }}
                lang={lang}
                plan={selectedPlan}
            />
            <HowItWorksModal
                open={howOpen}
                onClose={() => setHowOpen(false)}
                lang={lang}
                onSignupOpen={() => { setHowOpen(false); setSelectedPlan(null); setSignupOpen(true); }}
            />

            <Navbar user={user} lang={lang} setLang={setLang} t={t} />

            <main className="flex-1">
                <Routes>
                    <Route path="/" element={
                        <Landing
                            t={t}
                            onSignupOpen={(plan) => { setSelectedPlan(plan); setSignupOpen(true); }}
                            onHowOpen={() => setHowOpen(true)}
                        />
                    } />
                    <Route path="/onboarding" element={
                        !authLoaded ? (
                            <div className="flex justify-center items-center py-24 text-brand-primary font-bold text-sm">
                                {t.dash_loading}
                            </div>
                        ) : user ? (
                            <OnboardingView lang={lang}/>
                        ) : (
                            <Navigate to="/auth/login" replace />
                        )
                    } />
                    <Route path="/auth/login" element={
                        user ? <Navigate to="/dashboard" replace /> : <AuthView t={t} />
                    } />
                    <Route path="/auth/register" element={
                        user ? <Navigate to="/dashboard" replace /> : <AuthView t={t} />
                    } />
                    <Route path="/dashboard" element={
                        !authLoaded ? (
                            <div className="flex justify-center items-center py-24 text-brand-primary font-bold text-sm">
                                {t.dash_loading}
                            </div>
                        ) : user ? (
                            userProfile?.role_id === 1
                                ? <ClientDashboardView user={user} lang={lang} />
                                : <DashboardView user={user} t={t} userProfile={userProfile} />
                        ) : (
                            <Navigate to="/auth/login" replace />
                        )
                    } />
                    <Route path="/profile" element={
                        !authLoaded ? (
                            <div className="flex justify-center items-center py-24 text-brand-primary font-bold text-sm">
                                {t.dash_loading}
                            </div>
                        ) : user ? (
                            <ProfileView user={user} lang={lang} />
                        ) : (
                            <Navigate to="/auth/login" replace />
                        )
                    } />
                    {/* ✅ FIX (was unreachable): /auth/reset moved BEFORE the wildcard so React Router doesn't shadow it. Forgot-password is reached via the in-AuthView button which toggles internal `forgotMode` state. */}
                    <Route path="/auth/reset" element={<ResetPasswordView t={t} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            <Footer t={t} />
        </div>
    );
}

const Landing = ({ t, onSignupOpen, onHowOpen }) => (
    <>
        <Hero onSignupOpen={onSignupOpen} onHowOpen={onHowOpen} t={t} />
        <Features t={t} />
        <HowItWorks t={t} />
        <Experience t={t} />
        <Testimonials t={t} />
        <Pricing t={t} onSignupOpen={onSignupOpen} />
        <SignupSection t={t} />
    </>
);

const LanguageSelector = ({ lang, setLang }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = LANGUAGES.find(l => l.code === lang);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-brand-primary/20 text-sm font-semibold text-brand-dark hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all"
            >
                <span className="text-base leading-none">{current?.flag}</span>
                <span>{lang}</span>
                <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-brand-primary/10 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {LANGUAGES.map(l => (
                        <button
                            key={l.code}
                            onClick={() => { setLang(l.code); setOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                                lang === l.code
                                    ? 'bg-brand-primary/10 text-brand-primary font-bold'
                                    : 'text-brand-dark hover:bg-brand-primary/5'
                            }`}
                        >
                            <span className="text-base leading-none">{l.flag}</span>
                            <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const UserMenu = ({ user, t, navigate }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const avatar = (user.user_metadata?.full_name || user.email || '?')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || '';

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const item = (onClick, Icon, label, danger = false) => (
        <button
            onClick={() => { setOpen(false); onClick(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left rounded-xl ${
                danger
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-brand-dark/70 hover:bg-brand-primary/8 hover:text-brand-dark'
            }`}
        >
            <Icon size={15} className="shrink-0" />
            {label}
        </button>
    );

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-0 bg-brand-primary hover:bg-brand-accent transition-all rounded-full shadow-sm pr-3 select-none"
            >
                {/* Avatar circle */}
                <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs font-serif shrink-0">
                    {avatar}
                </span>
                {/* Name */}
                <span className="text-white text-sm font-semibold px-2 max-w-[120px] truncate">
                    {displayName}
                </span>
                {/* Chevron */}
                <ChevronDown
                    size={14}
                    className={`text-white/80 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-brand-primary/10 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-2 border-b border-brand-primary/8 mb-1">
                        <p className="text-xs font-bold text-brand-dark truncate">{displayName}</p>
                        <p className="text-[11px] text-brand-dark/40 truncate">{user.email}</p>
                    </div>
                    <div className="px-2">
                        {item(() => navigate('/profile'), User, t.profile_link)}
                        {item(() => navigate('/dashboard'), LayoutDashboard, t.nav.goDashboard)}
                        <div className="border-t border-brand-primary/8 my-1" />
                        {item(async () => { await supabase.auth.signOut(); navigate('/'); }, LogOut, t.dash_logout, true)}
                    </div>
                </div>
            )}
        </div>
    );
};

const Navbar = ({ user, lang, setLang, t }) => {
    const navigate = useNavigate();

    return (
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-brand-light/90 backdrop-blur-sm sticky top-0 z-40 border-b border-brand-primary/10">
            <Link to="/" className="text-2xl font-serif font-bold text-brand-dark">StaySmart</Link>
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-brand-dark">
                <a href="/#funcionalidades" className="hover:text-brand-primary transition-colors">{t.nav.features}</a>
                <a href="/#como-funciona" className="hover:text-brand-primary transition-colors">{t.nav.howItWorks}</a>
                <a href="/#precos" className="hover:text-brand-primary transition-colors">{t.nav.pricing}</a>
                <a href="/#contacto" className="hover:text-brand-primary transition-colors">{t.nav.contact}</a>
            </div>
            <div className="flex items-center gap-3">
                <LanguageSelector lang={lang} setLang={setLang} />
                {user ? (
                    <UserMenu user={user} t={t} navigate={navigate} />
                ) : (
                    <button
                        onClick={() => navigate('/auth/login')}
                        className="bg-brand-primary text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-brand-accent transition-all shadow-sm flex items-center gap-2"
                    >
                        <LayoutDashboard size={15} />
                        {t.nav.signin}
                    </button>
                )}
            </div>
        </nav>
    );
};

const Hero = ({ onSignupOpen, onHowOpen, t }) => (
    <section className="relative min-h-[80vh] flex items-center justify-center px-6 overflow-hidden py-16">
        <div className="absolute inset-0 z-0">
            <img
                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000"
                className="w-full h-full object-cover opacity-30"
                alt="Luxury Accommodation"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-light/20 via-brand-light/40 to-brand-light"></div>
        </div>
        <div className="relative z-10 max-w-4xl text-center mx-auto">
            <div className="inline-block px-4 py-1.5 mb-6 border border-brand-primary/30 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest">
                <Zap size={12} className="inline mr-1" /> {t.hero.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-brand-dark mb-6 leading-tight">
                {t.hero.h1}<br />{t.hero.h1b}
            </h1>
            <p className="text-lg md:text-xl text-brand-dark/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                {t.hero.p}
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
                <button
                    onClick={() => onSignupOpen(null)}
                    className="w-full md:w-auto bg-brand-primary text-white px-10 py-4 rounded-full text-base font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-accent hover:scale-105 transition-all"
                >
                    {t.hero.btn1}
                </button>
                <button
                    onClick={onHowOpen}
                    className="w-full md:w-auto border border-brand-dark/20 px-10 py-4 rounded-full text-base font-bold text-brand-dark hover:bg-brand-dark/5 transition-all inline-flex items-center justify-center group"
                >
                    <span>{t.hero.btn2}</span>
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    </section>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white/50 p-8 rounded-3xl border border-brand-primary/5 hover:border-brand-primary/20 transition-all hover:shadow-xl hover:shadow-brand-primary/5">
        <div className="bg-brand-primary/10 p-4 rounded-2xl w-fit mb-6 text-brand-primary">
            <Icon size={28} />
        </div>
        <h3 className="text-2xl font-serif font-bold text-brand-dark mb-4">{title}</h3>
        <p className="text-brand-dark/70 leading-relaxed">{description}</p>
    </div>
);

const Features = ({ t }) => (
    <section id="funcionalidades" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">{t.features.label}</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mt-4">{t.features.h2}</h2>
            <p className="text-brand-dark/60 mt-4 max-w-2xl mx-auto">{t.features.p}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            {t.features.cards.map((card, i) => (
                <FeatureCard key={i} icon={FEATURE_ICONS[i]} title={card.title} description={card.description} />
            ))}
        </div>
    </section>
);

const Step = ({ number, icon: Icon, title, description }) => (
    <div className="flex flex-col items-center text-center">
        <div className="relative mb-8">
            <div className="text-8xl font-serif font-bold text-brand-primary/10 absolute -top-12 -left-4">{number}</div>
            <div className="bg-transparent p-6 rounded-2x1 relative z-10 text-brand-primary">
                <Icon size={32} />
            </div>
        </div>
        <h4 className="text-xl font-serif font-bold text-brand-dark mb-4">{title}</h4>
        <p className="text-brand-dark/60 text-sm leading-relaxed">{description}</p>
    </div>
);

const HowItWorks = ({ t }) => (
    <section id="como-funciona" className="py-24 bg-brand-primary/[0.02]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-20">
                <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">{t.howItWorks.label}</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mt-4">{t.howItWorks.h2}</h2>
                <p className="text-brand-dark/60 mt-4">{t.howItWorks.p}</p>
            </div>
            <div className="grid md:grid-cols-4 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-[1px] bg-brand-primary/10 -z-0"></div>
                {t.howItWorks.steps.map((step, i) => (
                    <Step key={i} number={`0${i + 1}`} icon={STEP_ICONS[i]} title={step.title} description={step.description} />
                ))}
            </div>
        </div>
    </section>
);

const Experience = ({ t }) => (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto overflow-hidden">
        <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="rounded-3xl overflow-hidden shadow-2xl relative">
                <img
                    src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=1200"
                    alt="Modern Bedroom"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-primary/10"></div>
            </div>
            <div>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mb-8 leading-tight">{t.experience.h2}</h2>
                <p className="text-brand-dark/70 text-lg mb-10 leading-relaxed">{t.experience.p}</p>
                <ul className="space-y-4 mb-10">
                    {t.experience.list.map((item, i) => (
                        <li key={i} className="flex items-center text-brand-dark/80 font-medium">
                            <div className="bg-brand-primary/20 p-1 rounded-full mr-3 text-brand-primary">
                                <CheckCircle size={18} />
                            </div>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </section>
);

const TestimonialCard = ({ quote, author, role, image }) => (
    <div className="bg-brand-light p-8 rounded-3xl border border-brand-primary/5 flex flex-col justify-between">
        <div>
            <div className="flex text-brand-primary mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p className="text-brand-dark/80 text-lg mb-8 leading-relaxed">"{quote}"</p>
        </div>
        <div className="flex items-center">
            <img src={image} alt={author} className="w-12 h-12 rounded-full object-cover mr-4" />
            <div>
                <h5 className="font-bold text-brand-dark">{author}</h5>
                <p className="text-xs text-brand-dark/50">{role}</p>
            </div>
        </div>
    </div>
);

const Testimonials = ({ t }) => (
    <section className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
                <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">{t.testimonials.label}</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mt-4">{t.testimonials.h2}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {t.testimonials.items.map((item, i) => (
                    <TestimonialCard key={i} quote={item.quote} author={item.author} role={item.role} image={TESTIMONIAL_IMAGES[i]} />
                ))}
            </div>
        </div>
    </section>
);

const PricingCard = ({ plan, popular, perMonth, onSignupOpen }) => (
    <div className={`p-10 rounded-[40px] flex flex-col justify-between ${
        plan.highlighted
            ? 'bg-brand-dark text-white scale-105 shadow-2xl relative z-10'
            : 'bg-brand-light text-brand-dark border border-brand-primary/5'
    }`}>
        <div>
            {plan.highlighted && (
                <div className="bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-6">
                    {popular}
                </div>
            )}
            <h3 className="text-2xl font-serif font-bold mb-2">{plan.title}</h3>
            <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold">€{plan.price}</span>
                <span className={`text-sm ml-2 ${plan.highlighted ? 'text-white/60' : 'text-brand-dark/40'}`}>{perMonth}</span>
            </div>
            <p className={`text-sm mb-8 ${plan.highlighted ? 'text-white/70' : 'text-brand-dark/60'}`}>{plan.description}</p>
            <ul className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                        <CheckCircle size={18} className="mr-3 shrink-0 text-brand-primary" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
        <button
            onClick={() => onSignupOpen(plan.title)}
            className={`w-full py-4 rounded-2xl font-bold transition-all ${
                plan.highlighted
                    ? 'bg-brand-primary text-white hover:bg-brand-accent shadow-lg shadow-brand-primary/20'
                    : 'bg-brand-dark text-white hover:bg-brand-dark/90'
            }`}>
            {plan.buttonText}
        </button>
    </div>
);

const Pricing = ({ t, onSignupOpen }) => (
    <section id="precos" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">{t.pricing.label}</span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark mt-4">{t.pricing.h2}</h2>
                <p className="text-brand-dark/60 mt-4">{t.pricing.p}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
                {t.pricing.plans.map((plan, i) => (
                    <PricingCard
                        key={i}
                        plan={plan}
                        popular={t.pricing.popular}
                        perMonth={t.pricing.perMonth}
                        onSignupOpen={onSignupOpen}
                    />
                ))}
            </div>
        </div>
    </section>
);

const SignupSection = ({ t }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [properties, setProperties] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await dbService.registerLead({
                full_name: fullName.trim(),
                email: email.trim(),
                phone: phone.trim(),
                properties_count: properties,
                message: message.trim(),
                source: 'landing_form',
            });
            setSuccess(true);
            setFullName(''); setEmail(''); setPhone(''); setProperties(''); setMessage('');
        } catch (err) {
            setError('Erro ao enviar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contacto" className="py-24 px-6 md:px-12 bg-brand-light">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">{t.signup.label}</span>
                    <h2 className="text-4xl md:text-6xl font-serif font-bold text-brand-dark mt-4 mb-8">{t.signup.h2}</h2>
                    <p className="text-brand-dark/60 text-lg mb-12">{t.signup.p}</p>
                    <div className="space-y-8">
                        {t.signup.stats.map((stat, i) => (
                            <div key={i} className="flex items-center">
                                <div className="text-4xl font-bold text-brand-primary mr-6">{stat.value}</div>
                                <div className="text-brand-dark/70 font-medium leading-tight text-sm uppercase tracking-wide">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 rounded-3xl overflow-hidden shadow-xl border border-white/50">
                        <img src="https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&q=80&w=1000" alt="Interior" className="w-full h-48 object-cover" />
                    </div>
                </div>

                <div className="bg-white p-10 md:p-12 rounded-[40px] shadow-2xl shadow-brand-dark/5 border border-brand-primary/5">
                    <h3 className="text-3xl font-serif font-bold text-brand-dark mb-2">{t.signup.form.h3}</h3>
                    <p className="text-brand-dark/50 text-sm mb-10">{t.signup.form.p}</p>

                    {success ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <CheckCircle size={48} className="text-brand-primary mb-4" />
                            <p className="text-brand-dark font-bold text-lg">Pedido enviado! Entraremos em contacto em breve.</p>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-medium">{error}</div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{t.signup.form.name}</label>
                                <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t.signup.form.namePlaceholder}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{t.signup.form.email}</label>
                                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.signup.form.emailPlaceholder}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{t.signup.form.phone}</label>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.signup.form.phonePlaceholder}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{t.signup.form.properties}</label>
                                <select value={properties} onChange={(e) => setProperties(e.target.value)}
                                        className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark appearance-none">
                                    {t.signup.form.propertiesOptions.map((opt, i) => <option key={i}>{opt}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{t.signup.form.message}</label>
                                <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t.signup.form.messagePlaceholder}
                                          className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark resize-none"></textarea>
                            </div>
                            <button type="submit" disabled={loading}
                                    className="w-full bg-brand-primary text-white py-5 rounded-2xl font-bold text-lg hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20 mt-4 disabled:opacity-60">
                                {loading ? '...' : t.signup.form.button}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
};

const slugifyInstance = (str) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);

const WhatsAppMonitor = ({ propertyId, propertyData, onWAConnected, t }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const selectedConvRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const channelRef = useRef(null);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);

    // WA connect state (shown when wa_instance_name is null)
    const [showConnect, setShowConnect] = useState(false);
    const [instanceName, setInstanceName] = useState('');
    const [waStatus, setWaStatus] = useState('idle'); // idle|creating|scanning|connected|error
    const [qrBase64, setQrBase64] = useState(null);
    const [connectError, setConnectError] = useState(null);
    const connectPollRef = useRef(null);

    const hasInstance = propertyData?.wa_instance_name;

    useEffect(() => {
        if (showConnect && propertyData?.name) {
            const slug = slugifyInstance(propertyData.name);
            setInstanceName(slug || (propertyId ? propertyId.replace(/-/g, '').slice(0, 16) : 'property'));
        }
    }, [showConnect]);

    useEffect(() => {
        return () => { if (connectPollRef.current) clearInterval(connectPollRef.current); };
    }, []);

    const handleConnectWA = async () => {
        if (!instanceName.trim()) return;
        setWaStatus('creating');
        setConnectError(null);
        try {
            const { error: createErr } = await supabase.functions.invoke('wa-instance', {
                body: { action: 'create', propertyId, instanceName: instanceName.trim() },
            });
            if (createErr) {
                const msg = String(createErr?.message ?? '');
                if (!/already.?exist|already.?in.?use/i.test(msg)) {
                    setWaStatus('error');
                    setConnectError(msg || 'Erro ao ligar. Tente novamente.');
                    return;
                }
            }
            const { data: qrData, error: qrErr } = await supabase.functions.invoke('wa-instance', {
                body: { action: 'qr', propertyId, instanceName: instanceName.trim() },
            });
            if (qrErr) throw qrErr;
            setQrBase64(qrData?.base64 || null);
            setWaStatus('scanning');
            connectPollRef.current = setInterval(async () => {
                const { data: statusData } = await supabase.functions.invoke('wa-instance', {
                    body: { action: 'status', propertyId, instanceName: instanceName.trim() },
                });
                if (statusData?.instance?.state === 'open') {
                    clearInterval(connectPollRef.current);
                    setWaStatus('connected');
                    supabase.functions.invoke('wa-instance', { body: { action: 'save-number', propertyId, instanceName: instanceName.trim() } });
                    if (onWAConnected) onWAConnected();
                }
            }, 3000);
        } catch (err) {
            setWaStatus('error');
            setConnectError(err?.message || 'Erro ao ligar. Tente novamente.');
        }
    };

    const loadConversations = async () => {
        const { data, error } = await supabase
            .from('wa_conversations')
            .select('*')
            .eq('property_id', propertyId)
            .order('last_message_at', { ascending: false });
        if (error) console.error('wa_conversations query error:', error);
        if (data) setConversations(data);
    };

    const loadMessages = async (convId) => {
        const { data } = await supabase
            .from('wa_messages')
            .select('*')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
    };

    useEffect(() => {
        if (!propertyId) return;
        loadConversations();

        const ch = supabase
            .channel('wa-' + propertyId)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_messages' }, () => {
                loadConversations();
                if (selectedConvRef.current) loadMessages(selectedConvRef.current.id);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_conversations' }, () => {
                loadConversations();
            })
            .subscribe();

        channelRef.current = ch;
        return () => { supabase.removeChannel(ch); };
    }, [propertyId]);

    useEffect(() => {
        if (selectedConv) loadMessages(selectedConv.id);
    }, [selectedConv]);

    const openConv = (conv) => {
        selectedConvRef.current = conv;
        setSelectedConv(conv);
        setDrawerOpen(true);
        // Mark as read (best-effort)
        supabase.from('wa_conversations').update({ unread_count: 0 }).eq('id', conv.id);
    };

    const handleSend = async () => {
        if (!replyText.trim() || !selectedConv || sending) return;
        setSending(true);
        try {
            const { error } = await supabase.functions.invoke('wa-send', {
                body: { conversationId: selectedConv.id, body: replyText.trim() },
            });
            if (!error) {
                setReplyText('');
                await loadMessages(selectedConv.id);
            } else {
                console.error('wa-send error:', error);
            }
        } finally {
            setSending(false);
        }
    };

    const initials = (conv) => {
        const src = conv.guest_name || conv.guest_phone || '?';
        return src.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-sm space-y-4">
                <div className="flex items-center gap-3 text-brand-primary font-bold font-serif text-lg border-b border-brand-primary/10 pb-3">
                    <MessageCircle size={18} />
                    <span>{t.dash_monitoring}</span>
                </div>

                {/* Connect / Reconnect WA panel */}
                {hasInstance && (
                    <div className="flex items-center justify-between text-[11px] text-brand-dark/50 bg-brand-light px-3 py-2 rounded-xl border border-brand-primary/10 mb-1">
                        <span>Instância: <span className="font-mono text-brand-dark/70">{hasInstance}</span></span>
                        <button onClick={() => { setShowConnect(true); setWaStatus('idle'); setConnectError(null); setQrBase64(null); setInstanceName(hasInstance); }} className="text-brand-primary font-bold hover:text-brand-accent transition-colors">Reconectar</button>
                    </div>
                )}
                {(!hasInstance || showConnect) && (
                    <div className="bg-brand-light p-5 rounded-2xl border border-dashed border-brand-primary/20 text-center text-xs mb-2">
                        {!showConnect ? (
                            <>
                                <MessageCircle size={28} className="mx-auto mb-2 text-brand-primary/40" />
                                <p className="font-bold text-brand-dark/70 mb-3">Nenhum número WhatsApp ligado a este alojamento.</p>
                                <button
                                    onClick={() => setShowConnect(true)}
                                    className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-accent transition-all"
                                >
                                    <MessageCircle size={14} /> Ligar WhatsApp
                                </button>
                            </>
                        ) : waStatus === 'connected' ? (
                            <div className="flex flex-col items-center gap-2 py-2">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <MessageCircle size={22} className="text-green-600" />
                                </div>
                                <p className="text-green-700 font-bold text-sm">WhatsApp Ligado!</p>
                                <p className="text-brand-dark/50 text-[11px]">Aguarda mensagens dos hóspedes neste canal.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 text-left">
                                <p className="text-brand-dark/60 text-[11px] text-center">Liga o teu número WhatsApp a este alojamento para receber mensagens dos hóspedes.</p>
                                <div>
                                    <label className="block text-[10px] font-bold text-brand-dark uppercase tracking-widest mb-1">Nome da instância</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={instanceName}
                                            onChange={e => setInstanceName(e.target.value)}
                                            disabled={waStatus !== 'idle' && waStatus !== 'error'}
                                            className="flex-1 border border-brand-primary/15 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-primary font-mono disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleConnectWA}
                                            disabled={!instanceName.trim() || (waStatus !== 'idle' && waStatus !== 'error')}
                                            className="flex items-center gap-1.5 bg-brand-primary text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-accent transition-all disabled:opacity-40 shrink-0"
                                        >
                                            <MessageCircle size={13} />
                                            {waStatus === 'creating' ? '…' : 'Ligar'}
                                        </button>
                                    </div>
                                </div>
                                {connectError && <p className="text-red-500 text-[11px] font-medium">{connectError}</p>}
                                {waStatus === 'scanning' && (
                                    <div className="flex flex-col items-center gap-2 py-2">
                                        {qrBase64 ? (
                                            <img src={`data:image/png;base64,${qrBase64}`} alt="QR Code WhatsApp" className="w-40 h-40 rounded-xl border border-brand-primary/10" />
                                        ) : (
                                            <div className="w-40 h-40 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-dark/30 text-xs">A gerar QR…</div>
                                        )}
                                        <p className="text-brand-dark/60 text-[11px]">Abre o WhatsApp → Dispositivos ligados → Ligar dispositivo → Aponta a câmara</p>
                                    </div>
                                )}
                                <button onClick={() => { setShowConnect(false); setWaStatus('idle'); setConnectError(null); setQrBase64(null); }} className="text-brand-dark/40 text-[11px] hover:text-brand-dark/60 transition-colors text-center">Cancelar</button>
                            </div>
                        )}
                    </div>
                )}

                {conversations.length === 0 && hasInstance ? (
                    <div className="bg-brand-light p-5 rounded-2xl border border-dashed border-brand-primary/20 text-center text-brand-dark/40 text-xs">
                        <MessageSquare size={28} className="mx-auto mb-2 text-brand-primary/30" />
                        <p className="font-bold text-brand-dark/70">{t.wa_conversations}</p>
                        <p className="mt-1 text-[11px]">{t.wa_no_conversations}</p>
                    </div>
                ) : conversations.length > 0 ? (
                    <div className="space-y-2">
                        {conversations.map(conv => (
                            <button key={conv.id} onClick={() => openConv(conv)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-brand-light transition-all text-left">
                                <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {initials(conv)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-brand-dark truncate">{conv.guest_name || conv.guest_phone}</p>
                                    <p className="text-xs text-brand-dark/40 truncate">{conv.guest_phone}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {conv.unread_count > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                        </span>
                                    )}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        conv.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-brand-primary/10 text-brand-primary'
                                    }`}>
                                        {conv.status === 'open' ? t.wa_status_open : t.wa_status_closed}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* Conversation Drawer */}
            {drawerOpen && selectedConv && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                     onClick={() => { setDrawerOpen(false); setReplyText(''); }}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]"
                         onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-brand-primary/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
                                    {initials(selectedConv)}
                                </div>
                                <div>
                                    <p className="font-bold text-brand-dark text-sm">{selectedConv.guest_name || selectedConv.guest_phone}</p>
                                    <p className="text-xs text-brand-dark/40">{selectedConv.guest_phone}</p>
                                </div>
                            </div>
                            <button onClick={() => { setDrawerOpen(false); setReplyText(''); }}
                                    className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-red-50 hover:text-red-500 transition-all font-bold text-lg flex items-center justify-center">
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {messages.length === 0 ? (
                                <p className="text-center text-brand-dark/40 text-xs py-8">{t.wa_no_messages}</p>
                            ) : messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'guest' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                                        msg.role === 'guest'
                                            ? 'bg-brand-light text-brand-dark rounded-tl-none'
                                            : 'bg-brand-primary text-white rounded-tr-none'
                                    }`}>
                                        <p className="leading-relaxed">{msg.body}</p>
                                        <p className={`text-[10px] mt-1 ${msg.role === 'guest' ? 'text-brand-dark/40' : 'text-white/60'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-brand-primary/10 shrink-0 flex gap-2">
                            <input
                                type="text"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder={t.wa_reply_ph}
                                disabled={sending}
                                className="flex-1 bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2 text-sm text-brand-dark focus:outline-none focus:border-brand-primary transition-all disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!replyText.trim() || sending}
                                className="px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-accent transition-all disabled:opacity-40 shrink-0"
                            >
                                {sending ? '…' : t.wa_send}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const DashboardView = ({ user, t }) => {
    const [showClientProps, setShowClientProps] = useState(false);
    const [clientProperties, setClientProperties] = useState([]);
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [activePropertyData, setActivePropertyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addClientEmail, setAddClientEmail] = useState('');
    const [addClientPhone, setAddClientPhone] = useState('');
    const [addClientExpiry, setAddClientExpiry] = useState('');
    const [addClientPropertyId, setAddClientPropertyId] = useState(null);
    const [addClientError, setAddClientError] = useState('');
    const [addClientLoading, setAddClientLoading] = useState(false);
    const [editingProperty, setEditingProperty] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editingContextId, setEditingContextId] = useState(null);
    const [editContextValue, setEditContextValue] = useState('');
    const [addingContext, setAddingContext] = useState(false);
    const [newContextKey, setNewContextKey] = useState('');
    const [newContextValue, setNewContextValue] = useState('');

    const handleDeleteProperty = async (propertyId) => {
        if (!window.confirm(t.dash_confirm_delete)) return;
        try {
            await dbService.deleteProperty(propertyId);
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            if (selectedPropertyId === propertyId) {
                setSelectedPropertyId(null);
                setActivePropertyData(null);
            }
        } catch (err) {
            alert('Error deleting property: ' + err.message);
        }
    };

    const handleEditOpen = () => {
        setEditName(activePropertyData.name || '');
        setEditAddress(activePropertyData.address || '');
        setEditDescription(activePropertyData.description || '');
        setEditingProperty(true);
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        try {
            const updated = await dbService.updateProperty(selectedPropertyId, {
                name: editName.trim(),
                address: editAddress.trim(),
                description: editDescription.trim(),
            });
            setActivePropertyData(prev => ({ ...prev, ...updated }));
            setProperties(prev => prev.map(p => p.id === selectedPropertyId ? { ...p, name: updated.name } : p));
            setEditingProperty(false);
        } catch (err) {
            alert('Error updating property: ' + err.message);
        }
        setEditLoading(false);
    };

    const handleAddClient = async () => {
        setAddClientError('');
        setAddClientLoading(true);
        try {
            const found = await dbService.getUserByEmail(addClientEmail.trim());
            if (!found) { setAddClientError(t.dash_client_not_found); setAddClientLoading(false); return; }
            await dbService.addPropertyClient(addClientPropertyId, found.id, addClientExpiry || null, addClientPhone.trim() || null);
            // ✅ NEW (fixed per code review): greet inside try/catch and surface failures to the admin.
            let greetMessage = '';
            if (addClientPhone.trim()) {
                try {
                    const { data, error: greetErr } = await supabase.functions.invoke('wa-greet', {
                        body: { property_id: addClientPropertyId, client_phone: addClientPhone.trim(), lang },
                    });
                    if (greetErr) greetMessage = ' (Greeting WhatsApp não enviado: ' + (greetErr.message || 'erro desconhecido') + ')';
                    else if (data?.success) greetMessage = ' ✓ WhatsApp enviado';
                } catch (greetExc) {
                    greetMessage = ' (Greeting WhatsApp falhou: ' + (greetExc?.message || greetExc) + ')';
                }
            }
            // Show inline toast message to admin
            setAddClientError(greetMessage ? 'Cliente adicionado' + greetMessage : '');
            setTimeout(() => setAddClientError(''), 6000);
            setAddClientEmail('');
            setAddClientPhone('');
            setAddClientExpiry('');
            setAddClientPropertyId(null);
        } catch (err) {
            setAddClientError(err.message);
        }
        setAddClientLoading(false);
    };

    const handleRemoveClient = async (clientId) => {
        if (!window.confirm(t.dash_confirm_remove_client)) return;
        try {
            await dbService.removePropertyClient(clientId);
            setActivePropertyData(prev => ({
                ...prev,
                clientes: prev.clientes.filter(c => c.id !== clientId)
            }));
        } catch (err) {
            alert('Error removing client: ' + err.message);
        }
    };

    // AI Context handlers
    const handleSaveContext = async (contextId) => {
        try {
            const updated = await dbService.updatePropertyContext(contextId, editContextValue);
            setActivePropertyData(prev => ({
                ...prev,
                contexto: prev.contexto.map(c => c.id === contextId ? { ...c, feature_value: updated.feature_value } : c)
            }));
            setEditingContextId(null);
            setEditContextValue('');
        } catch (err) {
            alert('Error updating context: ' + err.message);
        }
    };

    const handleDeleteContext = async (contextId) => {
        if (!window.confirm(t.dash_confirm_delete_context)) return;
        try {
            await dbService.deletePropertyContext(contextId);
            setActivePropertyData(prev => ({
                ...prev,
                contexto: prev.contexto.filter(c => c.id !== contextId)
            }));
        } catch (err) {
            alert('Error deleting context: ' + err.message);
        }
    };

    const handleAddContext = async () => {
        try {
            const newCtx = await dbService.addPropertyContext({
                property_id: selectedPropertyId,
                feature_key: newContextKey.trim(),
                feature_value: newContextValue.trim(),
                is_visible_to_client: true,
            });
            setActivePropertyData(prev => ({
                ...prev,
                contexto: [...prev.contexto, newCtx]
            }));
            setAddingContext(false);
            setNewContextKey('');
            setNewContextValue('');
        } catch (err) {
            alert('Error adding context: ' + err.message);
        }
    };

    useEffect(() => {
        async function loadProperties() {
            if (!user) return;
            try {
                setLoading(true);
                const props = await dbService.getProperties(user.id);
                setProperties(props || []);
                if (props && props.length > 0) setSelectedPropertyId(props[0].id);
            } catch (err) {
                console.error("Erro ao ler propriedades:", err);
            } finally {
                setLoading(false);
            }
        }
        loadProperties();
    }, [user]);

    useEffect(() => {
        if (!user) return;
        dbService.getClientProperties(user.id).then(rows => {
            setClientProperties(rows || []);
        }).catch(() => {});
    }, [user]);

    useEffect(() => {
        if (!selectedPropertyId) { setActivePropertyData(null); return; }
        async function loadFullPropertyDetails() {
            try {
                const fullDetails = await dbService.getPropertyFullDetails(selectedPropertyId);
                setActivePropertyData(fullDetails);
            } catch (err) {
                console.error("Erro ao ler dados relacionais da propriedade:", err);
            }
        }
        loadFullPropertyDetails();
    }, [selectedPropertyId]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading) return (
        <div className="flex justify-center items-center py-24 text-brand-primary font-bold text-sm">
            {t.dash_loading}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-primary/10 pb-6 mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-dark">{t.dash_title}</h1>
                    <p className="text-xs text-brand-dark/50 mt-1">
                        {t.dash_manager} <strong className="text-brand-primary font-semibold">{user?.user_metadata?.full_name}<br /></strong>
                        {t.auth_email_label} <strong className="text-brand-primary font-semibold">{user?.email}</strong>
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {properties.length > 0 ? (
                        <div className="flex gap-2 items-center">
                            <label className="text-xs font-bold uppercase text-brand-dark/40">{t.dash_select_property}</label>
                            <select
                                value={selectedPropertyId || ''}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                className="bg-white border border-brand-primary/10 rounded-xl px-4 py-2 text-xs font-semibold text-brand-dark focus:outline-none focus:border-brand-primary shadow-sm"
                            >
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleDeleteProperty(selectedPropertyId)}
                                className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-all shadow-sm border border-red-100"
                            >
                                <Trash2 size={13} /> {t.dash_delete_property}
                            </button>
                        </div>
                    ) : (
                        <div className="text-xs text-brand-dark/40 bg-brand-primary/5 px-4 py-2 rounded-xl border border-brand-primary/10">
                            {t.dash_no_properties}
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/onboarding')}
                        className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-accent transition-all shadow-sm"
                    >
                        <Home size={13} /> {t.dash_add_property}
                    </button>
                    {clientProperties.length > 0 && (
                        <button
                            onClick={() => setShowClientProps(true)}
                            className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/20 transition-all shadow-sm"
                        >
                            <Home size={13} /> {t.client_dash_btn}
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2 bg-brand-primary/5 text-brand-dark/70 px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/10 hover:text-brand-primary transition-all shadow-sm"
                    >
                        <Settings size={13} /> {t.profile_link}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-brand-primary/5 text-brand-dark/70 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                    >
                        <LogOut size={13} /> {t.dash_logout}
                    </button>
                </div>
            </div>

            {/* Main content */}
            {activePropertyData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Property Data */}
                    <div className="bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 text-brand-primary font-bold font-serif text-lg border-b border-brand-primary/10 pb-3">
                            <Home size={18} />
                            <span>{t.dash_property_data}</span>
                        </div>
                        <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-dark/40">{t.dash_official_name}</h4>
                            <p className="text-brand-dark text-sm font-medium mt-0.5">{activePropertyData.name}</p>
                        </div>
                        <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-dark/40">{t.dash_address}</h4>
                            <p className="text-brand-dark text-sm font-medium mt-0.5">{activePropertyData.address || t.dash_address_empty}</p>
                        </div>
                        <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-dark/40">{t.dash_status}</h4>
                            <span className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 mt-1.5 ${activePropertyData.is_active ? 'bg-green-100 text-green-800' : 'bg-brand-primary/10 text-brand-dark/60'}`}>
                                {activePropertyData.is_active ? t.dash_status_active : t.dash_status_inactive}
                            </span>
                            <button
                                onClick={handleEditOpen}
                                className="w-full flex items-center justify-center gap-2 border border-brand-primary/20 text-brand-primary px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/5 transition-all mt-3"
                            >
                                <Pencil size={13} /> {t.dash_edit_property}
                            </button>
                        </div>

                        {/* AI Context — editable */}
                        <div className="pt-4 border-t border-brand-primary/10">
                            <div className="flex items-center justify-between text-brand-primary font-bold font-serif text-sm mb-3">
                                <div className="flex items-center gap-2">
                                    <Database size={16} />
                                    <span>{t.dash_ai_context}</span>
                                </div>
                                <span className="bg-brand-primary/10 text-brand-accent text-xs px-2 py-0.5 rounded-full font-bold">
                                    {activePropertyData.contexto?.length || 0}
                                </span>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {(!activePropertyData.contexto || activePropertyData.contexto.length === 0) && (
                                    <p className="text-xs text-brand-dark/40 italic">{t.dash_no_context}</p>
                                )}
                                {activePropertyData.contexto?.map((ctx) => (
                                    <div key={ctx.id} className="bg-brand-light p-2.5 rounded-xl border border-brand-primary/10 text-xs">
                                        {editingContextId === ctx.id ? (
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-bold text-brand-accent">{ctx.feature_key}:</span>
                                                <textarea
                                                    rows={2}
                                                    value={editContextValue}
                                                    onChange={e => setEditContextValue(e.target.value)}
                                                    className="border border-brand-primary/15 rounded-lg px-2 py-1 text-xs w-full bg-white focus:outline-none focus:border-brand-primary resize-none font-mono"
                                                />
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => handleSaveContext(ctx.id)}
                                                        className="flex-1 bg-brand-primary text-white px-2 py-1 rounded-lg text-[10px] font-bold hover:bg-brand-accent transition-all"
                                                    >{t.dash_save_changes}</button>
                                                    <button
                                                        onClick={() => { setEditingContextId(null); setEditContextValue(''); }}
                                                        className="px-2 py-1 rounded-lg text-[10px] font-bold border border-brand-primary/15 text-brand-dark/60 hover:bg-brand-primary/5 transition-all"
                                                    >{t.cancel}</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <span className="font-bold text-brand-accent block">{ctx.feature_key}:</span>
                                                    <span className="text-brand-dark/60 font-mono text-[11px] block truncate">{ctx.feature_value}</span>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    <button
                                                        onClick={() => { setEditingContextId(ctx.id); setEditContextValue(ctx.feature_value); }}
                                                        className="text-brand-primary hover:text-brand-accent transition-colors"
                                                    ><Pencil size={11} /></button>
                                                    <button
                                                        onClick={() => handleDeleteContext(ctx.id)}
                                                        className="text-red-400 hover:text-red-600 transition-colors"
                                                    ><Trash2 size={11} /></button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Add new context */}
                            {addingContext ? (
                                <div className="mt-2 p-3 bg-brand-light rounded-xl border border-brand-primary/10 flex flex-col gap-2">
                                    <input
                                        type="text"
                                        placeholder={t.dash_context_key_placeholder}
                                        value={newContextKey}
                                        onChange={e => setNewContextKey(e.target.value)}
                                        className="border border-brand-primary/15 rounded-lg px-2 py-1.5 text-xs w-full bg-white focus:outline-none focus:border-brand-primary font-mono"
                                    />
                                    <textarea
                                        rows={2}
                                        placeholder={t.dash_context_value_placeholder}
                                        value={newContextValue}
                                        onChange={e => setNewContextValue(e.target.value)}
                                        className="border border-brand-primary/15 rounded-lg px-2 py-1.5 text-xs w-full bg-white focus:outline-none focus:border-brand-primary resize-none font-mono"
                                    />
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={handleAddContext}
                                            disabled={!newContextKey.trim() || !newContextValue.trim()}
                                            className="flex-1 bg-brand-primary text-white px-2 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-accent transition-all disabled:opacity-50"
                                        >{t.dash_confirm_add_client}</button>
                                        <button
                                            onClick={() => { setAddingContext(false); setNewContextKey(''); setNewContextValue(''); }}
                                            className="px-2 py-1.5 rounded-lg text-[10px] font-bold border border-brand-primary/15 text-brand-dark/60 hover:bg-brand-primary/5 transition-all"
                                        >{t.cancel}</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setAddingContext(true)}
                                    className="w-full flex items-center justify-center gap-2 border border-brand-primary/20 text-brand-primary px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/5 transition-all mt-2"
                                >
                                    <Plus size={13} /> {t.dash_add_context}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Clients */}
                    <div className="bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-sm">
                        <div className="flex items-center justify-between text-brand-primary font-bold font-serif text-lg border-b border-brand-primary/10 pb-3 mb-4">
                            <div className="flex items-center gap-3">
                                <User size={18} />
                                <span>{t.dash_clients}</span>
                            </div>
                            <span className="bg-brand-primary/10 text-brand-accent text-xs px-2.5 py-0.5 rounded-full font-bold">
                                {activePropertyData.clientes?.length || 0}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-[420px] overflow-y-auto">
                            {(!activePropertyData.clientes || activePropertyData.clientes.length === 0) && (
                                <p className="text-xs text-brand-dark/40 italic">{t.dash_no_clients}</p>
                            )}
                            {activePropertyData.clientes?.map((cli) => (
                                <div key={cli.id} className="p-3 bg-brand-light rounded-2xl border border-brand-primary/10 text-xs">
                                    <p className="font-bold text-brand-dark/80">{cli.users?.full_name || cli.user_id}</p>
                                    <p className="text-brand-dark/40 text-[10px] truncate">{cli.users?.email}</p>
                                    <div className="flex justify-between items-center mt-3 text-[10px] text-brand-dark/50 bg-white p-2 rounded-xl border border-brand-primary/10 font-medium">
                                        <span>
                                            {cli.access_expires_at
                                                ? (new Date(cli.access_expires_at) < new Date()
                                                    ? <><span className="text-red-600 font-bold">{t.dash_expired}</span> <strong className="text-red-700">{new Date(cli.access_expires_at).toLocaleDateString()}</strong></>
                                                    : <>{t.dash_expires} <strong className="text-red-700">{new Date(cli.access_expires_at).toLocaleDateString()}</strong></>)
                                                : 'N/A'}
                                        </span>
                                        <button onClick={() => handleRemoveClient(cli.id)} className="flex items-center gap-1 text-red-400 hover:text-red-600 font-bold transition-colors">
                                            <UserMinus size={11} /> {t.dash_remove_client}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setAddClientPropertyId(addClientPropertyId === selectedPropertyId ? null : selectedPropertyId)}
                            className="w-full flex items-center justify-center gap-2 border border-brand-primary/20 text-brand-primary px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-primary/5 transition-all mt-2"
                        >
                            <UserPlus size={13} /> {t.dash_add_client}
                        </button>
                        {addClientPropertyId === selectedPropertyId && (
                            <div className="p-4 bg-brand-light rounded-2xl border border-brand-primary/10 flex flex-col gap-2.5 mt-2">
                                <input
                                    type="email"
                                    placeholder={t.dash_client_email_placeholder}
                                    value={addClientEmail}
                                    onChange={e => setAddClientEmail(e.target.value)}
                                    className="border border-brand-primary/15 rounded-xl px-3 py-2 text-xs w-full bg-white focus:outline-none focus:border-brand-primary"
                                />
                                <input
                                    type="tel"
                                    placeholder={t.dash_client_phone_placeholder}
                                    value={addClientPhone}
                                    onChange={e => setAddClientPhone(e.target.value)}
                                    className="border border-brand-primary/15 rounded-xl px-3 py-2 text-xs w-full bg-white focus:outline-none focus:border-brand-primary"
                                />
                                <input
                                    type="date"
                                    value={addClientExpiry}
                                    onChange={e => setAddClientExpiry(e.target.value)}
                                    className="border border-brand-primary/15 rounded-xl px-3 py-2 text-xs w-full bg-white focus:outline-none focus:border-brand-primary"
                                />
                                {addClientError && <p className="text-red-500 text-[11px] font-medium">{addClientError}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddClient}
                                        disabled={addClientLoading}
                                        className="flex-1 bg-brand-primary text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-accent transition-all disabled:opacity-50"
                                    >
                                        {addClientLoading ? '...' : t.dash_confirm_add_client}
                                    </button>
                                    <button
                                        onClick={() => { setAddClientPropertyId(null); setAddClientError(''); setAddClientEmail(''); setAddClientPhone(''); setAddClientExpiry(''); }}
                                        className="px-3 py-2 rounded-xl text-xs font-bold border border-brand-primary/15 text-brand-dark/60 hover:bg-brand-primary/5 transition-all"
                                    >
                                        {t.cancel}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Monitoring */}
                    <WhatsAppMonitor
                        propertyId={selectedPropertyId}
                        propertyData={activePropertyData}
                        onWAConnected={async () => {
                            const fullDetails = await dbService.getPropertyFullDetails(selectedPropertyId);
                            setActivePropertyData(fullDetails);
                        }}
                        t={t}
                    />
                </div>
            ) : (
                <div className="text-brand-dark/40 text-sm mt-8 border-t border-brand-primary/10 pt-8 italic text-center">
                    {t.dash_select_property_msg}
                </div>
            )}

            {/* Edit Property Modal */}
            {editingProperty && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingProperty(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-brand-primary/10">
                            <h2 className="text-lg font-serif font-bold text-brand-dark">{t.dash_edit_property}</h2>
                            <button onClick={() => setEditingProperty(false)} className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-red-50 hover:text-red-500 transition-all font-bold text-lg">×</button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-wider text-brand-dark/40 mb-1">{t.dash_official_name}</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="border border-brand-primary/15 rounded-xl px-3 py-2 text-xs w-full bg-white focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-wider text-brand-dark/40 mb-1">{t.dash_address}</label>
                                <input
                                    type="text"
                                    value={editAddress}
                                    onChange={e => setEditAddress(e.target.value)}
                                    className="border border-brand-primary/15 rounded-xl px-3 py-2 text-xs w-full bg-white focus:outline-none focus:border-brand-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold tracking-wider text-brand-dark/40 mb-1">{t.dash_description}</label>
                                <textarea
                                    rows={3}
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    className="border border-brand-primary/15 rounded-xl px-3 py-2 text-xs w-full bg-white focus:outline-none focus:border-brand-primary resize-none"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleEditSave}
                                    disabled={editLoading || !editName}
                                    className="flex-1 bg-brand-primary text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-brand-accent transition-all disabled:opacity-50"
                                >
                                    {editLoading ? '...' : t.dash_save_changes}
                                </button>
                                <button
                                    onClick={() => setEditingProperty(false)}
                                    className="px-3 py-2 rounded-xl text-xs font-bold border border-brand-primary/15 text-brand-dark/60 hover:bg-brand-primary/5 transition-all"
                                >
                                    {t.cancel}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Associated Properties Modal */}
            {showClientProps && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowClientProps(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-brand-primary/10">
                            <h2 className="text-lg font-serif font-bold text-brand-dark">{t.client_dash_title}</h2>
                            <button
                                onClick={() => setShowClientProps(false)}
                                className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-red-50 hover:text-red-500 transition-all font-bold text-lg"
                            >×</button>
                        </div>
                        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clientProperties.map(({ id, access_expires_at, properties: prop }) => (
                                <div key={id} className="bg-brand-light p-5 rounded-2xl border border-brand-primary/10 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Home size={14} className="text-brand-primary" />
                                        <h3 className="text-sm font-serif font-bold text-brand-dark">{prop.name}</h3>
                                    </div>
                                    {prop.address && (
                                        <p className="text-xs text-brand-dark/50 flex items-center gap-1.5">
                                            <MapPin size={11} className="text-brand-primary/60 shrink-0" />
                                            {prop.address}
                                        </p>
                                    )}
                                    {prop.description && (
                                        <p className="text-xs text-brand-dark/60 leading-relaxed border-t border-brand-primary/5 pt-2">
                                            {prop.description}
                                        </p>
                                    )}
                                    {prop.property_context && prop.property_context.filter(c => c.is_visible_to_client).length > 0 && (
                                        <div className="border-t border-brand-primary/5 pt-3 space-y-1.5">
                                            {prop.property_context
                                                .filter(c => c.is_visible_to_client)
                                                .map(ctx => (
                                                    <div key={ctx.id} className="flex items-start gap-2 text-xs">
                                                        <span className="font-bold text-brand-accent shrink-0">{ctx.feature_key}:</span>
                                                        <span className="text-brand-dark/60 font-mono">{ctx.feature_value}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
                                    <div className="mt-auto pt-2 border-t border-brand-primary/5 flex items-center justify-between">
                                        <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-green-100 text-green-800">
                                            {t.dash_status_active}
                                        </span>
                                        {access_expires_at && (
                                            <p className="text-[10px] text-amber-600 font-medium">
                                                {t.client_dash_access_expires}: <strong>{new Date(access_expires_at).toLocaleDateString()}</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Footer = ({ t }) => (
    <footer className="bg-brand-dark text-white pt-24 pb-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1">
                <div className="text-2xl font-serif font-bold mb-6">StaySmart</div>
                <p className="text-white/60 text-sm leading-relaxed mb-8">{t.footer.description}</p>
                <div className="flex space-x-4">
                    <Instagram className="text-white/60 hover:text-brand-primary cursor-pointer transition-colors" size={20} />
                    <Linkedin className="text-white/60 hover:text-brand-primary cursor-pointer transition-colors" size={20} />
                    <Twitter className="text-white/60 hover:text-brand-primary cursor-pointer transition-colors" size={20} />
                </div>
            </div>
            <div className="col-span-1">
                <h5 className="font-bold uppercase tracking-widest text-xs mb-8 text-brand-primary">{t.footer.product}</h5>
                <ul className="space-y-4 text-white/60 text-sm">
                    <li><a href="/#funcionalidades" className="hover:text-white transition-colors">{t.nav.features}</a></li>
                    <li><a href="/#como-funciona" className="hover:text-white transition-colors">{t.nav.howItWorks}</a></li>
                    <li><a href="/#precos" className="hover:text-white transition-colors">{t.nav.pricing}</a></li>
                </ul>
            </div>
            <div className="col-span-1">
                <h5 className="font-bold uppercase tracking-widest text-xs mb-8 text-brand-primary">{t.footer.company}</h5>
                <ul className="space-y-4 text-white/60 text-sm">
                    {t.footer.companyLinks.map((link, i) => <li key={i} className="hover:text-white cursor-pointer transition-colors">{link}</li>)}
                </ul>
            </div>
            <div className="col-span-1">
                <h5 className="font-bold uppercase tracking-widest text-xs mb-8 text-brand-primary">StaySmart AI</h5>
                <p className="text-white/40 text-xs leading-relaxed">
                    {t.footer.copyright}<br />{t.footer.tagline}
                </p>
            </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-white/40 text-[10px] uppercase tracking-[0.2em]">
            <div>{t.footer.designed}</div>
            <div className="mt-4 md:mt-0 cursor-pointer hover:text-white transition-colors" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>{t.footer.backToTop}</div>
        </div>
    </footer>
);

const ClientDashboardView = ({ user, lang }) => {
    const t = translations[lang];
    const navigate = useNavigate();
    const [clientProperties, setClientProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const EXPIRY_WARNING_DAYS = 7;

    const expiryInfo = (dateStr) => {
        if (!dateStr) return { warn: false };
        const days = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
        return { warn: days >= 0 && days <= EXPIRY_WARNING_DAYS, date: new Date(dateStr) };
    };

    useEffect(() => {
        const load = async () => {
            try {
                const rows = await dbService.getClientProperties(user.id);
                setClientProperties(rows);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user.id]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading) return (
        <div className="flex justify-center items-center py-24 text-brand-primary font-bold text-sm">
            {t.dash_loading}
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-brand-primary/10 pb-6 mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-dark">{t.client_dash_title}</h1>
                    <p className="text-xs text-brand-dark/50 mt-1">
                        {t.dash_manager} <strong className="text-brand-primary font-semibold">{user?.user_metadata?.full_name}</strong>
                        <br />
                        {t.auth_email_label} <strong className="text-brand-primary font-semibold">{user?.email}</strong>
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-brand-primary/5 text-brand-dark/70 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                >
                    <LogOut size={13} /> {t.dash_logout}
                </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {clientProperties.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-brand-primary/10">
                    <Home size={32} className="mx-auto mb-3 text-brand-primary/30" />
                    <p className="text-brand-dark/40 text-sm font-medium">{t.client_dash_no_properties}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clientProperties.map(({ id, access_expires_at, properties: prop }) => (
                        <div
                            key={id}
                            className="bg-white p-6 rounded-3xl border border-brand-primary/10 shadow-sm flex flex-col gap-3 hover:shadow-md hover:border-brand-primary/20 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Home size={16} className="text-brand-primary" />
                                <h2 className="text-base font-serif font-bold text-brand-dark">{prop.name}</h2>
                            </div>
                            {prop.address && (
                                <p className="text-xs text-brand-dark/50 flex items-center gap-1.5">
                                    <MapPin size={11} className="text-brand-primary/60 shrink-0" />
                                    {prop.address}
                                </p>
                            )}
                            {prop.description && (
                                <p className="text-xs text-brand-dark/60 leading-relaxed border-t border-brand-primary/5 pt-3">
                                    {prop.description}
                                </p>
                            )}
                            {(() => {
                                const info = expiryInfo(access_expires_at);
                                if (!info.warn) return null;
                                return (
                                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-xs font-semibold">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>{t.client_dash_expiring_warning} — {info.date.toLocaleDateString(lang)}</span>
                                    </div>
                                );
                            })()}
                            <div className="mt-auto pt-3 border-t border-brand-primary/5 flex items-center justify-between">
                                <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-green-100 text-green-800">
                                    {t.dash_status_active}
                                </span>
                                {access_expires_at && (
                                    <p className="text-[10px] text-amber-600 font-medium">
                                        {t.client_dash_access_expires}: <strong>{new Date(access_expires_at).toLocaleDateString()}</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
const ResetPasswordView = ({ t }) => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        if (password !== confirm) { setError(t.auth_reset_mismatch); return; }
        setLoading(true);
        setError(null);
        try {
            const { error: err } = await supabase.auth.updateUser({ password });
            if (err) throw err;
            setSuccess(true);
            setTimeout(() => navigate('/auth/login'), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center px-6 py-12">
            <div className="bg-white p-8 rounded-3xl shadow-md border border-brand-primary/10 w-full max-w-sm">
                <h2 className="text-2xl font-serif font-bold text-brand-dark mb-1 text-center">{t.auth_reset_title}</h2>
                <p className="text-xs text-brand-dark/40 mb-6 text-center">{t.auth_reset_subtitle}</p>
                {success ? (
                    <div className="bg-green-50 text-green-700 text-xs p-4 rounded-xl border border-green-100 font-medium text-center">
                        {t.auth_reset_success}
                    </div>
                ) : (
                    <>
                        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 mb-4 font-medium">{error}</div>}
                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 mb-1">{t.auth_reset_new_password}</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                                       placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 mb-1">{t.auth_reset_confirm_password}</label>
                                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                                       placeholder="••••••••" />
                            </div>
                            <button type="submit" disabled={loading}
                                    className="w-full bg-brand-primary text-white py-3 rounded-xl text-xs font-bold hover:bg-brand-accent shadow-md transition-colors disabled:opacity-50">
                                {loading ? t.auth_loading : t.auth_reset_btn}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;