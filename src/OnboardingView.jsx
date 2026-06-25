import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, Home, Database, Zap, MessageCircle, Loader2 } from 'lucide-react';
import { dbService } from './dbService';
import { supabase } from './supabaseClient';

const LABELS = {
    PT: {
        title: 'Configurar Propriedade',
        subtitle: 'Preencha os dados da sua propriedade passo a passo.',
        steps: ['Propriedade', 'Contexto IA', 'Utilitários', 'WhatsApp'],
        step1: { title: 'Dados da Propriedade', name: 'Nome da Propriedade *', namePh: 'Ex: Apartamento Lisboa Centro', address: 'Morada', addressPh: 'Ex: Rua Augusta 123, Lisboa', description: 'Descrição', descriptionPh: 'Descreva brevemente a sua propriedade...', checkin: 'Check-in', checkout: 'Check-out' },
        step2: { title: 'Contexto para IA', wifi: 'Password WiFi', wifiPh: 'Ex: MinhaRede_2024', rules: 'Regras da Casa', rulesPh: 'Ex: Não fumar, silêncio após as 22h...', instructions: 'Instruções de Check-in', instructionsPh: 'Ex: A chave está na caixa junto à porta...', emergency: 'Contacto de Emergência', emergencyPh: 'Ex: João Silva - +351 900 000 000' },
        step3: { title: 'Utilitários', itemPh: 'Ex: Máquina de lavar', essential: 'Essencial', add: '+ Adicionar Utilitário' },
        step4: { title: 'Ligar WhatsApp', desc: 'Ligue o seu número de WhatsApp a esta propriedade para receber mensagens de hóspedes.', instancePh: 'Ex: apartamento-lisboa', instanceLabel: 'Nome da instância', connect: 'Ligar WhatsApp', scanning: 'A aguardar leitura do QR...', connected: 'WhatsApp Ligado!', skip: 'Saltar por agora', error: 'Erro ao ligar. Tente novamente.' },
        prev: 'Anterior', next: 'Seguinte', finish: 'Concluir', saving: 'A guardar...', error: 'Erro ao guardar. Tente novamente.', nameRequired: 'O nome da propriedade é obrigatório.',
    },
    EN: {
        title: 'Setup Property',
        subtitle: 'Fill in your property details step by step.',
        steps: ['Property', 'AI Context', 'Utilities', 'WhatsApp'],
        step1: { title: 'Property Details', name: 'Property Name *', namePh: 'Ex: Lisbon Center Apartment', address: 'Address', addressPh: 'Ex: Augusta Street 123, Lisbon', description: 'Description', descriptionPh: 'Briefly describe your property...', checkin: 'Check-in', checkout: 'Check-out' },
        step2: { title: 'AI Context', wifi: 'WiFi Password', wifiPh: 'Ex: MyNetwork_2024', rules: 'House Rules', rulesPh: 'Ex: No smoking, quiet after 10pm...', instructions: 'Check-in Instructions', instructionsPh: 'Ex: Key is in the box by the door...', emergency: 'Emergency Contact', emergencyPh: 'Ex: John Smith - +44 700 000 000' },
        step3: { title: 'Utilities', itemPh: 'Ex: Washing machine', essential: 'Essential', add: '+ Add Utility' },
        step4: { title: 'Connect WhatsApp', desc: 'Link your WhatsApp number to this property to receive guest messages.', instancePh: 'Ex: lisbon-apartment', instanceLabel: 'Instance name', connect: 'Connect WhatsApp', scanning: 'Waiting for QR scan...', connected: 'WhatsApp Connected!', skip: 'Skip for now', error: 'Error connecting. Please try again.' },
        prev: 'Previous', next: 'Next', finish: 'Finish', saving: 'Saving...', error: 'Error saving. Please try again.', nameRequired: 'Property name is required.',
    },
    DE: {
        title: 'Unterkunft einrichten',
        subtitle: 'Füllen Sie die Daten Ihrer Unterkunft Schritt für Schritt aus.',
        steps: ['Unterkunft', 'KI-Kontext', 'Ausstattung', 'WhatsApp'],
        step1: { title: 'Unterkunftsdaten', name: 'Name der Unterkunft *', namePh: 'z.B. Apartment Berlin Mitte', address: 'Adresse', addressPh: 'z.B. Unter den Linden 123, Berlin', description: 'Beschreibung', descriptionPh: 'Beschreiben Sie kurz Ihre Unterkunft...', checkin: 'Check-in', checkout: 'Check-out' },
        step2: { title: 'KI-Kontext', wifi: 'WLAN-Passwort', wifiPh: 'z.B. MeinNetz_2024', rules: 'Hausregeln', rulesPh: 'z.B. Nichtraucher, Ruhe nach 22 Uhr...', instructions: 'Check-in Anweisungen', instructionsPh: 'z.B. Schlüssel ist in der Box neben der Tür...', emergency: 'Notfallkontakt', emergencyPh: 'z.B. Max Mustermann - +49 170 0000000' },
        step3: { title: 'Ausstattung', itemPh: 'z.B. Waschmaschine', essential: 'Wesentlich', add: '+ Ausstattung hinzufügen' },
        step4: { title: 'WhatsApp verbinden', desc: 'Verknüpfen Sie Ihre WhatsApp-Nummer mit dieser Unterkunft, um Gästenachrichten zu erhalten.', instancePh: 'z.B. berlin-apartment', instanceLabel: 'Instanzname', connect: 'WhatsApp verbinden', scanning: 'Warte auf QR-Scan...', connected: 'WhatsApp verbunden!', skip: 'Jetzt überspringen', error: 'Verbindungsfehler. Bitte erneut versuchen.' },
        prev: 'Zurück', next: 'Weiter', finish: 'Abschließen', saving: 'Speichern...', error: 'Fehler beim Speichern.', nameRequired: 'Der Name der Unterkunft ist erforderlich.',
    },
    FR: {
        title: 'Configurer la Propriété',
        subtitle: 'Remplissez les données de votre propriété étape par étape.',
        steps: ['Propriété', 'Contexte IA', 'Utilitaires', 'WhatsApp'],
        step1: { title: 'Données de la Propriété', name: 'Nom de la Propriété *', namePh: 'Ex: Appartement Centre Paris', address: 'Adresse', addressPh: 'Ex: Rue de Rivoli 123, Paris', description: 'Description', descriptionPh: 'Décrivez brièvement votre propriété...', checkin: 'Check-in', checkout: 'Check-out' },
        step2: { title: 'Contexte pour IA', wifi: 'Mot de passe WiFi', wifiPh: 'Ex: MonReseau_2024', rules: 'Règles de la Maison', rulesPh: 'Ex: Non-fumeur, silence après 22h...', instructions: 'Instructions de Check-in', instructionsPh: 'Ex: La clé est dans la boîte près de la porte...', emergency: 'Contact d\'Urgence', emergencyPh: 'Ex: Jean Dupont - +33 6 00 00 00 00' },
        step3: { title: 'Utilitaires', itemPh: 'Ex: Machine à laver', essential: 'Essentiel', add: '+ Ajouter Utilitaire' },
        step4: { title: 'Connecter WhatsApp', desc: 'Liez votre numéro WhatsApp à cette propriété pour recevoir les messages des clients.', instancePh: 'Ex: appartement-paris', instanceLabel: 'Nom de l\'instance', connect: 'Connecter WhatsApp', scanning: 'Attente du scan QR...', connected: 'WhatsApp connecté !', skip: 'Passer pour l\'instant', error: 'Erreur de connexion. Veuillez réessayer.' },
        prev: 'Précédent', next: 'Suivant', finish: 'Terminer', saving: 'Enregistrement...', error: 'Erreur lors de l\'enregistrement.', nameRequired: 'Le nom de la propriété est obligatoire.',
    },
    ES: {
        title: 'Configurar Propiedad',
        subtitle: 'Rellena los datos de tu propiedad paso a paso.',
        steps: ['Propiedad', 'Contexto IA', 'Utilidades', 'WhatsApp'],
        step1: { title: 'Datos de la Propiedad', name: 'Nombre de la Propiedad *', namePh: 'Ej: Apartamento Centro Madrid', address: 'Dirección', addressPh: 'Ej: Calle Mayor 123, Madrid', description: 'Descripción', descriptionPh: 'Describe brevemente tu propiedad...', checkin: 'Check-in', checkout: 'Check-out' },
        step2: { title: 'Contexto para IA', wifi: 'Contraseña WiFi', wifiPh: 'Ej: MiRed_2024', rules: 'Reglas de la Casa', rulesPh: 'Ej: No fumar, silencio después de las 22h...', instructions: 'Instrucciones de Check-in', instructionsPh: 'Ej: La llave está en la caja junto a la puerta...', emergency: 'Contacto de Emergencia', emergencyPh: 'Ej: Juan García - +34 600 000 000' },
        step3: { title: 'Utilidades', itemPh: 'Ej: Lavadora', essential: 'Esencial', add: '+ Añadir Utilidad' },
        step4: { title: 'Conectar WhatsApp', desc: 'Vincula tu número de WhatsApp a esta propiedad para recibir mensajes de huéspedes.', instancePh: 'Ej: apartamento-madrid', instanceLabel: 'Nombre de instancia', connect: 'Conectar WhatsApp', scanning: 'Esperando escaneo QR...', connected: '¡WhatsApp Conectado!', skip: 'Omitir por ahora', error: 'Error al conectar. Inténtalo de nuevo.' },
        prev: 'Anterior', next: 'Siguiente', finish: 'Finalizar', saving: 'Guardando...', error: 'Error al guardar. Inténtalo de nuevo.', nameRequired: 'El nombre de la propiedad es obligatorio.',
    },
    ZH: {
        title: '配置房源',
        subtitle: '逐步填写您的房源详情。',
        steps: ['房源', 'AI上下文', '设施', 'WhatsApp'],
        step1: { title: '房源详情', name: '房源名称 *', namePh: '例：北京中心公寓', address: '地址', addressPh: '例：长安街123号，北京', description: '描述', descriptionPh: '简要描述您的房源...', checkin: '入住', checkout: '退房' },
        step2: { title: 'AI上下文', wifi: 'WiFi密码', wifiPh: '例：MyNetwork_2024', rules: '房屋规则', rulesPh: '例：禁止吸烟，22点后保持安静...', instructions: '入住说明', instructionsPh: '例：钥匙在门旁边的盒子里...', emergency: '紧急联系人', emergencyPh: '例：张三 - +86 138 0000 0000' },
        step3: { title: '设施', itemPh: '例：洗衣机', essential: '必要', add: '+ 添加设施' },
        step4: { title: '连接WhatsApp', desc: '将您的WhatsApp号码链接到此房源以接收房客消息。', instancePh: '例：beijing-apartment', instanceLabel: '实例名称', connect: '连接WhatsApp', scanning: '等待扫描二维码...', connected: 'WhatsApp已连接！', skip: '暂时跳过', error: '连接错误，请重试。' },
        prev: '上一步', next: '下一步', finish: '完成', saving: '保存中...', error: '保存错误，请重试。', nameRequired: '房源名称为必填项。',
    },
    AR: {
        title: 'إعداد العقار',
        subtitle: 'قم بملء بيانات عقارك خطوة بخطوة.',
        steps: ['العقار', 'سياق الذكاء الاصطناعي', 'المرافق', 'واتساب'],
        step1: { title: 'بيانات العقار', name: 'اسم العقار *', namePh: 'مثال: شقة وسط الرياض', address: 'العنوان', addressPh: 'مثال: شارع الملك فهد 123، الرياض', description: 'الوصف', descriptionPh: 'صف عقارك باختصار...', checkin: 'تسجيل الوصول', checkout: 'تسجيل المغادرة' },
        step2: { title: 'سياق الذكاء الاصطناعي', wifi: 'كلمة مرور الواي فاي', wifiPh: 'مثال: MyNetwork_2024', rules: 'قواعد المنزل', rulesPh: 'مثال: ممنوع التدخين، هدوء بعد الساعة 22...', instructions: 'تعليمات تسجيل الوصول', instructionsPh: 'مثال: المفتاح في الصندوق بجانب الباب...', emergency: 'جهة الاتصال في حالات الطوارئ', emergencyPh: 'مثال: محمد أحمد - +966 50 000 0000' },
        step3: { title: 'المرافق', itemPh: 'مثال: غسالة', essential: 'ضروري', add: '+ إضافة مرفق' },
        step4: { title: 'ربط واتساب', desc: 'اربط رقم واتساب الخاص بك بهذا العقار لاستقبال رسائل الضيوف.', instancePh: 'مثال: riyadh-apartment', instanceLabel: 'اسم النموذج', connect: 'ربط واتساب', scanning: 'في انتظار مسح رمز QR...', connected: '!تم ربط واتساب', skip: 'تخطي في الوقت الحالي', error: 'خطأ في الاتصال. حاول مرة أخرى.' },
        prev: 'السابق', next: 'التالي', finish: 'إنهاء', saving: 'جارٍ الحفظ...', error: 'خطأ في الحفظ. حاول مرة أخرى.', nameRequired: 'اسم العقار مطلوب.',
    },
    RU: {
        title: 'Настройка объекта',
        subtitle: 'Заполните данные вашего объекта шаг за шагом.',
        steps: ['Объект', 'Контекст ИИ', 'Оснащение', 'WhatsApp'],
        step1: { title: 'Данные объекта', name: 'Название объекта *', namePh: 'Пр: Апартаменты в центре Москвы', address: 'Адрес', addressPh: 'Пр: ул. Арбат 123, Москва', description: 'Описание', descriptionPh: 'Кратко опишите ваш объект...', checkin: 'Заезд', checkout: 'Выезд' },
        step2: { title: 'Контекст для ИИ', wifi: 'Пароль Wi-Fi', wifiPh: 'Пр: МояСеть_2024', rules: 'Правила дома', rulesPh: 'Пр: Не курить, тишина после 22:00...', instructions: 'Инструкции по заезду', instructionsPh: 'Пр: Ключ в коробке у двери...', emergency: 'Экстренный контакт', emergencyPh: 'Пр: Иван Иванов - +7 900 000 00 00' },
        step3: { title: 'Оснащение', itemPh: 'Пр: Стиральная машина', essential: 'Необходимо', add: '+ Добавить оснащение' },
        step4: { title: 'Подключить WhatsApp', desc: 'Привяжите свой номер WhatsApp к этому объекту для получения сообщений от гостей.', instancePh: 'Пр: moscow-apartment', instanceLabel: 'Название экземпляра', connect: 'Подключить WhatsApp', scanning: 'Ожидание сканирования QR...', connected: 'WhatsApp подключён!', skip: 'Пропустить пока', error: 'Ошибка подключения. Попробуйте снова.' },
        prev: 'Назад', next: 'Далее', finish: 'Завершить', saving: 'Сохранение...', error: 'Ошибка сохранения. Попробуйте снова.', nameRequired: 'Название объекта обязательно.',
    },
    HI: {
        title: 'संपत्ति सेटअप करें',
        subtitle: 'अपनी संपत्ति का विवरण चरण दर चरण भरें।',
        steps: ['संपत्ति', 'AI संदर्भ', 'सुविधाएं', 'WhatsApp'],
        step1: { title: 'संपत्ति विवरण', name: 'संपत्ति का नाम *', namePh: 'उदा: दिल्ली सेंटर अपार्टमेंट', address: 'पता', addressPh: 'उदा: कनॉट प्लेस 123, नई दिल्ली', description: 'विवरण', descriptionPh: 'अपनी संपत्ति का संक्षिप्त विवरण दें...', checkin: 'चेक-इन', checkout: 'चेक-आउट' },
        step2: { title: 'AI संदर्भ', wifi: 'WiFi पासवर्ड', wifiPh: 'उदा: MeriNetwork_2024', rules: 'घर के नियम', rulesPh: 'उदा: धूम्रपान निषेध, रात 10 बजे के बाद शांति...', instructions: 'चेक-इन निर्देश', instructionsPh: 'उदा: चाबी दरवाजे के पास बॉक्स में है...', emergency: 'आपातकालीन संपर्क', emergencyPh: 'उदा: राहुल शर्मा - +91 90000 00000' },
        step3: { title: 'सुविधाएं', itemPh: 'उदा: वाशिंग मशीन', essential: 'आवश्यक', add: '+ सुविधा जोड़ें' },
        step4: { title: 'WhatsApp कनेक्ट करें', desc: 'अपने WhatsApp नंबर को इस संपत्ति से जोड़ें ताकि मेहमानों के संदेश प्राप्त हो सकें।', instancePh: 'उदा: delhi-apartment', instanceLabel: 'इंस्टेंस नाम', connect: 'WhatsApp कनेक्ट करें', scanning: 'QR स्कैन की प्रतीक्षा में...', connected: 'WhatsApp कनेक्ट हो गया!', skip: 'अभी छोड़ें', error: 'कनेक्ट करने में त्रुटि। पुनः प्रयास करें।' },
        prev: 'पिछला', next: 'अगला', finish: 'पूर्ण करें', saving: 'सहेजा जा रहा है...', error: 'सहेजने में त्रुटि। पुनः प्रयास करें।', nameRequired: 'संपत्ति का नाम आवश्यक है।',
    },
    BN: {
        title: 'সম্পত্তি সেটআপ করুন',
        subtitle: 'আপনার সম্পত্তির বিবরণ ধাপে ধাপে পূরণ করুন।',
        steps: ['সম্পত্তি', 'AI প্রসঙ্গ', 'সুযোগ-সুবিধা', 'WhatsApp'],
        step1: { title: 'সম্পত্তির বিবরণ', name: 'সম্পত্তির নাম *', namePh: 'যেমন: ঢাকা কেন্দ্র অ্যাপার্টমেন্ট', address: 'ঠিকানা', addressPh: 'যেমন: মতিঝিল ১২৩, ঢাকা', description: 'বিবরণ', descriptionPh: 'আপনার সম্পত্তির সংক্ষিপ্ত বিবরণ দিন...', checkin: 'চেক-ইন', checkout: 'চেক-আউট' },
        step2: { title: 'AI প্রসঙ্গ', wifi: 'WiFi পাসওয়ার্ড', wifiPh: 'যেমন: AmarNetwork_2024', rules: 'ঘরের নিয়ম', rulesPh: 'যেমন: ধূমপান নিষিদ্ধ, রাত ১০টার পর নীরবতা...', instructions: 'চেক-ইন নির্দেশনা', instructionsPh: 'যেমন: চাবি দরজার পাশের বাক্সে আছে...', emergency: 'জরুরি যোগাযোগ', emergencyPh: 'যেমন: রহিম আহমেদ - +880 1700 000000' },
        step3: { title: 'সুযোগ-সুবিধা', itemPh: 'যেমন: ওয়াশিং মেশিন', essential: 'অপরিহার্য', add: '+ সুবিধা যোগ করুন' },
        step4: { title: 'WhatsApp সংযুক্ত করুন', desc: 'অতিথির বার্তা পেতে আপনার WhatsApp নম্বর এই সম্পত্তির সাথে যুক্ত করুন।', instancePh: 'যেমন: dhaka-apartment', instanceLabel: 'ইনস্ট্যান্স নাম', connect: 'WhatsApp সংযুক্ত করুন', scanning: 'QR স্ক্যানের জন্য অপেক্ষা করছে...', connected: 'WhatsApp সংযুক্ত!', skip: 'এখন বাদ দিন', error: 'সংযোগে ত্রুটি। আবার চেষ্টা করুন।' },
        prev: 'পূর্ববর্তী', next: 'পরবর্তী', finish: 'সম্পন্ন করুন', saving: 'সংরক্ষণ হচ্ছে...', error: 'সংরক্ষণে ত্রুটি। আবার চেষ্টা করুন।', nameRequired: 'সম্পত্তির নাম প্রয়োজন।',
    },
    UR: {
        title: 'جائیداد ترتیب دیں',
        subtitle: 'اپنی جائیداد کی تفصیلات مرحلہ وار بھریں۔',
        steps: ['جائیداد', 'AI سیاق', 'سہولیات', 'واٹس ایپ'],
        step1: { title: 'جائیداد کی تفصیلات', name: 'جائیداد کا نام *', namePh: 'مثلاً: کراچی مرکز اپارٹمنٹ', address: 'پتہ', addressPh: 'مثلاً: ایم اے جناح روڈ 123، کراچی', description: 'تفصیل', descriptionPh: 'اپنی جائیداد کا مختصر تعارف دیں...', checkin: 'چیک ان', checkout: 'چیک آؤٹ' },
        step2: { title: 'AI سیاق و سباق', wifi: 'WiFi پاس ورڈ', wifiPh: 'مثلاً: MeraNetwork_2024', rules: 'گھر کے قواعد', rulesPh: 'مثلاً: تمباکو نوشی ممنوع، رات 10 بجے کے بعد خاموشی...', instructions: 'چیک ان ہدایات', instructionsPh: 'مثلاً: چابی دروازے کے پاس ڈبے میں ہے...', emergency: 'ہنگامی رابطہ', emergencyPh: 'مثلاً: احمد خان - +92 300 0000000' },
        step3: { title: 'سہولیات', itemPh: 'مثلاً: واشنگ مشین', essential: 'ضروری', add: '+ سہولت شامل کریں' },
        step4: { title: 'واٹس ایپ منسلک کریں', desc: 'مہمانوں کے پیغامات وصول کرنے کے لیے اپنا واٹس ایپ نمبر اس جائیداد سے منسلک کریں۔', instancePh: 'مثلاً: karachi-apartment', instanceLabel: 'انسٹینس کا نام', connect: 'واٹس ایپ منسلک کریں', scanning: 'QR اسکین کا انتظار ہے...', connected: '!واٹس ایپ منسلک', skip: 'ابھی چھوڑیں', error: 'منسلک کرنے میں خرابی۔ دوبارہ کوشش کریں۔' },
        prev: 'پچھلا', next: 'اگلا', finish: 'مکمل کریں', saving: 'محفوظ ہو رہا ہے...', error: 'محفوظ کرنے میں خرابی۔ دوبارہ کوشش کریں۔', nameRequired: 'جائیداد کا نام ضروری ہے۔',
    },
};

