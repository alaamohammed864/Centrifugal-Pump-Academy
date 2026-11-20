import type { WorkspaceTab } from '../components/DashboardHome';
import type { Lesson } from '../types/academy';

export const PRODUCTION_ORIGIN =
  'https://ais-pre-k7mnlqvcsqc3hakxwv5y5q-711537037381.europe-west2.run.app';
export const OG_IMAGE_PATH = '/assets/og-pump-academy-1200x630.jpg';
export const SITE_NAME = 'أكاديمية مضخات الطرد المركزي | Centrifugal Pump Academy';

export const VALID_WORKSPACE_TABS: readonly WorkspaceTab[] = [
  'home',
  'lessons',
  'lab3d',
  'simulator',
  'curves',
  'troubleshooting',
  'exams',
  'maintenance',
  'tools',
];

export interface RouteResolution {
  tab: WorkspaceTab;
  lessonId?: number;
  searchQuery?: string;
  isNotFound: boolean;
  invalidPath?: string;
}

export interface PageSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  ogType: 'website' | 'article';
  jsonLd: Record<string, unknown>;
}

const TAB_SEO_COPY: Record<
  WorkspaceTab,
  { title: string; description: string; breadcrumb: string }
> = {
  home: {
    title: 'أكاديمية مضخات الطرد المركزي | Centrifugal Pump Academy',
    description:
      'منصة هندسية تفاعلية لدراسة مضخات الطرد المركزي (مرجع شركة نفط البصرة): 27 درساً، 17 نموذج GLB ثلاثي الأبعاد، محاكي تشغيل، منحنيات H-Q، و162 سؤالاً.',
    breadcrumb: 'الرئيسية',
  },
  lessons: {
    title: 'المنهج الهندسي لمضخات الطرد المركزي (27 درساً) | Centrifugal Pump Academy',
    description:
      'تصفح 27 درساً هندسياً مبسطاً ومتدرجاً من أساسيات الطرد المركزي والتكهف وNPSH والسدادات الميكانيكية حتى المحاذاة والأعطال بمرجع شركة نفط البصرة.',
    breadcrumb: 'الدروس الهندسية (27)',
  },
  lab3d: {
    title: 'مختبر النماذج ثلاثية الأبعاد 3D GLB للمضخات | Centrifugal Pump Academy',
    description:
      'استكشف 17 نموذج CAD ثلاثي الأبعاد بصيغة GLB للمضخات: أحادية ومتعددة المراحل، الغاطسة، الإزاحة الموجبة، السداد الميكانيكي، التكهف والمحاذاة.',
    breadcrumb: 'مختبر 3D GLB',
  },
  simulator: {
    title: 'محاكي تشغيل المضخات الهيدروليكي التفاعلي | Centrifugal Pump Academy',
    description:
      'شغّل محاكي المضخات الفيزيائي لـ 12 نوعاً وتحكم بالسرعة RPM والصمامات ومنسوب الخزان واللزوجة لمراقبة الضغط والتدفق والتكهف ونقطة BEP.',
    breadcrumb: 'محاكي التشغيل',
  },
  curves: {
    title: 'منحنيات الأداء H-Q ونقطة BEP ومنحنى النظام | Centrifugal Pump Academy',
    description:
      'حلّل تفاعلياً منحنيات العلو والكفاءة والقدرة وNPSHr ومنحنى النظام وتقاطع نقطة التشغيل مع الربط على التوالي والتوازي بالوحدات المترية والإمبراطورية.',
    breadcrumb: 'منحنيات الأداء',
  },
  troubleshooting: {
    title: 'تشخيص أعطال المضخات ومهام الصيانة الميدانية | Centrifugal Pump Academy',
    description:
      'دليل تشخيص أعطال مضخات الطرد المركزي عبر 8 جداول مرجعية من دراسة شركة نفط البصرة بالإضافة إلى 6 مهام تحقيق عملي «أنت مهندس الصيانة».',
    breadcrumb: 'تشخيص الأعطال',
  },
  exams: {
    title: 'مركز اختبارات الكفاءة الهندسية (162 سؤال MSQ) | Centrifugal Pump Academy',
    description:
      'اختبر كفاءتك في هندسة المضخات عبر 162 سؤال اختيار متعدد مع أنماط حسب الفصل، شاملة، موقتة، وتخصصية مع التصحيح الدقيق وشرح كل خيار.',
    breadcrumb: 'مركز الاختبارات',
  },
  maintenance: {
    title: 'جداول وبرامج الصيانة الوقائية للمضخات | Centrifugal Pump Academy',
    description:
      'استعرض قوائم الصيانة الوقائية اليومية والشهرية والفصلية ونصف السنوية والسنوية لمضخات الطرد المركزي وفق دراسة شركة نفط البصرة مع سجل تدريبي.',
    breadcrumb: 'الصيانة الوقائية',
  },
  tools: {
    title: 'الحاسبات الهندسية، مقارنة التصاميم والقاموس الفني | Centrifugal Pump Academy',
    description:
      'حاسبات الضغط الهيدروستاتيكي، القدرة الهيدروليكية والكهربائية، قوانين التماثل، محول الوحدات، دراسات حالة، والقاموس الفني للمضخات عربي-إنجليزي.',
    breadcrumb: 'الأدوات والقاموس',
  },
};

