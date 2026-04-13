import { useState, useMemo, useRef } from "react";

const INVESTMENT_TYPES = [
  { label: "Solar Panel Installation", co2Rate: 0.8, life: 25, abatement: 50 },
  { label: "Energy Efficiency Retrofit", co2Rate: 0.5, life: 20, abatement: 40 },
  { label: "EV Fleet Transition", co2Rate: 0.6, life: 10, abatement: 45 },
  { label: "Waste Reduction Program", co2Rate: 0.3, life: 15, abatement: 30 },
  { label: "Green Building Certification", co2Rate: 0.4, life: 30, abatement: 35 },
  { label: "Water Recycling System", co2Rate: 0.2, life: 20, abatement: 25 },
];

const CURRENCIES = [
  { label: "EUR (€)", symbol: "€" },
  { label: "USD ($)", symbol: "$" },
  { label: "GBP (£)", symbol: "£" },
  { label: "SEK (kr)", symbol: "kr" },
];

const WACCS = [4, 6, 8, 10, 12];
const HORIZONS = [5, 10, 15, 20, 25];

// Carbon price escalation per year (regulatory tightening assumption)
const CARBON_ESCALATION = 0.05;
// Assumed carbon price if no investment (penalty/tax per tonne CO2)
const BASE_CARBON_PRICE = 50;

function fmt(val, sym = "€") {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${sym}${Math.round(abs).toLocaleString()}`;
  return `${sign}${sym}${Math.round(abs)}`;
}

function SliderInput({ label, value, min, max, step, onChange, sym, info, color = "#2d7a4f" }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1a3d2b", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
          {info && <span title={info} style={{ marginLeft: 5, cursor: "help", color: "#6aab7f", fontSize: "0.85em" }}>ⓘ</span>}
        </span>
        <span style={{ fontSize: "0.9rem", fontWeight: 700, color }}>{fmt(value, sym)}</span>
      </div>
      <div style={{ position: "relative", height: 6, background: "#d4e9dc", borderRadius: 99 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, #6aab7f, ${color})`, borderRadius: 99, transition: "width 0.1s" }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", cursor: "pointer", height: "100%", margin: 0 }} />
        <div style={{ position: "absolute", left: `calc(${pct}% - 9px)`, top: "50%", transform: "translateY(-50%)", width: 18, height: 18, borderRadius: "50%", background: "#fff", border: `2.5px solid ${color}`, boxShadow: "0 1px 6px rgba(0,0,0,0.15)", pointerEvents: "none", transition: "left 0.1s" }} />
      </div>
    </div>
  );
}

