import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import Manager from "@/pages/Manager.jsx";

const Nav = () => (
  <div className="appbar">
    <div className="appbar-left">
      <span className="brand">CORE</span>
      <NavLink to="/dashboard" className="pill">Dashboard</NavLink>
      <NavLink to="/capo" className="pill">Capo</NavLink>
      <NavLink to="/manager" className="pill">Manager</NavLink>
      <NavLink to="/catalogo" className="pill">Catalogo</NavLink>
      <NavLink to="/login" className="pill">Login</NavLink>
    </div>
    <div className="appbar-right">
      <span className="userpill">manager · manager</span>
      <button className="pill">Esci</button>
    </div>
  </div>
);

const Placeholder = ({ title }) => (
  <div className="container"><div className="card"><h2>{title}</h2></div></div>
);

export default function App() {
  return (
    <>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/manager" replace />} />
          <Route path="/manager" element={<Manager />} />
          <Route path="/dashboard" element={<Placeholder title="Dashboard (placeholder)" />} />
          <Route path="/capo" element={<Placeholder title="Capo (placeholder)" />} />
          <Route path="/catalogo" element={<Placeholder title="Catalogo (placeholder)" />} />
          <Route path="/login" element={<Placeholder title="Login (placeholder)" />} />
          <Route path="*" element={<Placeholder title="404" />} />
        </Routes>
      </div>
    </>
  );
}