export function normalizeOrigin(rawOrigin?: string): string {
  if (!rawOrigin || rawOrigin.includes('localhost') || rawOrigin.includes('127.0.0.1')) {
    return PRODUCTION_ORIGIN;
  }
  return rawOrigin.replace(/\/+$/, '');
}

export function resolveRouteFromLocation(pathname: string, search: string): RouteResolution {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const isKnownEntry =
    normalizedPath === '/' ||
    normalizedPath === '/index.html' ||
    normalizedPath === '/Centrifugal_Pump_Academy.html';

  const sp = new URLSearchParams(search);
  const rawTab = sp.get('tab');
  const rawLesson = sp.get('lesson');
  const rawQuery = sp.get('q')?.trim() || undefined;
  const autostart = sp.get('autostart') === '1';

  if (!isKnownEntry) {
    return {
      tab: 'home',
      isNotFound: true,
      invalidPath: normalizedPath,
    };
  }

  if (rawTab !== null) {
    if (!VALID_WORKSPACE_TABS.includes(rawTab as WorkspaceTab)) {
      return {
        tab: 'home',
        isNotFound: true,
        invalidPath: `${normalizedPath}?tab=${rawTab}`,
      };
    }
    const parsedLesson = rawLesson ? Number(rawLesson) : undefined;
    const validLessonId =
      parsedLesson && Number.isInteger(parsedLesson) && parsedLesson >= 1 && parsedLesson <= 27
        ? parsedLesson
        : undefined;
    return {
      tab: rawTab as WorkspaceTab,
      lessonId: validLessonId,
      searchQuery: rawQuery,
      isNotFound: false,
    };
  }

  return {
    tab: autostart ? 'lab3d' : 'home',
    searchQuery: rawQuery,
    isNotFound: false,
  };
}

export function buildCanonicalPath(tab: WorkspaceTab, lessonId?: number): string {
  if (tab === 'home') return '/';
  if (tab === 'lessons' && lessonId && lessonId >= 1 && lessonId <= 27) {
    return `/?tab=lessons&lesson=${lessonId}`;
  }
  return `/?tab=${tab}`;
}

