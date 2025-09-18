import { HashRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Manager from "./pages/Manager";
import Capo from "./pages/Capo";
import Direzione from "./pages/Direzione";

export default function App(){
  return (
    <HashRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/manager" element={<Manager/>} />
        <Route path="/capo" element={<Capo/>} />
        <Route path="/direzione" element={<Direzione/>} />
      </Routes>
    </HashRouter>
  );
}
