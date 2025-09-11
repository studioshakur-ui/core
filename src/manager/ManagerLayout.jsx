import React from 'react'
import { Outlet, Link } from 'react-router-dom'
export default function ManagerLayout(){
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide muted">Sezione</div>
          <h2 className="text-xl font-extrabold">Manager</h2>
        </div>
        <div className="flex gap-2">
          <Link to="/manager/import-programma" className="btn border border-black/10 dark:border-white/10">Import Programma</Link>
          <Link to="/manager/import-inca" className="btn border border-black/10 dark:border-white/10">Import INCA</Link>
        </div>
      </header>
      <Outlet />
    </section>
  )
}