function KPI({ label, value, sub, accent = false, big = false, warn = false }) {
  return (
    <div style={{
      background: accent ? "linear-gradient(135deg, #1a5c35 0%, #2d7a4f 100%)" : warn ? "linear-gradient(135deg, #5c1a1a 0%, #8b2a2a 100%)" : "#fff",
      border: (accent || warn) ? "none" : "1.5px solid #d4e9dc",
      borderRadius: 16, padding: "1.1rem 1.3rem", flex: 1, minWidth: 130,
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: accent ? "#a8dbb8" : warn ? "#ffb3b3" : "#6aab7f", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: big ? "1.7rem" : "1.35rem", fontWeight: 800, color: (accent || warn) ? "#fff" : "#1a3d2b", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: accent ? "#c8f0d4" : warn ? "#ffcccc" : "#7aaa8c", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MiniChart({ data, sym, inactionData }) {
  const W = 580, H = 210, PAD = { top: 16, right: 20, bottom: 36, left: 68 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;
  const allVals = [...data.map(d => d.cumReturn), ...(inactionData || []).map(d => d.cum)];
  const yMin = Math.min(0, ...allVals);
  const yMax = Math.max(0, ...allVals);
  const yRange = yMax - yMin || 1;
  const xScale = i => PAD.left + (i / (data.length - 1)) * iW;
  const yScale = v => PAD.top + iH - ((v - yMin) / yRange) * iH;
  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.cumReturn)}`).join(" ");
  const zeroY = yScale(0);
  const posPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${Math.min(yScale(d.cumReturn), zeroY)}`).join(" ") + ` L${xScale(data.length - 1)},${zeroY} L${xScale(0)},${zeroY} Z`;
  const negPath = data.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${Math.max(yScale(d.cumReturn), zeroY)}`).join(" ") + ` L${xScale(data.length - 1)},${zeroY} L${xScale(0)},${zeroY} Z`;
  const inactionPath = inactionData ? inactionData.map((d, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.cum)}`).join(" ") : null;
  const yTicks = 5;
  const yTickVals = Array.from({ length: yTicks }, (_, i) => yMin + (yRange / (yTicks - 1)) * i);
  const xTicks = data.filter((_, i) => i % 2 === 0);
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, fontFamily: "inherit" }}>
        <defs>
          <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2d7a4f" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#2d7a4f" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e05252" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#e05252" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        {yTickVals.map((v, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yScale(v)} y2={yScale(v)} stroke="#e8f3ec" strokeWidth="1" />
            <text x={PAD.left - 8} y={yScale(v) + 4} textAnchor="end" fontSize="10" fill="#8aab97">{fmt(v, sym)}</text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={zeroY} y2={zeroY} stroke="#2d7a4f" strokeWidth="1.5" strokeDasharray="4,3" />
        <path d={posPath} fill="url(#posGrad)" />
        <path d={negPath} fill="url(#negGrad)" />
        {inactionPath && <path d={inactionPath} fill="none" stroke="#c0392b" strokeWidth="2" strokeDasharray="6,3" strokeLinecap="round" />}
        <path d={linePath} fill="none" stroke="#2d7a4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {xTicks.map((d, i) => (
          <text key={i} x={xScale(data.indexOf(d))} y={H - 8} textAnchor="middle" fontSize="10" fill="#8aab97">Yr {d.year}</text>
        ))}
        {data.map((d, i) => {
          if (i > 0 && data[i - 1].cumReturn < 0 && d.cumReturn >= 0) {
            return (
              <g key={`be-${i}`}>
                <line x1={xScale(i)} x2={xScale(i)} y1={PAD.top} y2={H - PAD.bottom} stroke="#f4c430" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x={xScale(i) + 4} y={PAD.top + 14} fontSize="9" fill="#c89a10" fontWeight="700">BREAKEVEN</text>
              </g>
            );
          }
          return null;
        })}
        {/* Legend */}
        <g transform={`translate(${PAD.left}, ${H - 6})`}>
          <line x1="0" x2="16" y1="0" y2="0" stroke="#2d7a4f" strokeWidth="2.5" />
          <text x="20" y="4" fontSize="9" fill="#4a7a5a">ROI with investment</text>
          {inactionPath && <>
            <line x1="110" x2="126" y1="0" y2="0" stroke="#c0392b" strokeWidth="2" strokeDasharray="4,2" />
            <text x="130" y="4" fontSize="9" fill="#c0392b">Cost of inaction</text>
          </>}
        </g>
      </svg>
    </div>
  );
}

