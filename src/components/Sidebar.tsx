import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  ArrowLeftRight,
  LineChart,
  LayoutDashboard,
  Coins,
  FileText,
  MessageCircle,
  Twitter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import Logo from "./Logo";

const NAV = [
  { label: "Trade", icon: LineChart, path: "/trade" },
  { label: "Get Tokens", icon: ArrowLeftRight, path: "/faucet" },
  { label: "Positions", icon: Coins, path: "/positions" },
  { label: "Portfolio", icon: LayoutDashboard, path: "/portfolio" },
  { label: "PnL", icon: null, path: "/pnl", dot: true },
];
const BOT = [
  { label: "Documentation", icon: FileText, path: "/docs" },
  {
    label: "Discord",
    icon: MessageCircle,
    path: "https://discord.com/invite/arcium",
    ext: true,
  },
  { label: 'Twitter',       icon: Twitter,         path: 'https://x.com/Arcium' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const W = collapsed ? 60 : 218;

  const isActive = (path: string) => location.pathname === path.split("?")[0];


  return (
    <aside
      style={{
        width: W,
        minWidth: W,
        height: "100vh",
        background: "#0d1117",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        transition: "width .2s ease, min-width .2s ease",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
      }}
    >
      <div
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: collapsed ? "18px 0" : "18px 18px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Logo size={22} />
        {!collapsed && (
          <span
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: "#e8f5e9",
              whiteSpace: "nowrap",
              letterSpacing: "-0.3px",
            }}
          >
            percium
          </span>
        )}
      </div>

      <nav style={{ flex: 1, paddingTop: 6 }}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.path ||
            (item.path === "/trade" && location.pathname === "/trade");

          // const active = isActive(item.path)
          return (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: collapsed ? "10px 0" : "10px 18px",
                justifyContent: collapsed ? "center" : "flex-start",
                cursor: "pointer",
                color: active ? "#00e676" : "#4a6e5a",
                borderLeft: `2px solid ${active ? "#00e676" : "transparent"}`,
                background: active ? "rgba(0,200,83,0.06)" : "transparent",
                marginBottom: 1,
                transition: "all .15s",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#81c784";
                  el.style.background = "rgba(255,255,255,0.02)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "#4a6e5a";
                  el.style.background = "transparent";
                }
              }}
            >
              {Icon && (
                <Icon size={17} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              )}
              {item.dot && !Icon && (
                <div
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: "50%",
                    border: "1.8px solid currentColor",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "currentColor",
                    }}
                  />
                </div>
              )}

              {/* <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span> */}
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 6 }}
      >
        {BOT.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              onClick={() =>
                item.ext
                  ? window.open(item.path, "_blank")
                  : navigate(item.path)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "9px 0" : "9px 18px",
                justifyContent: collapsed ? "center" : "flex-start",
                cursor: "pointer",
                color: "#4a6e5a",
                fontSize: 13,
                transition: "color .15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#81c784")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#4a6e5a")}
            >
              <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>
              )}
            </div>
          );
        })}
        <div
          onClick={() => setCollapsed((c) => !c)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "10px 0" : "10px 18px",
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: "pointer",
            color: "#4a6e5a",
            fontSize: 13,
            marginBottom: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#81c784")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4a6e5a")}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </div>
      </div>
    </aside>
  );
}

