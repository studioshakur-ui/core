import React from "react";
import {
  loadOrg,
  saveOrg,
  addMember,
  addTeam,
  editTeam,
  moveMember,
  removeMember,
  removeTeam,
} from "@/shared/orgStore.js";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { historyCapture } from "@/shared/history.js";

/* ===== hooks org ===== */
function useOrg() {
  const [org, setOrg] = React.useState(loadOrg());
  React.useEffect(() => { saveOrg(org); }, [org]);
  const reload = () => setOrg(loadOrg());
  const getMember = (id) => (org.members || []).find((m) => m.id === id);
  return { org, reload, getMember };
}

/* ===== DnD wrappers ===== */
function DroppableColumn({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className || ""} ${isOver ? "outline outline-2 outline-blue-400/60" : ""}`}>
      {children}
    </div>
  );
}
function DraggableMember({ id, children, selected }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `member:${id}` });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${isDragging ? "opacity-60 cursor-grabbing" : "cursor-grab"} ${selected ? "ring-2 ring-blue-400 rounded-xl" : ""}`}
    >
      {children}
    </div>
  );
}

/* ===== UI cartes ===== */
function MemberCard({ member, checked, onToggle }) {
  return (
    <div className="p-3 rounded-xl border bg-white/70 dark:bg-white/10 flex items-center gap-2">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={onToggle} />
      <div className="min-w-0">
        <div className="font-medium truncate">{member.name}</div>
        <div className="text-xs opacity-70">{member.role || "Altro"}</div>
      </div>
    </div>
  );
}

