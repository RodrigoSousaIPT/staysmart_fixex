import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { dbService } from './dbService';

const MODAL_LABELS = {
  PT: { title: 'Inscreva-se gratuitamente', subtitle: '30 dias de trial. Sem cartão de crédito.', name: 'Nome completo *', namePh: 'João Silva', email: 'Email da empresa *', emailPh: 'joao@empresa.com', phone: 'Número de telefone *', phonePh: '+351 900 000 000', button: 'Solicitar acesso gratuito', success: 'Pedido enviado! Entraremos em contacto em breve.', error: 'Erro ao enviar. Tente novamente.' },
  EN: { title: 'Sign up for free', subtitle: '30-day trial. No credit card.', name: 'Full name *', namePh: 'John Smith', email: 'Company email *', emailPh: 'john@company.com', phone: 'Phone number *', phonePh: '+44 700 000 000', button: 'Request free access', success: 'Request sent! We\'ll be in touch soon.', error: 'Error submitting. Please try again.' },
  DE: { title: 'Kostenlos registrieren', subtitle: '30 Tage Testphase. Ohne Kreditkarte.', name: 'Vollständiger Name *', namePh: 'Max Mustermann', email: 'Firmen-E-Mail *', emailPh: 'max@firma.de', phone: 'Telefonnummer *', phonePh: '+49 170 0000000', button: 'Kostenlosen Zugang anfordern', success: 'Anfrage gesendet!', error: 'Fehler beim Senden.' },
  FR: { title: "S'inscrire gratuitement", subtitle: "30 jours d'essai. Sans carte de crédit.", name: 'Nom complet *', namePh: 'Jean Dupont', email: "Email de l'entreprise *", emailPh: 'jean@entreprise.com', phone: 'Numéro de téléphone *', phonePh: '+33 6 00 00 00 00', button: 'Demander un accès gratuit', success: 'Demande envoyée!', error: 'Erreur lors de l\'envoi.' },
  ES: { title: 'Inscríbete gratis', subtitle: '30 días de prueba. Sin tarjeta de crédito.', name: 'Nombre completo *', namePh: 'Juan García', email: 'Email de empresa *', emailPh: 'juan@empresa.com', phone: 'Número de teléfono *', phonePh: '+34 600 000 000', button: 'Solicitar acceso gratuito', success: '¡Solicitud enviada!', error: 'Error al enviar.' },
  ZH: { title: '免费注册', subtitle: '30天试用，无需信用卡。', name: '全名 *', namePh: '张三', email: '公司邮箱 *', emailPh: 'zhang@gongsi.com', phone: '电话号码 *', phonePh: '+86 138 0000 0000', button: '申请免费访问', success: '请求已发送！', error: '提交错误，请重试。' },
  AR: { title: 'سجل مجاناً', subtitle: '30 يوم تجريبي. بدون بطاقة ائتمان.', name: 'الاسم الكامل *', namePh: 'محمد أحمد', email: 'البريد الإلكتروني للشركة *', emailPh: 'mohammed@sharka.com', phone: 'رقم الهاتف *', phonePh: '+966 50 000 0000', button: 'طلب وصول مجاني', success: 'تم إرسال الطلب!', error: 'خطأ في الإرسال.' },
  RU: { title: 'Зарегистрироваться бесплатно', subtitle: '30 дней пробного периода. Без кредитной карты.', name: 'Полное имя *', namePh: 'Иван Иванов', email: 'Корпоративный email *', emailPh: 'ivan@kompaniya.ru', phone: 'Номер телефона *', phonePh: '+7 900 000 00 00', button: 'Запросить бесплатный доступ', success: 'Запрос отправлен!', error: 'Ошибка отправки.' },
  HI: { title: 'मुफ्त साइन अप करें', subtitle: '30 दिनों का ट्रायल। कोई क्रेडिट कार्ड नहीं।', name: 'पूरा नाम *', namePh: 'राहुल शर्मा', email: 'कंपनी ईमेल *', emailPh: 'rahul@company.com', phone: 'फ़ोन नंबर *', phonePh: '+91 90000 00000', button: 'मुफ्त एक्सेस का अनुरोध करें', success: 'अनुरोध भेजा गया!', error: 'भेजने में त्रुटि।' },
  BN: { title: 'বিনামূল্যে সাইন আপ করুন', subtitle: '30 দিনের ট্রায়াল। কোনো ক্রেডিট কার্ড নেই।', name: 'পুরো নাম *', namePh: 'রহিম আহমেদ', email: 'কোম্পানি ইমেইল *', emailPh: 'rahim@company.com', phone: 'ফোন নম্বর *', phonePh: '+880 1700 000000', button: 'বিনামূল্যে অ্যাক্সেসের জন্য অনুরোধ করুন', success: 'অনুরোধ পাঠানো হয়েছে!', error: 'পাঠানোর ত্রুটি।' },
  UR: { title: 'مفت سائن اپ کریں', subtitle: '30 دن کا ٹرائل۔ کوئی کریڈٹ کارڈ نہیں۔', name: 'پورا نام *', namePh: 'احمد خان', email: 'کمپنی ای میل *', emailPh: 'ahmed@company.com', phone: 'فون نمبر *', phonePh: '+92 300 0000000', button: 'مفت رسائی کی درخواست کریں', success: 'درخواست بھیجی گئی!', error: 'بھیجنے میں خرابی۔' },
};

const SignupModal = ({ open, onClose, lang, plan }) => {
  const l = MODAL_LABELS[lang] || MODAL_LABELS.PT;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    // Reset state when modal opens
    setFullName(''); setEmail(''); setPhone('');
    setLoading(false); setSuccess(false); setError(null);

    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await dbService.registerLead({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        plan: plan || null,
        source: 'modal',
      });
      setSuccess(true);
    } catch (err) {
      setError(l.error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" />
        <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-md p-10 z-10" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-primary/10 text-brand-dark/50 hover:text-brand-dark transition-all">
            <X size={20} />
          </button>

          {success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle size={48} className="text-brand-primary mb-4" />
                <p className="text-brand-dark font-bold text-lg">{l.success}</p>
              </div>
          ) : (
              <>
                <h2 className="text-3xl font-serif font-bold text-brand-dark mb-1">{l.title}</h2>
                <p className="text-brand-dark/50 text-sm mb-8">{l.subtitle}</p>

                {error && (
                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 mb-4 font-medium">{error}</div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.name}</label>
                    <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={l.namePh}
                           className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.email}</label>
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={l.emailPh}
                           className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.phone}</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={l.phonePh}
                           className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                  </div>
                  <button type="submit" disabled={loading}
                          className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20 mt-2 disabled:opacity-60">
                    {loading ? '...' : l.button}
                  </button>
                </form>
              </>
          )}
        </div>
      </div>
  );
};

export default SignupModal;