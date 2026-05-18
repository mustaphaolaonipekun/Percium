import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PerciumLogo from "../components/Logo";

/* ─── tiny reusable button ─── */
const Btn = ({ children, onClick, variant = "primary", style = {} }: any) => {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    fontFamily: "Manrope",
    fontWeight: 700,
    fontSize: 13,
    padding: "9px 20px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "all .18s",
    border: "none",
    ...style,
  };
  if (variant === "primary")
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          ...base,
          background: hov ? "#00e676" : "#00c853",
          color: "#051a14",
          transform: hov ? "translateY(-1px)" : "none",
        }}
      >
        {children}
      </button>
    );
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...base,
        background: hov ? "rgba(0,200,83,0.1)" : "transparent",
        color: "#e8f5e9",
        border: "1px solid rgba(0,230,118,0.25)",
      }}
    >
      {children}
    </button>
  );
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: "#051a14",
        minHeight: "100vh",
        fontFamily: "Manrope",
      }}
    >
      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 48px",
          background: "rgba(5,26,20,0.88)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(0,230,118,0.09)",
        }}
      >
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <PerciumLogo size={26} />
          <span
            style={{
              fontWeight: 800,
              fontSize: 17,
              color: "#e8f5e9",
              letterSpacing: "-0.3px",
            }}
          >
            percium
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[].map((l) => (
            <span
              key={l}
              style={{
                fontSize: 14,
                color: "#81c784",
                cursor: "pointer",
                transition: "color .2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e8f5e9")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#81c784")}
            >
              {l}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={() => navigate("/docs")}>
            Documentation
          </Btn>
          <Btn onClick={() => navigate("/trade")}>Launch DApp</Btn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "120px 48px 80px",
          overflow: "hidden",
        }}
      >
        {/* background lines */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0.055,
            pointerEvents: "none",
          }}
          viewBox="0 0 1400 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 200 Q300 160 600 200 T1400 200"
            stroke="#00e676"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M0 420 Q350 370 700 420 T1400 420"
            stroke="#00e676"
            strokeWidth="0.8"
            fill="none"
          />
          <path
            d="M0 640 Q400 590 800 640 T1400 640"
            stroke="#00e676"
            strokeWidth="0.6"
            fill="none"
          />
          <line
            x1="220"
            y1="0"
            x2="220"
            y2="900"
            stroke="#00e676"
            strokeWidth="0.5"
          />
          <line
            x1="620"
            y1="0"
            x2="620"
            y2="900"
            stroke="#00e676"
            strokeWidth="0.3"
          />
          <line
            x1="1080"
            y1="0"
            x2="1080"
            y2="900"
            stroke="#00e676"
            strokeWidth="0.35"
          />
        </svg>
        {/* glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -80,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,200,83,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* content */}
        <div style={{ position: "relative", maxWidth: 580, zIndex: 2 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(0,230,118,0.07)",
              border: "1px solid rgba(0,230,118,0.18)",
              borderRadius: 100,
              padding: "5px 14px",
              marginBottom: 28,
            }}
          >
            <PerciumLogo size={14} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#00e676",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              Percium DEX
            </span>
          </div>

          <h1
            style={{
              fontFamily: "Manrope",
              fontWeight: 800,
              fontSize: "clamp(44px, 5.5vw, 70px)",
              lineHeight: 1.02,
              letterSpacing: "-2.5px",
              color: "#fff",
              marginBottom: 24,
            }}
          >
          The Best Arcium

            <br />
            <span style={{ color: "#00e676" }}>Private Perp Dex</span>
          </h1>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: "#81c784",
              maxWidth: 480,
              marginBottom: 40,
            }}
          >
           Traditional Dex Perps reveals trader intent, enabling copy trading and targeted
            liquidations. But With Percium(Arcium private perp dex), positions, orders, and
            liquidation checks compute privately, only the final PnL is revealed,
            which is reducing adversarial behavior and enabling deeper liquidity.
          </p>

          <div style={{ display: "flex", gap: 14 }}>
            <button
              onClick={() => navigate("/trade")}
              style={{
                background: "#00c853",
                border: "none",
                color: "#051a14",
                fontFamily: "Manrope",
                fontWeight: 800,
                fontSize: 14,
                padding: "13px 28px",
                borderRadius: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all .2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#00e676";
                el.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "#00c853";
                el.style.transform = "none";
              }}
            >
              Launch DApp
            </button>
            <button
              onClick={() => navigate("/docs")}
              style={{
                background: "transparent",
                border: "1px solid rgba(0,230,118,0.22)",
                color: "#e8f5e9",
                fontFamily: "Manrope",
                fontWeight: 600,
                fontSize: 14,
                padding: "13px 28px",
                borderRadius: 10,
                cursor: "pointer",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(0,200,83,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              Read our Documentation
            </button>
          </div>
        </div>

        {/* floating token visual */}
        <div
          style={{
            position: "absolute",
            right: "8%",
            top: "50%",
            transform: "translateY(-50%)",
            width: 340,
            height: 340,
            pointerEvents: "none",
          }}
        >
          <svg
            viewBox="0 0 340 340"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%" }}
          >
            <circle
              cx="170"
              cy="170"
              r="150"
              stroke="rgba(0,230,118,0.08)"
              strokeWidth="1"
            />
            <circle
              cx="170"
              cy="170"
              r="100"
              stroke="rgba(0,200,83,0.12)"
              strokeWidth="1"
            />
            <circle
              cx="170"
              cy="170"
              r="60"
              fill="rgba(0,200,83,0.05)"
              stroke="rgba(0,200,83,0.18)"
              strokeWidth="1"
            />
            {/* percium icon center */}
            <g transform="translate(144,144)">
              <circle
                cx="26"
                cy="26"
                r="25"
                stroke="#00e676"
                strokeWidth="1.5"
              />
              <path
                d="M14 27 L19 21 L24 26 L29 21 L38 27"
                stroke="#00e676"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
            {/* ETH chip */}
            <circle
              cx="262"
              cy="82"
              r="24"
              fill="#0a2420"
              stroke="rgba(0,230,118,0.25)"
              strokeWidth="1"
            />
            <text
              x="262"
              y="90"
              textAnchor="middle"
              fontSize="18"
              fill="#627eea"
              fontWeight="700"
            >
              Ξ
            </text>
            {/* SOL chip */}
            <circle
              cx="300"
              cy="190"
              r="24"
              fill="#0a2420"
              stroke="rgba(0,230,118,0.25)"
              strokeWidth="1"
            />
            <text
              x="300"
              y="198"
              textAnchor="middle"
              fontSize="16"
              fill="#9945FF"
              fontWeight="700"
            >
              ◎
            </text>
            {/* USDC chip */}
            <circle
              cx="240"
              cy="285"
              r="24"
              fill="#0a2420"
              stroke="rgba(0,230,118,0.25)"
              strokeWidth="1"
            />
            <text
              x="240"
              y="293"
              textAnchor="middle"
              fontSize="16"
              fill="#2775ca"
              fontWeight="700"
            >
              $
            </text>
          </svg>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 48px", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <PerciumLogo size={14} color="#1de9b6" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#1de9b6",
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              How it works
            </span>
          </div>
          <h2
            style={{
              fontFamily: "Manrope",
              fontWeight: 800,
              fontSize: "clamp(30px,4vw,46px)",
              letterSpacing: "-1.5px",
              color: "#fff",
            }}
          >
            Explaining Percium
          </h2>
        </div>

        {/* Flow diagram */}
        <div
          style={{
            background: "#0a2420",
            border: "1px solid rgba(0,230,118,0.1)",
            borderRadius: 20,
            padding: "48px 40px",
            marginBottom: 48,
            maxWidth: 820,
            margin: "0 auto 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 280,
              height: 280,
              background:
                "radial-gradient(circle,rgba(0,200,83,0.04) 0%,transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Keeper bots badge */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                background: "#7c4dff",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 14px",
                borderRadius: 6,
                letterSpacing: "0.5px",
              }}
            >
                              Arcium MXE

               {/* Peprs reveal trader intent,
                enabling copy-trading and targeted liquidations. 
                With Arcium, positions, orders, and liquidation 
                checks compute privately; only final PnL is revealed,
                reducing adversarial behavior and enabling deeper liquidity. */}
            </span>
          </div>

          {/* Main flow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0,
            }}
          >
            {/* (Choose Market), Set Leverage, Set Size, Direction (long/short)  */}
            <FlowNode label="Maker" sub="Post Hidden Order" icon="" />
            <FlowArrow />
            <FlowNode label="Sources Liquidity" sub="Deep Liquidity " icon="" />
            <FlowArrow />
            <div
              style={{
                background: "#0f9b5e",
                border: "1px solid #00c853",
                borderRadius: 14,
                padding: "18px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                minWidth: 150,
              }}
            >
              <PerciumLogo size={28} color="#fff" />
              <span
                style={{
                  fontFamily: "Manrope",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                PERCIUM

              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
               Private Perps Engine
              </span>
            </div>
            <FlowArrow />
            <FlowNode label="Taker" sub="Execute Trades" icon="" />
            <FlowArrow />
            <FlowNode label="Solana" sub="All postions On-chain" icon="" />
          </div>

          {/* down arrow to maker */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "18px 0",
            }}
          >
            <div
              style={{
                width: 2,
                height: 42,
                background:
                  "linear-gradient(180deg,rgba(0,200,83,0.35),rgba(0,230,118,0.08))",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <FlowNode label="Recieves" sub="Private Positions and Final Pnl" icon="" />
          </div>
        </div>

        {/* Role cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 20,
            maxWidth: 820,
            margin: "0 auto",
          }}
        >
          <RoleCard
            tag="MAKERS"
            tagColor="#0f6e56"
            bg="#fff"
            textColor="#0a2a1f"
            btnBg="rgba(0,200,83,0.1)"
            btnColor="#0f6e56"
            text="Market makers facilitate the buying and selling of cryptocurrencies on Percium by setting leverages, sizes choosing direction, which all are invisible to the market(never revealed)"
         
          />
          <RoleCard
            tag="PERCIUM"
            tagColor="rgba(255,255,255,0.7)"
            bg="#00c853"
            textColor="#fff"
            btnBg="rgba(255,255,255,0.18)"
            btnColor="#fff"
            text="Private Perps Engine( Private Order Matching , Private liquidation Checks, Private Execution logic, Private Risk Engine, Only Final State Revealed)."
            // btnLabel="Launch DApp "
          />
          <RoleCard
            tag="TAKERS"
            tagColor="rgba(255,255,255,0.7)"
            bg="#7c4dff"
            textColor="#fff"
            btnBg="rgba(255,255,255,0.18)"
            btnColor="#fff"
            text="Takers browse the markets, find liquidity, take the offer, and trade privately; executes trades without seeing the makers intent."
          />       

        </div>
      </section>

      {/* ── TRY SECTION ── */}
      <section
        style={{
          background: "#0a2420",
          padding: "100px 48px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 0%,rgba(0,200,83,0.05) 0%,transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          <PerciumLogo size={14} color="#1de9b6" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#1de9b6",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            See for yourself
          </span>
        </div>

        <h2
          style={{
            fontFamily: "Manrope",
            fontWeight: 800,
            fontSize: "clamp(32px,4.5vw,52px)",
            letterSpacing: "-2px",
            color: "#fff",
            marginBottom: 36,
            position: "relative",
            zIndex: 1,
          }}
        >
          Try Percium DEX
        </h2>

        <button
          onClick={() => navigate("/trade")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "#0f9b5e",
            border: "none",
            borderRadius: 100,
            padding: "10px 26px",
            fontFamily: "Manrope",
            fontWeight: 700,
            fontSize: 15,
            color: "#fff",
            cursor: "pointer",
            marginBottom: 48,
            transition: "all .2s",
            position: "relative",
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "#00c853";
            el.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "#0f9b5e";
            el.style.transform = "none";
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#00e676",
            }}
          />
          Blast Now →
        </button>

        {/* DEX preview mockup */}
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <DexPreviewMockup navigate={navigate} />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: "#071e17",
          borderTop: "1px solid rgba(0,230,118,0.09)",
          padding: "60px 48px 32px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "280px 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <PerciumLogo size={22} />
              <span style={{ fontWeight: 800, fontSize: 16, color: "#e8f5e9" }}>
                percium
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#4a6e5a", lineHeight: 1.65 }}>
              Private perpetual trading on Solana, powered by Arcium's MXE
              confidential computing network.
            </p>
          </div>
          {/* <FooterCol
            title="PRODUCT"
            links={["Percium DEX", "General Docs"]}
            
            
            navigate={navigate ("/docs")}

          /> */}
      
          {/* <FooterCol
            title="DEVELOPERS"
            links={[
              "Ecosystem",
              "Technical Docs",
              "Implement our SDK",
              "Github",
            ]}
            navigate={navigate}
          /> */}
          {/* <FooterCol
            title="COMPANY"
            links={["Blog", "Contributors", "Brand assets", "Contact"]}
            navigate={navigate}
          /> */}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 24,
            borderTop: "1px solid rgba(0,230,118,0.08)",
          }}
        >
          <p style={{ fontSize: 13, color: "#4a6e5a" }}>
            Percium © 2026. All rights reserved.
          </p>
          
          {/* <div style={{ display: "flex", gap: 12 }}>
            {["𝕏", "in"].map((s) => (
              <div

                key={s}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid rgba(0,230,118,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4a6e5a",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "#00e676";
                  el.style.color = "#00e676";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(0,230,118,0.1)";
                  el.style.color = "#4a6e5a";
                }}
              >
                {s}
              </div>
            ))}
          </div> */}
        </div>
      </footer>
    </div>
  );
}
// https://discord.com/invite/arcium

/* ─── sub-components ─── */

function FlowNode({
  label,
  sub,
  icon,
}: {
  label: string;
  sub: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "#0d2e22",
        border: "1px solid rgba(0,230,118,0.12)",
        borderRadius: 10,
        padding: "10px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        minWidth: 88,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#e8f5e9" }}>
        {label}
      </span>
      <span style={{ fontSize: 10, color: "#4a6e5a" }}>{sub}</span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div
      style={{
        width: 40,
        height: 2,
        background:
          "linear-gradient(90deg,rgba(0,230,118,0.15),rgba(0,200,83,0.35))",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -1,
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderLeft: "6px solid rgba(0,200,83,0.4)",
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
        }}
      />
    </div>
  );
}

function RoleCard({
  tag,
  tagColor,
  bg,
  textColor,
  btnBg,
  btnColor,
  text,
  btnLabel,
}: any) {
  return (
    <div style={{ background: bg, borderRadius: 16, padding: "26px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <PerciumLogo size={12} color={tagColor} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: tagColor,
          }}
        >
          {tag}
        </span>
      </div>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.72,
          color: textColor,
          marginBottom: 20,
        }}
      >
        {text}
      </p>
      {/* <button
        style={{
          background: btnBg,
          color: btnColor,
          border: "none",
          borderRadius: 8,
          padding: "9px 18px",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "Manrope",
        }}
      >
        {btnLabel} →
      </button> */}
    </div>
  );
}

