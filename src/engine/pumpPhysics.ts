import type { GlbModelId, MsqQuestion } from '../types/academy';

export type SimulatorPumpType =
  | 'centrifugal_radial'
  | 'centrifugal_multistage'
  | 'centrifugal_split_double'
  | 'centrifugal_barrel'
  | 'centrifugal_vertical'
  | 'centrifugal_axial'
  | 'centrifugal_mixed'
  | 'pd_piston_plunger'
  | 'pd_gear'
  | 'pd_screw'
  | 'pd_lobe'
  | 'pd_vane';

export interface PumpTypeProfile {
  id: SimulatorPumpType;
  category: 'dynamic' | 'pd';
  arName: string;
  enName: string;
  desc: string;
  typicalApp: string;
  relatedGlbModel: GlbModelId;
  defaultRpm: number;
  minRpm: number;
  maxRpm: number;
  bepFlowM3h: number;
  shutoffHeadM: number; // Max head (for Dynamic) or nominal rated max pressure head before relief (for PD)
  maxEffPct: number;
  npshRBase: number;
  npshRK: number;
  qMaxRatio: number; // Ratio of Qmax to BEP Q for Dynamic H-Q parabola
  reliefPressureBar?: number; // For Positive Displacement pumps
  pulsationBasePct?: number;
}

