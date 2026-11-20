import React, { useEffect, useRef, useState } from 'react';
import {
  SPLASH_ASSET_PATH,
  SPLASH_DURATION_MS,
  computeSplashProgress,
} from '../engine/splashUtils';

export interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = SPLASH_DURATION_MS,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let rafId = 0;
    let fadeTimerId: number | undefined;
    let finished = false;
    const startTime = performance.now();

    const tick = (now: number) => {
      if (finished) return;
      const elapsed = now - startTime;
      const state = computeSplashProgress(elapsed, durationMs);
      setProgress(state.progressPct);

      if (state.isComplete) {
        finished = true;
        setIsFadingOut(true);
        fadeTimerId = window.setTimeout(() => {
          onCompleteRef.current();
        }, 220);
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      finished = true;
      window.cancelAnimationFrame(rafId);
      if (fadeTimerId !== undefined) {
        window.clearTimeout(fadeTimerId);
      }
    };
  }, [durationMs]);

  const handleSkip = () => {
    setProgress(100);
    setIsFadingOut(true);
    window.setTimeout(() => {
      onCompleteRef.current();
    }, 150);
  };

  return (
    <div
      data-testid="splash-screen"
      data-progress={progress}
      dir="rtl"
      className={`fixed inset-0 z-50 overflow-hidden bg-slate-950 select-none transition-opacity duration-200 ${
        isFadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Mobile-only Ambient Blurred Desert Horizon Backdrop so full truck stays uncropped in portrait */}
      <picture className="pointer-events-none absolute inset-0 sm:hidden">
        <source srcSet="/assets/basra-marsh-truck.webp" type="image/webp" />
        <img
          src={SPLASH_ASSET_PATH}
          alt=""
          aria-hidden="true"
          width={1672}
          height={941}
          loading="lazy"
          decoding="async"
          className="h-full w-full scale-110 object-cover opacity-45 blur-2xl"
        />
      </picture>

      {/* Hero Vehicle Layer: Uncropped cinematic showcase on mobile portrait, full-bleed 16:9 on tablet/desktop */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="relative flex h-auto w-full items-center justify-center overflow-hidden sm:h-full">
          <picture className="block w-full sm:h-full">
            <source srcSet="/assets/basra-marsh-truck.webp" type="image/webp" />
            <img
              src={SPLASH_ASSET_PATH}
              alt="شاحنة لاندكروزر في أهوار البصرة"
              width={1672}
              height={941}
              fetchPriority="high"
              loading="eager"
              decoding="sync"
              className="animate-splash-truck aspect-video w-full object-cover object-center contrast-[1.09] saturate-[1.12] brightness-[1.02] will-change-transform sm:aspect-auto sm:h-full sm:w-full"
            />
          </picture>

          {/* Soft Top & Bottom Edge Blending on Portrait Mobile */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.55)_0%,transparent_16%,transparent_84%,rgba(2,6,23,0.65)_100%)] sm:hidden"
          />
        </div>

        {/* Warm Golden-Hour Sun Optical Bloom (upper-right horizon) */}
        <div
          aria-hidden="true"
          className="animate-splash-sun pointer-events-none absolute -top-20 -right-20 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.26)_0%,rgba(245,158,11,0.09)_45%,transparent_72%)] mix-blend-screen"
        />

        {/* Automotive Showroom Light-Sweep Across Vehicle Bodywork */}
        <div
          aria-hidden="true"
          className="animate-splash-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(105deg,transparent_0%,rgba(255,244,214,0.16)_46%,rgba(255,255,255,0.26)_50%,rgba(251,191,36,0.12)_55%,transparent_100%)] mix-blend-screen"
        />

        {/* Subtle Cinematic Top & Bottom Vignette Framing */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.45)_0%,rgba(2,6,23,0.0)_22%,rgba(2,6,23,0.0)_68%,rgba(2,6,23,0.82)_100%)]"
        />
      </div>

      {/* Top Corner Transparent Credit & Skip Controls */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="rounded-lg border border-white/20 bg-slate-950/25 px-3 py-1.5 backdrop-blur-md">
          <span className="font-en text-[11px] font-bold tracking-wider text-amber-300 sm:text-xs">
            ENG ALAA MOHAMMED
          </span>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="rounded-lg border border-white/25 bg-slate-950/25 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-amber-300/70"
        >
          تخطي
        </button>
      </div>

      {/* Bottom Transparent HUD: Glass Progress Bar + 0-100 Counter */}
      <div className="absolute inset-x-0 bottom-4 z-10 mx-auto w-[calc(100%-1.5rem)] max-w-lg sm:bottom-5">
        <div className="rounded-2xl border border-white/25 bg-slate-950/20 px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-5 sm:py-3">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-white drop-shadow sm:text-base">
                أكاديمية مضخات الطرد المركزي
              </p>
              <p className="font-en truncate text-[11px] font-semibold text-sky-300/95">
                Centrifugal Pump Academy
              </p>
            </div>

            <div className="flex shrink-0 items-baseline gap-1">
              <span
                data-testid="splash-counter"
                className="font-mono-num text-2xl font-extrabold leading-none text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)] sm:text-3xl"
              >
                {progress}
              </span>
              <span className="font-mono-num text-xs font-bold text-white/85 sm:text-sm">%</span>
            </div>
          </div>

          {/* Transparent Glass Progress Track — synced 1:1 on rAF with zero CSS lag */}
          <div
            role="progressbar"
            aria-label="نسبة تحميل المنصة"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="relative h-3 w-full overflow-hidden rounded-full border border-white/30 bg-white/10 backdrop-blur-sm"
          >
            <div
              data-testid="splash-bar-fill"
              className="h-full rounded-full bg-gradient-to-l from-amber-300/85 via-amber-400/75 to-sky-300/80 shadow-[0_0_14px_rgba(251,191,36,0.55)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-white/85">
            <span>جاري تهيئة المنصة الهندسية والمختبر ثلاثي الأبعاد...</span>
            <span className="font-mono-num text-white/75">0 – 100</span>
          </div>
        </div>
      </div>
    </div>
  );
};
