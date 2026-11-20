import type { GlbModelId } from '../types/academy';
import type { SimulatorPumpType } from './pumpPhysics';

export const CDN_GLB_BASE_URL = 'https://cdn.jsdelivr.net/gh/alaamohammed864/complete_pump@main';

export const GLB_MODEL_URLS: Record<GlbModelId, string> = {
  alignment_model: `${CDN_GLB_BASE_URL}/alignment_model.glb`,
  axial_mixed_pump: `${CDN_GLB_BASE_URL}/axial_mixed_pump.glb`,
  barrel_pump: `${CDN_GLB_BASE_URL}/barrel_pump.glb`,
  bearings_loads: `${CDN_GLB_BASE_URL}/bearings_loads.glb`,
  cavitation_model: `${CDN_GLB_BASE_URL}/cavitation_model.glb`,
  complete_pump: `${CDN_GLB_BASE_URL}/complete_pump.glb`,
  exploded_pump: `${CDN_GLB_BASE_URL}/exploded_pump.glb`,
  gear_pump: `${CDN_GLB_BASE_URL}/gear_pump.glb`,
  impeller_types: `${CDN_GLB_BASE_URL}/impeller_types.glb`,
  lobe_vane_pump: `${CDN_GLB_BASE_URL}/lobe_vane_pump.glb`,
  mechanical_seal: `${CDN_GLB_BASE_URL}/mechanical_seal.glb`,
  multistage_pump: `${CDN_GLB_BASE_URL}/multistage_pump.glb`,
  reciprocating_pump: `${CDN_GLB_BASE_URL}/reciprocating_pump.glb`,
  screw_pump: `${CDN_GLB_BASE_URL}/screw_pump.glb`,
  split_case_double_suction: `${CDN_GLB_BASE_URL}/split_case_double_suction.glb`,
  vertical_pump: `${CDN_GLB_BASE_URL}/vertical_pump.glb`,
  water_hammer: `${CDN_GLB_BASE_URL}/water_hammer.glb`,
};

export function getGlbModelUrl(id: GlbModelId): string {
  return GLB_MODEL_URLS[id];
}

export type GlbCategory = 'all' | 'components' | 'centrifugal' | 'pd';

export interface GlbModelMeta {
  id: GlbModelId;
  category: Exclude<GlbCategory, 'all'>;
  arTitle: string;
  enTitle: string;
  desc: string;
  relatedLessonId: number;
  relatedSimulatorType?: SimulatorPumpType;
}