export const PUMP_TYPE_PROFILES: Record<SimulatorPumpType, PumpTypeProfile> = {
  centrifugal_radial: {
    id: 'centrifugal_radial',
    category: 'dynamic',
    arName: 'طرد مركزي أحادية المرحلة (نصف قطرية)',
    enName: 'Single-Stage Radial Centrifugal Pump',
    desc: 'النوع القياسي واسع الاستخدام في حقول النفط: علو متوسط، تصريف مستقر، ومنحنى قدرة ينخفض عند الغلق.',
    typicalApp: 'نقل النفط الخام الخفيف، مياه العمليات، والمنتجات الوسطية',
    relatedGlbModel: 'complete_pump',
    defaultRpm: 2950,
    minRpm: 600,
    maxRpm: 3400,
    bepFlowM3h: 180,
    shutoffHeadM: 84,
    maxEffPct: 78,
    npshRBase: 2.1,
    npshRK: 0.00011,
    qMaxRatio: 1.5833,
  },
  centrifugal_multistage: {
    id: 'centrifugal_multistage',
    category: 'dynamic',
    arName: 'طرد مركزي متعددة المراحل (أفقية)',
    enName: 'Horizontal Multistage Centrifugal Pump (5-Stage)',
    desc: 'دفاعات متتالية على عمود واحد تجمع ضغط المراحل على التوالي لتحقيق ضغط دفع مرتفع جداً.',
    typicalApp: 'تغذية مراجل البخار (Boiler Feed) وخطوط حقن المياه',
    relatedGlbModel: 'multistage_pump',
    defaultRpm: 2950,
    minRpm: 900,
    maxRpm: 3400,
    bepFlowM3h: 145,
    shutoffHeadM: 265,
    maxEffPct: 76,
    npshRBase: 2.3,
    npshRK: 0.00014,
    qMaxRatio: 1.52,
  },
  centrifugal_split_double: {
    id: 'centrifugal_split_double',
    category: 'dynamic',
    arName: 'منقسمة أفقياً / مزدوجة السحب',
    enName: 'Horizontal Split Case Double-Suction Pump',
    desc: 'سحب متناظر من الجهتين يضاعف التصريف ويقلل NPSHr المطلوب ويعادل الدفع المحوري بفعالية.',
    typicalApp: 'محطات الضخ الرئيسية ومياه التبريد وخطوط التصدير عالية التصريف',
    relatedGlbModel: 'split_case_double_suction',
    defaultRpm: 1480,
    minRpm: 600,
    maxRpm: 2200,
    bepFlowM3h: 340,
    shutoffHeadM: 76,
    maxEffPct: 83,
    npshRBase: 1.6,
    npshRK: 0.00004,
    qMaxRatio: 1.62,
  },
  centrifugal_barrel: {
    id: 'centrifugal_barrel',
    category: 'dynamic',
    arName: 'ذات الغلاف البرميلي عالية الضغط (BB5)',
    enName: 'Barrel Casing Ultra-High Pressure Pump',
    desc: 'مضخة متعددة المراحل داخل برميل فولاذي سميك محكم الإغلاق لتحمل الضغوط الفائقة بالمصافي والحقن.',
    typicalApp: 'حقن المياه في المكامن النفطية عالية الضغط وخدمات المصافي الحرجة',
    relatedGlbModel: 'barrel_pump',
    defaultRpm: 2980,
    minRpm: 1000,
    maxRpm: 3600,
    bepFlowM3h: 165,
    shutoffHeadM: 410,
    maxEffPct: 75,
    npshRBase: 2.6,
    npshRK: 0.00013,
    qMaxRatio: 1.5,
  },
  centrifugal_vertical: {
    id: 'centrifugal_vertical',
    category: 'dynamic',
    arName: 'المضخة الرأسية متعددة المراحل',
    enName: 'Vertical Multistage Inline Pump',
    desc: 'محور عمودي ومراحل متراكبة رأسياً تشغل مساحة أرضية صغيرة مع فتحات سحب ودفع على خط مستقيم.',
    typicalApp: 'وحدات رفع الضغط بالمواقع المحدودة المساحة وآبار السحب',
    relatedGlbModel: 'vertical_pump',
    defaultRpm: 2900,
    minRpm: 800,
    maxRpm: 3400,
    bepFlowM3h: 95,
    shutoffHeadM: 148,
    maxEffPct: 74,
    npshRBase: 1.7,
    npshRK: 0.00022,
    qMaxRatio: 1.55,
  },
  centrifugal_axial: {
    id: 'centrifugal_axial',
    category: 'dynamic',
    arName: 'مضخة الجريان المحوري (Axial Flow)',
    enName: 'Axial Flow Propeller Pump',
    desc: 'تدفع كميات ضخمة جداً بضغط رأسي منخفض؛ لاحظ ارتفاع القدرة المسحوبة خطراً إذا خُنق صمام الدفع!',
    typicalApp: 'تدوير مياه التبريد الكبرى، التصريف، وتدوير المبادلات',
    relatedGlbModel: 'axial_mixed_pump',
    defaultRpm: 980,
    minRpm: 400,
    maxRpm: 1500,
    bepFlowM3h: 520,
    shutoffHeadM: 22,
    maxEffPct: 79,
    npshRBase: 3.1,
    npshRK: 0.000018,
    qMaxRatio: 1.48,
  },
  centrifugal_mixed: {
    id: 'centrifugal_mixed',
    category: 'dynamic',
    arName: 'مضخة الجريان المزدوج (Mixed Flow)',
    enName: 'Mixed Flow Conical Pump',
    desc: 'حالة وسطية تجمع بين الجريان المحوري والنصف قطري بزاوية خروج >90° لتحقيق تدفق كبير وعلو متوسط.',
    typicalApp: 'سحب المياه من الأنهار وأحواض التجميع وتبريد المحطات',
    relatedGlbModel: 'axial_mixed_pump',
    defaultRpm: 1450,
    minRpm: 500,
    maxRpm: 2000,
    bepFlowM3h: 310,
    shutoffHeadM: 46,
    maxEffPct: 81,
    npshRBase: 2.4,
    npshRK: 0.000045,
    qMaxRatio: 1.54,
  },
  pd_piston_plunger: {
    id: 'pd_piston_plunger',
    category: 'pd',
    arName: 'إزاحة موجبة: ترددية (مكبس / غطاس)',
    enName: 'Reciprocating Piston / Plunger Pump (PD)',
    desc: 'تدفق شبه ثابت يتناسب طردياً مع RPM مهما ارتفعت مقاومة الخط؛ إغلاق الدفع يفتح صمام الأمان فوراً!',
    typicalApp: 'حقن الكيماويات، الاختبار الهيدروستاتيكي، والضغوط الفائقة بتصريف محدود',
    relatedGlbModel: 'reciprocating_pump',
    defaultRpm: 450,
    minRpm: 120,
    maxRpm: 900,
    bepFlowM3h: 38,
    shutoffHeadM: 420,
    maxEffPct: 86,
    npshRBase: 1.8,
    npshRK: 0.0008,
    qMaxRatio: 1.05,
    reliefPressureBar: 32,
    pulsationBasePct: 18,
  },
  pd_gear: {
    id: 'pd_gear',
    category: 'pd',
    arName: 'إزاحة موجبة: مضخة التروس (Gear)',
    enName: 'External Gear Rotary Pump (PD)',
    desc: 'ضخ منتظم بدون نبضات للزيوت والسوائل عالية اللزوجة عبر حصر المائع بين أسنان التروس.',
    typicalApp: 'تدوير زيوت التزييت، نقل المازوت والوقود الثقيل',
    relatedGlbModel: 'gear_pump',
    defaultRpm: 1450,
    minRpm: 300,
    maxRpm: 2200,
    bepFlowM3h: 65,
    shutoffHeadM: 220,
    maxEffPct: 82,
    npshRBase: 1.5,
    npshRK: 0.00035,
    qMaxRatio: 1.05,
    reliefPressureBar: 18,
    pulsationBasePct: 3,
  },
  pd_screw: {
    id: 'pd_screw',
    category: 'pd',
    arName: 'إزاحة موجبة: المضخة اللولبية (Screw)',
    enName: 'Twin-Screw Rotary Pump (PD)',
    desc: 'أفضل أداء مع النفط الخام الثقيل والسوائل شديدة اللزوجة بدون استحلاب أو نبضات ضغط.',
    typicalApp: 'نقل النفط الخام الثقيل (Heavy Crude) والشمع والإسفلت',
    relatedGlbModel: 'screw_pump',
    defaultRpm: 1450,
    minRpm: 400,
    maxRpm: 2400,
    bepFlowM3h: 120,
    shutoffHeadM: 250,
    maxEffPct: 84,
    npshRBase: 1.4,
    npshRK: 0.00018,
    qMaxRatio: 1.05,
    reliefPressureBar: 22,
    pulsationBasePct: 1.5,
  },
  pd_lobe: {
    id: 'pd_lobe',
    category: 'pd',
    arName: 'إزاحة موجبة: المضخة الفصية (Lobe)',
    enName: 'Rotary Lobe Positive Displacement Pump',
    desc: 'فصوص متزامنة لا تتلامس معدنيةً وتنقل الموائع الحساسة للقص أو المختلطة برواسب ناعمة.',
    typicalApp: 'الوحل والرواسب الزيتية (Sludge) والموائع البوليمرية الحساسة',
    relatedGlbModel: 'lobe_vane_pump',
    defaultRpm: 720,
    minRpm: 200,
    maxRpm: 1400,
    bepFlowM3h: 85,
    shutoffHeadM: 165,
    maxEffPct: 80,
    npshRBase: 1.6,
    npshRK: 0.00028,
    qMaxRatio: 1.05,
    reliefPressureBar: 14,
    pulsationBasePct: 6,
  },
  pd_vane: {
    id: 'pd_vane',
    category: 'pd',
    arName: 'إزاحة موجبة: المضخة الريشية (Sliding Vane)',
    enName: 'Sliding Vane Rotary Pump (PD)',
    desc: 'قدرة تحضير ذاتي ممتازة للسوائل الخفيفة والمنخفضة اللزوجة والمشتقات النفطية والغازات المسالة.',
    typicalApp: 'تفريغ صهاريج الوقود والكازولين وغاز البترول المسال LPG',
    relatedGlbModel: 'lobe_vane_pump',
    defaultRpm: 1150,
    minRpm: 350,
    maxRpm: 1800,
    bepFlowM3h: 72,
    shutoffHeadM: 175,
    maxEffPct: 79,
    npshRBase: 1.4,
    npshRK: 0.00032,
    qMaxRatio: 1.05,
    reliefPressureBar: 15,
    pulsationBasePct: 4,
  },
};

export type PumpScenarioId =
  | 'normal'
  | 'low_tank_level'
  | 'suction_clogged'
  | 'air_ingress'
  | 'low_rpm'
  | 'high_discharge_resistance'
  | 'off_bep_operation';

