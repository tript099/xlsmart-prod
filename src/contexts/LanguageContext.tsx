import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'en' | 'id';
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    'platform.title': 'XLSMART',
    'platform.subtitle': 'HR Platform',
    'platform.description': 'Leading Talent Management Platform',
    'platform.tagline': 'Role standardization, AI-powered JD generation, and employee assessment for XL & SMART digital HR transformation',
    'header.badge': 'AI-Powered',
    'header.cta': 'Get Started',

    // Features
    'features.title': 'Platform Features',
    'features.subtitle': 'Comprehensive solutions for modernizing HR operations through AI-driven insights',
    
    'feature.upload.title': 'Bulk Role Upload & Standardization',
    'feature.upload.description': 'Upload XL and SMART role catalogs and auto-map to XLSMART Standard Roles with industry-aligned job families.',
    'feature.upload.badge': 'Core',
    'feature.upload.button': 'Upload Role Catalog',

    'feature.jd.title': 'AI-Powered JD Generator',
    'feature.jd.description': 'Generate job descriptions for every standardized role with in-app chatbot to tweak tone and requirements.',
    'feature.jd.badge': 'AI',

    'feature.assessment.title': 'Employee Skill Assessment',
    'feature.assessment.description': 'Upload XL and SMART employees, match % vs target JD, skill gaps, next role recommendations.',
    'feature.assessment.badge': 'Analytics',

    'feature.chat.title': 'HR AI Assistant',
    'feature.chat.description': 'In-app chatbot for HR/editors to tweak job descriptions and get personalized recommendations.',
    'feature.chat.badge': 'AI',
    'feature.chat.button': 'Open Assistant',

    'feature.mobility.title': 'Employee Mobility & Planning',
    'feature.mobility.description': 'Level fit analysis, rotation/churn risk assessment, and personalized development plans.',
    'feature.mobility.badge': 'Planning',

    'feature.development.title': 'Development Pathways',
    'feature.development.description': 'Personalized development plans with courses, certifications, and projects for career growth.',
    'feature.development.badge': 'Growth',

    // Stats
    'stats.title': 'Dashboard Overview',
    'stats.subtitle': 'Real-time insights for XL & SMART HR transformation',
    'stats.employees': 'Total Employees',
    'stats.roles': 'Standardized Roles',
    'stats.accuracy': 'Mapping Accuracy',
    'stats.skills': 'Skills Identified',

    // CTA
    'cta.title': 'Ready to Transform Your HR?',
    'cta.description': 'Start by uploading XL and SMART role catalogs or explore our AI assistant to see how XLSMART can optimize your talent management processes.',
    'cta.upload': 'Upload Role Catalog',
    'cta.chat': 'Try AI Assistant',

    // Common
    'button.learn_more': 'Learn More',
    'button.close': 'Close',
  },
  id: {
    // Header
    'platform.title': 'XLSMART',
    'platform.subtitle': 'Platform HR',
    'platform.description': 'Platform Manajemen Talenta Terdepan',
    'platform.tagline': 'Standardisasi role, generate JD dengan AI, dan employee assessment untuk transformasi digital HR XL & SMART',
    'header.badge': 'Bertenaga AI',
    'header.cta': 'Mulai Sekarang',

    // Features
    'features.title': 'Fitur Platform',
    'features.subtitle': 'Solusi komprehensif untuk modernisasi operasi HR melalui teknologi AI dan analytics',
    
    'feature.upload.title': 'Bulk Role Upload & Standardization',
    'feature.upload.description': 'Upload XL dan SMART role catalogs dan auto-mapping ke XLSMART Standard Role dengan industry-aligned job families.',
    'feature.upload.badge': 'Core',
    'feature.upload.button': 'Upload Role Catalog',

    'feature.jd.title': 'AI-Powered JD Generator',
    'feature.jd.description': 'Generate job descriptions untuk setiap standardized role dengan in-app chatbot untuk tweak tone dan requirements.',
    'feature.jd.badge': 'AI',

    'feature.assessment.title': 'Employee Skill Assessment',
    'feature.assessment.description': 'Upload XL dan SMART employees, match % vs target JD, skill gaps, next role recommendation.',
    'feature.assessment.badge': 'Analytics',

    'feature.chat.title': 'HR AI Assistant',
    'feature.chat.description': 'In-app chatbot untuk HR/editors tweak job descriptions dan mendapatkan personalized recommendations.',
    'feature.chat.badge': 'AI',
    'feature.chat.button': 'Buka Assistant',

    'feature.mobility.title': 'Employee Mobility & Planning',
    'feature.mobility.description': 'Level fit analysis, rotation/churn risk assessment, dan personalized development plans.',
    'feature.mobility.badge': 'Planning',

    'feature.development.title': 'Development Pathways',
    'feature.development.description': 'Personalized development plan dengan courses, certifications, dan projects untuk career growth.',
    'feature.development.badge': 'Growth',

    // Stats
    'stats.title': 'Dashboard Overview',
    'stats.subtitle': 'Real-time insights transformasi HR XL & SMART',
    'stats.employees': 'Total Karyawan',
    'stats.roles': 'Standardized Roles',
    'stats.accuracy': 'Mapping Accuracy',
    'stats.skills': 'Skills Teridentifikasi',

    // CTA
    'cta.title': 'Siap Transformasi HR Anda?',
    'cta.description': 'Mulai dengan upload role catalog XL dan SMART atau eksplorasi AI assistant untuk melihat bagaimana XLSMART dapat mengoptimalkan proses talent management Anda.',
    'cta.upload': 'Upload Role Catalog',
    'cta.chat': 'Coba AI Assistant',

    // Common
    'button.learn_more': 'Pelajari Lebih Lanjut',
    'button.close': 'Tutup',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'id'>('id');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('xlsmart-language') as 'en' | 'id';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'id' : 'en';
    setLanguage(newLanguage);
    localStorage.setItem('xlsmart-language', newLanguage);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};