function FooterCol({
  title,
  links,
  navigate,
}: {
  title: string;
  links: string[];
  navigate: any;
}) {
  return (
    <div>
      <h5
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#1de9b6",
          textTransform: "uppercase",
          letterSpacing: "2px",
          marginBottom: 16,
        }}
      >
        {title}
      </h5>
      {links.map((l) => (
        <div
          key={l}
          style={{
            fontSize: 14,
            color: "#81c784",
            marginBottom: 10,
            cursor: "pointer",
            transition: "color .2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e8f5e9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#81c784")}
        >
          {l}
        </div>
      ))}
    </div>
  );
}

function DexPreviewMockup({ navigate }: { navigate: any }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1.5fr",
        background: "#161b22",
        border: "1px solid rgba(0,230,118,0.1)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 40px 80px rgba(0,0,0,0.55)",
      }}
    >
      {/* orders side */}
      <div
        style={{ padding: 20, borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h4
          style={{
            fontFamily: "Manrope",
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 14,
            color: "#e8f5e9",
          }}
        >
          Open orders
        </h4>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Buy orders 2", "Filled"].map((t, i) => (
            <span
              key={t}
              style={{
                fontSize: 12,
                padding: "4px 12px",
                borderRadius: 6,
                cursor: "pointer",
                background: i === 0 ? "rgba(0,200,83,0.1)" : "transparent",
                border: `1px solid ${i === 0 ? "#0f9b5e" : "rgba(0,230,118,0.12)"}`,
                color: i === 0 ? "#00e676" : "#4a6e5a",
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 60px 55px",
            gap: 8,
            fontSize: 11,
            color: "#4a6e5a",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "6px 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            marginBottom: 4,
          }}
        >
          <span>Status</span>
          <span>Type</span>
          <span>Side</span>
        </div>
        {[
          ["Open", "Market", "Buy", "#00e676"],
          ["Open", "Limit", "Sell", "#00e676"],
          ["Filled", "Market", "Sell", "#81c784"],
          ["Cancelled", "Limit", "Buy", "#4a6e5a"],
          ["Failed", "Limit", "Buy", "#ef5350"],
        ].map(([status, type, side, color]) => (
          <div
            key={status + type}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 60px 55px",
              gap: 8,
              fontSize: 12,
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              color: "#81c784",
            }}
          >
            <span style={{ color }}>{status}</span>
            <span>{type}</span>
            <span>{side}</span>
          </div>
        ))}
      </div>

      {/* trade form side */}
      <div style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "#0d1117",
            borderRadius: 10,
            padding: 3,
            marginBottom: 14,
          }}
        >
          {["Buy", "Sell"].map((t, i) => (
            <button
              key={t}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 8,
                border: "none",
                fontFamily: "Manrope",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                background: i === 0 ? "#1c2430" : "transparent",
                color: i === 0 ? "#fff" : "#4a6e5a",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Market", "Limit"].map((t, i) => (
            <button
              key={t}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                cursor: "pointer",
                border: `1px solid ${i === 0 ? "#0f9b5e" : "rgba(0,230,118,0.12)"}`,
                background: i === 0 ? "rgba(0,200,83,0.08)" : "transparent",
                color: i === 0 ? "#00e676" : "#4a6e5a",
                fontSize: 13,
                fontFamily: "Manrope",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#4a6e5a",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 6,
          }}
        >
          Token pair
        </div>
        <div
          style={{
            background: "#0d1117",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex" }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#627eea",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
                marginRight: -5,
                zIndex: 1,
              }}
            >
              Ξ
            </span>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#2775ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              $
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#e8f5e9" }}>
            WETH/USDC
          </span>
          <span style={{ marginLeft: "auto", color: "#4a6e5a", fontSize: 12 }}>
            ▾
          </span>
        </div>
        {[
          ["Buy amount", "2.36", "WETH"],
          ["Send amount", "4,380.25", "USDC"],
          ["Limit avg. price", "1 848.54", "USDC"],
        ].map(([label, val, tok]) => (
          <div key={label}>
            <div
              style={{
                fontSize: 11,
                color: "#4a6e5a",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 5,
              }}
            >
              {label}
            </div>
            <div
              style={{
                background: "#0d1117",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "9px 14px",
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 14, color: "#e8f5e9" }}>{val}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4a6e5a" }}>
                {tok}
              </span>
            </div>
          </div>
        ))}
        <div
          style={{
            fontSize: 11,
            color: "#4a6e5a",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 7,
          }}
        >
          Slippage tolerance
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {["0%", "0.25%", "0.5%", "1%", "2%"].map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                padding: "6px 2px",
                borderRadius: 7,
                textAlign: "center",
                border: `1px solid ${i === 0 ? "#0f9b5e" : "rgba(255,255,255,0.08)"}`,
                background: i === 0 ? "rgba(0,200,83,0.1)" : "transparent",
                color: i === 0 ? "#00e676" : "#4a6e5a",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {s}
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate("/trade")}
          style={{
            width: "100%",
            padding: 12,
            background: "#0d8f44",
            border: "none",
            borderRadius: 10,
            fontFamily: "Manrope",
            fontWeight: 700,
            fontSize: 14,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Launch DApp to Trade →
        </button>
      </div>
    </div>
  );
}
