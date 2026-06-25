import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Settings, ChevronLeft, Check, AlertTriangle, Save, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from './supabaseClient';

const LABELS = {
    PT: {
        title: 'O Meu Perfil',
        subtitle: 'Gerir as suas informações pessoais',
        back: 'Painel',
        logout: 'Terminar sessão',
        tabInfo: 'Informações',
        tabSecurity: 'Segurança',
        tabPreferences: 'Preferências',
        name: 'Nome Completo',
        namePh: 'O seu nome e apelido',
        email: 'Email',
        emailPh: 'O seu email',
        phone: 'Telefone',
        phonePh: '+351 900 000 000',
        saveInfo: 'Guardar Informações',
        newPassword: 'Nova Password',
        confirmPassword: 'Confirmar Nova Password',
        changePassword: 'Alterar Password',
        saving: 'A guardar...',
        savedInfo: 'Informações atualizadas com sucesso.',
        savedPassword: 'Password alterada com sucesso.',
        errorMismatch: 'As passwords não coincidem.',
        errorPasswordRules: 'A password deve ter pelo menos 8 caracteres, uma maiúscula, um número e um caractere especial.',
        errorGeneric: 'Ocorreu um erro. Tente novamente.',
        emailNote: 'A alteração de email requer confirmação por email.',
        preferencesComingSoon: 'As preferências de conta estarão disponíveis em breve.',
        preferencesDesc: 'Aqui poderá configurar notificações, idioma preferido, fuso horário e outras preferências de conta.',
    },
    EN: {
        title: 'My Profile',
        subtitle: 'Manage your personal information',
        back: 'Dashboard',
        logout: 'Sign out',
        tabInfo: 'Information',
        tabSecurity: 'Security',
        tabPreferences: 'Preferences',
        name: 'Full Name',
        namePh: 'Your first and last name',
        email: 'Email',
        emailPh: 'Your email address',
        phone: 'Phone',
        phonePh: '+44 700 000 000',
        saveInfo: 'Save Information',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        changePassword: 'Change Password',
        saving: 'Saving...',
        savedInfo: 'Information updated successfully.',
        savedPassword: 'Password changed successfully.',
        errorMismatch: 'Passwords do not match.',
        errorPasswordRules: 'Password must have at least 8 characters, one uppercase letter, one number, and one special character.',
        errorGeneric: 'An error occurred. Please try again.',
        emailNote: 'Changing your email requires email confirmation.',
        preferencesComingSoon: 'Account preferences will be available soon.',
        preferencesDesc: 'Here you will be able to configure notifications, preferred language, timezone, and other account preferences.',
    },
    DE: {
        title: 'Mein Profil', subtitle: 'Verwalten Sie Ihre persönlichen Daten', back: 'Dashboard', logout: 'Abmelden',
        tabInfo: 'Informationen', tabSecurity: 'Sicherheit', tabPreferences: 'Einstellungen',
        name: 'Vollständiger Name', namePh: 'Ihr Vor- und Nachname', email: 'E-Mail', emailPh: 'Ihre E-Mail-Adresse',
        phone: 'Telefon', phonePh: '+49 170 0000000', saveInfo: 'Informationen speichern',
        newPassword: 'Neues Passwort', confirmPassword: 'Neues Passwort bestätigen', changePassword: 'Passwort ändern',
        saving: 'Wird gespeichert...', savedInfo: 'Informationen erfolgreich aktualisiert.', savedPassword: 'Passwort erfolgreich geändert.',
        errorMismatch: 'Passwörter stimmen nicht überein.', errorGeneric: 'Ein Fehler ist aufgetreten.',
        errorPasswordRules: 'Das Passwort muss mindestens 8 Zeichen, einen Großbuchstaben, eine Zahl und ein Sonderzeichen enthalten.',
        emailNote: 'Das Ändern Ihrer E-Mail erfordert eine E-Mail-Bestätigung.',
        preferencesComingSoon: 'Kontoeinstellungen werden bald verfügbar sein.',
        preferencesDesc: 'Hier können Sie Benachrichtigungen, bevorzugte Sprache, Zeitzone und andere Kontoeinstellungen konfigurieren.',
    },
    FR: {
        title: 'Mon Profil', subtitle: 'Gérer vos informations personnelles', back: 'Tableau de bord', logout: 'Se déconnecter',
        tabInfo: 'Informations', tabSecurity: 'Sécurité', tabPreferences: 'Préférences',
        name: 'Nom Complet', namePh: 'Votre prénom et nom de famille', email: 'Email', emailPh: 'Votre adresse email',
        phone: 'Téléphone', phonePh: '+33 6 00 00 00 00', saveInfo: 'Sauvegarder',
        newPassword: 'Nouveau Mot de Passe', confirmPassword: 'Confirmer le Nouveau Mot de Passe', changePassword: 'Changer le Mot de Passe',
        saving: 'Sauvegarde...', savedInfo: 'Informations mises à jour.', savedPassword: 'Mot de passe changé.',
        errorMismatch: 'Les mots de passe ne correspondent pas.', errorGeneric: 'Une erreur est survenue.',
        errorPasswordRules: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.',
        emailNote: "La modification de l'email nécessite une confirmation.",
        preferencesComingSoon: 'Les préférences seront disponibles prochainement.',
        preferencesDesc: 'Ici vous pourrez configurer les notifications, la langue préférée, le fuseau horaire et autres préférences.',
    },
    ES: {
        title: 'Mi Perfil', subtitle: 'Gestionar tu información personal', back: 'Panel', logout: 'Cerrar sesión',
        tabInfo: 'Información', tabSecurity: 'Seguridad', tabPreferences: 'Preferencias',
        name: 'Nombre Completo', namePh: 'Tu nombre y apellidos', email: 'Email', emailPh: 'Tu dirección de email',
        phone: 'Teléfono', phonePh: '+34 600 000 000', saveInfo: 'Guardar Información',
        newPassword: 'Nueva Contraseña', confirmPassword: 'Confirmar Nueva Contraseña', changePassword: 'Cambiar Contraseña',
        saving: 'Guardando...', savedInfo: 'Información actualizada.', savedPassword: 'Contraseña cambiada.',
        errorMismatch: 'Las contraseñas no coinciden.', errorGeneric: 'Se produjo un error.',
        errorPasswordRules: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.',
        emailNote: 'Cambiar el email requiere confirmación.',
        preferencesComingSoon: 'Las preferencias estarán disponibles próximamente.',
        preferencesDesc: 'Aquí podrás configurar notificaciones, idioma preferido, zona horaria y otras preferencias.',
    },
    ZH: {
        title: '我的个人资料', subtitle: '管理您的个人信息', back: '仪表板', logout: '退出登录',
        tabInfo: '个人信息', tabSecurity: '安全', tabPreferences: '偏好设置',
        name: '全名', namePh: '您的姓名', email: '电子邮箱', emailPh: '您的电子邮箱地址',
        phone: '电话', phonePh: '+86 138 0000 0000', saveInfo: '保存信息',
        newPassword: '新密码', confirmPassword: '确认新密码', changePassword: '更改密码',
        saving: '保存中...', savedInfo: '信息更新成功。', savedPassword: '密码更改成功。',
        errorMismatch: '密码不匹配。', errorGeneric: '发生错误，请重试。',
        errorPasswordRules: '密码必须至少包含8个字符、一个大写字母、一个数字和一个特殊字符。',
        emailNote: '更改电子邮箱需要邮箱确认。',
        preferencesComingSoon: '账户偏好设置即将推出。', preferencesDesc: '在这里您可以配置通知、首选语言、时区和其他账户偏好。',
    },
    AR: {
        title: 'ملفي الشخصي', subtitle: 'إدارة معلوماتك الشخصية', back: 'لوحة التحكم', logout: 'تسجيل الخروج',
        tabInfo: 'المعلومات', tabSecurity: 'الأمان', tabPreferences: 'التفضيلات',
        name: 'الاسم الكامل', namePh: 'اسمك الأول والأخير', email: 'البريد الإلكتروني', emailPh: 'عنوان بريدك الإلكتروني',
        phone: 'الهاتف', phonePh: '+966 50 000 0000', saveInfo: 'حفظ المعلومات',
        newPassword: 'كلمة المرور الجديدة', confirmPassword: 'تأكيد كلمة المرور الجديدة', changePassword: 'تغيير كلمة المرور',
        saving: 'جارٍ الحفظ...', savedInfo: 'تم تحديث المعلومات.', savedPassword: 'تم تغيير كلمة المرور.',
        errorMismatch: 'كلمتا المرور غير متطابقتين.', errorGeneric: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
        errorPasswordRules: 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل وحرف كبير ورقم وحرف خاص.',
        emailNote: 'تغيير البريد الإلكتروني يتطلب تأكيداً.',
        preferencesComingSoon: 'التفضيلات ستكون متاحة قريباً.', preferencesDesc: 'هنا يمكنك تكوين الإشعارات واللغة المفضلة والمنطقة الزمنية.',
    },
    RU: {
        title: 'Мой Профиль', subtitle: 'Управление личной информацией', back: 'Панель', logout: 'Выйти',
        tabInfo: 'Информация', tabSecurity: 'Безопасность', tabPreferences: 'Настройки',
        name: 'Полное имя', namePh: 'Ваше имя и фамилия', email: 'Email', emailPh: 'Ваш адрес электронной почты',
        phone: 'Телефон', phonePh: '+7 900 000 00 00', saveInfo: 'Сохранить',
        newPassword: 'Новый пароль', confirmPassword: 'Подтвердите новый пароль', changePassword: 'Изменить пароль',
        saving: 'Сохранение...', savedInfo: 'Информация обновлена.', savedPassword: 'Пароль изменён.',
        errorMismatch: 'Пароли не совпадают.', errorGeneric: 'Произошла ошибка.',
        errorPasswordRules: 'Пароль должен содержать не менее 8 символов, одну заглавную букву, одну цифру и один специальный символ.',
        emailNote: 'Изменение email требует подтверждения.',
        preferencesComingSoon: 'Настройки появятся скоро.', preferencesDesc: 'Здесь вы сможете настроить уведомления, язык, часовой пояс и другие параметры.',
    },
    HI: {
        title: 'मेरी प्रोफ़ाइल', subtitle: 'अपनी व्यक्तिगत जानकारी प्रबंधित करें', back: 'डैशबोर्ड', logout: 'साइन आउट',
        tabInfo: 'जानकारी', tabSecurity: 'सुरक्षा', tabPreferences: 'प्राथमिकताएं',
        name: 'पूरा नाम', namePh: 'आपका पूरा नाम', email: 'ईमेल', emailPh: 'आपका ईमेल',
        phone: 'फ़ोन', phonePh: '+91 90000 00000', saveInfo: 'जानकारी सहेजें',
        newPassword: 'नया पासवर्ड', confirmPassword: 'नया पासवर्ड पुष्टि करें', changePassword: 'पासवर्ड बदलें',
        saving: 'सहेजा जा रहा है...', savedInfo: 'जानकारी अपडेट की गई।', savedPassword: 'पासवर्ड बदला गया।',
        errorMismatch: 'पासवर्ड मेल नहीं खाते।', errorGeneric: 'कोई त्रुटि हुई।',
        errorPasswordRules: 'पासवर्ड में कम से कम 8 अक्षर, एक बड़ा अक्षर, एक संख्या और एक विशेष वर्ण होना चाहिए।',
        emailNote: 'ईमेल बदलने के लिए पुष्टि आवश्यक है।',
        preferencesComingSoon: 'प्राथमिकताएं जल्द उपलब्ध होंगी।', preferencesDesc: 'यहाँ आप सूचनाएं, भाषा, समय क्षेत्र आदि कॉन्फ़िगर कर सकेंगे।',
    },
    BN: {
        title: 'আমার প্রোফাইল', subtitle: 'আপনার ব্যক্তিগত তথ্য পরিচালনা করুন', back: 'ড্যাশবোর্ড', logout: 'সাইন আউট',
        tabInfo: 'তথ্য', tabSecurity: 'নিরাপত্তা', tabPreferences: 'পছন্দ',
        name: 'পুরো নাম', namePh: 'আপনার পুরো নাম', email: 'ইমেইল', emailPh: 'আপনার ইমেইল',
        phone: 'ফোন', phonePh: '+880 1700 000000', saveInfo: 'তথ্য সংরক্ষণ করুন',
        newPassword: 'নতুন পাসওয়ার্ড', confirmPassword: 'নিশ্চিত করুন', changePassword: 'পাসওয়ার্ড পরিবর্তন',
        saving: 'সংরক্ষণ হচ্ছে...', savedInfo: 'তথ্য আপডেট হয়েছে।', savedPassword: 'পাসওয়ার্ড পরিবর্তিত হয়েছে।',
        errorMismatch: 'পাসওয়ার্ড মেলে না।', errorGeneric: 'ত্রুটি হয়েছে।',
        errorPasswordRules: 'পাসওয়ার্ডে ৮টি অক্ষর, একটি বড় হাতের অক্ষর, একটি সংখ্যা এবং একটি বিশেষ অক্ষর থাকতে হবে।',
        emailNote: 'ইমেইল পরিবর্তনের জন্য নিশ্চিতকরণ প্রয়োজন।',
        preferencesComingSoon: 'পছন্দসমূহ শীঘ্রই পাওয়া যাবে।', preferencesDesc: 'এখানে আপনি বিজ্ঞপ্তি, ভাষা, সময় অঞ্চল কনফিগার করতে পারবেন।',
    },
    UR: {
        title: 'میری پروفائل', subtitle: 'اپنی ذاتی معلومات کا انتظام کریں', back: 'ڈیش بورڈ', logout: 'سائن آؤٹ',
        tabInfo: 'معلومات', tabSecurity: 'سیکیورٹی', tabPreferences: 'ترجیحات',
        name: 'پورا نام', namePh: 'آپ کا پورا نام', email: 'ای میل', emailPh: 'آپ کا ای میل',
        phone: 'فون', phonePh: '+92 300 0000000', saveInfo: 'معلومات محفوظ کریں',
        newPassword: 'نیا پاس ورڈ', confirmPassword: 'تصدیق کریں', changePassword: 'پاس ورڈ تبدیل کریں',
        saving: 'محفوظ ہو رہا ہے...', savedInfo: 'معلومات اپ ڈیٹ ہو گئی۔', savedPassword: 'پاس ورڈ تبدیل ہو گیا۔',
        errorMismatch: 'پاس ورڈ مماثل نہیں۔', errorGeneric: 'خرابی پیش آئی۔',
        errorPasswordRules: 'پاس ورڈ میں 8 حروف، ایک بڑا حرف، ایک نمبر اور ایک خاص حرف ہونا چاہیے۔',
        emailNote: 'ای میل تبدیلی کے لیے تصدیق ضروری ہے۔',
        preferencesComingSoon: 'ترجیحات جلد دستیاب ہوں گی۔', preferencesDesc: 'یہاں آپ اطلاعات، زبان، وقت کا خطہ ترتیب دے سکیں گے۔',
    },
};