export const GLB_MODELS_META: GlbModelMeta[] = [
  {
    id: 'complete_pump',
    category: 'centrifugal',
    arTitle: 'طرد مركزي أحادية (كاملة)',
    enTitle: 'Single-Stage End-Suction Centrifugal Pump',
    desc: 'مضخة الطرد المركزي أحادية المرحلة (جريان نصف قطري) على قاعدة مشتركة مع خطوط السحب والدفع والمحرك.',
    relatedLessonId: 1,
    relatedSimulatorType: 'centrifugal_radial',
  },
  {
    id: 'multistage_pump',
    category: 'centrifugal',
    arTitle: 'متعددة المراحل (أفقية)',
    enTitle: 'Horizontal Multistage Centrifugal Pump',
    desc: '5 دفاعات مركبة على التوالي لرفع الضغط العالي جداً في تغذية المراجل وحقن المياه.',
    relatedLessonId: 2,
    relatedSimulatorType: 'centrifugal_multistage',
  },
  {
    id: 'split_case_double_suction',
    category: 'centrifugal',
    arTitle: 'منقسمة أفقياً / مزدوجة السحب',
    enTitle: 'Horizontal Split Case & Double-Suction',
    desc: 'غلاف علوي قابل للرفع دون فك الأنابيب مع دفاعة مزدوجة السحب متزنة محورياً.',
    relatedLessonId: 2,
    relatedSimulatorType: 'centrifugal_split_double',
  },
  {
    id: 'barrel_pump',
    category: 'centrifugal',
    arTitle: 'ذات الغلاف البرميلي (BB5)',
    enTitle: 'High-Pressure Barrel Casing Pump',
    desc: 'غلاف برميلي فولاذي سميك للضغوط الفائقة مع حزمة مراحل داخلية قابلة للسحب.',
    relatedLessonId: 4,
    relatedSimulatorType: 'centrifugal_barrel',
  },
  {
    id: 'vertical_pump',
    category: 'centrifugal',
    arTitle: 'المضخة الرأسية (العمودية)',
    enTitle: 'Vertical Multistage / Vertical Shaft Pump',
    desc: 'مراحل ضخ عمودية فوق بعضها ومحرك رأسي لتوفير المساحة الأرضية في المحطات.',
    relatedLessonId: 2,
    relatedSimulatorType: 'centrifugal_vertical',
  },
  {
    id: 'axial_mixed_pump',
    category: 'centrifugal',
    arTitle: 'جريان محوري ومزدوج',
    enTitle: 'Axial Flow & Mixed Flow Pumps',
    desc: 'مقارنة بين المضخة المروحية المحورية (تدفق عالٍ/ضغط واطئ) والجريان المزدوج (>90°).',
    relatedLessonId: 2,
    relatedSimulatorType: 'centrifugal_axial',
  },
  {
    id: 'reciprocating_pump',
    category: 'pd',
    arTitle: 'ترددية (مكبس / غطاس)',
    enTitle: 'Reciprocating Piston / Plunger Pump',
    desc: 'ضخ إزاحة موجبة بحركة المكبس مع مخمد النبض (Air Vessel) وصمام الأمان.',
    relatedLessonId: 1,
    relatedSimulatorType: 'pd_piston_plunger',
  },
  {
    id: 'gear_pump',
    category: 'pd',
    arTitle: 'مضخة التروس (Gear)',
    enTitle: 'External Gear Positive Displacement Pump',
    desc: 'ترسان متعشقان يدوران بعكس الاتجاه لضخ الزيوت الثقيلة عالية اللزوجة بسلاسة.',
    relatedLessonId: 1,
    relatedSimulatorType: 'pd_gear',
  },
  {
    id: 'screw_pump',
    category: 'pd',
    arTitle: 'المضخة اللولبية (Screw)',
    enTitle: 'Twin-Screw Positive Displacement Pump',
    desc: 'لولبان حلزونيان متداخلان لنقل النفط الثقيل والسوائل اللزجة دون نبضات.',
    relatedLessonId: 1,
    relatedSimulatorType: 'pd_screw',
  },
  {
    id: 'lobe_vane_pump',
    category: 'pd',
    arTitle: 'الفصية والريشية الدوارة',
    enTitle: 'Rotary Lobe & Sliding Vane Pumps',
    desc: 'مقارنة بين الفصوص المتزامنة والريش المنزلقة داخل الدوار اللامركزي.',
    relatedLessonId: 1,
    relatedSimulatorType: 'pd_lobe',
  },
  {
    id: 'exploded_pump',
    category: 'components',
    arTitle: 'تفكيك المضخة (Exploded)',
    enTitle: 'Exploded Pump Assembly',
    desc: 'اسحب شريط التفكيك أو اضغط على أي جزء لفحص وظيفته وأعطاله وأساليب صيانته.',
    relatedLessonId: 3,
    relatedSimulatorType: 'centrifugal_radial',
  },
  {
    id: 'impeller_types',
    category: 'components',
    arTitle: 'مقارنة الدفاعات الثلاثة',
    enTitle: 'Open vs Semi-Open vs Closed Impellers',
    desc: 'مقارنة هندسية مباشرة بين الدفاعة المفتوحة ونصف المفتوحة والمغلقة.',
    relatedLessonId: 10,
  },
  {
    id: 'bearings_loads',
    category: 'components',
    arTitle: 'المحامل والأحمال',
    enTitle: 'Bearings & Radial/Axial Loads',
    desc: 'تمثيل لمحمل الكرات القطري ومحمل الدفع المحوري وأسهم اتجاه الأحمال.',
    relatedLessonId: 11,
  },
  {
    id: 'mechanical_seal',
    category: 'components',
    arTitle: 'السداد الميكانيكي المفكك',
    enTitle: 'Mechanical Seal Exploded Assembly',
    desc: 'الأجزاء الدقيقة للسداد: الحلقة الثابتة، الدوارة، O-Ring، النابض، وحلقة الدفع.',
    relatedLessonId: 8,
  },
  {
    id: 'cavitation_model',
    category: 'components',
    arTitle: 'التكهف وتآكل الريش',
    enTitle: 'Cavitation Bubbles & Pitting Erosion',
    desc: 'تكون فقاعات البخار عند عين الدفاعة وانهيارها العنيف مع مناطق النقر المعدني.',
    relatedLessonId: 25,
  },
  {
    id: 'water_hammer',
    category: 'components',
    arTitle: 'المطرقة المائية',
    enTitle: 'Water Hammer Pressure Surge',
    desc: 'الإغلاق المفاجئ لصمام الدفع وارتداد موجة الضغط العالي في الأنبوب.',
    relatedLessonId: 24,
  },
  {
    id: 'alignment_model',
    category: 'components',
    arTitle: 'محاذاة المضخة والليزر',
    enTitle: 'Shaft Alignment & Misalignment Modes',
    desc: 'محاكاة بصرية للانحراف الزاوي والموازي والمركب مع جهاز المحاذاة الليزري.',
    relatedLessonId: 20,
  },
];
