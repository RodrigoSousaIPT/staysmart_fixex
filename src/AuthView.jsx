import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';

const AuthView = ({ t }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isLogin = location.pathname !== '/auth/register';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState([]);

    // Forgot password state
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const [forgotError, setForgotError] = useState(null);

    const validatePassword = (pwd) => {
        const errors = [];
        if (pwd.length < 8) errors.push('Mínimo 8 caracteres');
        if (!/[A-Z]/.test(pwd)) errors.push('Pelo menos 1 letra maiúscula');
        if (!/[0-9]/.test(pwd)) errors.push('Pelo menos 1 número');
        if (!/[!@#$%^&*(),.?":{}|<>_-]/.test(pwd)) errors.push('Pelo menos 1 caractere especial');
        return errors;
    };
    const validatePhone = (p) => /^\+?[0-9\s()-]{7,}$/.test(p.trim());

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const cleanEmail = email.trim();

        if (!isLogin) {
            const errors = validatePassword(password);
            if (errors.length > 0) {
                setPasswordErrors(errors);
                setLoading(false);
                return;
            }
            if (!validatePhone(phone)) {
                setError(t.auth_phone_invalid);
                setLoading(false);
                return;
            }
        }
        setPasswordErrors([]);

        try {
            if (isLogin) {
                const { error: err } = await supabase.auth.signInWithPassword({
                    email: cleanEmail,
                    password: password
                });
                if (err) throw err;
                navigate('/dashboard');
            } else {
                const { error: err } = await supabase.auth.signUp({
                    email: cleanEmail,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName.trim() || cleanEmail.split('@')[0],
                            phone: phone.trim(),
                        }
                    }
                });
                if (err) throw err;
                alert(t.auth_success_msg);
                navigate('/auth/login');
            }
        } catch (err) {
            setError(err.message || t.auth_error_default);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotError(null);
        setForgotLoading(true);
        try {
            const { error: err } = await supabase.auth.resetPasswordForEmail(
                forgotEmail.trim(),
                { redirectTo: `${window.location.origin}/auth/reset` }
            );
            if (err) throw err;
            setForgotSuccess(true);
        } catch (err) {
            setForgotError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    const toggleMode = () => {
        setError(null);
        setPasswordErrors([]);
        navigate(isLogin ? '/auth/register' : '/auth/login');
    };

    // Forgot password screen
    if (forgotMode) {
        return (
            <div className="flex justify-center items-center px-6 py-12">
                <div className="bg-white p-8 rounded-3xl shadow-md border border-brand-primary/10 w-full max-w-sm">
                    <h2 className="text-2xl font-serif font-bold text-brand-dark mb-1 text-center">
                        {t.auth_forgot_title}
                    </h2>
                    <p className="text-xs text-brand-dark/40 mb-6 text-center">{t.auth_forgot_subtitle}</p>

                    {forgotSuccess ? (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="bg-green-50 text-green-700 text-xs p-4 rounded-xl border border-green-100 font-medium w-full">
                                {t.auth_forgot_success}
                            </div>
                            <button
                                onClick={() => { setForgotMode(false); setForgotSuccess(false); setForgotEmail(''); }}
                                className="text-brand-primary text-xs font-bold hover:underline"
                            >
                                {t.auth_back_to_login}
                            </button>
                        </div>
                    ) : (
                        <>
                            {forgotError && (
                                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 mb-4 font-medium">
                                    {forgotError}
                                </div>
                            )}
                            <form onSubmit={handleForgotSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 mb-1">{t.auth_email_label}</label>
                                    <input
                                        type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                                        className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                                        placeholder="exemplo@email.com"
                                    />
                                </div>
                                <button
                                    type="submit" disabled={forgotLoading}
                                    className="w-full bg-brand-primary text-white py-3 rounded-xl text-xs font-bold hover:bg-brand-accent shadow-md transition-colors disabled:opacity-50"
                                >
                                    {forgotLoading ? t.auth_loading : t.auth_forgot_btn}
                                </button>
                            </form>
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => { setForgotMode(false); setForgotError(null); }}
                                    className="text-brand-primary text-xs font-bold hover:underline"
                                >
                                    {t.auth_back_to_login}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Normal login/register screen
    return (
        <div className="flex justify-center items-center px-6 py-12">
            <div className="bg-white p-8 rounded-3xl shadow-md border border-brand-primary/10 w-full max-w-sm">
                <h2 className="text-2xl font-serif font-bold text-brand-dark mb-1 text-center">
                    {isLogin ? t.auth_login_title : t.auth_register_title}
                </h2>
                <p className="text-xs text-brand-dark/40 mb-6 text-center">{t.auth_subtitle}</p>

                {error && (
                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 mb-4 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 mb-1">{t.auth_fullname_label}</label>
                            <input
                                type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                                placeholder={t.auth_fullname_placeholder}
                            />
                        </div>
                    )}
                    {!isLogin && (
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 mb-1">{t.auth_phone_label}</label>
                            <input
                                type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                                placeholder={t.auth_phone_placeholder}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/40 mb-1">{t.auth_email_label}</label>
                        <input
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                            placeholder="exemplo@email.com"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-dark/40">{t.auth_password_label}</label>
                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                                    className="text-[10px] text-brand-primary font-bold hover:underline"
                                >
                                    {t.auth_forgot_link}
                                </button>
                            )}
                        </div>
                        <input
                            type="password" required value={password} onChange={(e) => {
                            setPassword(e.target.value);
                            if (!isLogin) setPasswordErrors(validatePassword(e.target.value));
                        }}
                            className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-primary"
                            placeholder="••••••••"
                        />
                        {!isLogin && password.length > 0 && passwordErrors.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {passwordErrors.map((err, i) => (
                                    <li key={i} className="text-red-500 text-[10px] font-medium flex items-center gap-1">
                                        <span>✕</span> {err}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!isLogin && password.length > 0 && passwordErrors.length === 0 && (
                            <p className="mt-2 text-green-500 text-[10px] font-medium">✓ Password válida</p>
                        )}
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-brand-primary text-white py-3 rounded-xl text-xs font-bold hover:bg-brand-accent shadow-md transition-colors disabled:opacity-50"
                    >
                        {loading ? t.auth_loading : (isLogin ? t.auth_login_btn : t.auth_register_btn)}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-brand-dark/50">
                    {isLogin ? t.auth_no_account : t.auth_has_account}
                    <button
                        onClick={toggleMode}
                        className="ml-1 text-brand-primary font-bold hover:underline"
                    >
                        {isLogin ? t.auth_register_link : t.auth_login_link}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthView;