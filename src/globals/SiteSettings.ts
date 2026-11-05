import type { GlobalConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { en: 'Site settings', ar: 'إعدادات الموقع' },
  access: { read: () => true, update: adminOnly },
  fields: [
    { name: 'brandName', type: 'text', label: { en: 'Brand name', ar: 'اسم العلامة' }, required: true, defaultValue: 'MIS Department', maxLength: 60 },
    { name: 'tagline', type: 'text', label: { en: 'Tagline', ar: 'الشعار النصي' }, localized: true, maxLength: 120 },
    { name: 'logo', type: 'upload', label: { en: 'Logo', ar: 'الشعار' }, relationTo: 'public-media' },
    {
      name: 'defaultLocale',
      type: 'select',
      label: { en: 'Default language', ar: 'اللغة الافتراضية' },
      options: [
        { label: { en: 'English', ar: 'الإنجليزية' }, value: 'en' },
        { label: { en: 'Arabic', ar: 'العربية' }, value: 'ar' },
      ],
      defaultValue: 'en',
    },
    {
      name: 'accentColor',
      type: 'select',
      label: { en: 'Accent color', ar: 'اللون المميز' },
      options: [
        { label: { en: 'Blue', ar: 'أزرق' }, value: 'blue' },
        { label: { en: 'Cyan', ar: 'سماوي' }, value: 'cyan' },
      ],
      defaultValue: 'blue',
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: { en: 'Contact email', ar: 'بريد التواصل' },
      admin: {
        description: {
          en: 'Shown publicly in the footer once set. Do not use sample addresses.',
          ar: 'يظهر للعامة في التذييل بعد ضبطه. لا تستخدم عناوين تجريبية.',
        },
      },
    },
    { name: 'footerNote', type: 'text', label: { en: 'Footer note', ar: 'ملاحظة التذييل' }, localized: true, maxLength: 160 },
  ],
}
