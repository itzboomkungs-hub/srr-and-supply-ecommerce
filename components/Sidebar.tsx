"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import "./sidebar.css";

type MenuItem = {
  label: string;
  href: string;
};

type MenuGroup = {
  title: string;
  icon: string;
  items?: MenuItem[];
  badge?: number;
};

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

const menuGroups: MenuGroup[] = [
  {
    title: "ภาพรวม",
    icon: "⌂",
    items: [
      {
        label: "Dashboard",
        href: "/",
      },
    ],
  },

  {
    title: "จัดการสินค้า",
    icon: "▣",
    items: [
      {
        label: "สินค้า",
        href: "/products",
      },
      {
        label: "หมวดหมู่สินค้า",
        href: "/product-categories",
      },
    ],
  },

  {
    title: "สินค้าคงคลัง",
    icon: "□",
    items: [
      {
        label: "สินค้าคงคลัง",
        href: "/inventory",
      },
      {
        label: "เช็คสินค้าคงคลัง",
        href: "/stock-count",
      },
      {
        label: "เติมสินค้า",
        href: "/stock-replenishment",
      },
      {
        label: "ผู้จัดจำหน่าย",
        href: "/suppliers",
      },
      {
        label: "รายการเคลื่อนไหว",
        href: "/stock-movements",
      },
      {
        label: "รายงานสินค้าคงคลัง",
        href: "/inventory-reports",
      },
    ],
  },

  {
    title: "การขาย",
    icon: "▤",
    badge: 7,
    items: [
      {
        label: "ออเดอร์",
        href: "/orders",
      },
      {
        label: "PO ลูกค้า",
        href: "/customer-po",
      },
      {
        label: "รายงานการขาย",
        href: "/sales-reports",
      },
      {
        label: "ลูกค้า",
        href: "/customers",
      },
    ],
  },

  {
    title: "จัดซื้อ",
    icon: "☷",
    badge: 4,
    items: [
      {
        label: "PR",
        href: "/purchase-requests",
      },
      {
        label: "PO จัดซื้อ",
        href: "/purchase-orders",
      },
      {
        label: "ประวัติการจัดซื้อ",
        href: "/purchase-history",
      },
    ],
  },

  {
    title: "จัดส่ง",
    icon: "▰",
    badge: 18,
    items: [
      {
        label: "รอจัดส่ง",
        href: "/shipments",
      },
      {
        label: "ประวัติการจัดส่ง",
        href: "/shipment-history",
      },
    ],
  },

  {
    title: "เอกสารและภาษี",
    icon: "▥",
    items: [
      {
        label: "ใบเสนอราคา",
        href: "/quotations",
      },
      {
        label: "ใบกำกับภาษี",
        href: "/tax-invoices",
      },
      {
        label: "ใบเสร็จรับเงิน",
        href: "/receipts",
      },
    ],
  },

  {
    title: "รายงาน",
    icon: "▦",
    items: [
      {
        label: "รายงานภาพรวม",
        href: "/reports",
      },
    ],
  },
];

function isPathActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return (
    pathname === href ||
    pathname.startsWith(`${href}/`)
  );
}

function getActiveGroup(pathname: string) {
  for (const group of menuGroups) {
    if (!group.items) {
      continue;
    }

    const active = group.items.some((item) =>
      isPathActive(pathname, item.href)
    );

    if (active) {
      return group.title;
    }
  }

  return null;
}

export default function Sidebar({
  open = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  const [openGroup, setOpenGroup] = useState<string | null>(
    getActiveGroup(pathname)
  );

  useEffect(() => {
    setOpenGroup(getActiveGroup(pathname));
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setOpenGroup((current) =>
      current === title ? null : title
    );
  };

  return (
    <aside
  className={`sidebar ${open ? "sidebar-visible" : "sidebar-hidden"}`}
>
      {/* BRAND */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          SR
        </div>

        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">
            SRR AND SUPPLY
          </div>

          <div className="sidebar-brand-subtitle">
            E-COMMERCE
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {menuGroups.map((group) => {
          const hasChildren =
            !!group.items &&
            group.items.length > 0;

          const isOpen =
            openGroup === group.title;

          const hasActiveItem =
            group.items?.some((item) =>
              isPathActive(
                pathname,
                item.href
              )
            ) ?? false;

          /*
           * Dashboard
           */
          if (
            group.title === "ภาพรวม" &&
            group.items?.length === 1
          ) {
            const item = group.items[0];

            return (
              <div
                className="sidebar-section"
                key={group.title}
              >
                <div className="sidebar-section-title">
                  {group.title}
                </div>

                <Link
                  href={item.href}
                  className={`sidebar-item ${
                    isPathActive(
                      pathname,
                      item.href
                    )
                      ? "active"
                      : ""
                  }`}
                >
                  <span className="sidebar-item-icon">
                    {group.icon}
                  </span>

                  <span className="sidebar-item-label">
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          }

          /*
           * GROUP
           */
          return (
            <div
              className={`sidebar-section sidebar-group ${
                isOpen ? "is-open" : ""
              }`}
              key={group.title}
            >
              <button
                type="button"
                className={`sidebar-group-button ${
                  isOpen || hasActiveItem
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  toggleGroup(group.title)
                }
                aria-expanded={isOpen}
              >
                <span className="sidebar-item-icon">
                  {group.icon}
                </span>

                <span className="sidebar-item-label">
                  {group.title}
                </span>

                {group.badge !== undefined && (
                  <span className="sidebar-badge">
                    {group.badge}
                  </span>
                )}

                <span
                  className={`sidebar-group-arrow ${
                    isOpen ? "open" : ""
                  }`}
                >
                  ˅
                </span>
              </button>

              {hasChildren && (
                <div
                  className={`sidebar-submenu ${
                    isOpen ? "visible" : ""
                  }`}
                >
                  {group.items!.map((item) => {
                    const active =
                      isPathActive(
                        pathname,
                        item.href
                      );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-submenu-item ${
                          active ? "active" : ""
                        }`}
                      >
                        <span className="sidebar-submenu-dot">
                          •
                        </span>

                        <span className="sidebar-submenu-label">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* USER */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          A
        </div>

        <div className="sidebar-user-info">
          <div className="sidebar-user-name">
            Admin
          </div>

          <div className="sidebar-user-role">
            ผู้ดูแลระบบ
          </div>
        </div>

        <div className="sidebar-user-arrow">
          ˅
        </div>
      </div>
    </aside>
  );
}