const validatePassword = (pwd) => {
    if (pwd.length < 8) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[!@#$%^&*(),.?":{}|<>_-]/.test(pwd)) return false;
    return true;
};

const Alert = ({ type, children }) => (
    <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium border ${
        type === 'error'
            ? 'text-red-600 bg-red-50 border-red-100'
            : 'text-green-700 bg-green-50 border-green-100'
    }`}>
        {type === 'error' ? <AlertTriangle size={13} /> : <Check size={13} />}
        {children}
    </div>
);

const Field = ({ label, children }) => (
    <div>
        <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{label}</label>
        {children}
    </div>
);

const Input = ({ type = 'text', ...props }) => (
    <input
        type={type}
        className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-3.5 focus:outline-none focus:border-brand-primary transition-all text-brand-dark text-sm"
        {...props}
    />
);

const TABS = [
    { id: 'info',        icon: User },
    { id: 'security',   icon: Lock },
    { id: 'preferences', icon: Settings },
];

const ProfileView = ({ user, lang }) => {
    const navigate = useNavigate();
    const l = LABELS[lang] || LABELS.PT;
    const [activeTab, setActiveTab] = useState('info');

    const [name, setName] = useState(user?.user_metadata?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
    const [infoLoading, setInfoLoading] = useState(false);
    const [infoSuccess, setInfoSuccess] = useState(false);
    const [infoError, setInfoError] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwLoading, setPwLoading] = useState(false);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [pwError, setPwError] = useState('');

    const avatar = (user?.user_metadata?.full_name || user?.email || '?')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const tabLabel = { info: l.tabInfo, security: l.tabSecurity, preferences: l.tabPreferences };

    const handleSaveInfo = async (e) => {
        e.preventDefault();
        setInfoError(''); setInfoSuccess(false); setInfoLoading(true);
        try {
            const updates = { data: { full_name: name.trim(), phone: phone.trim() } };
            if (email.trim() !== user.email) updates.email = email.trim();
            const { error } = await supabase.auth.updateUser(updates);
            if (error) throw error;
            await supabase.from('users').update({ phone_number: phone.trim() || null, full_name: name.trim() }).eq('id', user.id);
            setInfoSuccess(true);
            setTimeout(() => setInfoSuccess(false), 4000);
        } catch (err) {
            setInfoError(err.message || l.errorGeneric);
        } finally {
            setInfoLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPwError(''); setPwSuccess(false);
        if (newPassword !== confirmPassword) { setPwError(l.errorMismatch); return; }
        if (!validatePassword(newPassword)) { setPwError(l.errorPasswordRules); return; }
        setPwLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setPwSuccess(true);
            setNewPassword(''); setConfirmPassword('');
            setTimeout(() => setPwSuccess(false), 4000);
        } catch (err) {
            setPwError(err.message || l.errorGeneric);
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 py-12">
            {/* Back */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-brand-dark/50 hover:text-brand-primary text-xs font-bold uppercase tracking-widest mb-8 transition-colors"
            >
                <ChevronLeft size={14} />
                {l.back}
            </button>

            {/* Hero row */}
            <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold text-lg font-serif select-none shrink-0">
                    {avatar}
                </div>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-brand-dark">{l.title}</h1>
                    <p className="text-brand-dark/50 text-sm mt-0.5">{l.subtitle}</p>
                </div>
            </div>

            {/* Sidebar + content layout */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar nav */}
                <nav className="md:w-52 shrink-0">
                    <ul className="flex md:flex-col gap-1">
                        {TABS.map(({ id, icon: Icon }) => (
                            <li key={id} className="flex-1 md:flex-none">
                                <button
                                    onClick={() => setActiveTab(id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left ${
                                        activeTab === id
                                            ? 'bg-brand-primary text-white shadow-sm shadow-brand-primary/20'
                                            : 'text-brand-dark/60 hover:bg-brand-primary/8 hover:text-brand-dark'
                                    }`}
                                >
                                    <Icon size={15} />
                                    <span className="hidden md:inline">{tabLabel[id]}</span>
                                    <span className="md:hidden text-xs">{tabLabel[id]}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="hidden md:flex flex-col gap-1 mt-6 pt-6 border-t border-brand-primary/10">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-brand-dark/60 hover:bg-brand-primary/8 hover:text-brand-dark transition-all text-left"
                        >
                            <LayoutDashboard size={15} />
                            <span>{l.back}</span>
                        </button>
                        <button
                            onClick={async () => { await supabase.auth.signOut(); navigate('/'); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-red-500/70 hover:bg-red-50 hover:text-red-600 transition-all text-left"
                        >
                            <LogOut size={15} />
                            <span>{l.logout}</span>
                        </button>
                    </div>
                </nav>

                {/* Content panel */}
                <div className="flex-1 bg-white rounded-3xl border border-brand-primary/10 shadow-sm">
                    {/* Info tab */}
                    {activeTab === 'info' && (
                        <form onSubmit={handleSaveInfo} className="p-8 space-y-6">
                            <div className="flex items-center gap-3 text-brand-primary font-bold font-serif text-lg border-b border-brand-primary/10 pb-4 mb-6">
                                <User size={18} />
                                <span>{l.tabInfo}</span>
                            </div>
                            <Field label={l.name}>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder={l.namePh} />
                            </Field>
                            <Field label={l.phone}>
                                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={l.phonePh} />
                            </Field>
                            {infoError && <Alert type="error">{infoError}</Alert>}
                            {infoSuccess && <Alert type="success">{l.savedInfo}</Alert>}
                            <button
                                type="submit"
                                disabled={infoLoading}
                                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-brand-accent transition-all shadow-sm shadow-brand-primary/20 disabled:opacity-50"
                            >
                                <Save size={14} />
                                {infoLoading ? l.saving : l.saveInfo}
                            </button>
                        </form>
                    )}

                    {/* Security tab */}
                    {activeTab === 'security' && (
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-3 text-brand-primary font-bold font-serif text-lg border-b border-brand-primary/10 pb-4">
                                <Lock size={18} />
                                <span>{l.tabSecurity}</span>
                            </div>
                            {/* Email */}
                            <form onSubmit={handleSaveInfo} className="space-y-4">
                                <p className="text-xs font-bold text-brand-dark/40 uppercase tracking-widest">{l.email}</p>
                                <Field label={l.email}>
                                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={l.emailPh} />
                                    {email !== user?.email && (
                                        <p className="text-xs text-brand-primary/70 mt-1.5 flex items-center gap-1">
                                            <AlertTriangle size={11} />{l.emailNote}
                                        </p>
                                    )}
                                </Field>
                                {infoError && <Alert type="error">{infoError}</Alert>}
                                {infoSuccess && <Alert type="success">{l.savedInfo}</Alert>}
                                <button
                                    type="submit"
                                    disabled={infoLoading || email === user?.email}
                                    className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-brand-accent transition-all shadow-sm shadow-brand-primary/20 disabled:opacity-40"
                                >
                                    <Save size={13} />
                                    {infoLoading ? l.saving : l.saveInfo}
                                </button>
                            </form>
                            <div className="border-t border-brand-primary/10 pt-6">
                                <p className="text-xs font-bold text-brand-dark/40 uppercase tracking-widest mb-4">{l.newPassword}</p>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <Field label={l.newPassword}>
                                        <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                                    </Field>
                                    <Field label={l.confirmPassword}>
                                        <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                                    </Field>
                                    {pwError && <Alert type="error">{pwError}</Alert>}
                                    {pwSuccess && <Alert type="success">{l.savedPassword}</Alert>}
                                    <button
                                        type="submit"
                                        disabled={pwLoading || !newPassword}
                                        className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-brand-accent transition-all shadow-sm shadow-brand-primary/20 disabled:opacity-40"
                                    >
                                        <Lock size={13} />
                                        {pwLoading ? l.saving : l.changePassword}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Preferences tab */}
                    {activeTab === 'preferences' && (
                        <div className="p-8">
                            <div className="flex items-center gap-3 text-brand-primary font-bold font-serif text-lg border-b border-brand-primary/10 pb-4 mb-6">
                                <Settings size={18} />
                                <span>{l.tabPreferences}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-brand-primary/8 flex items-center justify-center">
                                    <Settings size={22} className="text-brand-primary/40" />
                                </div>
                                <p className="text-brand-dark font-semibold text-sm">{l.preferencesComingSoon}</p>
                                <p className="text-brand-dark/40 text-xs max-w-xs leading-relaxed">{l.preferencesDesc}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
