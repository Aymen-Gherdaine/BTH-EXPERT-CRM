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
  safetyPx?: number
  /** Valeur initiale (doit matcher le rendu SSR pour éviter un mismatch d'hydratation) */
  initialPerPage?: number
  /** Mesure synchrone dans useLayoutEffect (avant paint) → supprime le "saut" post-hydratation */
  immediate?: boolean
}

export function useDynamicPerPage(
  gridRef: RefObject<HTMLElement | null>,
  {
    view, isDesktop,
    cardHeight = 172, rowHeight = 66, cols = 3,
    tableHeaderHeight = 48, pagerHeight = 64, mobilePerPage = 6,
    safetyPx = 0, initialPerPage = 8, immediate = false,
  }: Options,
  deps: unknown[] = [],
): number {
  const [perPage, setPerPage] = useState(initialPerPage)

  useLayoutEffect(() => {
    function calc() {
      // Mobile : valeur fixe, indépendante d'un conteneur mesuré (la vue cartes
      // n'attache pas gridRef). À traiter AVANT le null-check du ref, sinon
      // perPage reste bloqué sur initialPerPage et la pagination disparaît.
      if (!isDesktop) { setPerPage(mobilePerPage); return }
      const el = gridRef.current
      if (!el) return

      // Measure from container top to viewport bottom — stable, independent of content
      const top = el.getBoundingClientRect().top
      const avail = window.innerHeight - top - pagerHeight - safetyPx

      if (view === "cards") {
        const rows = Math.max(1, Math.floor(avail / cardHeight))
        setPerPage(rows * cols)
      } else {
        const rows = Math.max(1, Math.floor((avail - tableHeaderHeight) / rowHeight))
        setPerPage(rows)
      }
    }
    // Mesure synchrone optionnelle (avant paint) pour éviter un reflow visible,
    // puis double rAF pour re-stabiliser une fois le layout définitif.
    if (immediate) calc()
    const id = requestAnimationFrame(() => requestAnimationFrame(calc))
    window.addEventListener("resize", calc)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("resize", calc)
    }
    // Do NOT observe gridRef — that would refire when content changes height → feedback loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isDesktop, gridRef, cardHeight, rowHeight, cols, tableHeaderHeight, pagerHeight, mobilePerPage, immediate, ...deps])

  return perPage
}