export function buildSeoMetadata(params: {
  tab: WorkspaceTab;
  lesson?: Lesson;
  origin?: string;
  isNotFound?: boolean;
}): PageSeoMetadata {
  const baseOrigin = normalizeOrigin(params.origin);
  const ogImageAbsolute = `${baseOrigin}${OG_IMAGE_PATH}`;

  if (params.isNotFound) {
    const canonicalUrl = `${baseOrigin}/`;
    return {
      title: 'الصفحة غير موجودة (404) | Centrifugal Pump Academy',
      description:
        'الرابط المطلوب غير متوفر. يمكنك العودة إلى الصفحة الرئيسية لأكاديمية مضخات الطرد المركزي أو استعراض الدروس والمختبر ثلاثي الأبعاد.',
      canonicalUrl,
      robots: 'noindex, follow',
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'الصفحة غير موجودة (404)',
        url: canonicalUrl,
      },
    };
  }

  const { tab, lesson } = params;
  const tabMeta = TAB_SEO_COPY[tab];
  const isSpecificLesson = tab === 'lessons' && Boolean(lesson);
  const canonicalPath = buildCanonicalPath(tab, isSpecificLesson ? lesson!.id : undefined);
  const canonicalUrl = `${baseOrigin}${canonicalPath}`;

  const title = isSpecificLesson
    ? `الدرس ${lesson!.id}: ${lesson!.title} | Centrifugal Pump Academy`
    : tabMeta.title;

  const description = isSpecificLesson
    ? `${lesson!.simpleDef.text} — ${lesson!.englishTitle} (مرجع شركة نفط البصرة: ${lesson!.sourcePages}).`.slice(
        0,
        165,
      )
    : tabMeta.description;

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'الرئيسية',
      item: `${baseOrigin}/`,
    },
  ];

  if (tab !== 'home') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: tabMeta.breadcrumb,
      item: `${baseOrigin}/?tab=${tab}`,
    });
  }

  if (isSpecificLesson && lesson) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: `${lesson.id}. ${lesson.title}`,
      item: canonicalUrl,
    });
  }

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: title,
      description,
      inLanguage: 'ar',
      isPartOf: { '@id': `${baseOrigin}/#website` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: ogImageAbsolute,
        width: 1200,
        height: 630,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  ];

  if (tab === 'home') {
    graph.push(
      {
        '@type': 'WebSite',
        '@id': `${baseOrigin}/#website`,
        name: SITE_NAME,
        url: `${baseOrigin}/`,
        inLanguage: 'ar',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseOrigin}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Course',
        name: SITE_NAME,
        description: tabMeta.description,
        inLanguage: ['ar', 'en'],
        educationalLevel: 'Engineering & Industrial Maintenance',
        provider: {
          '@type': 'Organization',
          name: 'Centrifugal Pump Academy — ENG ALAA MOHAMMED',
          url: `${baseOrigin}/`,
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          category: 'Free Engineering Training',
        },
      },
    );
  } else if (isSpecificLesson && lesson) {
    graph.push({
      '@type': 'LearningResource',
      name: `${lesson.title} (${lesson.englishTitle})`,
      description,
      educationalLevel: lesson.level,
      learningResourceType: 'Engineering Lesson',
      inLanguage: 'ar',
      url: canonicalUrl,
      author: {
        '@type': 'Person',
        name: 'ENG ALAA MOHAMMED',
      },
    });
  } else if (tab === 'lab3d' || tab === 'simulator' || tab === 'curves' || tab === 'tools') {
    graph.push({
      '@type': 'SoftwareApplication',
      name: title,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web Browser',
      description,
      url: canonicalUrl,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    });
  }

  return {
    title,
    description,
    canonicalUrl,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    ogType: isSpecificLesson ? 'article' : 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
  };
}

function upsertMetaTag(attrName: 'name' | 'property', attrVal: string, content: string): void {
  let el = document.head.querySelector(`meta[${attrName}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applySeoToDocument(meta: PageSeoMetadata): void {
  if (typeof document === 'undefined') return;

  document.title = meta.title;

  upsertMetaTag('name', 'description', meta.description);
  upsertMetaTag('name', 'robots', meta.robots);
  upsertMetaTag('property', 'og:type', meta.ogType);
  upsertMetaTag('property', 'og:title', meta.title);
  upsertMetaTag('property', 'og:description', meta.description);
  upsertMetaTag('property', 'og:url', meta.canonicalUrl);
  upsertMetaTag('name', 'twitter:title', meta.title);
  upsertMetaTag('name', 'twitter:description', meta.description);

  let canonicalLink = document.head.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', meta.canonicalUrl);

  let jsonLdScript = document.getElementById('dynamic-seo-jsonld') as HTMLScriptElement | null;
  if (!jsonLdScript) {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'dynamic-seo-jsonld';
    jsonLdScript.type = 'application/ld+json';
    document.head.appendChild(jsonLdScript);
  }
  jsonLdScript.textContent = JSON.stringify(meta.jsonLd);
}
