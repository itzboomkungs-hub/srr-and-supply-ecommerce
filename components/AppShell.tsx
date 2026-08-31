"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className={`app-shell ${
        sidebarOpen ? "sidebar-open" : "sidebar-closed"
      }`}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-main">
        <Topbar
          onMenuClick={() => setSidebarOpen((current) => !current)}
        />

        <main className="app-content">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="ปิดเมนู"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}