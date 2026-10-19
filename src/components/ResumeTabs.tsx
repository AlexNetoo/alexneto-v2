'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Briefcase, GraduationCap, Shapes } from 'lucide-react';
import { useState } from 'react';
import type { ResumeRow } from '@/data/site';
import { DiscreteTabs, type DiscreteTab } from './discrete-tabs';
import { LiquidIndex, type LiquidItem } from './liquid-index';

const TABS: DiscreteTab[] = [
  { id: 'experience', title: 'Design experience', icon: Briefcase },
  { id: 'teaching', title: 'Teaching experience', icon: GraduationCap },
  { id: 'focus', title: 'Focus areas', icon: Shapes },
];

const BLUE: [number, number, number][] = [
  [10, 16, 44],
  [60, 120, 250],
  [150, 190, 255],
];

const toItems = (rows: ResumeRow[], icon: LiquidItem['icon'], seed: number): LiquidItem[] =>
  rows.map((r, i) => ({
    title: r.org,
    description: `${r.role} · ${r.period}`,
    icon,
    seed: seed + i * 37,
    colors: BLUE,
  }));

/**
 * About: pill tabs (useLayouts discrete tabs) switch between design experience, teaching and focus areas.
 * The two résumé lists are useLayouts liquid indexes: a liquid-gradient badge follows the hovered row and the
 * role and dates appear under the list. All content comes from src/data/site.ts.
 */
export function ResumeTabs({ experience, teaching, focusTags }: { experience: ResumeRow[]; teaching: ResumeRow[]; focusTags: string[] }) {
  const [tab, setTab] = useState(TABS[0].id);
  const reduce = useReducedMotion();

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <DiscreteTabs tabs={TABS} value={tab} onChange={setTab} label="Résumé sections" />
      <div className="resume__panel">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            role="tabpanel"
            id={`panel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === 'experience' && <LiquidIndex items={toItems(experience, Briefcase, 648)} />}
            {tab === 'teaching' && <LiquidIndex items={toItems(teaching, GraduationCap, 291)} />}
            {tab === 'focus' && (
              <div className="chips">
                {focusTags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
