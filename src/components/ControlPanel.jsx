/**
 * ControlPanel.jsx
 * ─────────────────────────────────────────────────────────────────
 * Left panel — all user-facing simulation controls:
 *   • Control Rod Insertion (%)
 *   • Neutron Source Strength
 *   • Fuel Efficiency Factor
 *   • Simulation speed
 *   • Play / Pause / Reset
 * Each control has a tooltip explaining the underlying physics.
 */

import React from 'react';
import {
  Sliders, Zap, Flame, Activity, Play, Pause,
  RotateCcw, Info, ChevronUp, ChevronDown
} from 'lucide-react';

// ── Sub-component: Tooltip wrapper ────────────────────────────────
function Tooltip({ text, children }) {
  return (
    <div className="tooltip-container inline-flex items-center gap-1">
      {children}
      <span className="tooltip-text">{text}</span>
    </div>
  );
}

// ── Sub-component: Section header ─────────────────────────────────
function SectionTitle({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-sky-400" />
      <span className="text-xs font-semibold tracking-widest uppercase text-sky-400">
        {label}
      </span>
    </div>
  );
}

// ── Sub-component: Labeled slider ─────────────────────────────────
function SliderControl({
  label, tooltipText, value, min, max, step,
  onChange, unit, colorClass, valueFormatter
}) {
  const displayVal = valueFormatter ? valueFormatter(value) : `${value}${unit}`;
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <Tooltip text={tooltipText}>
          <span className="text-sm text-slate-300 flex items-center gap-1 cursor-default">
            {label}
            <Info size={11} className="text-slate-500" />
          </span>
        </Tooltip>
        <span className="mono text-sm font-semibold text-sky-300">{displayVal}</span>
      </div>

      {/* Progress track behind slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`reactor-slider ${colorClass}`}
          style={{
            background: `linear-gradient(to right, 
              rgba(56,189,248,0.6) ${pct}%, 
              rgba(30,41,59,0.8) ${pct}%)`
          }}
        />
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-600">{min}{unit}</span>
        <span className="text-xs text-slate-600">{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Sub-component: Control rod visual ─────────────────────────────
function ControlRodVisual({ insertionPct }) {
  const rodCount = 5;
  return (
    <div className="flex items-end justify-center gap-2 h-16 mb-1">
      {Array.from({ length: rodCount }).map((_, i) => {
        // Stagger the rods slightly for visual realism
        const stagger = Math.abs(i - 2) * 4;
        const effectivePct = Math.max(0, insertionPct - stagger);
        return (
          <div key={i} className="flex flex-col items-center" style={{ height: '100%' }}>
            {/* Rod cap */}
            <div className="w-3 h-1 rounded-sm bg-slate-400 mb-0.5" />
            {/* Rod body */}
            <div className="w-2 rounded-b flex-1 overflow-hidden"
              style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(56,189,248,0.15)' }}>
              <div
                className="w-full rounded-b transition-all duration-700"
                style={{
                  height: `${effectivePct}%`,
                  background: `linear-gradient(to bottom, #64748b, #1e3a5f)`,
                  boxShadow: effectivePct > 50 ? '0 0 6px rgba(56,189,248,0.4)' : 'none'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function ControlPanel({
  controlRodPct, setControlRodPct,
  neutronSource, setNeutronSource,
  fuelFactor, setFuelFactor,
  simSpeed, setSimSpeed,
  isRunning, onToggle, onReset,
  keff
}) {
  // Color code the k-value display
  const kColor = keff >= 1.3
    ? 'text-red-400'
    : keff > 1.005
      ? 'text-amber-400'
      : keff >= 0.995
        ? 'text-green-400'
        : 'text-sky-400';

  return (
    <aside className="glass-panel rounded-2xl p-7 flex flex-col gap-6 overflow-y-auto h-full">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pb-5 border-b border-white/10">
        <div className="p-3 rounded-xl bg-sky-900/40 border border-sky-700/40 shadow-inner">
          <Sliders size={20} className="text-sky-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-wide">Reactor Controls</h2>
          <p className="text-xs text-slate-500">Parameter Configuration</p>
        </div>
      </div>

      {/* ── Live k display ────────────────────────────────────── */}
      <div className="metric-card flex items-center justify-between p-4">
        <Tooltip text="The effective neutron multiplication factor. It determines whether the chain reaction grows, shrinks, or stays stable.">
          <span className="text-xs text-slate-400 flex items-center gap-1 cursor-default">
            k<sub>eff</sub> <Info size={10} className="text-slate-600" />
          </span>
        </Tooltip>
        <span className={`mono font-bold text-lg ${kColor}`}>{keff.toFixed(4)}</span>
      </div>

      {/* ── Section: Control Rods ─────────────────────────────── */}
      <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.02]">
        <SectionTitle icon={Activity} label="Control Rods" />
        <ControlRodVisual insertionPct={controlRodPct} />
        <SliderControl
          label="Rod Insertion"
          tooltipText="Control rods absorb neutrons and reduce k_eff. 0% = fully withdrawn (maximum reactivity). 100% = fully inserted (SCRAM — shuts down reaction). This mimics Boron or Cadmium control rods in real reactors."
          value={controlRodPct}
          min={0}
          max={100}
          step={1}
          unit="%"
          colorClass="reactor-slider-red"
          onChange={setControlRodPct}
        />
      </div>

      {/* ── Section: Neutron Source ───────────────────────────── */}
      <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.02]">
        <SectionTitle icon={Zap} label="Neutron Source" />
        <SliderControl
          label="Source Strength"
          tooltipText="External neutron source injected each time step (e.g., from a Beryllium-9 or Californium-252 source). Higher values allow the reaction to sustain itself at lower k_eff values. In real reactors, this is used during startup."
          value={neutronSource}
          min={0}
          max={5000}
          step={50}
          unit=" n/s"
          colorClass="reactor-slider-blue"
          onChange={setNeutronSource}
          valueFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}K n/s` : `${v} n/s`}
        />
      </div>

      {/* ── Section: Fuel ────────────────────────────────────── */}
      <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.02]">
        <SectionTitle icon={Flame} label="Fuel Properties" />
        <SliderControl
          label="Fuel Efficiency"
          tooltipText="Represents the enrichment level and fission cross-section of the nuclear fuel (e.g., U-235 enrichment). Higher values increase the probability of each neutron causing a fission event, directly raising k_eff."
          value={fuelFactor}
          min={0.5}
          max={2.0}
          step={0.05}
          unit=""
          colorClass="reactor-slider-green"
          onChange={setFuelFactor}
          valueFormatter={v => v.toFixed(2) + '×'}
        />
      </div>

      {/* ── Section: Simulation Speed ─────────────────────────── */}
      <div className="border border-white/5 rounded-2xl p-5 bg-white/[0.02]">
        <SectionTitle icon={Activity} label="Simulation Speed" />
        <div className="flex items-center gap-3">
          {[1, 2, 5, 10].map(speed => (
            <button
              key={speed}
              onClick={() => setSimSpeed(speed)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold mono transition-all duration-200 border ${
                simSpeed === speed
                  ? 'bg-sky-600/30 border-sky-500 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {speed}×
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3 text-center uppercase tracking-widest font-medium">Steps per second</p>
      </div>

      {/* ── Play / Pause / Reset ──────────────────────────────── */}
      <div className="flex gap-4 mt-auto pt-4">
        <button
          onClick={onToggle}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border ${
            isRunning
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              : 'bg-green-500/20 border-green-500/50 text-green-300 hover:bg-green-500/30'
          }`}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          {isRunning ? 'Pause' : 'Resume'}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm
            bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-700/60
            hover:border-slate-500 transition-all duration-200"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* ── Educational note ─────────────────────────────────── */}
      <div className="rounded-xl p-3 bg-indigo-900/20 border border-indigo-800/30">
        <p className="text-xs text-indigo-300 leading-relaxed">
          <span className="font-semibold text-indigo-200">💡 Tip:</span>{' '}
          Set k<sub>eff</sub> ≈ 1.000 for a stable critical reactor.
          Insert rods progressively to perform a controlled shutdown (SCRAM).
        </p>
      </div>
    </aside>
  );
}
