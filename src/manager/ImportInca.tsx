import React from 'react'
export default function ImportInca(){
  return (
    <div className="card p-4">
      <div className="text-sm">Import INCA/IMPLM — CSV/XLSX</div>
      <div className="mt-3 flex items-center gap-2">
        <input type="file" className="input border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10" />
        <button className="btn border border-black/10 dark:border-white/10">Importa</button>
      </div>
      <div className="mt-4 text-xs muted">Mappa campi: MARCACAVO, NUMMLF, SEZIONE, TIPOLOGIA, LUNGHEZZA, AREA, SHIP</div>
    </div>
  )
}