export interface PumpSimInputs {
  isRunning: boolean;
  pumpType?: SimulatorPumpType; // defaults to 'centrifugal_radial'
  rpm: number; // Rated: 2950 RPM for radial default
  suctionValvePct: number; // 0..100
  dischargeValvePct: number; // 0..100
  tankLevelM: number; // 0.2..6.0 m
  fluidTempC: number; // 15..110 C
  airIngressPct: number; // 0..100 %
  impellerDiameterRatio?: number; // 0.8..1.0 (default 1.0)
  fluidDensityKgM3?: number; // default 860 (crude/light oil) or 1000 (water)
  fluidViscosityCst?: number; // 1..800 cSt (default 5 cSt)
  scenarioId?: PumpScenarioId;
}

export interface PumpSimOutputs {
  isEducationalModel: true;
  pumpType: SimulatorPumpType;
  pumpCategory: 'dynamic' | 'pd';
  flowM3h: number;
  headM: number;
  suctionPressureBar: number;
  dischargePressureBar: number;
  differentialPressureBar: number;
  rpm: number;
  hydraulicPowerKw: number;
  shaftPowerKw: number;
  efficiencyPct: number;
  bepFlowM3h: number;
  npshAvailableM: number;
  npshRequiredM: number;
  cavitationIndex: number; // 0..1
  cavitationRisk: 'none' | 'incipient' | 'severe';
  bearingTempC: number;
  vibrationMmS: number;
  reliefValveOpen?: boolean;
  operatingZone:
    | 'stopped'
    | 'shutoff'
    | 'min_flow'
    | 'bep_zone'
    | 'runout'
    | 'cavitation'
    | 'air_bound'
    | 'overpressure';
  statusAr: string;
  causeEffectAr: string;
}

export const RATED_RPM = 2950;
export const RATED_BEP_FLOW_M3H = 180;
export const RATED_SHUTOFF_HEAD_M = 84;
export const RATED_MAX_EFF_PCT = 78;

export const SCENARIO_PRESETS: Record<
  PumpScenarioId,
  { label: string; desc: string; inputs: Partial<PumpSimInputs> }
> = {
  normal: {
    label: 'تشغيل طبيعي عند نقطة أفضل كفاءة (BEP)',
    desc: 'صمامات مفتوحة ضمن التصميم، مستوى خزان كافٍ، سرعة اسمية 2950 RPM، وعدم وجود هواء أو انسداد.',
    inputs: {
      isRunning: true,
      rpm: 2950,
      suctionValvePct: 100,
      dischargeValvePct: 78,
      tankLevelM: 4.2,
      fluidTempC: 35,
      airIngressPct: 0,
      impellerDiameterRatio: 1.0,
    },
  },
  low_tank_level: {
    label: 'انخفاض مستوى السائل في الخزان',
    desc: 'انخفاض الضغط الهيدروستاتيكي المتاح على خط السحب مما يقلل NPSHa ويهيئ المضخة للتكهف.',
    inputs: {
      isRunning: true,
      rpm: 2950,
      suctionValvePct: 100,
      dischargeValvePct: 80,
      tankLevelM: 0.45,
      fluidTempC: 45,
      airIngressPct: 5,
    },
  },
  suction_clogged: {
    label: 'انسداد خط السحب أو المصفاة',
    desc: 'تقييد صمام/مصفاة السحب يرفع فواقد الاحتكاك في السحب ويهبط بضغط الدخول دون ضغط التبخير.',
    inputs: {
      isRunning: true,
      rpm: 2950,
      suctionValvePct: 24,
      dischargeValvePct: 80,
      tankLevelM: 3.5,
      fluidTempC: 40,
      airIngressPct: 0,
    },
  },
  air_ingress: {
    label: 'دخول الهواء إلى المضخة (Air Ingress)',
    desc: 'تسرب هواء عبر حشوات أو وصلات السحب يؤدي لاختناق التدفق وتذبذب الضغط وارتفاع الاهتزاز.',
    inputs: {
      isRunning: true,
      rpm: 2950,
      suctionValvePct: 100,
      dischargeValvePct: 78,
      tankLevelM: 3.8,
      fluidTempC: 35,
      airIngressPct: 68,
    },
  },
  low_rpm: {
    label: 'انخفاض سرعة الدوران (Low RPM)',
    desc: 'انخفاض الفولتية أو تردد المغذي (VFD) يقلل التدفق طردياً والضغط تربيعياً والقدرة تكعيبياً حسب قوانين التماثل.',
    inputs: {
      isRunning: true,
      rpm: 1950,
      suctionValvePct: 100,
      dischargeValvePct: 78,
      tankLevelM: 4.0,
      fluidTempC: 35,
      airIngressPct: 0,
    },
  },
  high_discharge_resistance: {
    label: 'ارتفاع مقاومة خط الدفع (Discharge Throttling)',
    desc: 'خنق صمام الدفع أو انسداد الخط يرفع الضغط نحو Shutoff Head ويخفض التدفق والكفاءة ويرفع حرارة المائع.',
    inputs: {
      isRunning: true,
      rpm: 2950,
      suctionValvePct: 100,
      dischargeValvePct: 16,
      tankLevelM: 4.2,
      fluidTempC: 35,
      airIngressPct: 0,
    },
  },
  off_bep_operation: {
    label: 'تشغيل المضخة بعيداً عن نقطة أفضل كفاءة (Runout)',
    desc: 'فتح زائد مع مقاومة نظام منخفضة يدفع نقطة التشغيل إلى أقصى اليمين (Runout) مع ارتفاع NPSHr والاهتزاز.',
    inputs: {
      isRunning: true,
      rpm: 2950,
      suctionValvePct: 100,
      dischargeValvePct: 100,
      tankLevelM: 3.0,
      fluidTempC: 50,
      airIngressPct: 0,
    },
  },
};

function waterVaporPressureBar(tempC: number): number {
  // Antoine-inspired smooth educational approximation for water/light hydrocarbon blend
  const clamped = Math.max(10, Math.min(120, tempC));
  return 0.00611 * Math.exp((17.27 * clamped) / (clamped + 237.3));
}

