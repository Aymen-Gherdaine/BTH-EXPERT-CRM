"use client"
import { useState, useLayoutEffect, RefObject } from "react"

interface Options {
  view: "cards" | "table"
  isDesktop: boolean
  cardHeight?: number
  rowHeight?: number
  cols?: number
  tableHeaderHeight?: number
  pagerHeight?: number
  mobilePerPage?: number
}

export function useDynamicPerPage(
  gridRef: RefObject<HTMLElement | null>,
  {
    view, isDesktop,
    cardHeight = 172, rowHeight = 66, cols = 3,
    tableHeaderHeight = 48, pagerHeight = 64, mobilePerPage = 6,
  }: Options,
  deps: unknown[] = [],
): number {
  const [perPage, setPerPage] = useState(8)

  useLayoutEffect(() => {
    function calc() {
      const el = gridRef.current
      if (!el) return
      if (!isDesktop) { setPerPage(mobilePerPage); return }

      // Measure from container top to viewport bottom — stable, independent of content
      const top = el.getBoundingClientRect().top
      const avail = window.innerHeight - top - pagerHeight

      if (view === "cards") {
        const rows = Math.max(1, Math.floor(avail / cardHeight))
        setPerPage(rows * cols)
      } else {
        const rows = Math.max(1, Math.floor((avail - tableHeaderHeight) / rowHeight))
        setPerPage(rows)
      }
    }
    // Double rAF lets the layout stabilise before measuring
    const id = requestAnimationFrame(() => requestAnimationFrame(calc))
    window.addEventListener("resize", calc)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("resize", calc)
    }
    // Do NOT observe gridRef — that would refire when content changes height → feedback loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isDesktop, gridRef, cardHeight, rowHeight, cols, tableHeaderHeight, pagerHeight, mobilePerPage, ...deps])

  return perPage
}
