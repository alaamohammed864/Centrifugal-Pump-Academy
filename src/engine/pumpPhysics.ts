import type { MsqQuestion } from '../types/academy';

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
  rpm: number; // Rated: 2950 RPM
  suctionValvePct: number; // 0..100
  dischargeValvePct: number; // 0..100
  tankLevelM: number; // 0.2..6.0 m
  fluidTempC: number; // 15..110 C
  airIngressPct: number; // 0..100 %
  impellerDiameterRatio?: number; // 0.8..1.0 (default 1.0)
  fluidDensityKgM3?: number; // default 850 (crude/light oil) or 1000 (water)
  scenarioId?: PumpScenarioId;
}

export interface PumpSimOutputs {
  isEducationalModel: true;
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
  operatingZone: 'stopped' | 'shutoff' | 'min_flow' | 'bep_zone' | 'runout' | 'cavitation' | 'air_bound';
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
  const density = raw.fluidDensityKgM3 ?? 860; // Typical light crude / industrial fluid educational baseline
  const dRatio = Math.max(0.75, Math.min(1.05, raw.impellerDiameterRatio ?? 1.0));
  const speedRatio = raw.isRunning ? Math.max(0, Math.min(1.25, raw.rpm / RATED_RPM)) : 0;

  if (!raw.isRunning || raw.rpm <= 50) {
    const pStatic = (density * 9.81 * raw.tankLevelM) / 100000;
    return {
      isEducationalModel: true,
      flowM3h: 0,
      headM: 0,
      suctionPressureBar: Number((1.013 + pStatic).toFixed(2)),
      dischargePressureBar: Number((1.013 + pStatic).toFixed(2)),
      differentialPressureBar: 0,
      rpm: 0,
      hydraulicPowerKw: 0,
      shaftPowerKw: 0,
      efficiencyPct: 0,
      bepFlowM3h: RATED_BEP_FLOW_M3H,
      npshAvailableM: Number((10.3 + raw.tankLevelM - 1.2).toFixed(2)),
      npshRequiredM: 0,
      cavitationIndex: 0,
      cavitationRisk: 'none',
      bearingTempC: 28,
      vibrationMmS: 0.2,
      operatingZone: 'stopped',
      statusAr: 'المضخة متوقفة (Standby)',
      causeEffectAr:
        'المحرك الكهربائي متوقف عن الدوران؛ الضغط في خط السحب والدفع متعادل ويساوي الضغط الاستاتيكي الناتج عن ارتفاع السائل في الخزان.',
    };
  }

  // Pump H-Q curve coefficients scaled by Affinity Laws: H0 ~ (N*D)^2, k_p ~ 1/D^2
  const h0 = RATED_SHUTOFF_HEAD_M * speedRatio * speedRatio * dRatio * dRatio;
  const qMaxPump = 285 * speedRatio * dRatio;
  const kp = h0 / Math.max(1, qMaxPump * qMaxPump);

  // System curve: H_sys = H_static + k_sys * Q^2
  const hStatic = 14; // Static elevation + backpressure (m)
  const dValve = Math.max(0.02, raw.dischargeValvePct / 100);
  const sValve = Math.max(0.05, raw.suctionValvePct / 100);
  const valveLossFactor = 1 / (dValve * dValve) + 0.35 / (sValve * sValve);
  const kSys = 0.00085 * valveLossFactor;

  // Solve h0 - kp * Q^2 = hStatic + kSys * Q^2
  let flow = 0;
  if (h0 > hStatic && raw.dischargeValvePct > 2) {
    flow = Math.sqrt((h0 - hStatic) / (kp + kSys));
  }

  // Air ingress degrades head & flow sharply above 25%
  const airPenalty = 1 - Math.min(0.88, (raw.airIngressPct / 100) * 0.92);
  flow = flow * airPenalty;

  // Ideal head before air degradation
  let head = Math.max(0, h0 - kp * flow * flow);
  head = head * (1 - Math.min(0.75, (raw.airIngressPct / 100) * 0.8));

  // BEP scales linearly with speed & diameter
  const bepFlow = RATED_BEP_FLOW_M3H * speedRatio * dRatio;
  const qRatio = bepFlow > 0 ? flow / bepFlow : 0;

  // Efficiency curve: parabolic drop around BEP (peak ~ 78%)
  let eff = RATED_MAX_EFF_PCT * (1 - 0.88 * Math.pow(qRatio - 1, 2));
  eff = Math.max(0, Math.min(82, eff * (1 - (raw.airIngressPct / 100) * 0.45)));
  if (flow < 4) eff = 0;

  // Suction losses and NPSHa
  const atmHeadM = (1.013 * 100000) / (density * 9.81);
  const vaporBar = waterVaporPressureBar(raw.fluidTempC);
  const vaporHeadM = (vaporBar * 100000) / (density * 9.81);
  const suctionPipeLossM = 0.5 + (0.00009 * flow * flow) / Math.max(0.04, sValve * sValve);
  const npshA = Math.max(0, atmHeadM + raw.tankLevelM - suctionPipeLossM - vaporHeadM);
  const npshR = (2.1 + 0.00011 * flow * flow) * Math.pow(speedRatio, 1.5);