export function simulatePumpOperation(raw: PumpSimInputs): PumpSimOutputs {
  const pumpType: SimulatorPumpType = raw.pumpType ?? 'centrifugal_radial';
  const profile = PUMP_TYPE_PROFILES[pumpType] ?? PUMP_TYPE_PROFILES.centrifugal_radial;
  const density = raw.fluidDensityKgM3 ?? 860;
  const viscosityCst = Math.max(1, Math.min(800, raw.fluidViscosityCst ?? 5));
  const dRatio = Math.max(0.75, Math.min(1.05, raw.impellerDiameterRatio ?? 1.0));
  const speedRatio = raw.isRunning ? Math.max(0, Math.min(1.5, raw.rpm / profile.defaultRpm)) : 0;

  if (!raw.isRunning || raw.rpm <= 50) {
    const pStatic = (density * 9.81 * raw.tankLevelM) / 100000;
    return {
      isEducationalModel: true,
      pumpType,
      pumpCategory: profile.category,
      flowM3h: 0,
      headM: 0,
      suctionPressureBar: Number((1.013 + pStatic).toFixed(2)),
      dischargePressureBar: Number((1.013 + pStatic).toFixed(2)),
      differentialPressureBar: 0,
      rpm: 0,
      hydraulicPowerKw: 0,
      shaftPowerKw: 0,
      efficiencyPct: 0,
      bepFlowM3h: profile.bepFlowM3h,
      npshAvailableM: Number((10.3 + raw.tankLevelM - 1.2).toFixed(2)),
      npshRequiredM: 0,
      cavitationIndex: 0,
      cavitationRisk: 'none',
      bearingTempC: 28,
      vibrationMmS: 0.2,
      reliefValveOpen: false,
      operatingZone: 'stopped',
      statusAr: 'المضخة متوقفة (Standby)',
      causeEffectAr:
        'المحرك متوقف عن الدوران؛ الضغط في خط السحب والدفع متعادل ويساوي الضغط الاستاتيكي الناتج عن ارتفاع السائل في الخزان.',
    };
  }

  const dValve = Math.max(0.02, raw.dischargeValvePct / 100);
  const sValve = Math.max(0.05, raw.suctionValvePct / 100);
  const atmHeadM = (1.013 * 100000) / (density * 9.81);
  const vaporBar = waterVaporPressureBar(raw.fluidTempC);
  const vaporHeadM = (vaporBar * 100000) / (density * 9.81);

  // ---------- BRANCH A: POSITIVE DISPLACEMENT PUMPS (PDF pp. 1, 6, 10-16) ----------
  if (profile.category === 'pd') {
    const qTheo = profile.bepFlowM3h * speedRatio;
    const reliefBar = profile.reliefPressureBar ?? 20;
    // System backpressure grows steeply if discharge valve is throttled
    const baseBackpressureBar = 2.8 + (qTheo / Math.max(1, profile.bepFlowM3h)) * 4.2;
    const throttleSpike = Math.pow(1 / dValve, 1.85) * 1.4;
    const viscBackpressure = Math.log10(viscosityCst) * 0.9;
    let diffBar = Math.min(reliefBar * 1.18, baseBackpressureBar + throttleSpike + viscBackpressure - 1.4);
    if (raw.dischargeValvePct >= 70) {
      diffBar = baseBackpressureBar + viscBackpressure * 0.55;
    }

    const reliefValveOpen = diffBar >= reliefBar * 0.95 || raw.dischargeValvePct <= 25;
    if (reliefValveOpen) {
      diffBar = Math.max(diffBar, reliefBar);
    }

    // Internal volumetric slip decreases at higher viscosity, increases with pressure & air ingress
    const viscSlipRelief = Math.min(0.85, 4.5 / Math.sqrt(viscosityCst + 3));
    const slipPct = Math.min(0.45, (diffBar / reliefBar) * 0.14 * viscSlipRelief);
    const airPenalty = 1 - Math.min(0.82, (raw.airIngressPct / 100) * 0.85);
    let flow = Math.max(0, qTheo * (1 - slipPct) * airPenalty);
    if (reliefValveOpen) {
      // Part of flow bypasses internally through relief valve
      flow *= Math.max(0.05, raw.dischargeValvePct / 45);
    }

    const head = (diffBar * 100000) / (density * 9.81);
    const suctionPipeLossM =
      0.35 + (profile.npshRK * flow * flow * (1 + Math.log10(viscosityCst) * 0.35)) / Math.max(0.04, sValve * sValve);
    const npshA = Math.max(0, atmHeadM + raw.tankLevelM - suctionPipeLossM - vaporHeadM);
    const npshR = (profile.npshRBase + profile.npshRK * flow * flow) * Math.pow(speedRatio, 1.15);

    const cavitationMargin = npshA - npshR;
    let cavitationIndex = 0;
    let cavitationRisk: 'none' | 'incipient' | 'severe' = 'none';
    if (cavitationMargin < 0.7 && cavitationMargin >= -0.5) {
      cavitationRisk = 'incipient';
      cavitationIndex = Math.min(0.55, (0.7 - cavitationMargin) / 2.0);
    } else if (cavitationMargin < -0.5) {
      cavitationRisk = 'severe';
      cavitationIndex = Math.min(1, 0.55 + Math.abs(cavitationMargin + 0.5) / 3.0);
      flow *= 1 - cavitationIndex * 0.25;
    }

    const suctionAbsBar = Math.max(0.12, 1.013 + ((raw.tankLevelM - suctionPipeLossM) * density * 9.81) / 100000);
    const dischargeBar = suctionAbsBar + diffBar;

    // Volumetric * Mechanical efficiency (PD holds high efficiency even at higher viscosities!)
    const mechLossFactor = 1 - Math.min(0.18, Math.log10(viscosityCst) * 0.04);
    const eff = Math.max(25, Math.min(90, profile.maxEffPct * (1 - slipPct) * mechLossFactor * airPenalty));
    const hydKw = (density * 9.81 * (qTheo / 3600) * head) / 1000;
    const shaftKw = Math.max(1.2, hydKw / Math.max(0.25, eff / 100));

    const pulsation = (profile.pulsationBasePct ?? 4) * (reliefValveOpen ? 1.8 : 1);
    const bearingTempC =
      40 + speedRatio * 12 + (diffBar / reliefBar) * 24 + (reliefValveOpen ? 16 : 0) + (raw.fluidTempC - 30) * 0.25;
    const vibrationMmS =
      1.0 +
      (pulsation / 10) * 0.9 +
      cavitationIndex * 4.8 +
      (raw.airIngressPct / 100) * 3.8 +
      (reliefValveOpen ? 3.2 : 0);

    let operatingZone: PumpSimOutputs['operatingZone'] = 'bep_zone';
    let statusAr = `تشغيل إزاحة موجبة مستقر (${profile.arName})`;
    let causeEffectAr =
      'مضخة الإزاحة الموجبة تضخ حجماً ثابتاً يتناسب طردياً مع السرعة (RPM) وتحافظ على كفاءة عالية حتى مع السوائل اللزجة.';

    if (raw.airIngressPct >= 45) {
      operatingZone = 'air_bound';
      statusAr = 'تراكم غاز/هواء يضعف الكفاءة الحجمية (Gas Locking)';
      causeEffectAr =
        'دخول الهواء أو الغاز بكثافة يسبب انضغاط الجيب الغازي داخل الحجرة بدل طرد المائع ويخفض التدفق الصافي مع تذبذب الضغط.';
    } else if (reliefValveOpen) {
      operatingZone = 'overpressure';
      statusAr = 'خطر حرج: ارتفاع مفرط للضغط وفتح صمام الأمان (Overpressure / PRV Open)';
      causeEffectAr = `مضخات الإزاحة الموجبة لا يُغلق صمام دفعها أبداً! خنق الدفع إلى ${raw.dischargeValvePct}% رفع الضغط إلى ${diffBar.toFixed(1)} bar مما فتح صمام الأمان لمنع انفجار الأنبوب أو تلف المضخة.`;
    } else if (cavitationRisk === 'severe') {
      operatingZone = 'cavitation';
      statusAr = 'تحذير: نقص هامش السحب / تبخر (Incomplete Filling & Cavitation)';
      causeEffectAr = `انخفاض NPSHa (${npshA.toFixed(1)} m) عن NPSHr (${npshR.toFixed(1)} m) يمنع امتلاء حجرة السحب بالكامل ويسبب صدمات وتآكلاً في الحشوات والتروس/المكابس.`;
    } else if (cavitationRisk === 'incipient') {
      operatingZone = 'cavitation';
      statusAr = 'بداية نقص امتلاء السحب (Incipient Cavitation)';
      causeEffectAr =
        'مقاومة خط السحب أو اللزوجة تقترب من حد التبخير؛ يُنصح برفع منسوب الخزان أو تقليل السرعة.';
    }

    return {
      isEducationalModel: true,
      pumpType,
      pumpCategory: 'pd',
      flowM3h: Number(flow.toFixed(1)),
      headM: Number(head.toFixed(1)),
      suctionPressureBar: Number(suctionAbsBar.toFixed(2)),
      dischargePressureBar: Number(dischargeBar.toFixed(2)),
      differentialPressureBar: Number(diffBar.toFixed(2)),
      rpm: Math.round(raw.rpm),
      hydraulicPowerKw: Number(hydKw.toFixed(1)),
      shaftPowerKw: Number(shaftKw.toFixed(1)),
      efficiencyPct: Number(eff.toFixed(1)),
      bepFlowM3h: Number(qTheo.toFixed(1)),
      npshAvailableM: Number(npshA.toFixed(2)),
      npshRequiredM: Number(npshR.toFixed(2)),
      cavitationIndex: Number(cavitationIndex.toFixed(2)),
      cavitationRisk,
      bearingTempC: Number(bearingTempC.toFixed(1)),
      vibrationMmS: Number(vibrationMmS.toFixed(2)),
      reliefValveOpen,
      operatingZone,
      statusAr,
      causeEffectAr,
    };
  }

  // ---------- BRANCH B: DYNAMIC / CENTRIFUGAL PUMPS (7 Subtypes from PDF) ----------
  // Viscosity derating for centrifugal impellers (high viscosity causes heavy disk friction & efficiency drop)
  const viscPenaltyFlow = viscosityCst > 15 ? Math.max(0.45, 1 - Math.log10(viscosityCst / 15) * 0.24) : 1;
  const viscPenaltyHead = viscosityCst > 20 ? Math.max(0.55, 1 - Math.log10(viscosityCst / 20) * 0.18) : 1;
  const viscPenaltyEff = viscosityCst > 12 ? Math.max(0.32, 1 - Math.log10(viscosityCst / 12) * 0.34) : 1;

  const h0 = profile.shutoffHeadM * speedRatio * speedRatio * dRatio * dRatio * viscPenaltyHead;
  const qMaxPump = profile.bepFlowM3h * profile.qMaxRatio * speedRatio * dRatio * viscPenaltyFlow;
  const kp = h0 / Math.max(1, qMaxPump * qMaxPump);

  // System curve scaled appropriately to pump head class so default valve ~78% sits near BEP!
  const targetBepQ = profile.bepFlowM3h * speedRatio * dRatio;
  const targetBepH = Math.max(6, h0 - kp * targetBepQ * targetBepQ);
  const hStatic = Math.min(targetBepH * 0.35, Math.max(3, targetBepH * 0.24));
  const baseKSys = Math.max(0.00001, (targetBepH - hStatic) / Math.max(1, targetBepQ * targetBepQ)) * (0.78 * 0.78);
  const valveLossFactor = 1 / (dValve * dValve) + 0.35 / (sValve * sValve) - 0.35;
  const kSys = baseKSys * Math.max(0.95, valveLossFactor);

  // Solve h0 - kp * Q^2 = hStatic + kSys * Q^2
  let flow = 0;
  if (h0 > hStatic && raw.dischargeValvePct > 2) {
    flow = Math.sqrt((h0 - hStatic) / (kp + kSys));
  }

  // Air ingress degrades head & flow sharply above 25%
  const airPenalty = 1 - Math.min(0.88, (raw.airIngressPct / 100) * 0.92);
  flow = flow * airPenalty;

  let head = Math.max(0, h0 - kp * flow * flow);
  head = head * (1 - Math.min(0.75, (raw.airIngressPct / 100) * 0.8));

  const bepFlow = profile.bepFlowM3h * speedRatio * dRatio;
  const qRatio = bepFlow > 0 ? flow / bepFlow : 0;

  let eff = profile.maxEffPct * (1 - 0.88 * Math.pow(qRatio - 1, 2)) * viscPenaltyEff;
  eff = Math.max(0, Math.min(86, eff * (1 - (raw.airIngressPct / 100) * 0.45)));
  if (flow < 4) eff = 0;

  // Suction losses and NPSHa
  const qNormRatio = flow / Math.max(1, profile.bepFlowM3h);
  const suctionPipeLossM =
    0.5 + ((2.2 * qNormRatio * qNormRatio) * (1 + Math.log10(viscosityCst) * 0.2)) / Math.max(0.04, sValve * sValve);
  const npshA = Math.max(0, atmHeadM + raw.tankLevelM - suctionPipeLossM - vaporHeadM);
  const npshR = (profile.npshRBase + profile.npshRK * flow * flow) * Math.pow(speedRatio, 1.5);

  const cavitationMargin = npshA - npshR;
  let cavitationIndex = 0;
  let cavitationRisk: 'none' | 'incipient' | 'severe' = 'none';
  if (cavitationMargin < 0.8 && cavitationMargin >= -0.6) {
    cavitationRisk = 'incipient';
    cavitationIndex = Math.min(0.6, (0.8 - cavitationMargin) / 2.2);
  } else if (cavitationMargin < -0.6) {
    cavitationRisk = 'severe';
    cavitationIndex = Math.min(1, 0.6 + Math.abs(cavitationMargin + 0.6) / 3.5);
    flow *= 1 - cavitationIndex * 0.28;
    head *= 1 - cavitationIndex * 0.32;
  }

  const suctionAbsBar = Math.max(0.15, 1.013 + ((raw.tankLevelM - suctionPipeLossM) * density * 9.81) / 100000);
  const diffBar = (head * density * 9.81) / 100000;
  const dischargeBar = suctionAbsBar + diffBar;

  // Powers (Axial flow pumps have uniquely rising power curve near shutoff!)
  const hydKw = (density * 9.81 * (flow / 3600) * head) / 1000;
  const bepHydKw = (density * 9.81 * (bepFlow / 3600) * targetBepH) / 1000;
  const churnKw =
    pumpType === 'centrifugal_axial'
      ? Math.max(8, (bepHydKw / (profile.maxEffPct / 100)) * 1.48)
      : Math.max(4, (bepHydKw / (profile.maxEffPct / 100)) * 0.17);
  const shaftKw =
    eff > 5
      ? pumpType === 'centrifugal_axial' && qRatio < 0.75
        ? Math.max(hydKw / (eff / 100), churnKw * (1 - qRatio * 0.28))
        : hydKw / (eff / 100)
      : churnKw;

  const offBepStress = Math.abs(qRatio - 1);
  const thermalLoad = (raw.dischargeValvePct < 20 ? 18 : 0) + offBepStress * 10 + cavitationIndex * 14;
  const bearingTempC = 42 + speedRatio * 14 + thermalLoad + (raw.fluidTempC - 30) * 0.25;

  const vibrationMmS =
    1.1 +
    offBepStress * 2.4 +
    cavitationIndex * 5.8 +
    (raw.airIngressPct / 100) * 4.5 +
    (raw.dischargeValvePct < 15 ? 2.1 : 0);

  let operatingZone: PumpSimOutputs['operatingZone'] = 'bep_zone';
  let statusAr = `تشغيل مستقر ضمن نطاق الكفاءة المثلى (${profile.arName})`;
  let causeEffectAr =
    'المضخة تعمل قرب نقطة أفضل كفاءة (BEP): الخسائر الهيدروليكية في أدنى مستوى، الحمل الشعاعي متوازن، وهامش السحب NPSHa أعلى من NPSHr بأمان.';

  if (raw.airIngressPct >= 45) {
    operatingZone = 'air_bound';
    statusAr = 'تراكم هواء/غاز في المضخة (Air Binding)';
    causeEffectAr =
      'دخول الهواء إلى خط السحب يقلل الكثافة الفعالة داخل الدفاعة فتنهار القدرة على توليد الضغط، وينخفض التصريف بشكل حاد مع تذبذب الاهتزاز.';
  } else if (cavitationRisk === 'severe') {
    operatingZone = 'cavitation';
    statusAr = 'تحذير حرج: ظاهرة التكهف (Severe Cavitation)';
    causeEffectAr = `انخفض صافي ضغط السحب المتاح (${npshA.toFixed(1)} m) دون المطلوب (${npshR.toFixed(1)} m) بسبب انخفاض مستوى الخزان أو انسداد السحب أو ارتفاع حرارة المائع؛ تتشكل فقاعات بخار عند عين الدفاعة وتنهار بعنف مولدة ضوضاء تشبه الحصى وتآكلاً معدنياً واهتزازاً عالياً.`;
  } else if (raw.dischargeValvePct <= 10 || flow < 10) {
    operatingZone = 'shutoff';
    statusAr =
      pumpType === 'centrifugal_axial'
        ? 'تحذير: خنق خط الدفع في مضخة جريان محوري (حمل كهربائي خطير)'
        : 'تشغيل قرب الإغلاق التام (Near Shutoff)';
    causeEffectAr =
      pumpType === 'centrifugal_axial'
        ? 'في مضخات الجريان المحوري ترتفع القدرة المسحوبة إلى الذروة عند إغلاق صمام الدفع مما قد يفصل المحرك (Overload)، بعكس مضخات الطرد النصف قطرية.'
        : 'إغلاق أو خنق صمام الدفع يرفع الضغط إلى أقصى قيمة (Shutoff Head) مع انعدام التبريد بالتدفق، فتتحول قدرة المحرك إلى حرارة قد تتلف السداد الميكانيكي والمحامل.';
  } else if (qRatio < 0.65) {
    operatingZone = 'min_flow';
    statusAr = 'تدفق منخفض (Low Flow / Recirculation)';
    causeEffectAr =
      'التشغيل دون 65% من BEP يولد دوامات إعادة تدوير داخل الغلاف الحلزوني ويرفع الحمل الشعاعي على العمود والمحامل.';
  } else if (qRatio > 1.25) {
    operatingZone = 'runout';
    statusAr = 'تدفق زائد (Runout Zone)';
    causeEffectAr =
      'التدفق المرتفع جداً يقلل الضغط المتولد ويزيد بشكل متسارع من NPSHr والقدرة المسحوبة، مما يعرض المضخة للتكهف وحمل زائد على المحرك.';
  } else if (cavitationRisk === 'incipient') {
    operatingZone = 'cavitation';
    statusAr = 'بداية تكهف (Incipient Cavitation)';
    causeEffectAr =
      'الفرق بين NPSHa و NPSHr أصبح حرجاً؛ يُنصح برفع مستوى الخزان أو فحص مصفاة السحب لتجنب تطور التكهف.';
  } else if (viscosityCst > 80) {
    causeEffectAr = `ملاحظة اللزوجة (${viscosityCst} cSt): اللزوجة المرتفعة تسبب هبوطاً ملحوظاً في كفاءة وعلو مضخات الطرد المركزي؛ في هذه التطبيقات يُفضّل التحويل إلى المضخة اللولبية أو التروسية (PD).`;
  }

  return {
    isEducationalModel: true,
    pumpType,
    pumpCategory: 'dynamic',
    flowM3h: Number(flow.toFixed(1)),
    headM: Number(head.toFixed(1)),
    suctionPressureBar: Number(suctionAbsBar.toFixed(2)),
    dischargePressureBar: Number(dischargeBar.toFixed(2)),
    differentialPressureBar: Number(diffBar.toFixed(2)),
    rpm: Math.round(raw.rpm),
    hydraulicPowerKw: Number(hydKw.toFixed(1)),
    shaftPowerKw: Number(shaftKw.toFixed(1)),
    efficiencyPct: Number(eff.toFixed(1)),
    bepFlowM3h: Number(bepFlow.toFixed(1)),
    npshAvailableM: Number(npshA.toFixed(2)),
    npshRequiredM: Number(npshR.toFixed(2)),
    cavitationIndex: Number(cavitationIndex.toFixed(2)),
    cavitationRisk,
    bearingTempC: Number(bearingTempC.toFixed(1)),
    vibrationMmS: Number(vibrationMmS.toFixed(2)),
    reliefValveOpen: false,
    operatingZone,
    statusAr,
    causeEffectAr,
  };
}

