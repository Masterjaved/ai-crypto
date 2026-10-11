import { useTranslation } from 'react-i18next';
import { GraduationCap, BookOpen, Brain, Shield, TrendingUp, AlertTriangle } from 'lucide-react';

export function LearningCenterPage() {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const topics = [
    {
      titleEn: '1. Technical Indicators Explained',
      titleUr: '1. تکنیکی اشارے (Indicators) کی وضاحت',
      descEn: 'Learn how EMA, RSI, MACD, and Bollinger Bands work mathematically and how they generate confluence.',
      descUr: 'سیکھیں کہ EMA، RSI، MACD، اور بولنجر بینڈز کس طرح ریاضیاتی طور پر کام کرتے ہیں اور ان کے ملاپ سے کیسے سگنل بنتے ہیں۔',
      icon: TrendingUp,
    },
    {
      titleEn: '2. Professional Risk Management',
      titleUr: '2. پیشہ ورانہ رسک مینجمنٹ اور رسک ٹو ریوارڈ',
      descEn: 'Understand the mathematical necessity of 1:2+ Risk:Reward and why preserving demo capital is the #1 priority.',
      descUr: 'سمجھیں کہ 1:2+ رسک ٹو ریوارڈ کیوں ضروری ہے اور سرمائے کا تحفظ کس طرح سب سے پہلی ترجیح ہے۔',
      icon: Shield,
    },
    {
      titleEn: '3. Market Structure & Candlestick Anatomy',
      titleUr: '3. مارکیٹ کا ڈھانچہ اور کینڈل اسٹک کے اصول',
      descEn: 'Master support, resistance, swing highs/lows, and recognizing confirmed versus unconfirmed candle closes.',
      descUr: 'سپورٹ، مزاحمت، سوئنگ ہائی اور لو، اور مکمل کینڈل کلوز کے بعد درست فیصلہ لینے کی مہارت۔',
      icon: Brain,
    },
    {
      titleEn: '4. Avoiding Trading Biases & Emotional Errors',
      titleUr: '4. نفسیاتی غلطیوں اور جلد بازی سے بچاؤ',
      descEn: 'Why chasing green candles leads to losses, and how systematic rule-based execution eliminates FOMO.',
      descUr: 'کیوں FOMO اور جلد بازی میں خریداری نقصان کا باعث بنتی ہے اور منظم حکمت عملی کس طرح مدد کرتی ہے۔',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-[#00d4aa]" />
          {t('nav.learning')}
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          {isUrdu
            ? 'کرپٹو ٹریڈنگ، تکنیکی تجزیہ اور رسک مینجمنٹ کا جامع تعلیمی گائیڈ'
            : 'Comprehensive educational curriculum on quantitative crypto trading and capital preservation.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {topics.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div key={idx} className="card p-5 space-y-3 hover:border-[#00d4aa]/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center text-[#00d4aa]">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-base text-white">
                  {isUrdu ? t.titleUr : t.titleEn}
                </h2>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                {isUrdu ? t.descUr : t.descEn}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
