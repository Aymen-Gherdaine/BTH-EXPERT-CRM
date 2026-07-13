"use client";

import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS as DndCSS } from "@dnd-kit/utilities";
import type { Prospect } from "@/types";
import { formatDateFr } from "@/lib/utils";
import {
  KANBAN_ETAPES,
  getEtapeCfg,
  getLastVisite,
  getProspectEtape,
  isProspectOverdue,
  prospectRef,
  type EtapeCfg,
} from "../lib";
import { EtapeBadge } from "../components";

function KanbanCard({ prospect, refCode, today, dragging = false, overlay = false }: {
  prospect: Prospect;
  refCode: string;
  today: Date;
  dragging?: boolean;
  overlay?: boolean;
}) {
  const etape = getProspectEtape(prospect);
  const cfg = getEtapeCfg(etape);
  const lastV = getLastVisite(prospect);
  const overdue = isProspectOverdue(prospect, today);
  const note = lastV?.action_requise || lastV?.notes_visite || prospect.notes_generales;

  return (
    <Link
      href={`/prospection/${prospect.id}`}
      className={`kanban-card bth-focus${dragging || overlay ? " is-dragging" : ""}`}
      style={{
        borderLeftColor: overdue ? "#c44a3a" : cfg.dot,
        pointerEvents: overlay ? "none" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ minWidth: 0, color: "#1a1714", fontSize: 14, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {prospect.entreprise}
        </span>
        <span className="tnum" style={{ color: "#b0a898", fontSize: 12, fontWeight: 400, flexShrink: 0 }}>
          {refCode}
        </span>
      </div>

      <p style={{ marginTop: 6, color: "#887f74", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {prospect.nom_contact}
        {prospect.poste_contact && <span> · {prospect.poste_contact}</span>}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
        <EtapeBadge etape={etape} />
        {overdue && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9c3c30", background: "#fff4f1", padding: "2px 8px", borderRadius: 6, border: "1px solid #efc8bf" }}>
            ASAP
          </span>
        )}
      </div>

      {lastV?.date_prochaine_action && (
        <p style={{ marginTop: 9, color: "#887f74", fontSize: 11, fontWeight: 500 }}>
          Relance · {formatDateFr(lastV.date_prochaine_action)}
        </p>
      )}

      {note && <p className="kanban-note">&ldquo;{note}&rdquo;</p>}
    </Link>
  );
}

function SortableKanbanCard({ prospect, refCode, today }: {
  prospect: Prospect;
  refCode: string;
  today: Date;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: prospect.id,
    data: { etape: getProspectEtape(prospect) },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: DndCSS.Transform.toString(transform),
        transition: transition ?? "transform 200ms ease-out",
      }}
      {...attributes}
      {...listeners}
    >
      <KanbanCard prospect={prospect} refCode={refCode} today={today} dragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ cfg, prospects, prospectRefMap, today }: {
  cfg: EtapeCfg;
  prospects: Prospect[];
  prospectRefMap: Map<string, number>;
  today: Date;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: cfg.value });

  return (
    <section
      ref={setNodeRef}
      className={`kanban-column${isOver ? " is-over" : ""}`}
      style={{ "--kanban-column-width": `${cfg.width}px` } as CSSProperties}
    >
      <div className="kanban-column-header">
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="kanban-column-title">
            {cfg.label}
          </h2>
          <p className="kanban-column-description">{cfg.description}</p>
        </div>
        <span style={{ color: "#635c54", background: "#f5f0e8", border: "1px solid #e8e2d8", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
          {prospects.length}
        </span>
      </div>

      <SortableContext items={prospects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-list">
          {prospects.length === 0 ? (
            <p style={{ color: "#887f74", fontSize: 12, fontStyle: "italic", padding: "10px 4px" }}>
              Aucun prospect
            </p>
          ) : (
            prospects.map((p) => (
              <SortableKanbanCard
                key={p.id}
                prospect={p}
                refCode={prospectRef(prospectRefMap.get(p.id) ?? 0)}
                today={today}
              />
            ))
          )}
        </div>
      </SortableContext>

      <Link href="/prospection/nouveau" className="kanban-add bth-focus">
        <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Ajouter
      </Link>
    </section>
  );
}

export function KanbanView({ prospects, prospectRefMap, today, activeId, onDragStart, onDragEnd, scrollRef, activeIndex, onScroll, onDotClick }: {
  prospects: Prospect[];
  prospectRefMap: Map<string, number>;
  today: Date;
  activeId: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  activeIndex: number;
  onScroll: () => void;
  onDotClick: (index: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );
  const activeProspect = activeId ? prospects.find(p => p.id === activeId) ?? null : null;
  const byEtape = KANBAN_ETAPES.map((cfg) => ({
    cfg,
    prospects: prospects.filter(p => getProspectEtape(p) === cfg.value),
  }));
  const panRef = useRef({ active: false, pointerId: -1, startX: 0, scrollLeft: 0 });

  function canPanBoard(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return true;
    return !target.closest(".kanban-card, .kanban-add, button, a, input, label, select, textarea");
  }

  function handleBoardPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.pointerType === "mouse" && event.button !== 0) || !canPanBoard(event.target)) return;
    const board = event.currentTarget;
    panRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: board.scrollLeft,
    };
    board.classList.add("is-panning");
    board.setPointerCapture(event.pointerId);
  }

  function handleBoardPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan.active || pan.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = pan.scrollLeft - (event.clientX - pan.startX);
  }

  function stopBoardPan(event: ReactPointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan.active || pan.pointerId !== event.pointerId) return;
    panRef.current = { active: false, pointerId: -1, startX: 0, scrollLeft: 0 };
    event.currentTarget.classList.remove("is-panning");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div className="kanban-shell">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div
          ref={scrollRef}
          className="kanban-board"
          onScroll={onScroll}
          onPointerDown={handleBoardPointerDown}
          onPointerMove={handleBoardPointerMove}
          onPointerUp={stopBoardPan}
          onPointerCancel={stopBoardPan}
          onPointerLeave={stopBoardPan}
        >
          {byEtape.map(({ cfg, prospects: colProspects }) => (
            <KanbanColumn
              key={cfg.value}
              cfg={cfg}
              prospects={colProspects}
              prospectRefMap={prospectRefMap}
              today={today}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
          {activeProspect ? (
            <KanbanCard
              prospect={activeProspect}
              refCode={prospectRef(prospectRefMap.get(activeProspect.id) ?? 0)}
              today={today}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="kanban-dots" aria-label="Colonnes Kanban">
        {KANBAN_ETAPES.map((cfg, i) => (
          <button
            key={cfg.value}
            className={`kanban-dot bth-focus${activeIndex === i ? " is-active" : ""}`}
            onClick={() => onDotClick(i)}
            aria-label={`Voir ${cfg.label}`}
          />
        ))}
      </div>
    </div>
  );
}