/* ===== Colonne équipe ===== */
function TeamColumn({
  team,
  org,
  selected,
  setSelected,
  onChangeName,
  onSetCapo,
  onAddMember,
  onMoveMember,
  onDeleteTeam,
}) {
  const members = (team.members || [])
    .map((id) => (org.members || []).find((m) => m.id === id))
    .filter(Boolean);

  const allTeamsExcept = (org.teams || []).filter((t) => t.id !== team.id);

  return (
    <DroppableColumn id={`team:${team.id}`} className="card">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <input className="input w-full" value={team.name} onChange={(e) => onChangeName(e.target.value)} />
          <div className="text-xs mt-1 opacity-70">
            Capo:
            <select className="input ml-2" value={team.capo || ""} onChange={(e) => onSetCapo(e.target.value || undefined)}>
              <option value="">— nessuno —</option>
              {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
            </select>
          </div>
          {!members.length ? <div className="text-xs mt-1 text-amber-700">Squadra vuota</div> : null}
          {!team.capo ? <div className="text-xs mt-1 text-amber-700">Capo mancante</div> : null}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={onAddMember}>+ Membro</button>
          <button className="btn" title="Elimina squadra" onClick={onDeleteTeam}>✖</button>
        </div>
      </div>

      {/* Actions de masse (pour les membres sélectionnés de CETTE équipe) */}
      <div className="flex items-center gap-2 mb-2">
        <select className="input" id={`bulk-${team.id}`}>
          <option value="">⇄ Sposta selezionati…</option>
          <option value="__unassigned__">— Non assegnati —</option>
          {allTeamsExcept.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
        </select>
        <button
          className="btn"
          onClick={() => {
            const to = document.getElementById(`bulk-${team.id}`).value || "";
            if (!to) return;
            historyCapture();
            const ids = (team.members || []).filter((id) => selected.has(id));
            ids.forEach((id) => {
              if (to === "__unassigned__") onMoveMember(id, null, false);
              else onMoveMember(id, to, false);
            });
            setSelected((s) => {
              const n = new Set([...s]);
              ids.forEach((id) => n.delete(id));
              return n;
            });
          }}
        >
          Applica
        </button>
      </div>

      <div className="grid gap-2">
        {members.length === 0 ? (
          <div className="text-sm opacity-60">Nessun membro…</div>
        ) : (
          members.map((m) => (
            <DraggableMember key={m.id} id={m.id} selected={selected.has(m.id)}>
              <MemberCard
                member={m}
                checked={selected.has(m.id)}
                onToggle={() =>
                  setSelected((prev) => {
                    const n = new Set([...prev]);
                    n.has(m.id) ? n.delete(m.id) : n.add(m.id);
                    return n;
                  })
                }
              />
            </DraggableMember>
          ))
        )}
      </div>
    </DroppableColumn>
  );
}

/* ===== Board ===== */
export default function OrgBoard() {
  const { org, reload, getMember } = useOrg();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = React.useState(null);
  const [selected, setSelected] = React.useState(new Set());
  const [filter, setFilter] = React.useState("");

  function handleDragStart(event) { setActiveId(event.active?.id || null); }
  function handleDragEnd(event) {
    const active = event.active, over = event.over; setActiveId(null);
    if (!active || !over) return;
    const memberId = String(active.id || "").replace("member:", "");
    const overId = String(over.id || "");
    if (!memberId) return;
    historyCapture();
    if (overId === "unassigned") { moveMember(memberId, null); reload(); return; }
    if (overId.startsWith("team:")) { moveMember(memberId, overId.slice(5)); reload(); return; }
  }
  function handleDragCancel() { setActiveId(null); }

  const activeMember = activeId && String(activeId).startsWith("member:")
    ? getMember(String(activeId).replace("member:", ""))
    : null;

  const handleAddMemberUnassigned = () => {
    const name = prompt("Nome membro?"); if (!name) return;
    historyCapture(); addMember({ name }); reload();
  };
  const handleCreateTeam = () => {
    const name = prompt("Nome squadra?"); if (!name) return;
    historyCapture(); addTeam(name); reload();
  };

  // filtre nuage
  const unassignedMembers = (org.unassigned || [])
    .map((id) => (org.members || []).find((m) => m.id === id))
    .filter(Boolean)
    .filter((m) => m.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Tools nuage */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-end gap-2 justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold">Nuage (Non assegnati)</h3>
            <input className="input" placeholder="Filtra…" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <button className="btn" onClick={() => setSelected(new Set())}>Deseleziona tutto</button>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn" onClick={handleAddMemberUnassigned}>+ Membro</button>
            <button className="btn" onClick={handleCreateTeam}>+ Nuova squadra</button>
            {/* move selected from Nuage */}
            <select className="input" id="bulk-unassigned">
              <option value="">⇄ Sposta selezionati in squadra…</option>
              {(org.teams || []).map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
            <button
              className="btn"
              onClick={() => {
                const to = document.getElementById("bulk-unassigned").value || "";
                if (!to) return;
                const ids = (org.unassigned || []).filter((id) => selected.has(id));
                if (!ids.length) return;
                historyCapture();
                ids.forEach((id) => moveMember(id, to));
                setSelected((s) => {
                  const n = new Set([...s]);
                  ids.forEach((id) => n.delete(id));
                  return n;
                });
                reload();
              }}
            >
              Applica
            </button>
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {/* Nuage */}
        <DroppableColumn id="unassigned" className="card">
          <div className="grid gap-2">
            {unassignedMembers.length === 0 ? (
              <div className="text-sm opacity-60">Nessun membro…</div>
            ) : (
              unassignedMembers.map((m) => (
                <DraggableMember key={m.id} id={m.id} selected={selected.has(m.id)}>
                  <MemberCard
                    member={m}
                    checked={selected.has(m.id)}
                    onToggle={() =>
                      setSelected((prev) => {
                        const n = new Set([...prev]);
                        n.has(m.id) ? n.delete(m.id) : n.add(m.id);
                        return n;
                      })
                    }
                  />
                </DraggableMember>
              ))
            )}
          </div>
        </DroppableColumn>

        {/* Equipes */}
        {(org.teams || []).map((t) => (
          <TeamColumn
            key={t.id}
            team={t}
            org={org}
            selected={selected}
            setSelected={setSelected}
            onChangeName={(name) => { historyCapture(); editTeam(t.id, { name }); reload(); }}
            onSetCapo={(capo) => { historyCapture(); editTeam(t.id, { capo }); reload(); }}
            onAddMember={() => { const name = prompt("Nome membro?"); if (!name) return; historyCapture(); const m = addMember({ name }); moveMember(m.id, t.id); reload(); }}
            onMoveMember={(memberId, toId, capture = true) => {
              if (capture) historyCapture();
              if (toId === "__delete__") {
                if (!confirm("Rimuovere il membro dalla base?")) return;
                removeMember(memberId);
              } else {
                moveMember(memberId, toId); // null => unassigned
              }
              reload();
            }}
            onDeleteTeam={() => { if (!confirm(`Eliminare la squadra "${t.name}"?`)) return; historyCapture(); removeTeam(t.id); reload(); }}
          />
        ))}
      </div>

      <DragOverlay>{activeMember ? (
        <div className="p-3 rounded-xl border bg-white/90">
          <div className="font-medium">{activeMember.name}</div>
          <div className="text-xs opacity-70">{activeMember.role || "Altro"}</div>
        </div>
      ) : null}</DragOverlay>
    </DndContext>
  );
}
