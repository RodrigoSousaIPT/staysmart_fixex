import React, { useEffect } from 'react';
import { X, Upload, MessageSquare, Zap, CheckCircle, Star } from 'lucide-react';

const CONTENT = {
  PT: {
    title: 'Como funciona o StaySmart',
    subtitle: 'Do upload ao hóspede satisfeito — em 4 passos simples',
    steps: [
      { number: '01', icon: Upload, title: 'Carregue o manual da sua casa', summary: 'Faça upload de um PDF ou documento com todas as informações do seu imóvel.', details: ['WiFi, código da fechadura, instruções de electrodomésticos', 'Regras da casa, horários de check-in e check-out', 'Recomendações de restaurantes, transportes e atrações locais', 'Contactos de emergência e prestadores de serviços', 'O StaySmart converte tudo em vetores de conhecimento com tecnologia RAG'] },
      { number: '02', icon: MessageSquare, title: 'O hóspede pergunta via WhatsApp', summary: 'Sem apps para instalar. O hóspede usa o WhatsApp que já tem no telemóvel.', details: ['O hóspede recebe um número de WhatsApp dedicado à propriedade', 'Pode perguntar qualquer coisa a qualquer hora, incluindo de madrugada', 'Suporta texto, áudio e imagens enviadas pelo hóspede', 'A conversa é natural, como falar com uma pessoa real', 'Funciona em qualquer idioma — a IA detecta e responde na língua do hóspede'] },
      { number: '03', icon: Zap, title: 'A IA processa e responde em segundos', summary: 'O motor de IA consulta o manual da sua propriedade e gera uma resposta precisa.', details: ['Tempo de resposta médio inferior a 3 segundos', 'Respostas baseadas exclusivamente no manual da sua propriedade', 'Sem invenções nem "alucinações" — só informação que forneceu', 'Controla dispositivos smart home via comandos de chat (luzes, AC, etc.)', 'Notifica o proprietário em casos que precisam de intervenção humana'] },
      { number: '04', icon: Star, title: 'Hóspede satisfeito, mais avaliações 5 estrelas', summary: 'Respostas instantâneas 24/7 traduzem-se diretamente em melhores avaliações.', details: ['Proprietários StaySmart reportam aumento médio de 0,6 estrelas no Airbnb', 'Redução de 80% nas mensagens repetidas para o proprietário', 'O dashboard mostra todas as conversas e pedidos dos hóspedes', 'Relatórios mensais com as perguntas mais frequentes', 'Sugestões automáticas para melhorar o manual com base nas dúvidas reais'] },
    ],
    close: 'Fechar',
    cta: 'Começar gratuitamente',
  },
  EN: {
    title: 'How StaySmart works',
    subtitle: 'From upload to happy guest — in 4 simple steps',
    steps: [
      { number: '01', icon: Upload, title: 'Upload your house manual', summary: 'Upload a PDF or document with all the information about your property.', details: ['WiFi, lock code, appliance instructions', 'House rules, check-in and check-out times', 'Restaurant, transport and local attraction recommendations', 'Emergency contacts and service providers', 'StaySmart converts everything into knowledge vectors using RAG technology'] },
      { number: '02', icon: MessageSquare, title: 'Guest asks via WhatsApp', summary: 'No apps to install. The guest uses the WhatsApp already on their phone.', details: ['The guest receives a WhatsApp number dedicated to the property', 'Can ask anything at any time, including the middle of the night', 'Supports text, audio and images sent by the guest', 'The conversation feels natural, like talking to a real person', "Works in any language — AI detects and replies in the guest's language"] },
      { number: '03', icon: Zap, title: 'AI processes and responds in seconds', summary: 'The AI engine consults your property manual and generates a precise answer.', details: ['Average response time under 3 seconds', 'Answers based exclusively on your property manual', 'No hallucinations — only information you provided', 'Controls smart home devices via chat commands (lights, AC, etc.)', 'Notifies the owner in cases requiring human intervention'] },
      { number: '04', icon: Star, title: 'Happy guest, more 5-star reviews', summary: 'Instant 24/7 responses translate directly into better ratings.', details: ['StaySmart owners report an average 0.6-star increase on Airbnb', '80% reduction in repetitive messages to the owner', 'Dashboard shows all guest conversations and requests', 'Monthly reports with the most frequently asked questions', 'Automatic suggestions to improve the manual based on real guest questions'] },
    ],
    close: 'Close',
    cta: 'Start for free',
  },
  DE: {
    title: 'Wie StaySmart funktioniert',
    subtitle: 'Vom Upload zum zufriedenen Gast — in 4 einfachen Schritten',
    steps: [
      { number: '01', icon: Upload, title: 'Laden Sie Ihr Haushandbuch hoch', summary: 'Laden Sie ein PDF oder Dokument mit allen Informationen zu Ihrer Immobilie hoch.', details: ['WLAN, Türcode, Gerätebedienungsanleitungen', 'Hausregeln, Check-in- und Check-out-Zeiten', 'Empfehlungen für Restaurants, Verkehrsmittel und lokale Attraktionen', 'Notfallkontakte und Dienstleister', 'StaySmart konvertiert alles in Wissensvektoren mit RAG-Technologie'] },
      { number: '02', icon: MessageSquare, title: 'Gast fragt per WhatsApp', summary: 'Keine App-Installation nötig. Der Gast nutzt das bereits installierte WhatsApp.', details: ['Der Gast erhält eine WhatsApp-Nummer speziell für die Unterkunft', 'Kann jederzeit fragen, auch mitten in der Nacht', 'Unterstützt Text, Audio und Bilder vom Gast', 'Die Konversation fühlt sich natürlich an, wie mit einer echten Person', 'Funktioniert in jeder Sprache — KI erkennt und antwortet in der Sprache des Gastes'] },
      { number: '03', icon: Zap, title: 'KI verarbeitet und antwortet in Sekunden', summary: 'Die KI-Engine konsultiert Ihr Immobilienhandbuch und generiert eine präzise Antwort.', details: ['Durchschnittliche Antwortzeit unter 3 Sekunden', 'Antworten ausschließlich auf Basis Ihres Immobilienhandbuchs', 'Keine Halluzinationen — nur Informationen, die Sie bereitgestellt haben', 'Steuert Smart-Home-Geräte per Chat-Befehlen (Lichter, Klimaanlage, etc.)', 'Benachrichtigt den Eigentümer bei Fällen, die menschliches Eingreifen erfordern'] },
      { number: '04', icon: Star, title: 'Zufriedener Gast, mehr 5-Sterne-Bewertungen', summary: 'Sofortige 24/7-Antworten führen direkt zu besseren Bewertungen.', details: ['StaySmart-Eigentümer berichten von durchschnittlich 0,6 mehr Sternen auf Airbnb', '80% weniger wiederholte Nachrichten an den Eigentümer', 'Dashboard zeigt alle Gästegespräche und Anfragen', 'Monatliche Berichte mit den häufigsten Fragen', 'Automatische Verbesserungsvorschläge für das Handbuch'] },
    ],
    close: 'Schließen',
    cta: 'Kostenlos starten',
  },
  FR: {
    title: 'Comment fonctionne StaySmart',
    subtitle: "Du téléchargement à l'hôte satisfait — en 4 étapes simples",
    steps: [
      { number: '01', icon: Upload, title: 'Téléchargez le manuel de votre maison', summary: 'Téléchargez un PDF ou un document avec toutes les informations sur votre bien.', details: ['WiFi, code de serrure, instructions des appareils', "Règles de la maison, horaires d'arrivée et de départ", 'Recommandations de restaurants, transports et attractions locales', "Contacts d'urgence et prestataires de services", "StaySmart convertit tout en vecteurs de connaissance avec la technologie RAG"] },
      { number: '02', icon: MessageSquare, title: "L'hôte pose une question via WhatsApp", summary: "Aucune application à installer. L'hôte utilise le WhatsApp déjà sur son téléphone.", details: ["L'hôte reçoit un numéro WhatsApp dédié à la propriété", "Peut poser n'importe quelle question à n'importe quelle heure", "Supporte le texte, l'audio et les images envoyés par l'hôte", 'La conversation est naturelle, comme parler à une vraie personne', "Fonctionne dans n'importe quelle langue — l'IA détecte et répond dans la langue de l'hôte"] },
      { number: '03', icon: Zap, title: "L'IA traite et répond en quelques secondes", summary: "Le moteur IA consulte le manuel de votre propriété et génère une réponse précise.", details: ['Temps de réponse moyen inférieur à 3 secondes', 'Réponses basées exclusivement sur le manuel de votre propriété', "Sans hallucinations — uniquement les informations que vous avez fournies", 'Contrôle les appareils domotiques via des commandes de chat', "Notifie le propriétaire dans les cas nécessitant une intervention humaine"] },
      { number: '04', icon: Star, title: "Hôte satisfait, plus d'avis 5 étoiles", summary: 'Les réponses instantanées 24/7 se traduisent directement par de meilleures évaluations.', details: ["Les propriétaires StaySmart rapportent une augmentation moyenne de 0,6 étoile sur Airbnb", '80% de réduction des messages répétitifs au propriétaire', 'Le tableau de bord affiche toutes les conversations et demandes des hôtes', 'Rapports mensuels avec les questions les plus fréquentes', 'Suggestions automatiques pour améliorer le manuel'] },
    ],
    close: 'Fermer',
    cta: 'Commencer gratuitement',
  },
  ES: {
    title: 'Cómo funciona StaySmart',
    subtitle: 'De la subida al huésped satisfecho — en 4 pasos simples',
    steps: [
      { number: '01', icon: Upload, title: 'Sube el manual de tu casa', summary: 'Sube un PDF o documento con toda la información de tu propiedad.', details: ['WiFi, código de cerradura, instrucciones de electrodomésticos', 'Reglas de la casa, horarios de check-in y check-out', 'Recomendaciones de restaurantes, transportes y atracciones locales', 'Contactos de emergencia y proveedores de servicios', 'StaySmart convierte todo en vectores de conocimiento con tecnología RAG'] },
      { number: '02', icon: MessageSquare, title: 'El huésped pregunta por WhatsApp', summary: 'Sin apps que instalar. El huésped usa el WhatsApp que ya tiene en su móvil.', details: ['El huésped recibe un número de WhatsApp dedicado a la propiedad', 'Puede preguntar cualquier cosa a cualquier hora, incluso de madrugada', 'Soporta texto, audio e imágenes enviados por el huésped', 'La conversación es natural, como hablar con una persona real', 'Funciona en cualquier idioma — la IA detecta y responde en la lengua del huésped'] },
      { number: '03', icon: Zap, title: 'La IA procesa y responde en segundos', summary: 'El motor de IA consulta el manual de tu propiedad y genera una respuesta precisa.', details: ['Tiempo de respuesta medio inferior a 3 segundos', 'Respuestas basadas exclusivamente en el manual de tu propiedad', 'Sin alucinaciones — solo información que proporcionaste', 'Controla dispositivos del hogar inteligente via comandos de chat', 'Notifica al propietario en casos que requieren intervención humana'] },
      { number: '04', icon: Star, title: 'Huésped satisfecho, más reseñas de 5 estrellas', summary: 'Las respuestas instantáneas 24/7 se traducen directamente en mejores valoraciones.', details: ['Los propietarios de StaySmart reportan un aumento medio de 0,6 estrellas en Airbnb', '80% de reducción en mensajes repetidos al propietario', 'El panel muestra todas las conversaciones y solicitudes de los huéspedes', 'Informes mensuales con las preguntas más frecuentes', 'Sugerencias automáticas para mejorar el manual basadas en dudas reales'] },
    ],
    close: 'Cerrar',
    cta: 'Empezar gratis',
  },
  ZH: {
    title: 'StaySmart 如何工作',
    subtitle: '从上传到满意房客 — 仅需4个简单步骤',
    steps: [
      { number: '01', icon: Upload, title: '上传您的房屋手册', summary: '上传包含您物业所有信息的 PDF 或文档。', details: ['WiFi、门锁密码、家电使用说明', '房屋规则、入住和退房时间', '餐厅、交通和当地景点推荐', '紧急联系人和服务提供商', 'StaySmart 使用 RAG 技术将一切转换为知识向量'] },
      { number: '02', icon: MessageSquare, title: '房客通过 WhatsApp 提问', summary: '无需安装任何应用。房客使用手机上已有的 WhatsApp。', details: ['房客收到专属于该物业的 WhatsApp 号码', '可随时提问，包括深夜', '支持房客发送的文字、音频和图片', '对话自然，就像与真人交谈', 'AI 能检测并以房客的语言回复'] },
      { number: '03', icon: Zap, title: 'AI 在几秒内处理并回复', summary: 'AI 引擎查阅您的物业手册并生成精准答案。', details: ['平均响应时间不到3秒', '回答完全基于您的物业手册', '无幻觉 — 只提供您提供的信息', '通过聊天命令控制智能家居设备', '在需要人工干预的情况下通知业主'] },
      { number: '04', icon: Star, title: '满意房客，更多5星好评', summary: '24/7 即时响应直接转化为更好的评分。', details: ['StaySmart 业主平均 Airbnb 评分提高0.6星', '对业主的重复消息减少80%', '控制台显示所有房客对话和请求', '包含最常见问题的月度报告', '根据实际房客问题自动提供改进手册的建议'] },
    ],
    close: '关闭',
    cta: '免费开始',
  },
  AR: {
    title: 'كيف يعمل StaySmart',
    subtitle: 'من الرفع إلى الضيف الراضي — في 4 خطوات بسيطة',
    steps: [
      { number: '01', icon: Upload, title: 'ارفع دليل منزلك', summary: 'ارفع ملف PDF أو مستنداً يحتوي على جميع معلومات عقارك.', details: ['WiFi، رمز القفل، تعليمات الأجهزة', 'قواعد المنزل، مواعيد تسجيل الوصول والمغادرة', 'توصيات المطاعم والمواصلات والمعالم المحلية', 'جهات الاتصال للطوارئ ومزودي الخدمات', 'يحول StaySmart كل شيء إلى متجهات معرفية بتقنية RAG'] },
      { number: '02', icon: MessageSquare, title: 'الضيف يسأل عبر WhatsApp', summary: 'لا حاجة لتثبيت أي تطبيق. الضيف يستخدم WhatsApp الموجود بالفعل على هاتفه.', details: ['الضيف يتلقى رقم WhatsApp مخصصاً للعقار', 'يمكنه السؤال في أي وقت، حتى منتصف الليل', 'يدعم النصوص والمقاطع الصوتية والصور التي يرسلها الضيف', 'المحادثة طبيعية، كالحديث مع شخص حقيقي', 'يعمل بأي لغة — AI يكتشف ويرد بلغة الضيف'] },
      { number: '03', icon: Zap, title: 'AI يعالج ويرد في ثوانٍ', summary: 'محرك الذكاء الاصطناعي يراجع دليل عقارك ويولد إجابة دقيقة.', details: ['متوسط وقت الاستجابة أقل من 3 ثوانٍ', 'إجابات مبنية حصراً على دليل عقارك', 'بدون هلوسة — فقط المعلومات التي قدمتها', 'يتحكم في أجهزة المنزل الذكي عبر أوامر الدردشة', 'يُنبّه المالك في الحالات التي تتطلب تدخلاً بشرياً'] },
      { number: '04', icon: Star, title: 'ضيف سعيد، تقييمات 5 نجوم أكثر', summary: 'الردود الفورية 24/7 تترجم مباشرة إلى تقييمات أفضل.', details: ['يُفيد أصحاب StaySmart بزيادة متوسطة 0.6 نجمة على Airbnb', 'تقليل 80% في الرسائل المتكررة للمالك', 'تعرض لوحة التحكم جميع محادثات وطلبات الضيوف', 'تقارير شهرية تضم الأسئلة الأكثر تكراراً', 'اقتراحات تلقائية لتحسين الدليل بناءً على الأسئلة الحقيقية'] },
    ],
    close: 'إغلاق',
    cta: 'ابدأ مجاناً',
  },
  RU: {
    title: 'Как работает StaySmart',
    subtitle: 'От загрузки до довольного гостя — за 4 простых шага',
    steps: [
      { number: '01', icon: Upload, title: 'Загрузите руководство по дому', summary: 'Загрузите PDF или документ со всей информацией о вашей недвижимости.', details: ['WiFi, код замка, инструкции по бытовой технике', 'Правила дома, время заезда и выезда', 'Рекомендации ресторанов, транспорта и местных достопримечательностей', 'Контакты экстренных служб и поставщиков услуг', 'StaySmart конвертирует всё в векторы знаний с помощью технологии RAG'] },
      { number: '02', icon: MessageSquare, title: 'Гость спрашивает через WhatsApp', summary: 'Никаких приложений для установки. Гость использует уже имеющийся WhatsApp.', details: ['Гость получает номер WhatsApp, выделенный для объекта', 'Может спрашивать что угодно в любое время, даже ночью', 'Поддерживает текст, аудио и изображения от гостя', 'Общение естественное, как с реальным человеком', 'Работает на любом языке — ИИ определяет и отвечает на языке гостя'] },
      { number: '03', icon: Zap, title: 'ИИ обрабатывает и отвечает за секунды', summary: 'Движок ИИ обращается к руководству вашей недвижимости и генерирует точный ответ.', details: ['Среднее время ответа менее 3 секунд', 'Ответы основаны исключительно на руководстве вашей недвижимости', 'Без галлюцинаций — только информация, которую вы предоставили', 'Управляет устройствами умного дома через команды в чате', 'Уведомляет владельца в случаях, требующих вмешательства человека'] },
      { number: '04', icon: Star, title: 'Довольный гость, больше отзывов на 5 звёзд', summary: 'Мгновенные ответы 24/7 напрямую ведут к лучшим оценкам.', details: ['Владельцы StaySmart сообщают о среднем увеличении рейтинга на 0,6 звезды на Airbnb', '80% сокращение повторяющихся сообщений владельцу', 'Панель управления показывает все разговоры и запросы гостей', 'Ежемесячные отчёты с наиболее частыми вопросами', 'Автоматические предложения по улучшению руководства'] },
    ],
    close: 'Закрыть',
    cta: 'Начать бесплатно',
  },
  HI: {
    title: 'StaySmart कैसे काम करता है',
    subtitle: 'अपलोड से संतुष्ट अतिथि तक — 4 सरल चरणों में',
    steps: [
      { number: '01', icon: Upload, title: 'अपने घर का मैनुअल अपलोड करें', summary: 'अपनी संपत्ति की सभी जानकारी वाला PDF या दस्तावेज़ अपलोड करें।', details: ['WiFi, ताला कोड, उपकरण निर्देश', 'घर के नियम, चेक-इन और चेक-आउट का समय', 'रेस्तरां, परिवहन और स्थानीय आकर्षण की सिफारिशें', 'आपातकालीन संपर्क और सेवा प्रदाता', 'StaySmart RAG तकनीक का उपयोग करके सब कुछ ज्ञान वैक्टर में परिवर्तित करता है'] },
      { number: '02', icon: MessageSquare, title: 'अतिथि WhatsApp के माध्यम से पूछता है', summary: 'कोई ऐप इंस्टॉल नहीं करना है। अतिथि अपने फ़ोन पर पहले से मौजूद WhatsApp का उपयोग करता है।', details: ['अतिथि को संपत्ति के लिए समर्पित WhatsApp नंबर मिलता है', 'किसी भी समय कुछ भी पूछ सकता है, यहां तक कि आधी रात को भी', 'अतिथि द्वारा भेजे गए टेक्स्ट, ऑडियो और इमेज का समर्थन करता है', 'बातचीत स्वाभाविक है, असली व्यक्ति से बात करने जैसी', 'किसी भी भाषा में काम करता है — AI अतिथि की भाषा में पता लगाता और जवाब देता है'] },
      { number: '03', icon: Zap, title: 'AI सेकंडों में संसाधित और प्रतिक्रिया देता है', summary: 'AI इंजन आपकी संपत्ति की मैनुअल से परामर्श करता है और सटीक उत्तर उत्पन्न करता है।', details: ['औसत प्रतिक्रिया समय 3 सेकंड से कम', 'विशेष रूप से आपकी संपत्ति की मैनुअल पर आधारित उत्तर', 'कोई भ्रम नहीं — केवल वही जानकारी जो आपने प्रदान की', 'चैट कमांड के माध्यम से स्मार्ट होम डिवाइस को नियंत्रित करता है', 'मानवीय हस्तक्षेप की आवश्यकता वाले मामलों में मालिक को सूचित करता है'] },
      { number: '04', icon: Star, title: 'खुश अतिथि, अधिक 5-स्टार समीक्षाएं', summary: '24/7 तत्काल प्रतिक्रियाएं सीधे बेहतर रेटिंग में बदल जाती हैं।', details: ['StaySmart मालिक Airbnb पर औसतन 0.6 स्टार की वृद्धि की रिपोर्ट करते हैं', 'मालिक के लिए दोहराव वाले संदेशों में 80% कमी', 'डैशबोर्ड सभी अतिथि वार्तालाप और अनुरोध दिखाता है', 'सबसे अधिक पूछे जाने वाले प्रश्नों के साथ मासिक रिपोर्ट', 'वास्तविक अतिथि प्रश्नों के आधार पर मैनुअल को बेहतर बनाने के स्वचालित सुझाव'] },
    ],
    close: 'बंद करें',
    cta: 'मुफ्त शुरू करें',
  },
  BN: {
    title: 'StaySmart কীভাবে কাজ করে',
    subtitle: 'আপলোড থেকে সন্তুষ্ট অতিথি পর্যন্ত — ৪টি সহজ ধাপে',
    steps: [
      { number: '01', icon: Upload, title: 'আপনার বাড়ির ম্যানুয়াল আপলোড করুন', summary: 'আপনার সম্পত্তির সমস্ত তথ্য সহ একটি PDF বা নথি আপলোড করুন।', details: ['WiFi, লক কোড, যন্ত্রপাতির নির্দেশাবলী', 'বাড়ির নিয়ম, চেক-ইন এবং চেক-আউটের সময়', 'রেস্তোরাঁ, পরিবহন এবং স্থানীয় আকর্ষণের সুপারিশ', 'জরুরী যোগাযোগ এবং সেবা প্রদানকারী', 'StaySmart RAG প্রযুক্তি ব্যবহার করে সবকিছুকে জ্ঞান ভেক্টরে রূপান্তর করে'] },
      { number: '02', icon: MessageSquare, title: 'অতিথি WhatsApp এর মাধ্যমে জিজ্ঞাসা করেন', summary: 'কোনো অ্যাপ ইনস্টল করার প্রয়োজন নেই। অতিথি তার ফোনে ইতিমধ্যে থাকা WhatsApp ব্যবহার করেন।', details: ['অতিথি সম্পত্তির জন্য নিবেদিত একটি WhatsApp নম্বর পান', 'যে কোনো সময় যে কোনো কিছু জিজ্ঞাসা করতে পারেন, এমনকি মাঝরাতেও', 'অতিথি দ্বারা পাঠানো টেক্সট, অডিও এবং ছবি সমর্থন করে', 'কথোপকথন স্বাভাবিক, প্রকৃত ব্যক্তির সাথে কথা বলার মতো', 'যে কোনো ভাষায় কাজ করে — AI অতিথির ভাষা সনাক্ত করে এবং উত্তর দেয়'] },
      { number: '03', icon: Zap, title: 'AI সেকেন্ডের মধ্যে প্রক্রিয়া করে এবং প্রতিক্রিয়া দেয়', summary: 'AI ইঞ্জিন আপনার সম্পত্তির ম্যানুয়াল পরামর্শ করে এবং একটি সুনির্দিষ্ট উত্তর তৈরি করে।', details: ['গড় প্রতিক্রিয়া সময় ৩ সেকেন্ডের কম', 'একচেটিয়াভাবে আপনার সম্পত্তির ম্যানুয়ালের উপর ভিত্তি করে উত্তর', 'কোনো হ্যালুসিনেশন নেই — শুধু আপনার প্রদত্ত তথ্য', 'চ্যাট কমান্ডের মাধ্যমে স্মার্ট হোম ডিভাইস নিয়ন্ত্রণ করে', 'মানবিক হস্তক্ষেপ প্রয়োজন এমন ক্ষেত্রে মালিককে অবহিত করে'] },
      { number: '04', icon: Star, title: 'সন্তুষ্ট অতিথি, আরও ৫-তারকা রিভিউ', summary: '২৪/৭ তাত্ক্ষণিক প্রতিক্রিয়া সরাসরি ভাল রেটিংয়ে রূপান্তরিত হয়।', details: ['StaySmart মালিকরা Airbnb-এ গড়ে ০.৬-তারকা বৃদ্ধির রিপোর্ট করেন', 'মালিকের কাছে পুনরাবৃত্ত বার্তায় ৮০% হ্রাস', 'ড্যাশবোর্ড সমস্ত অতিথি কথোপকথন এবং অনুরোধ দেখায়', 'সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্ন সহ মাসিক রিপোর্ট', 'প্রকৃত অতিথি প্রশ্নের ভিত্তিতে ম্যানুয়াল উন্নত করার স্বয়ংক্রিয় পরামর্শ'] },
    ],
    close: 'বন্ধ করুন',
    cta: 'বিনামূল্যে শুরু করুন',
  },
  UR: {
    title: 'StaySmart کیسے کام کرتا ہے',
    subtitle: 'اپ لوڈ سے مطمئن مہمان تک — 4 آسان مراحل میں',
    steps: [
      { number: '01', icon: Upload, title: 'اپنے گھر کا دستی کتابچہ اپ لوڈ کریں', summary: 'اپنی پراپرٹی کی تمام معلومات پر مشتمل PDF یا دستاویز اپ لوڈ کریں۔', details: ['WiFi، تالے کا کوڈ، آلات کی ہدایات', 'گھر کے قوانین، چیک ان اور چیک آؤٹ کے اوقات', 'ریستوران، نقل و حمل اور مقامی پرکشش مقامات کی سفارشات', 'ایمرجنسی رابطے اور خدمات فراہم کرنے والے', 'StaySmart RAG ٹیکنالوجی استعمال کر کے ہر چیز کو علم کے ویکٹرز میں تبدیل کرتا ہے'] },
      { number: '02', icon: MessageSquare, title: 'مہمان WhatsApp کے ذریعے سوال کرتا ہے', summary: 'کوئی ایپ انسٹال کرنے کی ضرورت نہیں۔ مہمان اپنے فون پر پہلے سے موجود WhatsApp استعمال کرتا ہے۔', details: ['مہمان کو پراپرٹی کے لیے مخصوص WhatsApp نمبر ملتا ہے', 'کسی بھی وقت کچھ بھی پوچھ سکتا ہے، آدھی رات کو بھی', 'مہمان کے بھیجے گئے ٹیکسٹ، آڈیو اور تصاویر کو سپورٹ کرتا ہے', 'گفتگو قدرتی ہے، حقیقی شخص سے بات کرنے کی طرح', 'کسی بھی زبان میں کام کرتا ہے — AI مہمان کی زبان کا پتہ لگاتا اور جواب دیتا ہے'] },
      { number: '03', icon: Zap, title: 'AI سیکنڈز میں پروسیس اور جواب دیتا ہے', summary: 'AI انجن آپ کی پراپرٹی کے دستی کتابچے سے مشورہ کرتا ہے اور درست جواب پیدا کرتا ہے۔', details: ['اوسط جوابی وقت 3 سیکنڈ سے کم', 'صرف آپ کی پراپرٹی کے دستی کتابچے کی بنیاد پر جوابات', 'کوئی ہیلوسینیشن نہیں — صرف وہ معلومات جو آپ نے فراہم کی ہیں', 'چیٹ کمانڈز کے ذریعے سمارٹ ہوم ڈیوائسز کو کنٹرول کرتا ہے', 'انسانی مداخلت کی ضرورت والے معاملات میں مالک کو اطلاع دیتا ہے'] },
      { number: '04', icon: Star, title: 'مطمئن مہمان، زیادہ 5 ستاروں والے جائزے', summary: '24/7 فوری جوابات براہ راست بہتر درجہ بندیوں میں تبدیل ہوتے ہیں۔', details: ['StaySmart مالکان Airbnb پر اوسطاً 0.6 ستاروں کے اضافے کی اطلاع دیتے ہیں', 'مالک کو دہرائے جانے والے پیغامات میں 80% کمی', 'ڈیش بورڈ تمام مہمانوں کی گفتگو اور درخواستیں دکھاتا ہے', 'سب سے زیادہ پوچھے جانے والے سوالات کے ساتھ ماہانہ رپورٹس', 'حقیقی مہمان سوالات کی بنیاد پر دستی کتابچے کو بہتر بنانے کے خودکار مشورے'] },
    ],
    close: 'بند کریں',
    cta: 'مفت شروع کریں',
  },
};

