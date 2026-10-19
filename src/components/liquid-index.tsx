"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react"
import { type LucideIcon } from "lucide-react"
import { LiquidGradientCanvas } from "./liquid-index-canvas"

const SPRING = { type: "spring" as const, bounce: 0, duration: 0.36 }
const COLOR_EASE = [0.25, 0.1, 0.25, 1] as const

export type LiquidItem = {
  title: string
  description: string
  icon: LucideIcon
  seed: number
  colors: [number, number, number][]
}

function useIsPhone() {
  const [isPhone, setIsPhone] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 809px)")
    const update = () => setIsPhone(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return isPhone
}

/** A list whose hover badge is a liquid gradient that follows the row. Items are passed in. */
export function LiquidIndex({ items: ITEMS }: { items: LiquidItem[] }) {
  const isPhone = useIsPhone()
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState<number | null>(null)
  const [offsetY, setOffsetY] = useState(0)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const current = active == null ? ITEMS[0] : ITEMS[active]
  const Icon = current.icon
  const transition = reduceMotion ? { duration: 0 } : SPRING

  useLayoutEffect(() => {
    if (isPhone || active == null) {
      setOffsetY(0)
      return
    }

    const first = itemRefs.current[0]
    const item = itemRefs.current[active]
    if (!first || !item) return

    setOffsetY(item.offsetTop - first.offsetTop)
  }, [active, isPhone])

  return (
    <div
      className={
        isPhone
          ? "flex w-full flex-col items-start gap-[27px]"
          : "flex w-full flex-row items-stretch gap-12"
      }
    >
      <div
        className={
          isPhone
            ? "relative flex w-[120px] shrink-0 flex-col items-center"
            : "relative flex w-[220px] shrink-0 flex-col items-center"
        }
      >
        <motion.div
          className={
            isPhone
              ? "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] bg-muted"
              : "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[32px] bg-muted"
          }
          initial={false}
          animate={{
            opacity: 1,
            y: isPhone || active == null ? 0 : offsetY,
          }}
          transition={transition}
        >
          <div className="absolute inset-0">
            <LiquidGradientCanvas
              colors={current.colors}
              seed={current.seed}
              paused={!!reduceMotion}
            />
          </div>
          <div
            className={
              isPhone
                ? "relative z-[2] flex size-9 items-center justify-center text-white"
                : "relative z-[2] flex size-14 items-center justify-center text-white"
            }
          >
            <AnimatePresence initial={false} mode="sync">
              <motion.span
                key={current.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.18,
                  ease: COLOR_EASE,
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Icon
                  className={isPhone ? "size-7" : "size-10"}
                  fill="currentColor"
                  strokeWidth={0}
                  aria-hidden
                />
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <div
        className={
          isPhone
            ? "flex min-w-0 flex-1 flex-col items-start gap-[19px] py-0"
            : "flex min-w-0 flex-1 flex-col items-start gap-[22px] py-0"
        }
        onMouseLeave={() => {
          if (!isPhone) setActive(null)
        }}
      >
        <div className="flex w-full flex-col items-start">
          {ITEMS.map((item, index) => {
            const isActive = active === index
            const inactive = active != null && !isActive

            return (
              <motion.button
                key={item.title}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                type="button"
                onMouseEnter={() => {
                  if (!isPhone) setActive(index)
                }}
                onClick={() => {
                  if (isPhone) setActive(isActive ? null : index)
                }}
                className={
                  isPhone
                    ? "flex w-full cursor-pointer flex-col items-start gap-[3px] py-[8px] text-left"
                    : "flex w-auto max-w-full cursor-pointer flex-col items-start gap-0 py-[10px] text-left"
                }
                animate={{ paddingLeft: isActive ? 8 : 0 }}
                transition={transition}
              >
                <motion.span
                  className={
                    isPhone
                      ? "w-full select-none text-[22px] font-medium leading-[1.2em] tracking-[-0.025em] whitespace-pre-wrap"
                      : "w-auto select-none text-[clamp(22px,2.6vw,34px)] font-medium leading-[1.15em] tracking-[-0.03em]"
                  }
                  animate={{
                    color: inactive
                      ? "var(--muted-foreground)"
                      : "var(--foreground)",
                  }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    ease: COLOR_EASE,
                  }}
                >
                  {item.title}
                </motion.span>
                <span className="block max-w-[520px] select-none pb-1 text-[16px] font-normal leading-[1.4em] tracking-[-0.01em] text-muted-foreground">
                  {item.description}
                </span>
              </motion.button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
