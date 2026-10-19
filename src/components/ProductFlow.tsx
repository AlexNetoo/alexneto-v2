'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Product design: a small working prototype. Three connected app screens (sign in, choose, done) play through
 * a flow on their own, with a cursor typing, tapping and picking; click any control to take over, and the demo
 * resumes after a few idle seconds. Text is limited to the button labels; everything else is placeholder shapes.
 * Styles: `.pf*` in globals.css.
 */
type Step = 0 | 1 | 2;
const IDLE_RESUME_MS = 6000;

const Check = ({ draw }: { draw?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5 10 17.5 19 7" className={draw ? 'pf__draw' : undefined} />
  </svg>
);

export function ProductFlow() {
  const root = useRef<HTMLDivElement>(null);
  const fit = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLSpanElement>(null);
  const ctaRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];
  const optRefs = [useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)];

  const [step, setStep] = useState<Step>(0);
  const [typed, setTyped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(-1);
  const [burst, setBurst] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(true);
  const [cursor, setCursor] = useState({ x: 220, y: 140, down: false });
  const [reduced, setReduced] = useState(false);
  const resume = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // scale the 440 x 300 prototype to the stage
  useEffect(() => {
    const host = root.current?.parentElement;
    const el = fit.current;
    if (!host || !el) return;
    const apply = () => el.style.setProperty('--k', Math.max(0.5, Math.min(1.2, host.clientWidth / 480, host.clientHeight / 340)).toFixed(3));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(resume.current);
    };
  }, []);

  // ---- the actions (shared by the demo and by real clicks)
  const doContinue = useCallback(() => {
    setTyped(true);
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setStep(1);
    }, 800);
  }, []);
  const doNext = useCallback(() => {
    setBurst((b) => b + 1);
    setStep(2);
  }, []);
  const doDone = useCallback(() => {
    setStep(0);
    setTyped(false);
    setPicked(-1);
  }, []);

  // a real click takes over from the demo; it resumes after a quiet spell
  const user = (fn: () => void) => () => {
    setAuto(false);
    clearTimeout(resume.current);
    resume.current = setTimeout(() => setAuto(true), IDLE_RESUME_MS);
    fn();
  };

  // ---- the demo: move the cursor to the next control, tap it, repeat
  useEffect(() => {
    if (!auto || !visible || reduced || loading) return;
    const rel = (el: HTMLElement | null) => {
      const base = fit.current;
      if (!el || !base) return null;
      let x = 0;
      let y = 0;
      let n: HTMLElement | null = el;
      while (n && n !== base) {
        x += n.offsetLeft;
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
    };
    let target: HTMLElement | null = null;
    let run: () => void = () => {};
    let wait = 900;
    if (step === 0 && !typed) {
      target = fieldRef.current;
      run = () => setTyped(true);
    } else if (step === 0) {
      target = ctaRefs[0].current;
      run = doContinue;
      wait = 700;
    } else if (step === 1 && picked < 0) {
      target = optRefs[1].current;
      run = () => setPicked(1);
    } else if (step === 1) {
      target = ctaRefs[1].current;
      run = doNext;
      wait = 700;
    } else {
      target = ctaRefs[2].current;
      run = doDone;
      wait = 2000;
    }
    const p = rel(target);
    const t1 = setTimeout(() => p && setCursor({ x: p.x, y: p.y, down: false }), 50);
    const t2 = setTimeout(() => setCursor((c) => ({ ...c, down: true })), wait);
    const t3 = setTimeout(() => {
      setCursor((c) => ({ ...c, down: false }));
      run();
    }, wait + 160);
    return () => [t1, t2, t3].forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, visible, reduced, loading, step, typed, picked]);

  const phoneCls = (i: number) => `pf__phone${step === i ? ' is-on' : ''}${i < step ? ' is-done' : ''}`;

  return (
    <div ref={root} className="pf">
      <div ref={fit} className="pf__fit">
        <div className="pf__row">
          {/* 1: sign in */}
          <div className={phoneCls(0)} onClick={user(() => setStep(0))}>
            <span className="pf__bar pf__bar--s" />
            <span className="pf__avatar" />
            <span ref={fieldRef} className="pf__field" onClick={user(() => setTyped(true))}>
              <span className="pf__type" style={{ width: typed ? '68%' : '0%' }} />
            </span>
            <span className="pf__field">
              <span className="pf__dots">
                {[0, 1, 2, 3, 4].map((k) => (
                  <i key={k} style={{ opacity: typed ? 1 : 0, transitionDelay: `${k * 70}ms` }} />
                ))}
              </span>
            </span>
            <button
              ref={ctaRefs[0]}
              type="button"
              className="pf__cta"
              disabled={loading}
              onClick={(e) => {
                e.stopPropagation();
                user(doContinue)();
              }}
            >
              {loading ? <span className="pf__spin" aria-label="Loading" /> : 'Continue'}
            </button>
          </div>

          <span className={`pf__arrow${step >= 1 ? ' is-on' : ''}`} aria-hidden="true" />

          {/* 2: choose */}
          <div className={phoneCls(1)} onClick={user(() => step > 0 && setStep(1))}>
            <span className="pf__bar pf__bar--s" />
            {[0, 1, 2].map((k) => (
              <button
                key={k}
                ref={optRefs[k]}
                type="button"
                className={`pf__opt${picked === k ? ' is-picked' : ''}`}
                aria-pressed={picked === k}
                aria-label={`Option ${k + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  user(() => {
                    setStep(1);
                    setPicked(k);
                  })();
                }}
              >
                <i>{picked === k && <Check />}</i>
                <span className="pf__bar" style={{ width: `${[78, 62, 70][k]}%` }} />
              </button>
            ))}
            <button
              ref={ctaRefs[1]}
              type="button"
              className="pf__cta"
              disabled={picked < 0}
              onClick={(e) => {
                e.stopPropagation();
                user(doNext)();
              }}
            >
              Next
            </button>
          </div>

          <span className={`pf__arrow${step >= 2 ? ' is-on' : ''}`} aria-hidden="true" />

          {/* 3: done */}
          <div className={phoneCls(2)} onClick={user(() => step > 1 && setStep(2))}>
            <span className="pf__bar pf__bar--s" />
            <span className="pf__done" key={burst}>
              <Check draw={step === 2} />
              {step === 2 && [0, 1, 2, 3, 4, 5, 6, 7].map((k) => <b key={k} className="pf__spark" style={{ ['--a' as string]: `${k * 45}deg` }} />)}
            </span>
            <span className="pf__bar" style={{ width: '70%', alignSelf: 'center' }} />
            <span className="pf__bar pf__bar--m" style={{ alignSelf: 'center' }} />
            <button
              ref={ctaRefs[2]}
              type="button"
              className="pf__cta"
              onClick={(e) => {
                e.stopPropagation();
                user(doDone)();
              }}
            >
              Done
            </button>
          </div>
        </div>

        <div className="pf__steps" aria-hidden="true">
          {[0, 1, 2].map((k) => (
            <i key={k} className={step === k ? 'on' : k < step ? 'done' : ''} />
          ))}
        </div>

        <span className={`pf__cursor${auto && visible && !reduced ? ' is-on' : ''}${cursor.down ? ' is-down' : ''}`} style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }} aria-hidden="true" />
      </div>
    </div>
  );
}
