/**
 * GraphPanel.jsx
 * ─────────────────────────────────────────────────────────────────
 * Center panel — live Recharts line chart showing neutron population
 * over simulation time steps. Auto-scales Y-axis and color-codes
 * the line based on criticality state.
 */

import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Atom } from 'lucide-react';
import { formatNeutronCount } from '../utils/physicsEngine';

// ── Custom tooltip for the chart ───────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="glass-panel rounded-xl p-3 text-xs border border-sky-700/40 shadow-2xl">
      <p className="text-slate-400 mb-1">Step <span className="mono text-sky-300">{label}</span></p>
      <p className="text-slate-300">
        Neutrons:{' '}
        <span className="mono font-bold text-sky-200">{formatNeutronCount(val)}</span>
      </p>
      {payload[1] && (
        <p className="text-slate-400 mt-0.5">
          k·N:{' '}
          <span className="mono text-amber-300">{formatNeutronCount(payload[1].value)}</span>
        </p>
      )}
    </div>
  );
}

// ── Tick formatter ────────────────────────────────────────────────
function formatYAxis(value) {
  return formatNeutronCount(value);
}

// ── Trend icon ────────────────────────────────────────────────────
function TrendIcon({ rate }) {
  if (rate > 0.01) return <TrendingUp size={14} className="text-red-400" />;
  if (rate < -0.01) return <TrendingDown size={14} className="text-sky-400" />;
  return <Minus size={14} className="text-green-400" />;
}

// ── Animated neutron particle sprites ─────────────────────────────
function NeutronParticles({ state }) {
  const colors = {
    prompt_critical: ['#ef4444', '#f97316', '#fbbf24'],
    supercritical:   ['#f97316', '#fbbf24', '#ef4444'],
    critical:        ['#22c55e', '#86efac', '#34d399'],
    subcritical:     ['#38bdf8', '#7dd3fc', '#0ea5e9'],
  };
  const c = colors[state] || colors.subcritical;
  const count = state === 'prompt_critical' ? 8 : state === 'supercritical' ? 5 : 3;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            background: c[i % c.length],
            boxShadow: `0 0 6px ${c[i % c.length]}`,
            left: `${10 + i * 12}%`,
            bottom: '8%',
            animation: `float-particle ${1.2 + i * 0.3}s ease-out ${i * 0.4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function GraphPanel({ history, keff, state, rateOfChange, timeStep }) {
  // Derive chart stroke color from criticality state
  const strokeColor = useMemo(() => {
    switch (state) {
      case 'prompt_critical': return '#ef4444';
      case 'supercritical':   return '#f97316';
      case 'critical':        return '#22c55e';
      default:                return '#38bdf8';
    }
  }, [state]);

  const gradientId = `neutron-gradient-${state}`;

  // Prepare chart data — keep last 80 steps for readability
  const chartData = useMemo(() => {
    const slice = history.slice(-80);
    return slice.map((pop, i) => ({
      step: history.length - slice.length + i + 1,
      population: pop,
    }));
  }, [history]);

  const latestN = history[history.length - 1] ?? 0;
  const maxN = Math.max(...history.slice(-80), 1);

  // State badge config
  const badge = {
    prompt_critical: { label: 'PROMPT CRITICAL', bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300', dot: '#ef4444' },
    supercritical:   { label: 'SUPERCRITICAL',  bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-300', dot: '#f97316' },
    critical:        { label: 'CRITICAL (STABLE)', bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300', dot: '#22c55e' },
    subcritical:     { label: 'SUBCRITICAL',    bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-300', dot: '#38bdf8' },
  }[state];

  return (
    <div className="glass-panel rounded-2xl p-7 flex flex-col gap-6 h-full relative overflow-hidden">
      <NeutronParticles state={state} />

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between z-10 pb-2">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-900/40 border border-sky-700/40 shadow-inner">
            <Atom size={20} className="text-sky-400" style={{ animation: state !== 'subcritical' ? 'core-spin 4s linear infinite' : 'none' }} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 tracking-wide">Neutron Population</h2>
            <p className="text-xs text-slate-500">N(t+1) = N(t) × k<sub>eff</sub></p>
          </div>
        </div>

        <div className={`status-badge ${badge.bg} border ${badge.border} ${badge.text} px-4 py-1.5`}>
          <span className="led" style={{ background: badge.dot, color: badge.dot, width: 8, height: 8 }} />
          {badge.label}
        </div>
      </div>

      {/* ── Live metrics bar ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5 z-10">
        {[
          { label: 'Current N(t)', value: formatNeutronCount(latestN), unit: 'neutrons', color: strokeColor },
          {
            label: 'Rate of Change',
            value: `${rateOfChange >= 0 ? '+' : ''}${(rateOfChange * 100).toFixed(2)}%`,
            unit: 'per step',
            color: rateOfChange > 0.01 ? '#ef4444' : rateOfChange < -0.01 ? '#38bdf8' : '#22c55e',
            icon: <TrendIcon rate={rateOfChange} />
          },
          { label: 'Time Step', value: timeStep, unit: 'elapsed', color: '#a855f7' },
        ].map(({ label, value, unit, color, icon }) => (
          <div key={label} className="metric-card text-center p-5 bg-white/[0.01] border-white/[0.05]">
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-medium">{label}</p>
            <p className="mono font-bold text-xl flex items-center justify-center gap-2" style={{ color }}>
              {icon}{value}
            </p>
            <p className="text-xs text-slate-600 mt-1">{unit}</p>
          </div>
        ))}
      </div>

      {/* ── Chart ────────────────────────────────────────────── */}
      <div className="flex-1 z-10 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(148,163,184,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="step"
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(148,163,184,0.1)' }}
              tickLine={false}
              label={{ value: 'Time Step', fill: '#475569', fontSize: 10, position: 'insideBottom', offset: -2 }}
            />

            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              width={55}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference line at initial neutron count */}
            <ReferenceLine
              y={history[0]}
              stroke="rgba(168,85,247,0.3)"
              strokeDasharray="4 4"
              label={{ value: 'N₀', fill: '#a855f7', fontSize: 10, position: 'insideTopRight' }}
            />

            <Area
              type="monotoneX"
              dataKey="population"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: strokeColor, stroke: '#0a1628', strokeWidth: 2 }}
              animationDuration={300}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Physics equation reminder ─────────────────────────── */}
      <div className="flex items-center justify-center gap-4 z-10 pt-2 border-t border-slate-800">
        <span className="mono text-xs text-slate-600">N(t+1) = N(t) × k<sub>eff</sub></span>
        <span className="text-slate-700">•</span>
        <span className="mono text-xs" style={{ color: strokeColor }}>
          k<sub>eff</sub> = {keff.toFixed(4)}
        </span>
        <span className="text-slate-700">•</span>
        <span className="mono text-xs text-slate-600">
          Peak: {formatNeutronCount(maxN)}
        </span>
      </div>
    </div>
  );
}
