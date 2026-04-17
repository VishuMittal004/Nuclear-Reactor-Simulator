/**
 * StatusPanel.jsx
 * ─────────────────────────────────────────────────────────────────
 * Right panel — reactor status at a glance:
 *   • Visual reactor core (animated rings)
 *   • Criticality status badge
 *   • Key derived metrics (power, doubling time, energy)
 *   • Educational explanations of k, criticality, control rods
 *   • Supercritical warning alert
 */

import React from 'react';
import {
  Gauge, Zap, AlertTriangle, BookOpen,
  ThermometerSun, Timer, Activity, Shield
} from 'lucide-react';
import {
  computePower, computeDoublingTime, formatNeutronCount
} from '../utils/physicsEngine';

// ── Animated Reactor Core Visual ──────────────────────────────────
function ReactorCore({ state, keff }) {
  const configs = {
    prompt_critical: {
      coreColor: '#ef4444',
      rings: [
        { size: 48, color: '#ef4444', speed: '0.8s', opacity: 0.9 },
        { size: 72, color: '#f97316', speed: '1.4s', opacity: 0.6 },
        { size: 96, color: '#fbbf24', speed: '2s', opacity: 0.3 },
      ],
      pulse: 'animate-critical',
    },
    supercritical: {
      coreColor: '#f97316',
      rings: [
        { size: 48, color: '#f97316', speed: '1.2s', opacity: 0.8 },
        { size: 72, color: '#fbbf24', speed: '2s', opacity: 0.5 },
        { size: 96, color: '#f97316', speed: '3s', opacity: 0.25 },
      ],
      pulse: 'animate-critical',
    },
    critical: {
      coreColor: '#22c55e',
      rings: [
        { size: 48, color: '#22c55e', speed: '3s', opacity: 0.7 },
        { size: 72, color: '#86efac', speed: '4.5s', opacity: 0.4 },
        { size: 96, color: '#22c55e', speed: '6s', opacity: 0.2 },
      ],
      pulse: 'animate-stable',
    },
    subcritical: {
      coreColor: '#38bdf8',
      rings: [
        { size: 48, color: '#38bdf8', speed: '5s', opacity: 0.5 },
        { size: 72, color: '#7dd3fc', speed: '7s', opacity: 0.3 },
        { size: 96, color: '#0ea5e9', speed: '9s', opacity: 0.15 },
      ],
      pulse: '',
    },
  };

  const cfg = configs[state] || configs.subcritical;

  return (
    <div className="reactor-core w-32 h-32 mx-auto my-3">
      {/* Outer rings */}
      {cfg.rings.map((ring, i) => (
        <div
          key={i}
          className="core-ring"
          style={{
            width: ring.size,
            height: ring.size,
            borderColor: ring.color,
            opacity: ring.opacity,
            animationDuration: ring.speed,
            boxShadow: `0 0 12px ${ring.color}40`,
          }}
        />
      ))}

      {/* Core nucleus */}
      <div
        className={`w-10 h-10 rounded-full z-10 flex items-center justify-center ${cfg.pulse}`}
        style={{
          background: `radial-gradient(circle, ${cfg.coreColor}80, ${cfg.coreColor}20)`,
          border: `2px solid ${cfg.coreColor}`,
          boxShadow: `0 0 20px ${cfg.coreColor}60`,
          color: cfg.coreColor,
        }}
      >
        <span className="mono text-xs font-bold">{keff.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ── Metric Row ────────────────────────────────────────────────────
function MetricRow({ icon: Icon, label, value, unit, color = '#94a3b8', sub }) {
  return (
    <div className="metric-card flex items-center gap-4 p-4 border-white/[0.05] bg-white/[0.01]">
      <div className="p-2.5 rounded-xl shadow-inner" style={{ background: `${color}15` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-0.5">{label}</p>
        <p className="text-xs text-slate-400 font-normal leading-tight">{sub}</p>
      </div>
      <div className="text-right">
        <span className="mono text-base font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-xs text-slate-500 ml-1 font-medium">{unit}</span>}
      </div>
    </div>
  );
}

// ── Educational Info Card ─────────────────────────────────────────
function InfoCard({ title, children }) {
  return (
    <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800">
      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
        <BookOpen size={11} className="text-indigo-400" />
        {title}
      </h4>
      <div className="text-xs text-slate-500 leading-relaxed space-y-1">
        {children}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function StatusPanel({
  state, keff, neutronPop, fuelFactor, rateOfChange,
  controlRodPct, timeStep, neutronSource
}) {
  const power = computePower(neutronPop, fuelFactor);
  const doublingTime = computeDoublingTime(keff);
  const isPromptCritical = state === 'prompt_critical';
  const isSupercritical = state === 'supercritical' || isPromptCritical;

  // Criticality badge config
  const statusConfig = {
    prompt_critical: { label: '⚠ PROMPT CRITICAL', bg: '#ef444420', border: '#ef444450', text: '#fca5a5' },
    supercritical:   { label: '🔴 SUPERCRITICAL',  bg: '#f9731620', border: '#f9731650', text: '#fdba74' },
    critical:        { label: '🟢 STABLE CRITICAL', bg: '#22c55e20', border: '#22c55e50', text: '#86efac' },
    subcritical:     { label: '🔵 SUBCRITICAL',     bg: '#38bdf820', border: '#38bdf850', text: '#7dd3fc' },
  }[state];

  return (
    <aside className="glass-panel rounded-2xl p-7 flex flex-col gap-6 overflow-y-auto h-full">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pb-5 border-b border-white/10">
        <div className="p-3 rounded-xl bg-sky-900/40 border border-sky-700/40 shadow-inner">
          <Gauge size={20} className="text-sky-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-wide">Reactor Status</h2>
          <p className="text-xs text-slate-500">Real-time Diagnostics</p>
        </div>
      </div>

      {/* ── SCRAM WARNING ──────────────────────────────────── */}
      {isPromptCritical && (
        <div
          className="rounded-2xl p-5 border flex items-center gap-4 animate-warning-flash shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          style={{ background: '#ef444420', borderColor: '#ef444460' }}
        >
          <AlertTriangle size={24} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-300 uppercase tracking-widest">⚠ SCRAM REQUIRED</p>
            <p className="text-xs text-red-400/80 mt-1">Reactor in prompt critical state. Insert control rods immediately.</p>
          </div>
        </div>
      )}

      {/* ── Criticality status badge ────────────────────────── */}
      <div
        className="rounded-2xl p-4 border text-center shadow-lg"
        style={{ background: statusConfig.bg, borderColor: statusConfig.border }}
      >
        <span
          className="font-bold text-sm tracking-widest uppercase"
          style={{ color: statusConfig.text }}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* ── Animated core visual ───────────────────────────── */}
      <ReactorCore state={state} keff={keff} />

      {/* ── Key metrics ───────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <MetricRow
          icon={Activity}
          label="k_eff"
          value={keff.toFixed(4)}
          color={isPromptCritical ? '#ef4444' : isSupercritical ? '#f97316' : state === 'critical' ? '#22c55e' : '#38bdf8'}
          sub="Multiplication factor"
        />
        <MetricRow
          icon={Zap}
          label="Thermal Power"
          value={power.toFixed(1)}
          unit="MW"
          color="#f59e0b"
          sub="Generated power"
        />
        <MetricRow
          icon={ThermometerSun}
          label="Neutron Pop."
          value={formatNeutronCount(neutronPop)}
          unit="n"
          color="#a855f7"
          sub="Current N(t)"
        />
        <MetricRow
          icon={Timer}
          label="Doubling Time"
          value={doublingTime ? `${doublingTime.toFixed(1)} steps` : '∞'}
          color={doublingTime && doublingTime < 5 ? '#ef4444' : '#94a3b8'}
          sub={doublingTime ? 'T₂ = ln(2)/ln(k)' : 'Reaction stable/decaying'}
        />
        <MetricRow
          icon={Shield}
          label="Rod Insertion"
          value={`${controlRodPct}%`}
          color={controlRodPct > 70 ? '#22c55e' : controlRodPct > 30 ? '#f59e0b' : '#ef4444'}
          sub="Suppression level"
        />
      </div>

      {/* ── Power bar ─────────────────────────────────────── */}
      <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-500 uppercase tracking-widest font-medium">Power Output</span>
          <span className="mono text-amber-300 font-bold">{Math.min(power, 1000).toFixed(0)} / 1000 MW</span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
            style={{
              width: `${Math.min((power / 1000) * 100, 100)}%`,
              background: power > 800
                ? 'linear-gradient(to right, #ef4444, #fbbf24)'
                : power > 400
                  ? 'linear-gradient(to right, #f97316, #fbbf24)'
                  : 'linear-gradient(to right, #22c55e, #86efac)',
            }}
          />
        </div>
      </div>

      {/* ── Educational layer ─────────────────────────────── */}
      <InfoCard title="What is k_eff?">
        <p>The <span className="text-slate-300 font-medium">effective multiplication factor</span> counts how many neutrons from one fission event go on to cause the next fission.</p>
        <p className="mt-1">
          <span className="text-sky-300">k &lt; 1</span> → reaction dies &nbsp;
          <span className="text-green-300">k = 1</span> → stable &nbsp;
          <span className="text-red-300">k &gt; 1</span> → grows
        </p>
      </InfoCard>

      <InfoCard title="Criticality">
        <p><span className="text-green-300 font-medium">Critical:</span> Every fission produces exactly 1 successor neutron. Power is steady.</p>
        <p><span className="text-red-300 font-medium">Supercritical:</span> Chain reaction grows exponentially — requires immediate rod insertion.</p>
        <p><span className="text-sky-300 font-medium">Subcritical:</span> Chain reaction fades. Safe shutdown state.</p>
      </InfoCard>

      <InfoCard title="Control Rods">
        <p>Made of neutron-absorbing material (e.g., <span className="text-slate-300">Boron, Cadmium</span>). Inserting them captures free neutrons, reducing k_eff.</p>
        <p className="mt-1">Full insertion = <span className="text-green-300">SCRAM</span> — emergency shutdown.</p>
      </InfoCard>
    </aside>
  );
}
