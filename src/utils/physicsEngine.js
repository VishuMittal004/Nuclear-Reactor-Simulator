/**
 * physicsEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Simplified neutron point-kinetics model for educational purposes.
 *
 * Physics Model:
 *   N(t+1) = N(t) * k_eff
 *
 * Where k_eff (effective multiplication factor) determines criticality:
 *   k < 1  → Subcritical  — neutron population decays to zero
 *   k = 1  → Critical     — neutron population is stable
 *   k > 1  → Supercritical — neutron population grows exponentially
 *
 * k_eff is computed from three user-controlled parameters:
 *   1. Control Rod Insertion (0–100%) — absorbs neutrons, lowers k
 *   2. Fuel Efficiency Factor (0.5–2.0) — fission yield multiplier
 *   3. Neutron Source Strength — initial / baseline neutron count
 * ─────────────────────────────────────────────────────────────────
 */

// ── Constants ─────────────────────────────────────────────────────

/** Base k without any control rods (bare, unmoderated core) */
export const BASE_K = 1.05;

/** Maximum safe neutron population before emergency clamp */
export const MAX_NEUTRON_POPULATION = 1e12;

/** Minimum neutron population (floor — avoids complete extinction) */
export const MIN_NEUTRON_POPULATION = 1;

/** Energy conversion factor: 1 neutron ≈ proportional energy release (MeV, simplified) */
export const ENERGY_FACTOR = 200; // MeV per fission event (approximate)

// ── Core Physics Calculation ───────────────────────────────────────

/**
 * Calculates the effective multiplication factor (k_eff).
 *
 * k_eff = BASE_K + (fuelFactor - 1) * 0.1 - controlRodEffect
 *
 * @param {number} controlRodPct   - Control rod insertion percentage (0–100)
 * @param {number} fuelFactor      - Fuel efficiency factor (0.5–2.0)
 * @returns {number} k_eff         - Effective multiplication factor
 */
export function computeKeff(controlRodPct, fuelFactor) {
  // Control rod effect: full insertion (100%) → kills reaction completely
  // Uses a slightly non-linear (quadratic) relationship for realism
  const normalizedRod = controlRodPct / 100;
  const controlRodEffect = 0.15 * (normalizedRod + 0.5 * normalizedRod * normalizedRod);

  // Fuel factor influence: base 1.0, range ±0.1 of base_k
  const fuelBonus = (fuelFactor - 1.0) * 0.08;

  const keff = BASE_K + fuelBonus - controlRodEffect;

  // Clamp to a physically meaningful range
  return Math.max(0.01, Math.min(2.5, keff));
}

/**
 * Advances the simulation by one time step.
 *
 * @param {number} currentPopulation  - Current neutron count N(t)
 * @param {number} keff               - Effective multiplication factor
 * @param {number} neutronSource      - External neutron source (constant injection)
 * @returns {number} newPopulation    - Neutron count at N(t+1)
 */
export function stepNeutronPopulation(currentPopulation, keff, neutronSource) {
  // Apply the kinetics equation
  let next = currentPopulation * keff + neutronSource;

  // Safety clamp — prevent numerical overflow
  if (next > MAX_NEUTRON_POPULATION) {
    next = MAX_NEUTRON_POPULATION;
  }

  // Floor to avoid negative / zero physical absurdity
  if (next < MIN_NEUTRON_POPULATION) {
    next = MIN_NEUTRON_POPULATION;
  }

  return next;
}

/**
 * Computes the rate of change (ΔN / N) — used as a percentage metric.
 *
 * @param {number} previous - N(t-1)
 * @param {number} current  - N(t)
 * @returns {number} rate   - Fractional change (e.g. 0.05 = 5% increase)
 */
export function computeRateOfChange(previous, current) {
  if (previous === 0) return 0;
  return (current - previous) / previous;
}

/**
 * Estimates thermal power output (arbitrary units proportional to neutron flux).
 *
 * In a real reactor: Power ∝ neutron flux × fission cross-section × fuel volume
 * Here we use a simplified linear model for demonstration.
 *
 * @param {number} neutronPopulation - Current N(t)
 * @param {number} fuelFactor        - Fuel efficiency
 * @returns {number} power           - Approximate power in MW (scaled)
 */
export function computePower(neutronPopulation, fuelFactor) {
  // Normalize to a 0–1000 MW scale using logarithm to handle wide range
  const logN = Math.log10(Math.max(1, neutronPopulation));
  const maxLogN = Math.log10(MAX_NEUTRON_POPULATION);
  const normalized = logN / maxLogN; // 0 → 1
  return normalized * 1000 * fuelFactor; // 0 → 1000 MW (scaled)
}

/**
 * Determines reactor criticality state from k_eff.
 *
 * @param {number} keff
 * @returns {'subcritical' | 'critical' | 'supercritical' | 'prompt_critical'}
 */
export function getCriticalityState(keff) {
  if (keff >= 1.3) return 'prompt_critical'; // Dangerous runaway
  if (keff > 1.005) return 'supercritical';
  if (keff >= 0.995) return 'critical';
  return 'subcritical';
}

/**
 * Doublingtime in seconds for supercritical reactors.
 * T₂ = ln(2) / (k - 1) (simplified period calculation)
 *
 * @param {number} keff
 * @returns {number | null} doubling time in steps, or null if not supercritical
 */
export function computeDoublingTime(keff) {
  if (keff <= 1.0) return null;
  return Math.log(2) / Math.log(keff);
}

/**
 * Formats large neutron populations for display (scientific notation).
 *
 * @param {number} n
 * @returns {string}
 */
export function formatNeutronCount(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}G`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(0);
}