export interface CurvePoint {
  qM3h: number;
  headSingle: number;
  headSeries: number;
  headParallel: number;
  efficiency: number;
  powerKw: number;
  npshR: number;
  systemHead: number;
}

export function generatePerformanceCurves(
  rpm = RATED_RPM,
  valveOpenPct = 78,
  diameterRatio = 1.0,
  pumpType: SimulatorPumpType = 'centrifugal_radial',
): {
  points: CurvePoint[];
  bepQ: number;
  bepHead: number;
  bepEff: number;
  operatingPoint: { qM3h: number; headM: number; eff: number; powerKw: number; npshR: number };
} {
  const profile = PUMP_TYPE_PROFILES[pumpType] ?? PUMP_TYPE_PROFILES.centrifugal_radial;
  const sRatio = rpm / profile.defaultRpm;
  const h0 = profile.shutoffHeadM * sRatio * sRatio * diameterRatio * diameterRatio;
  const qMax = profile.bepFlowM3h * profile.qMaxRatio * sRatio * diameterRatio;
  const kp = h0 / Math.max(1, qMax * qMax);
  const bepQ = profile.bepFlowM3h * sRatio * diameterRatio;
  const dValve = Math.max(0.1, valveOpenPct / 100);
  const kSys =
    pumpType === 'centrifugal_radial'
      ? 0.00085 / (dValve * dValve)
      : ((h0 * 0.55) / Math.max(1, bepQ * bepQ)) / (dValve * dValve);
  const hStatic = pumpType === 'centrifugal_radial' ? 14 : Math.max(4, h0 * 0.16);

  const points: CurvePoint[] = [];
  const steps = 28;
  const maxPlotQ = pumpType === 'centrifugal_radial' ? Math.max(320, qMax * 1.15) : Math.max(50, qMax * 1.15);

  for (let i = 0; i <= steps; i++) {
    const q = (maxPlotQ * i) / steps;
    const hSingle =
      profile.category === 'pd'
        ? q <= qMax
          ? h0 * (1 - 0.1 * (q / Math.max(1, qMax)))
          : 0
        : Math.max(0, h0 - kp * q * q);
    const hSeries = hSingle * 2;
    const hParallel =
      profile.category === 'pd'
        ? q <= qMax * 2
          ? h0 * (1 - 0.1 * (q / Math.max(1, qMax * 2)))
          : 0
        : Math.max(0, h0 - kp * (q / 2) * (q / 2));
    const qRatio = bepQ > 0 ? q / bepQ : 0;
    const eff =
      q > 0 && hSingle > 0
        ? Math.max(0, profile.maxEffPct * (1 - (profile.category === 'pd' ? 0.35 : 0.88) * Math.pow(qRatio - 1, 2)))
        : 0;
    const hydKw = (860 * 9.81 * (q / 3600) * hSingle) / 1000;
    const pwr = eff > 8 ? hydKw / (eff / 100) : 6.5 * Math.pow(sRatio, 3);
    const npshR = (profile.npshRBase + profile.npshRK * q * q) * Math.pow(sRatio, 1.5);
    const systemHead = hStatic + kSys * q * q;

    points.push({
      qM3h: Number(q.toFixed(1)),
      headSingle: Number(hSingle.toFixed(1)),
      headSeries: Number(hSeries.toFixed(1)),
      headParallel: Number(hParallel.toFixed(1)),
      efficiency: Number(eff.toFixed(1)),
      powerKw: Number(pwr.toFixed(1)),
      npshR: Number(npshR.toFixed(2)),
      systemHead: Number(systemHead.toFixed(1)),
    });
  }

  const opQ = h0 > hStatic ? Math.sqrt((h0 - hStatic) / (kp + kSys)) : 0;
  const opH = Math.max(0, h0 - kp * opQ * opQ);
  const opRatio = bepQ > 0 ? opQ / bepQ : 0;
  const opEff = opQ > 0 ? Math.max(0, profile.maxEffPct * (1 - 0.88 * Math.pow(opRatio - 1, 2))) : 0;
  const opHyd = (860 * 9.81 * (opQ / 3600) * opH) / 1000;
  const opPwr = opEff > 8 ? opHyd / (opEff / 100) : 6.5 * Math.pow(sRatio, 3);
  const opNpshR = (profile.npshRBase + profile.npshRK * opQ * opQ) * Math.pow(sRatio, 1.5);

  return {
    points,
    bepQ: Number(bepQ.toFixed(1)),
    bepHead: Number(Math.max(0, h0 - kp * bepQ * bepQ).toFixed(1)),
    bepEff: profile.maxEffPct,
    operatingPoint: {
      qM3h: Number(opQ.toFixed(1)),
      headM: Number(opH.toFixed(1)),
      eff: Number(opEff.toFixed(1)),
      powerKw: Number(opPwr.toFixed(1)),
      npshR: Number(opNpshR.toFixed(2)),
    },
  };
}