const slugify = (str) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);

const STEP_ICONS = [Home, Database, Zap, MessageCircle];

const OnboardingView = ({ lang }) => {
    const l = LABELS[lang] || LABELS.PT;
    const navigate = useNavigate();
    // unused suppression for unused destructured imports preserved for tree shaking
    void supabase;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [description, setDescription] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');

    const [wifi, setWifi] = useState('');
    const [houseRules, setHouseRules] = useState('');
    const [checkInInstructions, setCheckInInstructions] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');

    const [utilities, setUtilities] = useState([{ item_name: '', is_essential: false }]);

    // Step 4 WhatsApp state
    const [createdPropertyId, setCreatedPropertyId] = useState(null);
    const [instanceName, setInstanceName] = useState('');
    const [waStatus, setWaStatus] = useState('idle'); // idle | creating | scanning | connected | error
    const [qrBase64, setQrBase64] = useState(null);
    const pollRef = useRef(null);

    useEffect(() => {
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, []);

    useEffect(() => {
        if (step !== 4) return;
        const slug = slugify(name);
        // Fall back to first 16 hex chars of property UUID for non-Latin names
        setInstanceName(slug || (createdPropertyId ? createdPropertyId.replace(/-/g, '').slice(0, 16) : 'property'));
    }, [step]);

    const addUtility = () => setUtilities([...utilities, { item_name: '', is_essential: false }]);
    const removeUtility = (index) => setUtilities(utilities.filter((_, i) => i !== index));
    const updateUtility = (index, field, value) => {
        const updated = [...utilities];
        updated[index][field] = value;
        setUtilities(updated);
    };

    const handleSubmit = async () => {
        setError(null);
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const property = await dbService.createProperty({
                owner_id: user.id,
                name,
                address,
                description,
                check_in_date: checkIn || null,
                check_out_date: checkOut || null,
                is_active: true,
            });

            const contextItems = [
                { property_id: property.id, feature_key: 'wifi', feature_value: wifi, is_visible_to_client: true },
                { property_id: property.id, feature_key: 'house_rules', feature_value: houseRules, is_visible_to_client: true },
                { property_id: property.id, feature_key: 'check_in_instructions', feature_value: checkInInstructions, is_visible_to_client: true },
                { property_id: property.id, feature_key: 'emergency_contact', feature_value: emergencyContact, is_visible_to_client: true },
            ].filter(item => item.feature_value.trim() !== '');

            if (contextItems.length > 0) await dbService.createPropertyContext(contextItems);

            const utilityItems = utilities
                .filter(u => u.item_name.trim() !== '')
                .map(u => ({ property_id: property.id, item_name: u.item_name, is_essential: u.is_essential }));

            if (utilityItems.length > 0) await dbService.createPropertyUtilities(utilityItems);

            setCreatedPropertyId(property.id);
            setStep(4);
        } catch (err) {
            setError(l.error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectWhatsApp = async () => {
        if (!instanceName.trim()) return;
        setWaStatus('creating');
        setError(null);
        try {
            const { error: createErr } = await supabase.functions.invoke('wa-instance', {
                body: { action: 'create', propertyId: createdPropertyId, instanceName: instanceName.trim() },
            });
            if (createErr) {
                const msg = String(createErr?.message ?? '');
                if (!/already.?exist|already.?in.?use/i.test(msg)) {
                    setWaStatus('error');
                    setError(msg || l.step4.error);
                    return;
                }
                // Instance already exists — proceed to QR (reconnect)
            }

            const { data: qrData, error: qrErr } = await supabase.functions.invoke('wa-instance', {
                body: { action: 'qr', propertyId: createdPropertyId, instanceName: instanceName.trim() },
            });
            if (qrErr) throw qrErr;

            setQrBase64(qrData?.base64 || null);
            setWaStatus('scanning');

            pollRef.current = setInterval(async () => {
                const { data: statusData } = await supabase.functions.invoke('wa-instance', {
                    body: { action: 'status', propertyId: createdPropertyId, instanceName: instanceName.trim() },
                });
                if (statusData?.instance?.state === 'open') {
                    clearInterval(pollRef.current);
                    setWaStatus('connected');
                    // ✅ FIX (was missing): persist wa_display_number after first successful connect
                    supabase.functions.invoke('wa-instance', {
                        body: { action: 'save-number', propertyId: createdPropertyId, instanceName: instanceName.trim() },
                    }).catch((err) => console.warn('save-number failed:', err));
                }
            }, 3000);
        } catch (err) {
            setWaStatus('error');
            setError(err?.message || l.step4.error);
        }
    };

    return (
        <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center px-6 py-12">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-serif font-bold text-brand-dark mb-2">{l.title}</h1>
                    <p className="text-brand-dark/50 text-sm">{l.subtitle}</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-between mb-10">
                    {l.steps.map((label, i) => {
                        const Icon = STEP_ICONS[i];
                        const stepNum = i + 1;
                        return (
                            <React.Fragment key={stepNum}>
                                <div className="flex flex-col items-center gap-2">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                        step >= stepNum
                                            ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                            : 'bg-white border border-brand-primary/10 text-brand-dark/30'
                                    }`}>
                                        {step > stepNum ? <CheckCircle size={20} /> : <Icon size={20} />}
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${
                                        step >= stepNum ? 'text-brand-primary' : 'text-brand-dark/30'
                                    }`}>{label}</span>
                                </div>
                                {i < l.steps.length - 1 && (
                                    <div className={`flex-1 h-[2px] mx-4 rounded-full transition-all ${
                                        step > stepNum ? 'bg-brand-primary' : 'bg-brand-primary/10'
                                    }`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white rounded-[40px] shadow-xl shadow-brand-dark/5 border border-brand-primary/5 p-10">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 mb-6 font-medium">{error}</div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-brand-dark mb-6">{l.step1.title}</h2>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step1.name}</label>
                                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder={l.step1.namePh}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step1.address}</label>
                                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder={l.step1.addressPh}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step1.description}</label>
                                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={l.step1.descriptionPh}
                                          className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step1.checkin}</label>
                                    <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                                           className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step1.checkout}</label>
                                    <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                                           className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-brand-dark mb-6">{l.step2.title}</h2>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step2.wifi}</label>
                                <input type="text" value={wifi} onChange={e => setWifi(e.target.value)} placeholder={l.step2.wifiPh}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step2.rules}</label>
                                <textarea rows={3} value={houseRules} onChange={e => setHouseRules(e.target.value)} placeholder={l.step2.rulesPh}
                                          className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step2.instructions}</label>
                                <textarea rows={3} value={checkInInstructions} onChange={e => setCheckInInstructions(e.target.value)} placeholder={l.step2.instructionsPh}
                                          className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step2.emergency}</label>
                                <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder={l.step2.emergencyPh}
                                       className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand-primary transition-all text-brand-dark" />
                            </div>
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-serif font-bold text-brand-dark mb-6">{l.step3.title}</h2>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {utilities.map((utility, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <input type="text" value={utility.item_name}
                                               onChange={e => updateUtility(index, 'item_name', e.target.value)}
                                               placeholder={l.step3.itemPh}
                                               className="flex-1 bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-all text-brand-dark text-sm" />
                                        <label className="flex items-center gap-2 text-xs font-bold text-brand-dark/60 whitespace-nowrap">
                                            <input type="checkbox" checked={utility.is_essential}
                                                   onChange={e => updateUtility(index, 'is_essential', e.target.checked)}
                                                   className="accent-brand-primary w-4 h-4" />
                                            {l.step3.essential}
                                        </label>
                                        {utilities.length > 1 && (
                                            <button onClick={() => removeUtility(index)}
                                                    className="text-red-400 hover:text-red-600 text-xs font-bold transition-colors">✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={addUtility}
                                    className="w-full border-2 border-dashed border-brand-primary/20 rounded-xl py-3 text-sm font-bold text-brand-primary/60 hover:border-brand-primary/40 hover:text-brand-primary transition-all">
                                {l.step3.add}
                            </button>
                        </div>
                    )}

                    {/* Step 4 — WhatsApp */}
                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
                                    <MessageCircle size={20} className="text-green-600" />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-brand-dark">{l.step4.title}</h2>
                            </div>
                            <p className="text-brand-dark/60 text-sm">{l.step4.desc}</p>

                            {waStatus === 'idle' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-brand-dark uppercase tracking-widest mb-2">{l.step4.instanceLabel}</label>
                                        <div className="w-full bg-brand-light border border-brand-primary/10 rounded-xl px-4 py-4 text-brand-dark font-mono text-sm select-all">
                                            {instanceName || '…'}
                                        </div>
                                    </div>
                                    <button onClick={handleConnectWhatsApp} disabled={!instanceName.trim()}
                                            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-40">
                                        <MessageCircle size={18} /> {l.step4.connect}
                                    </button>
                                </>
                            )}

                            {waStatus === 'creating' && (
                                <div className="flex flex-col items-center gap-4 py-8">
                                    <Loader2 size={32} className="text-brand-primary animate-spin" />
                                    <p className="text-brand-dark/60 text-sm">Creating instance…</p>
                                </div>
                            )}

                            {waStatus === 'scanning' && (
                                <div className="flex flex-col items-center gap-4">
                                    {qrBase64 ? (
                                        <img src={qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`}
                                             alt="WhatsApp QR" className="w-56 h-56 rounded-2xl border border-brand-primary/10" />
                                    ) : (
                                        <div className="w-56 h-56 rounded-2xl bg-brand-light flex items-center justify-center">
                                            <Loader2 size={32} className="text-brand-primary animate-spin" />
                                        </div>
                                    )}
                                    <p className="text-brand-dark/60 text-sm text-center">{l.step4.scanning}</p>
                                </div>
                            )}

                            {waStatus === 'connected' && (
                                <div className="flex flex-col items-center gap-4 py-6">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle size={32} className="text-green-600" />
                                    </div>
                                    <p className="text-green-700 font-bold text-lg">{l.step4.connected}</p>
                                </div>
                            )}

                            {waStatus === 'error' && (
                                <button onClick={() => { setWaStatus('idle'); setError(null); }}
                                        className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-brand-accent transition-all">
                                    {l.step4.connect}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-10">
                        {step > 1 && step < 4 ? (
                            <button onClick={() => setStep(step - 1)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-brand-primary/10 text-brand-dark/60 font-bold text-sm hover:bg-brand-primary/5 transition-all">
                                <ArrowLeft size={16} /> {l.prev}
                            </button>
                        ) : <div />}

                        {step < 3 ? (
                            <button onClick={() => {
                                if (step === 1 && !name.trim()) { setError(l.nameRequired); return; }
                                setError(null);
                                setStep(step + 1);
                            }}
                                    className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20">
                                {l.next} <ArrowRight size={16} />
                            </button>
                        ) : step === 3 ? (
                            <button onClick={handleSubmit} disabled={loading}
                                    className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-60">
                                {loading ? l.saving : l.next} {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                            </button>
                        ) : (
                            // Step 4 — finish button always visible
                            <button onClick={() => navigate('/dashboard')}
                                    className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20">
                                {waStatus === 'connected' ? l.finish : l.step4.skip} <CheckCircle size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingView;
