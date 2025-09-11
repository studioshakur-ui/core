import React from 'react'
import { Outlet } from 'react-router-dom'
export default function CapoLayout(){
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide muted">Sezione</div>
          <h2 className="text-xl font-extrabold">Capo</h2>
        </div>
        <div className="flex gap-2">
          <button className="btn border border-black/10 dark:border-white/10">Nuovo report</button>
          <button className="btn border border-transparent hover:bg-black/5 dark:hover:bg-white/10">Esporta</button>
        </div>
      </header>
      <Outlet />
    </section>
  )
}
