// Royal Model 10 (1938) — Real-world dimensions in millimetres and exact 1-DOF keystroke kinematics.
// Zero Three.js dependencies; every 3D mesh, linkage, gear, and HUD panel reads from this single source.

export const D2R = Math.PI / 180;

export const M_SPEC = {
  width: 368,          // mm total chassis width
  depth: 342,          // mm front to rear
  pitch: 2.54,         // mm per character (10 CPI standard)
  linePitch: 4.23,     // mm per line (6 LPI)
  maxCols: 52,
  maxLines: 34,
  carriageTravel: 52 * 2.54, // 132.08 mm
  platenR: 21,         // mm rubber cylinder radius
  platenCenterY: 140,  // mm above desk
  platenCenterZ: -78,  // mm behind origin
  strikeY: 139.3,      // mm exact type-slug impact height
  strikeZ: -56,        // mm platen front paper surface (-78 + 22)
  segCenterY: 92,      // mm segment pivot arc center
  segCenterZ: -56,     // mm aligned with strikeZ for exact radial convergence
  segR: 46,            // mm pivot arc radius
  typebarLen: 66,      // mm pivot to type-slug face
  restAngleDeg: 16,    // deg resting on felt cushion
  strikeAngleDeg: 134.18, // deg where 66 * cos(a) = -46 -> converges at (0, 139.3, -56)
  keyStrokeMm: 10.5,   // mm vertical key travel
  vibratorLiftMm: 9.5, // mm ribbon vibrator rise
  escTeeth: 12,        // 12-tooth brass escapement starwheel (30° per letter, 15° per half-step)
  pinionTeeth: 16,     // carriage drive pinion meshing with 2.54 mm pitch brass rack
};

export const KEY_ROWS = [
  [
    {code: 'Digit1', label: '1', sub: '!'},
    {code: 'Digit2', label: '2', sub: '@'},
    {code: 'Digit3', label: '3', sub: '#'},
    {code: 'Digit4', label: '4', sub: '$'},
    {code: 'Digit5', label: '5', sub: '%'},
    {code: 'Digit6', label: '6', sub: '^'},
    {code: 'Digit7', label: '7', sub: '&'},
    {code: 'Digit8', label: '8', sub: '*'},
    {code: 'Digit9', label: '9', sub: '('},
    {code: 'Digit0', label: '0', sub: ')'},
    {code: 'Minus', label: '-', sub: '_'},
  ],
  [
    {code: 'KeyQ', label: 'Q'},
    {code: 'KeyW', label: 'W'},
    {code: 'KeyE', label: 'E'},
    {code: 'KeyR', label: 'R'},
    {code: 'KeyT', label: 'T'},
    {code: 'KeyY', label: 'Y'},
    {code: 'KeyU', label: 'U'},
    {code: 'KeyI', label: 'I'},
    {code: 'KeyO', label: 'O'},
    {code: 'KeyP', label: 'P'},
    {code: 'Backspace', label: 'BACK', isAction: true},
  ],
  [
    {code: 'KeyA', label: 'A'},
    {code: 'KeyS', label: 'S'},
    {code: 'KeyD', label: 'D'},
    {code: 'KeyF', label: 'F'},
    {code: 'KeyG', label: 'G'},
    {code: 'KeyH', label: 'H'},
    {code: 'KeyJ', label: 'J'},
    {code: 'KeyK', label: 'K'},
    {code: 'KeyL', label: 'L'},
    {code: 'Semicolon', label: ';', sub: ':'},
    {code: 'Enter', label: 'RET', isAction: true},
  ],
  [
    {code: 'ShiftLeft', label: 'SHIFT', isAction: true},
    {code: 'KeyZ', label: 'Z'},
    {code: 'KeyX', label: 'X'},
    {code: 'KeyC', label: 'C'},
    {code: 'KeyV', label: 'V'},
    {code: 'KeyB', label: 'B'},
    {code: 'KeyN', label: 'N'},
    {code: 'KeyM', label: 'M'},
    {code: 'Comma', label: ',', sub: '<'},
    {code: 'Period', label: '.', sub: '>'},
    {code: 'Slash', label: '/', sub: '?'},
  ],
];