// Engineering Calculators (Educational — clearly separated from certified engineering design)
export function calcHydrostaticPressure(densityKgM3: number, heightM: number, gravity = 9.81) {
  const pascals = densityKgM3 * gravity * heightM;
  return {
    pascals: Number(pascals.toFixed(1)),
    kPa: Number((pascals / 1000).toFixed(3)),
    bar: Number((pascals / 100000).toFixed(4)),
    psi: Number((pascals / 6894.757).toFixed(3)),
  };
}

export function calcPumpPowers(
  flowM3h: number,
  headM: number,
  densityKgM3: number,
  pumpEfficiencyPct: number,
  motorEfficiencyPct = 94,
) {
  const qM3s = flowM3h / 3600;
  const hydraulicKw = (densityKgM3 * 9.81 * qM3s * headM) / 1000;
  const etaP = Math.max(0.05, Math.min(1, pumpEfficiencyPct / 100));
  const etaM = Math.max(0.1, Math.min(1, motorEfficiencyPct / 100));
  const shaftKw = hydraulicKw / etaP;
  const electricalKw = shaftKw / etaM;
  return {
    hydraulicKw: Number(hydraulicKw.toFixed(2)),
    shaftKw: Number(shaftKw.toFixed(2)),
    shaftHp: Number((shaftKw * 1.34102).toFixed(2)),
    electricalKw: Number(electricalKw.toFixed(2)),
  };
}