function CostOfInaction({ cost, annualBenefit, horizon, wacc, co2Saved, sym, carbonEscalation }) {
  const inactionData = useMemo(() => {
    let cum = 0;
    return Array.from({ length: horizon + 1 }, (_, yr) => {
      if (yr === 0) return { year: 0, cum: 0 };
      const lostBenefit = annualBenefit * Math.pow(1 + 0.03, yr - 1);
      const carbonPenalty = co2Saved * BASE_CARBON_PRICE * Math.pow(1 + CARBON_ESCALATION, yr - 1);
      const totalLoss = (lostBenefit + carbonPenalty) / Math.pow(1 + wacc / 100, yr);
      cum -= totalLoss;
      return { year: yr, cum };
    });
  }, [annualBenefit, horizon, wacc, co2Saved]);

  const totalInactionCost = Math.abs(inactionData[inactionData.length - 1].cum);
  const avgAnnualLoss = totalInactionCost / horizon;
  const carbonRegulatoryRisk = co2Saved * BASE_CARBON_PRICE * horizon * (1 + CARBON_ESCALATION * horizon / 2);

  return (
    <div style={{ background: "linear-gradient(135deg, #3d1515 0%, #6b2020 100%)", borderRadius: 20, padding: "1.8rem", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
        <span style={{ fontSize: "1.4rem" }}>⚠️</span>
        <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffb3b3" }}>Cost of Inaction</h2>
      </div>
      <p style={{ margin: "0 0 1.2rem", fontSize: "0.85rem", color: "#ffd5d5", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
        If you delay or forgo this investment, here is what your organisation stands to lose over {horizon} years.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.8rem", marginBottom: "1.2rem" }}>
        {[
          { label: "Total Opportunity Loss", value: fmt(totalInactionCost, sym), sub: `Over ${horizon} years (discounted)` },
          { label: "Average Annual Loss", value: fmt(avgAnnualLoss, sym), sub: "Per year of delay" },
          { label: "Carbon Regulatory Risk", value: fmt(carbonRegulatoryRisk, sym), sub: "Escalating carbon taxes" },
          { label: "Delayed Breakeven", value: `+${(horizon * 0.3).toFixed(1)} yrs`, sub: "Extra time to recover if delayed" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.9rem 1rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#ffb3b3", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>{value}</div>
            <div style={{ fontSize: "0.7rem", color: "#ffcccc", marginTop: 3 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "0.9rem 1rem", fontSize: "0.78rem", color: "#ffd5d5", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
        <strong style={{ color: "#ffb3b3" }}>Key risks of inaction:</strong> Increasing energy costs, escalating carbon taxation (assumed {(CARBON_ESCALATION * 100).toFixed(0)}%/yr growth), reputational damage with ESG-focused investors, and competitive disadvantage as peers decarbonise.
      </div>
      {inactionData}
    </div>
  );
}

export default function App() {
  const [invType, setInvType] = useState(0);
  const [cost, setCost] = useState(1_000_000);
  const [savings, setSavings] = useState(80_000);
  const [riskAvoid, setRiskAvoid] = useState(12_500);
  const [revGrowth, setRevGrowth] = useState(20_000);
  const [financeBonus, setFinanceBonus] = useState(25_000);
  const [wacc, setWacc] = useState(8);
  const [horizon, setHorizon] = useState(10);
  const [currency, setCurrency] = useState(0);
  const [activeTab, setActiveTab] = useState("inputs");
  const [showInaction, setShowInaction] = useState(false);
  const printRef = useRef(null);

  const sym = CURRENCIES[currency].symbol;
  const it = INVESTMENT_TYPES[invType];
  const annualBenefit = savings + riskAvoid + revGrowth + financeBonus;
  const escalation = 0.03;

  const yearlyData = useMemo(() => {
    let cumReturn = -cost;
    return Array.from({ length: horizon + 1 }, (_, yr) => {
      if (yr === 0) return { year: 0, benefit: 0, discBenefit: 0, cumReturn: -cost };
      const benefit = annualBenefit * Math.pow(1 + escalation, yr - 1);
      const discBenefit = benefit / Math.pow(1 + wacc / 100, yr);
      cumReturn += discBenefit;
      return { year: yr, benefit, discBenefit, cumReturn };
    });
  }, [cost, annualBenefit, wacc, horizon]);

  const inactionData = useMemo(() => {
    let cum = 0;
    return Array.from({ length: horizon + 1 }, (_, yr) => {
      if (yr === 0) return { year: 0, cum: 0 };
      const lostBenefit = annualBenefit * Math.pow(1 + 0.03, yr - 1);
      const co2Saved = (cost * it.co2Rate) / 1000;
      const carbonPenalty = co2Saved * BASE_CARBON_PRICE * Math.pow(1 + CARBON_ESCALATION, yr - 1);
      const totalLoss = (lostBenefit + carbonPenalty) / Math.pow(1 + wacc / 100, yr);
      cum -= totalLoss;
      return { year: yr, cum };
    });
  }, [annualBenefit, horizon, wacc, cost, it]);

  const npv = yearlyData[yearlyData.length - 1].cumReturn;
  const basicROI = ((annualBenefit * horizon - cost) / cost) * 100;
  const enhancedROI = (npv / cost) * 100;
  const payback = useMemo(() => {
    for (let i = 1; i < yearlyData.length; i++) {
      if (yearlyData[i].cumReturn >= 0) return i - 1 + (-yearlyData[i - 1].cumReturn) / (yearlyData[i].cumReturn - yearlyData[i - 1].cumReturn);
    }
    return null;
  }, [yearlyData]);

  const co2Saved = (cost * it.co2Rate) / 1000;
  const carbonTaxSaving = co2Saved * it.abatement;
  const totalInactionCost = Math.abs(inactionData[inactionData.length - 1].cum);

  const handlePrint = () => {
    window.print();
  };

  const tabStyle = (t) => ({
    padding: "0.55rem 1.2rem", borderRadius: 99, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.05em", transition: "all 0.2s",
    background: activeTab === t ? "#1a5c35" : "transparent",
    color: activeTab === t ? "#fff" : "#4a7a5a",
    fontFamily: "'DM Sans', sans-serif",
  });

  return (
    <div ref={printRef} style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f0faf4 0%, #e8f5ee 40%, #f5fdf7 100%)", fontFamily: "'Bitter', 'Georgia', serif", color: "#1a3d2b" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; appearance: none; }
        select { appearance: none; -webkit-appearance: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.45s ease forwards; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #e8f5ee; }
        ::-webkit-scrollbar-thumb { background: #6aab7f; border-radius: 99px; }
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f3d22 0%, #1a5c35 50%, #2d7a4f 100%)", padding: "2.5rem 2rem 2rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", borderRadius: 99, padding: "0.3rem 0.9rem", marginBottom: "0.8rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a8dbb8", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" }}>🌿 Interactive Calculator</span>
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>Sustainability ROI</h1>
          <p style={{ margin: "0.6rem 0 0", color: "#c8f0d4", fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            Build your business case. Calculate the financial return, payback period, and carbon impact of your sustainability investment.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="no-print" style={{ background: "#fff", borderBottom: "1.5px solid #d4e9dc", padding: "0.8rem 1.5rem", display: "flex", gap: "0.7rem", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        {[{ label: "Horizon", options: HORIZONS, value: horizon, onChange: setHorizon, suffix: " Yrs" }, { label: "WACC", options: WACCS, value: wacc, onChange: setWacc, suffix: "%" }].map(({ label, options, value, onChange, suffix }) => (
          <div key={label} style={{ position: "relative" }}>
            <select value={value} onChange={e => onChange(Number(e.target.value))} style={{ padding: "0.4rem 2rem 0.4rem 0.8rem", borderRadius: 99, border: "1.5px solid #c4dece", background: "#f5fdf7", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 700, color: "#1a5c35", cursor: "pointer" }}>
              {options.map(o => <option key={o} value={o}>{o}{suffix}</option>)}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6aab7f", fontSize: "0.7rem" }}>▾</span>
          </div>
        ))}
        <div style={{ position: "relative" }}>
          <select value={currency} onChange={e => setCurrency(Number(e.target.value))} style={{ padding: "0.4rem 2rem 0.4rem 0.8rem", borderRadius: 99, border: "1.5px solid #c4dece", background: "#f5fdf7", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 700, color: "#1a5c35", cursor: "pointer" }}>
            {CURRENCIES.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#6aab7f", fontSize: "0.7rem" }}>▾</span>
        </div>
        <div style={{ marginLeft: "auto", background: "#f0faf4", borderRadius: 99, padding: "0.25rem", display: "flex", gap: 2 }}>
          {["inputs", "results"].map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
              {t === "inputs" ? "⚙ Inputs" : "📊 Results"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>

        {/* INPUTS TAB */}
        {activeTab === "inputs" && (
          <div className="fade-up" style={{ display: "grid", gap: "1.2rem" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "1.5rem", border: "1.5px solid #d4e9dc" }}>
              <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 800 }}>Investment Type</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: "0.6rem" }}>
                {INVESTMENT_TYPES.map((t, i) => (
                  <button key={i} onClick={() => setInvType(i)} style={{ padding: "0.65rem 0.9rem", borderRadius: 12, border: invType === i ? "2px solid #2d7a4f" : "1.5px solid #d4e9dc", background: invType === i ? "#f0faf4" : "#fff", color: invType === i ? "#1a5c35" : "#4a7a5a", fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", fontWeight: invType === i ? 700 : 500, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    {t.label}
                    <div style={{ fontSize: "0.65rem", color: "#8aab97", marginTop: 2 }}>{t.co2Rate} kg CO₂/{sym}/yr</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 20, padding: "1.5rem", border: "1.5px solid #d4e9dc" }}>
              <h2 style={{ margin: "0 0 1.2rem", fontSize: "1rem", fontWeight: 800 }}>Financial Inputs</h2>
              <SliderInput label="Investment Cost" value={cost} min={50_000} max={10_000_000} step={50_000} onChange={setCost} sym={sym} info="Total upfront capital expenditure" />
              <SliderInput label="Annual Cost Savings (Yr 1)" value={savings} min={0} max={500_000} step={5_000} onChange={setSavings} sym={sym} info="Energy, operational, or material savings" color="#1a8c50" />
              <SliderInput label="Annual Risk Avoidance (Yr 1)" value={riskAvoid} min={0} max={200_000} step={2_500} onChange={setRiskAvoid} sym={sym} info="Avoided fines, penalties, or insurance costs" color="#2a9d6f" />
              <SliderInput label="Annual Revenue Growth (Yr 1)" value={revGrowth} min={0} max={200_000} step={2_500} onChange={setRevGrowth} sym={sym} info="New revenue from green credentials" color="#3ab080" />
              <SliderInput label="Financing Benefit (Yr 1)" value={financeBonus} min={0} max={100_000} step={2_500} onChange={setFinanceBonus} sym={sym} info="Lower cost of capital from green loans" color="#4abf8a" />
            </div>

            <button onClick={() => setActiveTab("results")} style={{ background: "linear-gradient(135deg, #1a5c35, #2d7a4f)", color: "#fff", border: "none", borderRadius: 14, padding: "1rem 2rem", fontSize: "1rem", fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(29,92,53,0.3)", transition: "all 0.15s" }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "none"; }}>
              Calculate ROI →
            </button>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === "results" && (
          <div className="fade-up" style={{ display: "grid", gap: "1.2rem" }}>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.8rem" }}>
              <KPI label="Enhanced ROI" value={`${enhancedROI.toFixed(1)}%`} sub="With 3% escalation" accent big />
              <KPI label="Basic ROI" value={`${basicROI.toFixed(1)}%`} sub="No escalation" />
              <KPI label="Net Present Value" value={fmt(npv, sym)} sub={`${horizon}-yr net value`} />
              <KPI label="Payback Period" value={payback ? `${payback.toFixed(1)} yrs` : "Beyond horizon"} sub="Years to break even" />
              <KPI label="Carbon Tax Savings" value={fmt(carbonTaxSaving, sym)} sub={`${co2Saved.toFixed(0)} t CO₂ saved`} />
              <KPI label="Annual Value" value={fmt(annualBenefit, sym)} sub="Year 1 total benefit" />
            </div>

            {/* Chart */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "1.5rem", border: "1.5px solid #d4e9dc" }}>
              <h2 style={{ margin: "0 0 0.3rem", fontSize: "1rem", fontWeight: 800 }}>ROI Timeline</h2>
              <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", color: "#8aab97", fontFamily: "'DM Sans', sans-serif" }}>Cumulative discounted return over {horizon} years · WACC {wacc}% · 3% annual escalation</p>
              <MiniChart data={yearlyData} sym={sym} inactionData={showInaction ? inactionData : null} />
            </div>

            {/* Cost of Inaction toggle */}
            <button onClick={() => setShowInaction(v => !v)} style={{ background: showInaction ? "#6b2020" : "#fff3f3", color: showInaction ? "#fff" : "#8b2a2a", border: "2px solid #8b2a2a", borderRadius: 14, padding: "0.85rem 1.5rem", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
              ⚠️ {showInaction ? "Hide" : "Show"} Cost of Inaction
              {!showInaction && <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#c0392b", fontWeight: 600 }}>Est. {fmt(totalInactionCost, sym)} loss over {horizon} yrs</span>}
            </button>

            {showInaction && (
              <div className="fade-up">
                <div style={{ background: "linear-gradient(135deg, #3d1515 0%, #6b2020 100%)", borderRadius: 20, padding: "1.8rem", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                    <span style={{ fontSize: "1.4rem" }}>⚠️</span>
                    <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#ffb3b3" }}>Cost of Inaction</h2>
                  </div>
                  <p style={{ margin: "0 0 1.2rem", fontSize: "0.85rem", color: "#ffd5d5", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                    If you delay or forgo this investment, here is what your organisation stands to lose over {horizon} years.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.8rem", marginBottom: "1.2rem" }}>
                    {[
                      { label: "Total Opportunity Loss", value: fmt(totalInactionCost, sym), sub: `Over ${horizon} years (discounted)` },
                      { label: "Avg Annual Loss", value: fmt(totalInactionCost / horizon, sym), sub: "Per year of delay" },
                      { label: "Carbon Regulatory Risk", value: fmt(co2Saved * BASE_CARBON_PRICE * horizon * (1 + CARBON_ESCALATION * horizon / 2), sym), sub: "Escalating carbon taxes" },
                      { label: "Extra Breakeven Delay", value: `+${(horizon * 0.3).toFixed(1)} yrs`, sub: "If you act later" },
                    ].map(({ label, value, sub }) => (
                      <div key={label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "0.9rem 1rem" }}>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#ffb3b3", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#fff" }}>{value}</div>
                        <div style={{ fontSize: "0.7rem", color: "#ffcccc", marginTop: 3 }}>{sub}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "0.9rem 1rem", fontSize: "0.78rem", color: "#ffd5d5", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                    <strong style={{ color: "#ffb3b3" }}>Key risks of inaction:</strong> Rising energy costs, escalating carbon taxes ({(CARBON_ESCALATION * 100).toFixed(0)}%/yr), ESG reputational risk, and competitive disadvantage as peers decarbonise.
                  </div>
                </div>
              </div>
            )}

            {/* Year-by-Year Table */}
            <div style={{ background: "#fff", borderRadius: 20, padding: "1.5rem", border: "1.5px solid #d4e9dc" }}>
              <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 800 }}>Year-by-Year Breakdown</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #d4e9dc" }}>
                      {["Year", "Gross Benefit", "Disc. Benefit", "Cumulative Return", "Status"].map(h => (
                        <th key={h} style={{ padding: "0.5rem 0.8rem", textAlign: "left", fontWeight: 700, color: "#4a7a5a", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyData.slice(1).map((d, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #edf7f1", background: i % 2 === 0 ? "#fafffe" : "#fff" }}>
                        <td style={{ padding: "0.45rem 0.8rem", fontWeight: 700, color: "#1a3d2b" }}>{d.year}</td>
                        <td style={{ padding: "0.45rem 0.8rem", color: "#2d7a4f" }}>{fmt(d.benefit, sym)}</td>
                        <td style={{ padding: "0.45rem 0.8rem", color: "#4a7a5a" }}>{fmt(d.discBenefit, sym)}</td>
                        <td style={{ padding: "0.45rem 0.8rem", fontWeight: 700, color: d.cumReturn >= 0 ? "#1a8c50" : "#c0392b" }}>{fmt(d.cumReturn, sym)}</td>
                        <td style={{ padding: "0.45rem 0.8rem" }}>
                          <span style={{ padding: "0.15rem 0.6rem", borderRadius: 99, fontSize: "0.65rem", fontWeight: 700, background: d.cumReturn >= 0 ? "#d4f0e0" : "#fde8e8", color: d.cumReturn >= 0 ? "#1a5c35" : "#c0392b" }}>
                            {d.cumReturn >= 0 ? "✓ Positive" : "▼ Recovering"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Investment Summary */}
            <div style={{ background: "linear-gradient(135deg, #0f3d22 0%, #1a5c35 100%)", borderRadius: 20, padding: "1.8rem", color: "#fff" }}>
              <h2 style={{ margin: "0 0 0.8rem", fontSize: "1rem", fontWeight: 800, color: "#a8dbb8", letterSpacing: "0.05em", textTransform: "uppercase" }}>Investment Summary</h2>
              <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif", color: "#e8f8f0" }}>
                Your <strong style={{ color: "#fff" }}>{fmt(cost, sym)}</strong> {INVESTMENT_TYPES[invType].label.toLowerCase()} investment generates an estimated enhanced return of{" "}
                <strong style={{ color: "#a8dbb8" }}>{enhancedROI.toFixed(1)}%</strong> (or <strong style={{ color: "#a8dbb8" }}>{basicROI.toFixed(1)}%</strong> basic),
                with a payback period of <strong style={{ color: "#fff" }}>{payback ? `${payback.toFixed(1)} years` : "beyond the selected horizon"}</strong>.
                The Net Present Value is <strong style={{ color: "#fff" }}>{fmt(npv, sym)}</strong>,
                creating <strong style={{ color: "#fff" }}>{fmt(annualBenefit, sym)}</strong> in annual value through cost savings, risk reduction, revenue growth, and improved financing terms.
                The project is estimated to save <strong style={{ color: "#a8dbb8" }}>{co2Saved.toFixed(1)} tonnes of CO₂</strong>,
                yielding <strong style={{ color: "#a8dbb8" }}>{fmt(carbonTaxSaving, sym)}</strong> in carbon benefits.
                {showInaction && <> Delaying this investment could cost your organisation an estimated <strong style={{ color: "#ffaaaa" }}>{fmt(totalInactionCost, sym)}</strong> over {horizon} years.</>}
              </p>
              <p style={{ margin: "1rem 0 0", fontSize: "0.68rem", color: "#6aab7f", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
                Disclaimer: All figures are estimates based on inputs provided and should not be considered guaranteed outcomes. Consult a financial advisor before making investment decisions.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="no-print" style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
              <button onClick={() => setActiveTab("inputs")} style={{ background: "transparent", color: "#2d7a4f", border: "2px solid #2d7a4f", borderRadius: 14, padding: "0.8rem 1.5rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flex: 1, minWidth: 140 }}>
                ← Adjust Inputs
              </button>
              <button onClick={handlePrint} style={{ background: "linear-gradient(135deg, #1a5c35, #2d7a4f)", color: "#fff", border: "none", borderRadius: 14, padding: "0.8rem 1.5rem", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flex: 2, minWidth: 180, boxShadow: "0 4px 16px rgba(29,92,53,0.25)" }}>
                🖨 Export / Print as PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "1.5rem", borderTop: "1px solid #d4e9dc", fontSize: "0.7rem", color: "#8aab97", fontFamily: "'DM Sans', sans-serif" }}>
        Sustainability ROI Calculator · Methodology based on DCF-adjusted NPV analysis · {new Date().getFullYear()}
      </div>
    </div>
  );
}
