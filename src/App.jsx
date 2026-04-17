/**
 * App.jsx
 * ─────────────────────────────────────────────────────────────────
 * Root component — orchestrates the simulation loop and wires all
 * three panels together. Contains all simulation state.
 *
 * Simulation loop uses setInterval at a rate determined by simSpeed.
 * Each tick calls the physics engine to advance one time step.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ControlPanel from './components/ControlPanel';
import GraphPanel from './components/GraphPanel';
import StatusPanel from './components/StatusPanel';
import {
  computeKeff,
  stepNeutronPopulation,
  computeRateOfChange,
  getCriticalityState,
} from './utils/physicsEngine';

// ── Default simulation parameters ─────────────────────────────────
const DEFAULTS = {
  controlRodPct: 30,       // 30% rod insertion → slightly supercritical start
  neutronSource: 500,       // baseline neutron injection per step
  fuelFactor: 1.0,          // base fuel efficiency
  simSpeed: 2,              // 2 steps per second
  initialNeutrons: 1000,    // starting neutron population
};

const HISTORY_MAX = 300; // Maximum stored history points

export default function App() {
  // ── Control parameters ──────────────────────────────────────────
  const [controlRodPct, setControlRodPct] = useState(DEFAULTS.controlRodPct);
  const [neutronSource, setNeutronSource]   = useState(DEFAULTS.neutronSource);
  const [fuelFactor, setFuelFactor]         = useState(DEFAULTS.fuelFactor);
  const [simSpeed, setSimSpeed]             = useState(DEFAULTS.simSpeed);

  // ── Simulation state ────────────────────────────────────────────
  const [isRunning, setIsRunning]           = useState(true);
  const [timeStep, setTimeStep]             = useState(0);
  const [neutronPop, setNeutronPop]         = useState(DEFAULTS.initialNeutrons);
  const [history, setHistory]               = useState([DEFAULTS.initialNeutrons]);
  const [prevPop, setPrevPop]               = useState(DEFAULTS.initialNeutrons);

  // Keep refs for use inside the interval closure
  const neutronPopRef   = useRef(DEFAULTS.initialNeutrons);
  const controlRodRef   = useRef(DEFAULTS.controlRodPct);
  const neutronSrcRef   = useRef(DEFAULTS.neutronSource);
  const fuelFactorRef   = useRef(DEFAULTS.fuelFactor);
  const isRunningRef    = useRef(true);

  // Sync refs whenever state updates
  useEffect(() => { controlRodRef.current = controlRodPct; }, [controlRodPct]);
  useEffect(() => { neutronSrcRef.current = neutronSource; }, [neutronSource]);
  useEffect(() => { fuelFactorRef.current = fuelFactor; }, [fuelFactor]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // ── Simulation tick ─────────────────────────────────────────────
  const tick = useCallback(() => {
    if (!isRunningRef.current) return;

    const keff = computeKeff(controlRodRef.current, fuelFactorRef.current);
    const next = stepNeutronPopulation(
      neutronPopRef.current,
      keff,
      neutronSrcRef.current
    );

    setPrevPop(neutronPopRef.current);
    neutronPopRef.current = next;

    setNeutronPop(next);
    setTimeStep(t => t + 1);
    setHistory(h => {
      const updated = [...h, next];
      return updated.length > HISTORY_MAX ? updated.slice(-HISTORY_MAX) : updated;
    });
  }, []);

  // ── Interval management — restarts when simSpeed changes ─────────
  useEffect(() => {
    const interval = setInterval(tick, 1000 / simSpeed);
    return () => clearInterval(interval);
  }, [tick, simSpeed]);

  // ── Reset handler ───────────────────────────────────────────────
  const handleReset = useCallback(() => {
    neutronPopRef.current = DEFAULTS.initialNeutrons;
    setNeutronPop(DEFAULTS.initialNeutrons);
    setPrevPop(DEFAULTS.initialNeutrons);
    setHistory([DEFAULTS.initialNeutrons]);
    setTimeStep(0);
    setControlRodPct(DEFAULTS.controlRodPct);
    setNeutronSource(DEFAULTS.neutronSource);
    setFuelFactor(DEFAULTS.fuelFactor);
    setSimSpeed(DEFAULTS.simSpeed);
  }, []);

  // ── Derived values (computed fresh each render) ─────────────────
  const keff = computeKeff(controlRodPct, fuelFactor);
  const state = getCriticalityState(keff);
  const rateOfChange = computeRateOfChange(prevPop, neutronPop);

  // Ambient glow color based on state
  const ambientColor = {
    prompt_critical: 'rgba(239,68,68,0.08)',
    supercritical:   'rgba(249,115,22,0.06)',
    critical:        'rgba(34,197,94,0.05)',
    subcritical:     'rgba(56,189,248,0.04)',
  }[state];

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${ambientColor} 0%, transparent 70%), #000000`,
        transition: 'background 1s ease'
      }}
    >
      {/* CRT scanline overlay for sci-fi feel */}
      <div className="scanline-overlay" />

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-10 py-5 border-b shrink-0 shadow-2xl relative z-20"
        style={{ borderColor: 'rgba(56,189,248,0.1)', background: 'rgba(0,0,0,0.9)' }}
      >
        {/* Logo + Title */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm"
              style={{
                borderColor: state === 'prompt_critical' ? '#ef4444'
                  : state === 'supercritical' ? '#f97316'
                  : state === 'critical' ? '#22c55e' : '#38bdf8',
                animation: isRunning && state !== 'subcritical' ? 'core-spin 6s linear infinite' : 'none',
                color: '#38bdf8',
              }}
            >
              ⚛
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase">
              Nuclear Reactor Simulator
            </h1>
            <p className="text-xs text-slate-600 tracking-wider">
              Neutron Point-Kinetics Model · Educational Edition
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4">
          {/* Simulation running indicator */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: isRunning ? '#22c55e' : '#ef4444',
                boxShadow: isRunning ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
                animation: isRunning ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              }}
            />
            <span className="text-xs text-slate-400 mono">
              {isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Step counter */}
          <span className="mono text-xs text-slate-500">
            STEP <span className="text-sky-400">{String(timeStep).padStart(5, '0')}</span>
          </span>

          <div className="h-4 w-px bg-slate-700" />

          {/* k_eff badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">k =</span>
            <span
              className="mono text-xs font-bold"
              style={{
                color: state === 'prompt_critical' ? '#ef4444'
                  : state === 'supercritical' ? '#f97316'
                  : state === 'critical' ? '#22c55e' : '#38bdf8'
              }}
            >
              {keff.toFixed(4)}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Speed badge */}
          <span className="mono text-xs text-slate-500">
            {simSpeed}× <span className="text-slate-700">speed</span>
          </span>
        </div>
      </header>

      {/* ── Three-column layout ──────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-[320px_1fr_300px] gap-6 p-6 min-h-0 overflow-hidden">

        {/* Left — Controls */}
        <ControlPanel
          controlRodPct={controlRodPct}   setControlRodPct={setControlRodPct}
          neutronSource={neutronSource}   setNeutronSource={setNeutronSource}
          fuelFactor={fuelFactor}         setFuelFactor={setFuelFactor}
          simSpeed={simSpeed}             setSimSpeed={setSimSpeed}
          isRunning={isRunning}
          onToggle={() => setIsRunning(r => !r)}
          onReset={handleReset}
          keff={keff}
        />

        {/* Center — Graph */}
        <GraphPanel
          history={history}
          keff={keff}
          state={state}
          rateOfChange={rateOfChange}
          timeStep={timeStep}
        />

        {/* Right — Status */}
        <StatusPanel
          state={state}
          keff={keff}
          neutronPop={neutronPop}
          fuelFactor={fuelFactor}
          rateOfChange={rateOfChange}
          controlRodPct={controlRodPct}
          timeStep={timeStep}
          neutronSource={neutronSource}
        />
      </main>
    </div>
  );
}