export function calcAffinityBySpeed(q1: number, h1: number, p1Kw: number, n1: number, n2: number) {
  const r = n1 > 0 ? n2 / n1 : 0;
  return {
    q2: Number((q1 * r).toFixed(2)),
    h2: Number((h1 * r * r).toFixed(2)),
    p2Kw: Number((p1Kw * r * r * r).toFixed(2)),
    ratio: Number(r.toFixed(3)),
  };
}

export function convertUnitValue(
  category: 'pressure' | 'flow' | 'power' | 'head',
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  const tables: Record<string, Record<string, number>> = {
    // base unit: bar
    pressure: { bar: 1, kPa: 100, Pa: 100000, psi: 14.50377, mH2O: 10.19716 },
    // base unit: m3/h
    flow: { 'm3/h': 1, 'L/s': 1 / 3.6, 'L/min': 1000 / 60, GPM: 4.402868, bbl_d: 150.955 },
    // base unit: kW
    power: { kW: 1, W: 1000, HP: 1.341022, MW: 0.001 },
    // base unit: m
    head: { m: 1, ft: 3.28084, cm: 100, mm: 1000 },
  };
  const map = tables[category];
  if (!map || !map[fromUnit] || !map[toUnit]) return value;
  const base = value / map[fromUnit];
  return Number((base * map[toUnit]).toFixed(4));
}

