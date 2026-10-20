"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react";

// --- Number Formatter Helper ---
function $(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "0";
  return (Math.round(n * 100) / 100).toString();
}

// --- Exact SVG Pill Path Generator ---
function getPillPath(rect: { x: number; y: number; width: number; height: number }, radius: number) {
  const rClamped = Math.min(radius, rect.width / 2, rect.height / 2);
  const { x, y, width: w, height: h } = rect;
  return [
    `M${$(x)} ${$(y + rClamped)}`,
    `A${$(rClamped)} ${$(rClamped)} 0 0 1 ${$(x + rClamped)} ${$(y)}`,
    `L${$(x + w - rClamped)} ${$(y)}`,
    `A${$(rClamped)} ${$(rClamped)} 0 0 1 ${$(x + w)} ${$(y + rClamped)}`,
    `L${$(x + w)} ${$(y + h - rClamped)}`,
    `A${$(rClamped)} ${$(rClamped)} 0 0 1 ${$(x + w - rClamped)} ${$(y + h)}`,
    `L${$(x + rClamped)} ${$(y + h)}`,
    `A${$(rClamped)} ${$(rClamped)} 0 0 1 ${$(x)} ${$(y + h - rClamped)}`,
    `Z`,
  ].join(" ");
}

// --- Exact Tangent-Arc Liquid Gooey Bridge Generator ---
function getGooeyBridgePath(
  e: { x: number; y: number; width: number; height: number },
  t: { x: number; y: number; width: number; height: number },
  cornerRadius: number,
  neckHeight: number,
  pushFactor: number
) {
  if (pushFactor <= 0.02) return null;
  const a = e.height;
  const o = e.y + a / 2;
  const s = Math.min(cornerRadius, a / 2, e.width / 2, t.width / 2);
  if (s <= 0) return null;
  const c = e.x + e.width;
  const l = t.x;
  const u = l - c;
  if (u < 0) return null;
  const d = Math.min((neckHeight / 2) * pushFactor, a / 2 - 0.5);
  const f = u / 2 + s;
  const p = d - a / 2 + s;
  const m = 2 * (p - s);
  if (Math.abs(m) < 1e-4) return null;
  const h = (s * s - f * f - p * p) / m;
  if (!(h > 0) || s + h < f) return null;
  const g = Math.sqrt(Math.max(0, (s + h) * (s + h) - f * f));
  const mid = (c + l) / 2;
  const v = c - s;
  const y = e.y + s;
  const ee = mid - v;
  const b = e.y + s - g - y;
  const hyp = Math.hypot(ee, b) || 1;
  const te = v + (s * ee) / hyp;
  const S = y + (s * b) / hyp;
  const C = 2 * mid - te;
  return [
    `M${$(te)} ${$(S)}`,
    `A${$(h)} ${$(h)} 0 0 0 ${$(C)} ${$(S)}`,
    `L${$(C)} ${$(2 * o - S)}`,
    `A${$(h)} ${$(h)} 0 0 0 ${$(te)} ${$(2 * o - S)}`,
    `Z`,
  ].join(" ");
}

// --- Props & Types ---
export interface NavItem {
  /** text label, or `content` for an icon */
  label: string;
  content?: ReactNode;
  /** a page (Next link), an external URL (new tab) or none (a button that calls `onPress`) */
  link?: string;
  onPress?: () => void;
  ariaLabel?: string;
  /** width of the pill in px (the label is centred in it) */
  width: number;
}

export interface GooeyNavbarProps {
  items: NavItem[];
  defaultActiveIndex?: number;
  activeIndex?: number;
  pillColor?: string;
  textColor?: string;
  hoverTextColor?: string;
  fontSize?: number;
  paddingX?: number;
  paddingY?: number;
  cornerRadius?: number;
  gap?: number;
  neighborPush?: number;
  anchorEdge?: "left" | "center" | "right";
  neckRatio?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  className?: string;
}

/**
 * Reusable Gooey Navbar Component
 */
