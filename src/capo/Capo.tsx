import React from 'react'
export default function Capo(){
  return (
    <div className="card p-4">
      <div className="text-sm mb-3">Inserimento rapido lavoro giornaliero</div>
      <form className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input className="input border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10" placeholder="Attività" />
        <input className="input border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10" placeholder="Ore" />
        <input className="input border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/10" placeholder="Materiale" />
        <button className="btn border border-black/10 dark:border-white/10">Salva</button>
      </form>
    </div>
  )
}
