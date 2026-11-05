import type { Locale } from './catalog'
const en = {
  tagline:'Operational Intelligence, Real Impact.',
  intro:'MIS Department connects real-time monitoring, quality, and executive reporting to help operations move with confidence.',
  servicesTitle:'Our core services', servicesIntro:'Three capabilities. One clearer way to operate.',
  projectsTitle:'Selected projects', projectsIntro:'Explore the challenges, solutions and capabilities behind our work.',
  impactTitle:'Making operational complexity useful.', impactIntro:'Visibility. Process consistency. Faster understanding. Better decisions.',
  explore:'Explore our work ↗', services:'Services', projects:'Projects', about:'About', impact:'Impact', home:'Home', preview:'Demo concept — illustrative content only',
  case:'Case Study', challenge:'The challenge', solution:'Our approach', value:'Delivered value', notFound:'Project not found', noResults:'No matching projects', all:'All projects',
  approachTitle:'From data to direction', approachDesc:'Collect → Validate → Analyze → Present → Improve', contact:'Request a presentation', back:'Back to projects',
}
const ar: typeof en = {
  tagline:'ذكاء تشغيلي وأثر واضح.', intro:'يجمع قسم MIS بين المراقبة اللحظية والجودة والتقارير التنفيذية لدعم تشغيل أكثر وضوحًا وثقة.',
  servicesTitle:'خدماتنا الأساسية', servicesIntro:'ثلاث قدرات مترابطة لتشغيل أوضح.', projectsTitle:'مشاريع مختارة', projectsIntro:'اكتشف التحديات والحلول والقدرات وراء أعمالنا.',
  impactTitle:'نحوّل التعقيد التشغيلي إلى قيمة.', impactIntro:'رؤية واضحة. عمليات أكثر اتساقًا. فهم أسرع. قرارات أفضل.',
  explore:'استكشف أعمالنا ↗', services:'الخدمات', projects:'المشاريع', about:'عن القسم', impact:'الأثر', home:'الرئيسية', preview:'محتوى توضيحي فقط — ليس بيانات أداء حقيقية',
  case:'دراسة حالة', challenge:'التحدي', solution:'طريقتنا', value:'القيمة المقدمة', notFound:'المشروع غير موجود', noResults:'لا توجد مشاريع مطابقة', all:'كل المشاريع',
  approachTitle:'من البيانات إلى القرار', approachDesc:'جمع ← تحقق ← تحليل ← عرض ← تحسين', contact:'طلب عرض تقديمي', back:'العودة للمشاريع',
}
export const copy = (locale: Locale) => locale === 'ar' ? ar : en
