import { kpis } from "../mock/data";

export default function Direzione(){
  return (
    <div className="container">
      <h2>Direzione — KPI della Settimana {kpis.settimana}</h2>
      <div className="row row-3" style={{marginTop:12}}>
        <div className="card"><div className="small">Capacità (h)</div><h3>{kpis.capacita}</h3></div>
        <div className="card"><div className="small">Assegnati (h)</div><h3>{kpis.assegnati}</h3></div>
        <div className="card"><div className="small">Copertura</div><h3>{kpis.copertura}%</h3></div>
      </div>
      <div className="row row-2" style={{marginTop:12}}>
        <div className="card"><div className="small">Superamenti</div><h3>{kpis.superamenti}</h3></div>
        <div className="card"><div className="small">HSE KO</div><h3>{kpis.hseKO}</h3></div>
      </div>
      <div className="card" style={{marginTop:12}}>
        <strong>Next actions</strong>
        <ul>
          <li>Ridurre occupazione Team T-03 (+10h disponibili)</li>
          <li>Verificare HSE per corridoi Ponte 7</li>
          <li>Confermare export executive PDF (demo)</li>
        </ul>
      </div>
    </div>
  );
}