export function GooeyNavbar({
  items,
  defaultActiveIndex = 0,
  activeIndex: controlledActiveIndex,
  pillColor = "var(--chip)",
  textColor = "var(--ink)",
  hoverTextColor = "var(--ink)",
  fontSize = 14,
  paddingX = 24,
  paddingY = 13,
  cornerRadius = 20,
  gap = 4,
  neighborPush = 22,
  anchorEdge = "right",
  neckRatio = 0.35,
  stiffness = 260,
  damping = 30,
  mass = 1,
  className = "",
}: GooeyNavbarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const activeIndex = controlledActiveIndex ?? defaultActiveIndex;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Measure initial rects — same width drives SVG pills and <a> boxes so labels stay centered.
  const baseRects = useMemo(() => {
    let curX = 0;
    return items.map((item) => {
      const w = item.width;
      const h = fontSize + paddingY * 2;
      const r = { x: curX, y: 0, width: w, height: h };
      curX += w + gap;
      return r;
    });
  }, [items, fontSize, paddingX, paddingY, gap]);

  const pillHeight = baseRects[0]?.height ?? 47;
  const radius = Math.min(Math.max(cornerRadius, 0), pillHeight / 2);

  // Target separation factors for each gap
  const targetPushFactors = useMemo(() => {
    const isTarget = (idx: number) => idx === hoveredIndex || idx === activeIndex;
    return baseRects.slice(0, -1).map((_, idx) => (isTarget(idx) || isTarget(idx + 1) ? 1 : 0));
  }, [baseRects, hoveredIndex, activeIndex]);

  // Spring Physics Solver Loop
  const [animatedPushFactors, setAnimatedPushFactors] = useState<number[]>(() =>
    baseRects.slice(0, -1).map((_, i) => (i === defaultActiveIndex ? 1 : 0))
  );
  const currentPush = useRef<number[]>(baseRects.slice(0, -1).map((_, i) => (i === defaultActiveIndex ? 1 : 0)));
  const currentVel = useRef<number[]>(baseRects.slice(0, -1).map(() => 0));

  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const updatePhysics = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      const pushVals = currentPush.current;
      const velVals = currentVel.current;
      let isMoving = false;

      for (let i = 0; i < targetPushFactors.length; i++) {
        const target = targetPushFactors[i];
        const pos = pushVals[i] ?? target;
        const vel = velVals[i] ?? 0;

        const force = -stiffness * (pos - target) - damping * vel;
        const nextVel = vel + (force / mass) * dt;
        const nextPos = pos + nextVel * dt;

        if (Math.abs(nextPos - target) > 0.001 || Math.abs(nextVel) > 0.01) {
          pushVals[i] = nextPos;
          velVals[i] = nextVel;
          isMoving = true;
        } else {
          pushVals[i] = target;
          velVals[i] = 0;
        }
      }

      pushVals.length = targetPushFactors.length;
      velVals.length = targetPushFactors.length;
      setAnimatedPushFactors([...pushVals]);

      if (isMoving) {
        animId = requestAnimationFrame(updatePhysics);
      }
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, [targetPushFactors, stiffness, damping, mass]);

  const getTabPositions = useCallback(
    (factors: number[]) => {
      const len = baseRects.length;
      const positions = new Array(len);
      if (len === 0) return positions;

      positions[0] = baseRects[0].x;
      for (let i = 1; i < len; i++) {
        positions[i] =
          positions[i - 1] + baseRects[i - 1].width + gap + neighborPush * (factors[i - 1] ?? 0);
      }
      return positions;
    },
    [baseRects, gap, neighborPush]
  );

  const tabTranslations = useMemo(() => {
    const len = baseRects.length;
    if (len === 0) return [];
    const factors = baseRects.slice(0, -1).map((_, i) => animatedPushFactors[i] ?? targetPushFactors[i] ?? 0);
    const pos = getTabPositions(factors);
    const lastIdx = len - 1;
    const totalExpansion =
      pos[lastIdx] +
      baseRects[lastIdx].width -
      pos[0] -
      (baseRects[lastIdx].x + baseRects[lastIdx].width - baseRects[0].x);

    let offset = 0;
    if (anchorEdge === "right") {
      offset = -totalExpansion;
    } else if (anchorEdge === "center") {
      offset = -totalExpansion / 2;
    }

    return pos.map((p, idx) => p + offset - baseRects[idx].x);
  }, [baseRects, animatedPushFactors, targetPushFactors, getTabPositions, anchorEdge]);

  const currentRects = useMemo(() => {
    return baseRects.map((rect, i) => ({
      ...rect,
      x: rect.x + (tabTranslations[i] ?? 0),
    }));
  }, [baseRects, tabTranslations]);

  // Full SVG Contour (Pills + Liquid Bridges)
  const fullSvgPath = useMemo(() => {
    const paths: string[] = [];
    for (const r of currentRects) {
      paths.push(getPillPath(r, radius));
    }
    for (let i = 0; i < currentRects.length - 1; i++) {
      const factor = animatedPushFactors[i] ?? targetPushFactors[i] ?? 0;
      const bridge = getGooeyBridgePath(
        currentRects[i],
        currentRects[i + 1],
        radius,
        pillHeight * neckRatio,
        factor
      );
      if (bridge) paths.push(bridge);
    }
    return paths.join(" ");
  }, [currentRects, radius, pillHeight, neckRatio, animatedPushFactors, targetPushFactors]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;

    let closestIdx: number | null = null;
    let minDist = Infinity;
    for (let i = 0; i < currentRects.length; i++) {
      const r = currentRects[i];
      const dist = x < r.x ? r.x - x : x > r.x + r.width ? x - (r.x + r.width) : 0;
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    setHoveredIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative block w-max select-none ${className}`}
    >
      {/* SVG Liquid Contour Layer */}
      <svg
        width="100%"
        height="100%"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 z-0 pointer-events-none overflow-visible"
      >
        <path d={fullSvgPath} style={{ fill: pillColor }} fillRule="nonzero" />
      </svg>

      {/* Foreground Navigation Links */}
      <nav
        aria-label="Main"
        className="relative z-10 flex items-center justify-center w-max min-w-max"
        style={{ gap: `${gap}px` }}
      >
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const isActive = activeIndex === idx;
          const tx = tabTranslations[idx] ?? 0;

          const style: React.CSSProperties = {
            fontFamily: "inherit",
            fontWeight: 500,
            fontSize: `${fontSize}px`,
            lineHeight: 1,
            letterSpacing: "normal",
            textAlign: "center",
            whiteSpace: "nowrap",
            width: `${baseRects[idx]?.width ?? 0}px`,
            height: `${pillHeight}px`,
            flexShrink: 0,
            color: isHovered ? hoverTextColor : textColor,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: `${cornerRadius}px`,
            textDecoration: "none",
            cursor: "pointer",
            boxSizing: "border-box",
            appearance: "none",
            position: "relative",
            willChange: "transform",
            transform: `translateX(${tx}px)`,
            transition: "color 0.25s",
          };
          const inner = (
            <>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{item.content ?? item.label}</span>
              {/* Active dot */}
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "4px",
                    marginLeft: "-1.5px",
                    width: "3px",
                    height: "3px",
                    borderRadius: "50%",
                    backgroundColor: "currentColor",
                  }}
                />
              )}
            </>
          );
          const common = {
            ref: (el: HTMLElement | null) => {
              itemRefs.current[idx] = el;
            },
            onMouseEnter: () => setHoveredIndex(idx),
            style,
            "aria-label": item.ariaLabel,
          };
          if (!item.link) {
            return (
              <button key={`tab-${idx}`} type="button" {...common} onClick={item.onPress}>
                {inner}
              </button>
            );
          }
          if (/^https?:/.test(item.link)) {
            return (
              <a key={item.link} href={item.link} target="_blank" rel="noopener noreferrer" {...common}>
                {inner}
              </a>
            );
          }
          return (
            <Link key={item.link} href={item.link} aria-current={isActive ? "page" : undefined} {...common}>
              {inner}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