// Build canonical key table with exact mm positions & mapped typebar slot
export const KEYS = [];
export const KEY_BY_CODE = new Map();
{
  const totalBars = 40;
  let barIdx = 0;
  KEY_ROWS.forEach((row, rIdx) => {
    const z = 76 + rIdx * 24;
    const y = 65 - rIdx * 11.5;
    const stagger = (rIdx - 1.5) * 4.5;
    const spacing = 22.0;
    const x0 = -((row.length - 1) * spacing) / 2 + stagger;
    row.forEach((k, cIdx) => {
      const x = x0 + cIdx * spacing;
      const typebarIndex = k.isAction ? -1 : barIdx++;
      const fanDeg =
        typebarIndex >= 0
          ? -62 + (typebarIndex / (totalBars - 1)) * 124
          : 0;
      const entry = {
        ...k,
        row: rIdx,
        col: cIdx,
        x,
        y,
        z,
        typebarIndex,
        fanDeg,
      };
      KEYS.push(entry);
      KEY_BY_CODE.set(k.code, entry);
    });
  });

  const spaceEntry = {
    code: 'Space',
    label: 'SPACE',
    row: 4,
    col: 0,
    x: 0,
    y: 19,
    z: 170,
    typebarIndex: -1,
    fanDeg: 0,
    isAction: true,
  };
  KEYS.push(spaceEntry);
  KEY_BY_CODE.set('Space', spaceEntry);
}

/**
 * Solve the complete mechanical linkage for a normalized stroke p in [0, 1].
 * p = 0.00 : rest
 * p = 0.45 : type slug impacts platen (peak force, ribbon vibrator at top, escapement trips)
 * p = 1.00 : return spring restores key, lever, and typebar to rest
 */
export function solveKeystroke(p) {
  const u = Math.max(0, Math.min(1, p));
  // Asymmetric physical cam curve: snappy acceleration into strike at p=0.44, cushioned return
  const strikeP = 0.44;
  let travel;
  if (u <= strikeP) {
    const k = u / strikeP;
    travel = k * k * (3 - 2 * k); // smoothstep to 1.0
  } else {
    const k = (u - strikeP) / (1 - strikeP);
    travel = 1 - k * k * (2 - k); // snappy spring return
  }

  const keyDip = travel * M_SPEC.keyStrokeMm;
  const hammerDeg =
    M_SPEC.restAngleDeg +
    travel * (M_SPEC.strikeAngleDeg - M_SPEC.restAngleDeg);

  // Keylever pivots around rear fulcrum at z = -12 mm
  const leverAngleRad = Math.atan2(keyDip, 108);

  // Ribbon vibrator rises slightly ahead of impact to intercept the type slug
  const vibK = Math.min(1, travel * 1.25);
  const vibratorLift = vibK * M_SPEC.vibratorLiftMm;

  // Escapement trips sharply around impact (0.35 -> 0.55)
  const escAdvance =
    u < 0.3
      ? 0
      : u < 0.58
      ? (u - 0.3) / 0.28
      : 1;
  const escAngleDeg = escAdvance * (360 / M_SPEC.escTeeth);
  const rockerTiltDeg = travel > 0.25 ? Math.sin(((u - 0.2) / 0.6) * Math.PI) * 14 : 0;

  // Impact contact force (N) spikes cleanly at platen collision (u ~ 0.44)
  const distFromStrike = Math.abs(u - strikeP);
  const forceN = distFromStrike < 0.12 ? 18.4 * Math.exp(-((distFromStrike / 0.04) ** 2)) : 1.2 * travel;

  return {
    u,
    travel,
    keyDip,
    springRatio: Math.max(0.55, 1 - keyDip / 28),
    leverAngleRad,
    hammerDeg,
    vibratorLift,
    escAdvance,
    escAngleDeg,
    rockerTiltDeg,
    forceN,
  };
}
