'use client';

import { ExplodedView, Layer } from './ExplodedView';

const FIT: [number, number] = [570, 540];
const BARS = [38, 62, 46, 78, 54, 90, 68];

/** UX / UI design: a small dashboard screen that takes itself apart (see ExplodedView). */
export function UiDashboard() {
  return (
    <ExplodedView width={420} height={260} fit={FIT} layers={6} label="Dashboard screen">
      <Layer i={0} name="Screen" className="pd__frame">
        <span className="pd__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </Layer>
      <Layer i={1} name="Chart" className="pd__chart">
        {BARS.map((b, k) => (
          <span key={k} className="pd__bar" style={{ height: `${b}%` }} />
        ))}
      </Layer>
      <Layer i={2} name="Cards" className="pd__cards">
        {[0, 1, 2].map((k) => (
          <span key={k} className="pd__card">
            <span className="pd__line pd__line--s" />
            <span className="pd__line pd__line--l" />
          </span>
        ))}
      </Layer>
      <Layer i={3} name="Sidebar" className="pd__side">
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className={`pd__nav${k === 0 ? ' pd__nav--on' : ''}`} />
        ))}
      </Layer>
      <Layer i={4} name="Header" className="pd__head">
        <span className="pd__title">Overview</span>
        <span className="pd__search" />
        <span className="pd__avatar" />
      </Layer>
      <Layer i={5} name="Action" className="pd__fab">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Layer>
    </ExplodedView>
  );
}
