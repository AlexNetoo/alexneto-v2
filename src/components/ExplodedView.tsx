'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Shared shell for the "takes itself apart" components in Focus Areas. Click (or Enter / Space) and the
 * component tilts into an isometric view while its layers lift apart, labelled; click again to put it back.
 * Plain DOM + CSS 3D, so text stays real and crisp. At rest it floats and leans toward the pointer.
 * Styles: `.xv*` in globals.css. Compose layers with <Layer i={height} name="Label">.
 */
export function ExplodedView({
  width,
  height,
  fit,
  layers,
  label,
  children,
}: {
  /** The assembled component's size in px (it is scaled to fit the stage). */
  width: number;
  height: number;
  /** Room the exploded view needs at scale 1: [w, h]. */
  fit: [number, number];
  /** Number of layers (the highest `i` + 1). */
  layers: number;
  /** What it is, for the accessible name, e.g. "Notification card". */
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const fitEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current?.parentElement;
    const el = fitEl.current;
    if (!host || !el) return;
    const apply = () => el.style.setProperty('--k', Math.max(0.4, Math.min(1.15, host.clientWidth / fit[0], host.clientHeight / fit[1])).toFixed(3));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    return () => ro.disconnect();
  }, [fit]);

  const lean = (e: React.PointerEvent) => {
    const r = root.current?.getBoundingClientRect();
    if (!r || !root.current) return;
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    root.current.style.setProperty('--lx', `${(-ny * 9).toFixed(2)}deg`);
    root.current.style.setProperty('--lz', `${(nx * 9).toFixed(2)}deg`);
  };
  const rest = () => {
    root.current?.style.setProperty('--lx', '0deg');
    root.current?.style.setProperty('--lz', '0deg');
  };
  const toggle = () => setOpen((o) => !o);

  return (
    <div
      ref={root}
      className="xv"
      data-open={open}
      style={{ ['--n' as string]: layers }}
      role="button"
      tabIndex={0}
      aria-pressed={open}
      aria-label={`${label}. Activate to ${open ? 'put it back together' : 'take it apart'}`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      onPointerMove={lean}
      onPointerLeave={rest}
    >
      <div ref={fitEl} className="xv__fit" style={{ width, height }}>
        <div className="xv__ground" />
        <div className="xv__float">
          <div className="xv__stack">{children}</div>
        </div>
      </div>
    </div>
  );
}

/** One layer of an ExplodedView. `i` is its height when apart (0 = bottom). */
export function Layer({ i, name, className = '', children }: { i: number; name: string; className?: string; children?: ReactNode }) {
  return (
    <div className={`xv__layer ${className}`} style={{ ['--i' as string]: i }}>
      {children}
      <span className="xv__tag t-label">{name}</span>
    </div>
  );
}
