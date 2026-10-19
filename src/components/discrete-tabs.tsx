"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export type DiscreteTab = {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number }>;
};

/** Pill tabs; the active one expands to show its label. Controlled: pass `value` and `onChange`. */
export function DiscreteTabs({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: DiscreteTab[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const move = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const n = (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[n].id);
    (e.currentTarget.parentElement?.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]')[n])?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn("flex flex-wrap items-center gap-3", className)}>
      {tabs.map((tab, i) => (
        <Button
          key={tab.id}
          id={tab.id}
          title={tab.title}
          ButtonIcon={tab.icon}
          isActive={value === tab.id}
          onSelect={() => onChange(tab.id)}
          onKeyDown={(e) => move(e, i)}
        />
      ))}
    </div>
  );
}

function Button({
  id,
  title,
  ButtonIcon,
  isActive,
  onSelect,
  onKeyDown,
}: {
  id: string;
  title: string;
  ButtonIcon: React.ComponentType<
    React.SVGProps<SVGSVGElement> & { size?: number }
  >;
  isActive: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const [showShine, setShowShine] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isActive && isLoaded) {
      setShowShine(true);
      const timer = setTimeout(() => setShowShine(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isActive, isLoaded]);

  const activeColor = "text-primary";

  return (
    <motion.div
      layoutId={"button-id-" + title}
      transition={{
        layout: {
          type: "spring",
          damping: 20,
          stiffness: 230,
          mass: 1.2,
          ease: [0.215, 0.61, 0.355, 1],
        },
      }}
      role="tab"
      aria-label={title}
      id={`tab-${id}`}
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={onKeyDown}
      onClick={() => {
        onSelect();
        setIsLoaded(true);
      }}
      className="w-fit h-fit flex"
      style={{ willChange: "transform" }}
    >
      <motion.div
        layout
        transition={{
          layout: {
            type: "spring",
            damping: 20,
            stiffness: 230,
            mass: 1.2,
          },
        }}
        className={cn(
          "flex items-center gap-1.5 bg-secondary outline outline-1 outline-border overflow-hidden transition-colors duration-75 ease-out  p-3 cursor-pointer",
          isActive && activeColor,
          isActive ? "px-4" : "px-3"
        )}
        style={{
          borderRadius: "25px",
          //   paddingTop: "12px",
          //   paddingBottom: "12px",
          //   paddingLeft: isActive ? "15px" : "12px",
          //   paddingRight: isActive ? "15px" : "12px",
        }}
      >
        <motion.div
          layoutId={"icon-id" + title}
          className="shrink-0"
          style={{ willChange: "transform" }}
        >
          <ButtonIcon size={22} />
        </motion.div>
        {isActive && (
          <motion.div
            className="flex items-center"
            initial={isLoaded ? { opacity: 0, filter: "blur(4px)" } : false}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: isLoaded ? 0.2 : 0,
              ease: [0.86, 0, 0.07, 1],
            }}
          >
            <motion.span
              layoutId={"text-id-" + title}
              className="text-sm font-medium whitespace-nowrap relative inline-block"
              style={{ willChange: "transform" }}
            >
              {title}
            </motion.span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