const HowItWorksModal = ({ open, onClose, lang, onSignupOpen }) => {
  const c = CONTENT[lang] || CONTENT.PT;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-brand-dark/70 backdrop-blur-sm" />

      <div
        className="relative bg-brand-light rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-light/95 backdrop-blur-sm px-10 pt-10 pb-6 border-b border-brand-primary/10 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-brand-primary/10 text-brand-dark/50 hover:text-brand-dark transition-all"
          >
            <X size={20} />
          </button>
          <h2 className="text-3xl font-serif font-bold text-brand-dark pr-8">{c.title}</h2>
          <p className="text-brand-dark/50 text-sm mt-1">{c.subtitle}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
          {c.steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="flex gap-6">
                <div className="flex flex-col items-center shrink-0">
                  <div className="bg-brand-primary/10 text-brand-primary p-3 rounded-2xl">
                    <Icon size={24} />
                  </div>
                  <div className="w-px flex-1 bg-brand-primary/10 mt-3" />
                </div>

                <div className="pb-8">
                  <div className="text-xs font-bold text-brand-primary/50 uppercase tracking-widest mb-1">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brand-dark mb-2">{step.title}</h3>
                  <p className="text-brand-dark/60 text-sm mb-4 leading-relaxed">{step.summary}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-brand-dark/70">
                        <CheckCircle size={15} className="text-brand-primary shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-brand-light/95 backdrop-blur-sm px-10 py-6 border-t border-brand-primary/10 shrink-0">
          <button
            onClick={() => { onClose(); onSignupOpen(); }}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-base hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20"
          >
            {c.cta}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