// Strict MSQ Grading Engine
export interface MsqGradeResult {
  questionId: string;
  isExactMatch: boolean;
  score: number; // 0 or 1 under strict mode; also exposes diagnostic ratio
  strictScore: number; // 1 iff all correct selected AND zero wrong selected
  missedCorrect: number[];
  wrongSelected: number[];
  selected: number[];
  correct: number[];
}

export function gradeMsqQuestion(question: MsqQuestion, selectedIndices: number[]): MsqGradeResult {
  const selectedSet = new Set(selectedIndices);
  const correctSet = new Set(question.correctIndices);

  const missedCorrect = question.correctIndices.filter((idx) => !selectedSet.has(idx));
  const wrongSelected = selectedIndices.filter((idx) => !correctSet.has(idx));
  const isExactMatch = missedCorrect.length === 0 && wrongSelected.length === 0 && selectedIndices.length > 0;

  return {
    questionId: question.id,
    isExactMatch,
    score: isExactMatch ? 1 : 0,
    strictScore: isExactMatch ? 1 : 0,
    missedCorrect,
    wrongSelected,
    selected: [...selectedSet].sort((a, b) => a - b),
    correct: [...correctSet].sort((a, b) => a - b),
  };
}

export function gradeExam(questions: MsqQuestion[], answersById: Record<string, number[]>) {
  const results = questions.map((q) => gradeMsqQuestion(q, answersById[q.id] ?? []));
  const exactCount = results.filter((r) => r.isExactMatch).length;
  const totalCount = questions.length;
  const scorePct = totalCount > 0 ? Math.round((exactCount / totalCount) * 100) : 0;

  const weakChaptersMap = new Map<number, number>();
  results.forEach((r, idx) => {
    if (!r.isExactMatch) {
      const ch = questions[idx].chapterId;
      weakChaptersMap.set(ch, (weakChaptersMap.get(ch) ?? 0) + 1);
    }
  });

  const weakChapters = [...weakChaptersMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ch]) => ch);

  return {
    results,
    exactCount,
    totalCount,
    scorePct,
    weakChapters,
  };
}
