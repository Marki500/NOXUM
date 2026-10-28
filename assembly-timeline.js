export const ASSEMBLY_DURATION = 3.8;
export const FLIGHT_DURATION = 1.45;
export const FLIGHT_DELAYS = [0, .27, .14];
export const clamp01 = value => Math.max(0, Math.min(1, value));
export const smooth = value => { const t = clamp01(value); return t * t * (3 - 2 * t); };
export const flightEase = value => {
  const t = clamp01(value);
  return t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
};

// Light and depth remain completely off until every piece has landed.
export function assemblyState(time) {
  const t = Math.max(0, time);
  return {
    phase: t < 1.9 ? 'flight' : t < 2.08 ? 'flat' : t < ASSEMBLY_DURATION ? 'reveal' : 'complete',
    flights: FLIGHT_DELAYS.map(delay => clamp01((t - .12 - delay) / FLIGHT_DURATION)),
    depth: smooth((t - 2.08) / .82),
    light: smooth((t - 2.08) / 1.25),
    impact: t >= 1.9 && t < 2.3 ? Math.sin((t - 1.9) / .4 * Math.PI) * .035 : 0,
    sweep: clamp01((t - 2.55) / 1.15),
    complete: t >= ASSEMBLY_DURATION
  };
}
