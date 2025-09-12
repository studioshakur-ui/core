import React from "react";
import {
  loadOrg, saveOrg, addMember, addTeam, editTeam,
  moveMember, removeMember, removeTeam,
} from "@/shared/orgStore.js";
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, closestCorners, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { historyCapture } from "@/shared/history.js";

function useOrg() {
  const [org, setOrg] = React.useState(() => loadOrg() || { members: [], teams: [], unassigned: [], suspects: [] });
  React.useEffect(() => { saveOrg(org); }, [org]);
  const reload = () => setOrg(loadOrg() || { members: [], teams: [], unassigned: [], suspects: [] });
  const getMember = (id) => (org?.members || []).find((m) => m.id === id);
  return { org, reload, getMember };
}

function DroppableColumn({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className || ""} ${isOver ? "is-over" : ""}`}>
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
      ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`${isDragging ? "opacity-60 cursor-grabbing" : "cursor-grab"} ${selected ? "ring-2 ring-blue-400 rounded-xl" : ""}`}
    >
      {children}
    </div>
  );
}

function TeamColumn({
  team, org, selected, setSelected,
  onSetCapo, onAddMember, onDeleteTeam,
}) {
  const capo = (org?.members || []).find(m => m.id === team.capo);
  const members = (team?.members || [])
    .map((id) => (org?.members || []).find((m) => m.id === id))
    .filter(Boolean);
  const membersNoCapo = members.filter(m => m.id !== team.capo);

  return (
    <DroppableColumn id={`team:${team.id}`} className="card column">
      <div className="col-head">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <div className="col-title">
              <h3 className={`text-sm font-semibold ${capo ? "" : "text-amber-300"}`}>
                {capo ? <>Capo · {capo.name}</> : "Capo mancante"}
              </h3>
              <span className="subchip" title={`${membersNoCapo.length} membri`}>
                {membersNoCapo.length} membri
              </span>
              {membersNoCapo.length > 15 && <span className="subchip warn">grande squadra</span>}
              {membersNoCapo.length === 0 && <span className="subchip zero">0 membri</span>}
            </div>

            {!capo ? (
              <div className="mt-2 col-meta">
                <button className="btn primary" onClick={() => {
                  const name = prompt("Nome Capo?");
                  if (!name) return;
                  onSetCapo(`__new__:${name}`);
                }}>Nomina Capo</button>

                <label className="text-xs text-secondary">oppure scegli tra i membri:</label>
                <select className="input" value="" onChange={(e) => onSetCapo(e.target.value || undefined)}>
                  <option value="">— seleziona —</option>
                  {members.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
              </div>
            ) : (
              <div className="mt-2 col-meta text-xs text-secondary">
                <span>Sostituisci capo:</span>
                <select className="input" value="" onChange={(e) => onSetCapo(e.target.value || undefined)}>
                  <option value="">— scegli tra i membri —</option>
                  {membersNoCapo.map((m) => (<option key={m.id} value={m.id}>{m.name}</option>))}
                </select>
                <button className="btn ghost" onClick={() => {
                  const name = prompt("Nuovo Capo (crea & imposta)?");
                  if (!name) return;
                  onSetCapo(`__new__:${name}`);
                }}>+ Crea & imposta</button>
                <button className="btn ghost" onClick={()=>{
                  if (!confirm("Rimuovere il capo (la colonna resterà senza capo)?")) return;
                  editTeam(team.id, { capo: undefined });
                }}>Rimuovi Capo</button>
                <button className="btn ghost" onClick={()=>{
                  if (!confirm("Eliminare il Capo (persona) dalla base?")) return;
                  if (team.capo) removeMember(team.capo);
                }}>Elimina Capo</button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="btn icon" title="Aggiungi membro" onClick={onAddMember}>＋</button>
            <button className="btn icon" title="Elimina colonna" onClick={onDeleteTeam}>✖</button>
          </div>
        </div>
      </div>

      <div className="col-body grid gap-2">
        {members.length === 0 ? (
          <div className="text-sm text-secondary">Nessun membro…</div>
        ) : (
          members.map((m) => (
            <DraggableMember key={m.id} id={m.id} selected={selected.has(m.id)}>
              <div className="member">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={selected.has(m.id)}
                  onChange={() =>
                    setSelected(prev => {
                      const n = new Set(prev);
                      n.has(m.id) ? n.delete(m.id) : n.add(m.id);
                      return n;
                    })
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="name truncate-2" title={m.name}>{m.name}</div>
                  <div className="meta">{m.role || "Altro"}</div>
                </div>
                <div className="row-actions flex items-center gap-1">
                  <button className="btn icon" title="Rimuovi dalla squadra" onClick={() => { historyCapture(); moveMember(m.id, null); }}>
                    ↩
                  </button>
                  <button className="btn icon" title="Elimina operaio" onClick={() => {
                    if (!confirm(`Eliminare "${m.name}" dalla base?`)) return;
                    historyCapture(); removeMember(m.id);
                  }}>🗑</button>
                </div>
              </div>
            </DraggableMember>
          ))
        )}
      </div>
    </DroppableColumn>
  );
}

export default function TeamBoard({ selected, setSelected }) {
  const { org, reload, getMember } = useOrg();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeId, setActiveId] = React.useState(null);
  const [orderBy, setOrderBy] = React.useState("capoAZ");

  function handleDragStart(event) { setActiveId(event.active?.id || null); }
  import { rememberRecentTeam } from "@/shared/assist.js";
function handleDragEnd(event) {
  const active = event.active, over = event.over; setActiveId(null);
  if (!active || !over) return;
  const memberId = String(active.id || "").replace("member:", "");
  const overId = String(over.id || "");
  if (!memberId) return;
  historyCapture();
  if (overId === "unassigned") { moveMember(memberId, null); reload(); return; }
  if (overId.startsWith("team:")) {
    const teamId = overId.slice(5);
    moveMember(memberId, teamId);
    rememberRecentTeam(teamId); // <-- mémorise pour les suggestions
    reload();
    return;
  }
}
  function handleDragCancel() { setActiveId(null); }

  const activeMember = activeId && String(activeId).startsWith("member:")
    ? getMember(String(activeId).replace("member:", ""))
    : null;

  const createTeamWithCapo = () => {
    const name = prompt("Nome Capo?");
    if (!name) return;
    historyCapture();
    const t = addTeam("capo");
    const m = addMember({ name });
    moveMember(m.id, t.id);
    editTeam(t.id, { capo: m.id });
    reload();
  };

  const teamsEnriched = (org?.teams || []).map(t => {
    const capo = (org?.members || []).find(m => m.id === t.capo);
    const sizeNoCapo = (t.members || []).filter(id => id !== t.capo).length;
    return { ...t, capoName: capo ? capo.name : "", sizeNoCapo };
  });

  const teamsSorted = [...teamsEnriched].sort((a, b) => {
    if (orderBy === "sizeAsc") return a.sizeNoCapo - b.sizeNoCapo;
    if (orderBy === "sizeDesc") return b.sizeNoCapo - a.sizeNoCapo;
    const A = a.capoName || "ΩΩ", B = b.capoName || "ΩΩ";
    return A.localeCompare(B, "it");
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={(e)=>{ handleDragEnd(e); reload(); }}
      onDragCancel={handleDragCancel}
    >
      <div className="card">
        <div className="flex items-center gap-2">
          <button className="btn primary" onClick={createTeamWithCapo}>+ Nuovo Capo</button>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-sm text-secondary">Ordina colonne:</label>
            <select className="input" value={orderBy} onChange={e => setOrderBy(e.target.value)}>
              <option value="capoAZ">Capo A→Z</option>
              <option value="sizeAsc">Membri ↑</option>
              <option value="sizeDesc">Membri ↓</option>
            </select>
          </div>
        </div>
      </div>

      <div className="columns mt-4">
        {teamsSorted.map((t) => (
          <TeamColumn
            key={t.id}
            team={t}
            org={org}
            selected={selected}
            setSelected={setSelected}
            onSetCapo={(value) => {
              historyCapture();
              if (value && String(value).startsWith("__new__:")) {
                const name = value.slice("__new__:".length);
                const m = addMember({ name });
                moveMember(m.id, t.id);
                editTeam(t.id, { capo: m.id });
              } else if (value) {
                editTeam(t.id, { capo: value });
                moveMember(value, t.id);
              }
            }}
            onAddMember={() => {
              const name = prompt("Nome membro?");
              if (!name) return;
              historyCapture();
              const m = addMember({ name });
              moveMember(m.id, t.id);
            }}
            onDeleteTeam={() => {
              if (!confirm("Eliminare la colonna (Capo e membri torneranno in Sorgente)?")) return;
              historyCapture();
              (t.members || []).forEach(id => moveMember(id, null));
              removeTeam(t.id);
            }}
          />
        ))}
      </div>

      <DragOverlay>
        {activeMember ? (
          <div className="dnd-ghost">
            <div className="font-medium">{activeMember.name}</div>
            <div className="text-xs text-secondary">{activeMember.role || "Altro"}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
