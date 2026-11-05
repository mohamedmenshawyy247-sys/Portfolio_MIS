import type { CollectionConfig } from 'payload'
import { adminOnly } from '../lib/access'

export const Leads: CollectionConfig = {
  slug: 'leads',
  labels: { singular: { en: 'Lead', ar: 'طلب تواصل' }, plural: { en: 'Leads', ar: 'طلبات التواصل' } },
  admin: { useAsTitle: 'email' },
  access: { create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'name', type: 'text', label: { en: 'Name', ar: 'الاسم' }, required: true, maxLength: 100 },
    { name: 'email', type: 'email', label: { en: 'Email', ar: 'البريد الإلكتروني' }, required: true },
    { name: 'company', type: 'text', label: { en: 'Company', ar: 'الشركة' }, maxLength: 150 },
    { name: 'message', type: 'textarea', label: { en: 'Message', ar: 'الرسالة' }, required: true, maxLength: 2000 },
    {
      name: 'status',
      type: 'select',
      label: { en: 'Status', ar: 'الحالة' },
      options: [
        { label: { en: 'New', ar: 'جديد' }, value: 'new' },
        { label: { en: 'Reviewing', ar: 'قيد المراجعة' }, value: 'reviewing' },
        { label: { en: 'Closed', ar: 'مغلق' }, value: 'closed' },
      ],
      defaultValue: 'new',
    },
  ],
}
