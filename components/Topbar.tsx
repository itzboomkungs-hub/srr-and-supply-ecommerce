"use client";

import "./topbar.css";

type TopbarProps = {
  onMenuClick?: () => void;
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-button"
          aria-label="เปิดเมนู"
          onClick={onMenuClick}
        >
          ☰
        </button>

        <div className="topbar-search">
          <span className="topbar-search-icon">
            ⌕
          </span>

          <input
            type="text"
            placeholder="ค้นหาสินค้า, PO, ลูกค้า..."
            aria-label="ค้นหา"
          />
        </div>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="topbar-icon-button"
          aria-label="กิจกรรม"
        >
          ◷
        </button>

        <button
          type="button"
          className="topbar-icon-button notification"
          aria-label="การแจ้งเตือน"
        >
          ♧
          <span className="notification-badge">
            5
          </span>
        </button>

        <div className="topbar-divider" />

        <div className="topbar-user">
          <div className="topbar-avatar">
            A
          </div>

          <div className="topbar-user-info">
            <div className="topbar-user-name">
              Admin
            </div>

            <div className="topbar-user-role">
              ผู้ดูแลระบบ
            </div>
          </div>

          <span className="topbar-user-arrow">
            ˅
          </span>
        </div>
      </div>
    </header>
  );
}