  const cavitationMargin = npshA - npshR;
  let cavitationIndex = 0;
  let cavitationRisk: 'none' | 'incipient' | 'severe' = 'none';
  if (cavitationMargin < 0.8 && cavitationMargin >= -0.6) {
    cavitationRisk = 'incipient';
    cavitationIndex = Math.min(0.6, (0.8 - cavitationMargin) / 2.2);
  } else if (cavitationMargin < -0.6) {
    cavitationRisk = 'severe';
    cavitationIndex = Math.min(1, 0.6 + Math.abs(cavitationMargin + 0.6) / 3.5);
    // Severe cavitation drops head & flow
    flow *= 1 - cavitationIndex * 0.28;
    head *= 1 - cavitationIndex * 0.32;
  }

  // Pressures (bar gauge/abs educational display in bar)
  const suctionAbsBar = Math.max(0.15, 1.013 + ((raw.tankLevelM - suctionPipeLossM) * density * 9.81) / 100000);
  const diffBar = (head * density * 9.81) / 100000;
  const dischargeBar = suctionAbsBar + diffBar;

  // Powers
  const hydKw = (density * 9.81 * (flow / 3600) * head) / 1000;
  const churnKw = 6.5 * Math.pow(speedRatio, 3); // Minimum shutoff churn power
  const shaftKw = eff > 5 ? hydKw / (eff / 100) : churnKw;

  // Bearing Temperature & Vibration (diagnostic indicators)
  const offBepStress = Math.abs(qRatio - 1);
  const thermalLoad = (raw.dischargeValvePct < 20 ? 18 : 0) + offBepStress * 10 + cavitationIndex * 14;
  const bearingTempC = 42 + speedRatio * 14 + thermalLoad + (raw.fluidTempC - 30) * 0.25;

  const vibrationMmS =
    1.1 +
    offBepStress * 2.4 +
    cavitationIndex * 5.8 +
    (raw.airIngressPct / 100) * 4.5 +
    (raw.dischargeValvePct < 15 ? 2.1 : 0);

  // Operating zone & Cause-Effect narrative
  let operatingZone: PumpSimOutputs['operatingZone'] = 'bep_zone';
  let statusAr = 'تشغيل مستقر ضمن نطاق الكفاءة المثلى (BEP Zone)';
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
  } else if (raw.dischargeValvePct <= 10 || flow < 15) {
    operatingZone = 'shutoff';
    statusAr = 'تشغيل قرب الإغلاق التام (Near Shutoff)';
    causeEffectAr =
      'إغلاق أو خنق صمام الدفع يرفع الضغط إلى أقصى قيمة (Shutoff Head) مع انعدام التبريد بالتدفق، فتتحول قدرة المحرك إلى حرارة قد تتلف السداد الميكانيكي والمحامل.';
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
  }

  return {
    isEducationalModel: true,
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
): {
  points: CurvePoint[];
  bepQ: number;
  bepHead: number;
  bepEff: number;
  operatingPoint: { qM3h: number; headM: number; eff: number; powerKw: number; npshR: number };
} {
  const sRatio = rpm / RATED_RPM;
  const h0 = RATED_SHUTOFF_HEAD_M * sRatio * sRatio * diameterRatio * diameterRatio;
  const qMax = 285 * sRatio * diameterRatio;
  const kp = h0 / Math.max(1, qMax * qMax);
  const bepQ = RATED_BEP_FLOW_M3H * sRatio * diameterRatio;
  const dValve = Math.max(0.1, valveOpenPct / 100);
  const kSys = 0.00085 / (dValve * dValve);
  const hStatic = 14;

  const points: CurvePoint[] = [];
  const steps = 28;
  const maxPlotQ = Math.max(320, qMax * 1.15);

  for (let i = 0; i <= steps; i++) {
    const q = (maxPlotQ * i) / steps;
    const hSingle = Math.max(0, h0 - kp * q * q);
    const hSeries = hSingle * 2;
    const hParallel = Math.max(0, h0 - kp * (q / 2) * (q / 2));
    const qRatio = bepQ > 0 ? q / bepQ : 0;
    const eff = q > 0 && hSingle > 0 ? Math.max(0, RATED_MAX_EFF_PCT * (1 - 0.88 * Math.pow(qRatio - 1, 2))) : 0;
    const hydKw = (860 * 9.81 * (q / 3600) * hSingle) / 1000;
    const pwr = eff > 8 ? hydKw / (eff / 100) : 6.5 * Math.pow(sRatio, 3);
    const npshR = (2.1 + 0.00011 * q * q) * Math.pow(sRatio, 1.5);
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
  const opEff = opQ > 0 ? Math.max(0, RATED_MAX_EFF_PCT * (1 - 0.88 * Math.pow(opRatio - 1, 2))) : 0;
  const opHyd = (860 * 9.81 * (opQ / 3600) * opH) / 1000;
  const opPwr = opEff > 8 ? opHyd / (opEff / 100) : 6.5 * Math.pow(sRatio, 3);
  const opNpshR = (2.1 + 0.00011 * opQ * opQ) * Math.pow(sRatio, 1.5);

  return {
    points,
    bepQ: Number(bepQ.toFixed(1)),
    bepHead: Number(Math.max(0, h0 - kp * bepQ * bepQ).toFixed(1)),
    bepEff: RATED_MAX_EFF_PCT,
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
