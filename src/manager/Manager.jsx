// src/manager/Manager.jsx
import React from "react";
import ManagerHeader from "@/manager/ManagerHeader.jsx";
import SourcePanel from "@/manager/SourcePanel.jsx";
import TeamBoard from "@/manager/TeamBoard.jsx";

export default function Manager() {
  // sélection partagée entre SourcePanel et TeamBoard
  const [selected, setSelected] = React.useState(new Set());

  return (
    <div className="container">
      <ManagerHeader />

      <div className="grid mt-4 gap-4" style={{ gridTemplateColumns: "360px 1fr" }}>
        <SourcePanel
          selected={selected}
          setSelected={setSelected}
          onMoved={() => {}}
        />
        <TeamBoard
          selected={selected}
          setSelected={setSelected}
        />
      </div>
    </div>
  );
}
