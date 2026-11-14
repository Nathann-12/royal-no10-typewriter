// Royal No. 10 (1938) — Cozy Desk Interactive 3D Typewriter + On-Demand Mechanical Teardown
import * as THREE from 'three';
import {warmComposer} from './kit/warm.js';
import {TypewriterAudio} from './audio.js';
import {
  createConsole,
  CUTS,
  THEMES,
  VIEWS,
} from './console.js';
import {KEY_BY_CODE, M_SPEC} from './kin.js';
import {createTypewriterStage} from './stage.js';
import {PaperSheetCanvas} from './textures.js';

const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
const smoothstep = (a, b, x) => {
  const u = clamp((x - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};
const bez2 = (out, p0, p1, p2, u) => {
  const iu = 1 - u;
  out.set(
    iu * iu * p0.x + 2 * iu * u * p1.x + u * u * p2.x,
    iu * iu * p0.y + 2 * iu * u * p1.y + u * u * p2.y,
    iu * iu * p0.z + 2 * iu * u * p1.z + u * u * p2.z,
  );
};

const VIEW_FN = {
  desk: () => ({tx: 0, ty: 0.1, tz: -0.005, az: 10, el: 34, d: 0.96, sx: 0, sy: 0}),
  keywell: () => ({tx: 0, ty: 0.095, tz: 0.015, az: 16, el: 33, d: 0.5, sx: 0, sy: 0}),
  escapement: () => ({tx: 0, ty: 0.105, tz: -0.088, az: 168, el: 18, d: 0.44, sx: 0, sy: 0}),
  paper: () => ({tx: 0, ty: 0.168, tz: -0.075, az: 2, el: 19, d: 0.44, sx: 0, sy: 0}),
  hero: (u) => ({tx: 0, ty: 0.105, tz: -0.008, az: 34 + Math.sin(u * 0.25) * 4, el: 25, d: 0.78, sx: 0, sy: 0}),
};

const CALLOUT_DEFS = [
  {name: 'SLOTTED SEGMENT', sub: '40 RADIAL HAMMERS', p: (e) => [-0.04, 0.095 + 0.062 * e, -0.02 + 0.008 * e], dx: -175, dy: 28},
  {name: 'COIL RETURN SPRINGS', sub: '43 HELICAL SPRINGS', p: (e) => [-0.07, 0.03 - 0.006 * e, 0.09 + 0.086 * e], dx: -165, dy: 38},
  {name: 'ESCAPEMENT STARWHEEL', sub: '12-TOOTH BRASS RATCHET', p: (e) => [0.016, 0.106 + 0.078 * e, -0.088 - 0.055 * e], dx: 135, dy: -16},
  {name: 'RIBBON VIBRATOR', sub: '9.5 MM SYNC LIFT', p: (e) => [0, 0.13 + 0.108 * e, -0.052 + 0.006 * e], dx: -155, dy: -48},
  {name: 'PLATEN & COTTON SHEET', sub: '10 CPI · 2.54 MM PITCH', p: (e) => [0.06, 0.152 + 0.165 * e, -0.088 - 0.056 * e], dx: 120, dy: -36},
  {name: 'MAINSPRING DRUM', sub: 'CARRIAGE TENSION', p: (e) => [-0.072, 0.092 + 0.078 * e, -0.092 - 0.055 * e], dx: -175, dy: -22},
];

const CHAR_TO_CODE = {
  ' ': 'Space',
  '\n': 'Enter',
  '-': 'Minus',
  _: 'Minus',
  ';': 'Semicolon',
  ':': 'Semicolon',
  ',': 'Comma',
  '<': 'Comma',
  '.': 'Period',
  '>': 'Period',
  '/': 'Slash',
  '?': 'Slash',
  '!': 'Digit1',
  '@': 'Digit2',
  '#': 'Digit3',
  $: 'Digit4',
  '%': 'Digit5',
  '^': 'Digit6',
  '&': 'Digit7',
  '*': 'Digit8',
  '(': 'Digit9',
  ')': 'Digit0',
};

function resolveCodeForChar(ch) {
  if (CHAR_TO_CODE[ch]) return CHAR_TO_CODE[ch];
  const up = ch.toUpperCase();
  if (up >= 'A' && up <= 'Z') return 'Key' + up;
  if (ch >= '0' && ch <= '9') return 'Digit' + ch;
  return 'KeyR';
}

const DEMO_SCRIPT =
  'Royal Standard No. 10, 1938.\n' +
  'Quiet keystrokes, crisp cotton paper,\n' +
  'and 40 steel hammers at your fingertips.\n' +
  'Click anywhere & type freely...';

function runApp() {
  const style = document.createElement('style');
  style.textContent = `
    html,body{margin:0;padding:0;width:100%;height:100%;background:#0d0b09;overflow:hidden}
    #app{position:fixed;inset:0;width:100%;height:100%}
    #gl{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
    #gl.drag{cursor:grabbing}
  `;
  document.head.appendChild(style);

  const app = document.getElementById('app');
  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  app.appendChild(canvas);

  const paperCanvas = new PaperSheetCanvas();
  const audio = new TypewriterAudio();
  const st = createTypewriterStage({canvas, paperCanvas});
  const ui = createConsole(app);

  // Start in solid classic typewriter mode on the desk
  st.setCut('solid', 0);
  st.setLamp(true);

  const fit = () => {
    const w = Math.max(320, innerWidth);
    const h = Math.max(240, innerHeight);
    st.resize(w, h, clamp(devicePixelRatio || 1, 1, 2));
  };
  fit();
  addEventListener('resize', fit);

  // Machine & UI State
  let T = 0;
  let view = 'desk';
  let viewAt = 0;
  let cut = 'solid';
  let theme = 'midnight';
  let exploded = false;
  let labels = false;
  let explodeVal = 0;

  let line = 0;
  let col = 0;
  let smoothCol = 0;
  let bellRung = false;
  let totalChars = 0;

  let activeCode = 'KeyR';
  let strokeP = 0;
  let strokePlaying = false;
  let returnProgress = 0;
  let promptHidden = false;

  let autoType = false;
  let demoIdx = 0;
  let demoTimer = 0.25;

  let soundEnabled = true;
  let rainEnabled = false;
  let lampEnabled = true;

  const off = {az: 0, el: 0, k: 1};
  const cam = {...VIEW_FN.desk(0)};

  // 3-beat mechanical paper change ceremony state & archive store
  const archivedPages = [];
  let pageCounter = 0;

  const paperAnim = {
    active: false,
    t: 0,
    dur: 1.42,
    snapshot: null,
    pendingArchive: null,
    outLifted: false,
    outPlaced: false,
    inPicked: false,
    inSlotted: false,
    outStart: new THREE.Vector3(),
    outMid: new THREE.Vector3(),
    outLand: {pos: new THREE.Vector3(), ry: 0},
    inStart: {pos: new THREE.Vector3(), ry: 0},
    inMid: new THREE.Vector3(),
    inEnd: new THREE.Vector3(),
  };
  const paperState = {hidePaper: false, paperFeedOffset: 0, platenSpinOffset: 0};

  const captureSheetCanvas = (src) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 704;
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c;
  };

  const downloadDataUrl = (href, filename) => {
    const a = document.createElement('a');
    a.download = filename;
    a.href = href;
    a.click();
  };

  const openSheetArchive = (startIndex = -1) => {
    if (archivedPages.length > 0) audio.playPaperPick();
    ui.openArchive(archivedPages, startIndex, {
      onFlip: () => audio.playPaperPick(),
      onDownload: (pg) => {
        audio.playPaperPlace();
        downloadDataUrl(pg.dataUrl, `royal-no10-page-${pg.pageNumber}.png`);
      },
      onClose: () => {},
    });
  };

  const startPaperChange = () => {
    if (paperAnim.active) return;
    autoType = false;
    promptHidden = true;

    pageCounter++;
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    paperAnim.active = true;
    paperAnim.t = 0;
    paperAnim.snapshot = captureSheetCanvas(paperCanvas.canvas);
    paperAnim.pendingArchive = {
      pageNumber: pageCounter,
      lineCount: line + 1,
      charCount: totalChars,
      timeLabel: nowTime,
      dataUrl: paperCanvas.canvas.toDataURL('image/png'),
    };
    paperAnim.outLifted = false;
    paperAnim.outPlaced = false;
    paperAnim.inPicked = false;
    paperAnim.inSlotted = false;

    paperAnim.outLand = st.getFinishedLandingWorld();
    paperAnim.inStart = st.getBlankTopWorld();

    audio.playPaperPullOut();
  };

  const stampAndAdvance = (char, code, fromAuto = false) => {
    if (paperAnim.active) return;
    promptHidden = true;
    if (line >= M_SPEC.maxLines) return;
    activeCode = code;
    strokeP = 0.01;
    strokePlaying = true;

    if (char === '\n') {
      if (line < M_SPEC.maxLines - 1) line++;
      col = 0;
      bellRung = false;
      returnProgress = 1;
      audio.playCarriageReturn();
      return;
    }

    if (char === '\b') {
      if (col > 0) col--;
      audio.playBackspace();
      return;
    }

    if (col < M_SPEC.maxCols) {
      if (char !== ' ') {
        paperCanvas.stampChar(char, line, col);
        totalChars++;
      }
      col++;
      if (col === M_SPEC.maxCols - 8 && !bellRung) {
        bellRung = true;
        setTimeout(() => audio.playBell(), 45);
      }
    } else if (!fromAuto) {
      audio.playBell();
    }

    if (char === ' ') audio.playSpace();
    else audio.playKeyStrike((col % 5) - 2);
  };

  // Prevent focused buttons from capturing Space / Enter while typing
  const blurOnClick = (el, fn) => {
    el.addEventListener('click', (e) => {
      e.currentTarget.blur();
      fn(e);
    });
  };

  for (const v of VIEWS) {
    blurOnClick(ui.btn[v], () => {
      view = v;
      viewAt = T;
      Object.assign(off, {az: 0, el: 0, k: 1});
    });
  }
  for (const c of CUTS) {
    blurOnClick(ui.btn[c], () => {
      cut = c;
    });
  }
  for (const th of THEMES) {
    blurOnClick(ui.btn['theme_' + th], () => {
      theme = th;
      st.tw.setTheme(th);
    });
  }

  blurOnClick(ui.btn.exploded, () => {
    exploded = !exploded;
    labels = exploded;
    if (exploded && view === 'desk') {
      view = 'hero';
      viewAt = T;
      Object.assign(off, {az: 0, el: 0, k: 1});
    } else if (!exploded && view === 'hero') {
      view = 'desk';
      viewAt = T;
      Object.assign(off, {az: 0, el: 0, k: 1});
    }
  });

  blurOnClick(ui.btn.labels, () => {
    labels = !labels;
  });

  blurOnClick(ui.btn.sound, () => {
    soundEnabled = !soundEnabled;
    audio.setSoundEnabled(soundEnabled);
  });

  blurOnClick(ui.btn.rain, () => {
    rainEnabled = audio.toggleRain();
  });

  blurOnClick(ui.btn.lamp, () => {
    lampEnabled = !lampEnabled;
    st.setLamp(lampEnabled);
  });

  blurOnClick(ui.btn.auto, () => {
    autoType = !autoType;
    promptHidden = true;
    if (autoType && (demoIdx >= DEMO_SCRIPT.length || line >= M_SPEC.maxLines - 1)) {
      paperCanvas.clear();
      line = 0;
      col = 0;
      demoIdx = 0;
    }
    demoTimer = 0.08;
  });

  blurOnClick(ui.btn.newSheet, startPaperChange);

  blurOnClick(ui.btn.sheets, () => {
    if (ui.isArchiveOpen()) ui.closeArchive();
    else openSheetArchive(-1);
  });

  blurOnClick(ui.btn.savePng, () => {
    downloadDataUrl(
      paperCanvas.canvas.toDataURL('image/png'),
      `royal-no10-page-${pageCounter + 1}.png`,
    );
  });

  // Physical Keyboard Input (works anywhere on screen; pauses typing while reading archive)
  addEventListener('keydown', (e) => {
    if (ui.isArchiveOpen()) {
      if (e.key === 'Escape') {
        e.preventDefault();
        ui.closeArchive();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const curBtn = document.querySelector('.tw-thumb-item.active');
        const thumbs = [...document.querySelectorAll('.tw-thumb-item')];
        const idx = thumbs.indexOf(curBtn);
        if (idx > 0) ui.selectArchivePage(idx - 1, true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const curBtn = document.querySelector('.tw-thumb-item.active');
        const thumbs = [...document.querySelectorAll('.tw-thumb-item')];
        const idx = thumbs.indexOf(curBtn);
        if (idx >= 0 && idx < thumbs.length - 1) ui.selectArchivePage(idx + 1, true);
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.repeat && e.key !== 'Backspace' && e.key !== ' ') return;
    if (document.activeElement?.tagName === 'BUTTON') document.activeElement.blur();
    if (paperAnim.active) return;

    if (e.key === ' ') {
      e.preventDefault();
      autoType = false;
      stampAndAdvance(' ', 'Space', false);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      autoType = false;
      stampAndAdvance('\b', 'Backspace', false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      autoType = false;
      stampAndAdvance('\n', 'Enter', false);
    } else if (e.key === 'Shift') {
      activeCode = 'ShiftLeft';
      strokeP = 0.01;
      strokePlaying = true;
    } else if (e.key.length === 1) {
      e.preventDefault();
      autoType = false;
      stampAndAdvance(e.key, e.code, false);
    }
  });

  addEventListener('keyup', (e) => {
    if (e.key.length === 1 || e.key === ' ' || e.key === 'Enter' || e.key === 'Backspace') {
      if (!autoType) audio.playKeyRelease();
    }
  });

  // Orbit drag + 3D key click raycaster
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null;
  let downPos = {x: 0, y: 0};

  canvas.addEventListener('pointerdown', (e) => {
    drag = {x: e.clientX, y: e.clientY};
    downPos = {x: e.clientX, y: e.clientY};
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('drag');
  });

  canvas.addEventListener('pointermove', (e) => {
    if (drag) {
      off.az -= (e.clientX - drag.x) * 0.25;
      off.el = clamp(off.el + (e.clientY - drag.y) * 0.18, -15, 65);
      drag = {x: e.clientX, y: e.clientY};
      return;
    }
    if (!ui.isArchiveOpen()) {
      const r = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ndc, st.camera);
      const hits = raycaster.intersectObjects(
        [...st.tw.clickableMeshes, ...st.blankStackMeshes, ...st.getFinishedMeshes()],
        false,
      );
      canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
    }
  });

  const endDrag = (e) => {
    const moved = e ? Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) : 99;
    drag = null;
    canvas.classList.remove('drag');
    if (moved < 6 && e) {
      const r = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(ndc, st.camera);
      const hits = raycaster.intersectObjects(
        [...st.tw.clickableMeshes, ...st.blankStackMeshes, ...st.getFinishedMeshes()],
        false,
      );
      if (hits.length > 0) {
        if (hits[0].object.userData.isBlankStack) {
          startPaperChange();
          return;
        }
        if (hits[0].object.userData.isFinishedStack) {
          const stackCount = st.getFinishedCount();
          const idx = archivedPages.length - stackCount + (hits[0].object.userData.sheetIndex ?? 0);
          openSheetArchive(clamp(idx, 0, Math.max(0, archivedPages.length - 1)));
          return;
        }
        if (paperAnim.active) return;
        const code = hits[0].object.userData.keyCode;
        const def = KEY_BY_CODE.get(code);
        if (def) {
          autoType = false;
          if (code === 'Space') stampAndAdvance(' ', 'Space', false);
          else if (code === 'Backspace') stampAndAdvance('\b', 'Backspace', false);
          else if (code === 'Enter') stampAndAdvance('\n', 'Enter', false);
          else if (code === 'ShiftLeft') {
            promptHidden = true;
            activeCode = 'ShiftLeft';
            strokeP = 0.01;
            strokePlaying = true;
          } else {
            stampAndAdvance(def.label.toLowerCase(), code, false);
          }
        }
      }
    }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => endDrag(null));

  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      off.k = clamp(off.k * Math.exp(e.deltaY * 0.0011), 0.45, 2.2);
    },
    {passive: false},
  );

  // Frame loop
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    T += dt;

    if (autoType) {
      demoTimer -= dt;
      if (demoTimer <= 0) {
        if (demoIdx < DEMO_SCRIPT.length) {
          const ch = DEMO_SCRIPT[demoIdx++];
          stampAndAdvance(ch, resolveCodeForChar(ch), true);
          demoTimer = ch === '\n' ? 0.44 : ch === ' ' ? 0.13 : 0.1 + Math.random() * 0.06;
        } else {
          autoType = false;
        }
      }
    }

    if (strokePlaying) {
      strokeP += dt * 7.2;
      if (strokeP >= 1) {
        strokeP = 0;
        strokePlaying = false;
      }
    }

    smoothCol = THREE.MathUtils.lerp(smoothCol, col, 1 - Math.exp(-22 * dt));
    returnProgress = THREE.MathUtils.lerp(returnProgress, 0, 1 - Math.exp(-9 * dt));
    explodeVal = THREE.MathUtils.lerp(
      explodeVal,
      exploded ? 1 : 0,
      1 - Math.exp(-6.5 * dt),
    );

    const baseCam = VIEW_FN[view](T - viewAt);
    const tgt = {
      ...baseCam,
      ty: baseCam.ty + 0.042 * explodeVal,
      az: baseCam.az + off.az,
      el: clamp(baseCam.el + off.el, 4, 82),
      d: baseCam.d * off.k * (exploded ? 1.42 : 1.0),
    };
    const k = 1 - Math.exp(-dt / 0.25);
    cam.az += wrap(tgt.az - cam.az) * k;
    for (const key of ['tx', 'ty', 'tz', 'el', 'd', 'sx', 'sy']) {
      cam[key] += (tgt[key] - cam[key]) * k;
    }

    // Animated 3-beat paper pull-out, left-pile stack & platen ratchet feed-in
    paperState.hidePaper = false;
    paperState.paperFeedOffset = 0;
    paperState.platenSpinOffset = 0;

    if (paperAnim.active) {
      paperAnim.t += dt;
      const t = paperAnim.t;

      if (t < 0.3) {
        const u = smoothstep(0, 0.3, t);
        paperState.paperFeedOffset = -175 * u;
        paperState.platenSpinOffset = -8.0 * u;
      } else {
        if (!paperAnim.outLifted) {
          paperAnim.outLifted = true;
          st.tw.carriageGroup.updateMatrixWorld(true);
          paperAnim.outStart
            .set(0, 175, -20)
            .applyMatrix4(st.tw.carriageGroup.matrixWorld);
          paperAnim.outMid.set(
            (paperAnim.outStart.x + paperAnim.outLand.pos.x) * 0.5 - 0.04,
            Math.max(paperAnim.outStart.y, 0.32) + 0.095,
            (paperAnim.outStart.z + paperAnim.outLand.pos.z) * 0.5 + 0.03,
          );
          st.setFlyingOutTexture(paperAnim.snapshot);
          st.flyingOut.visible = true;

          // Clear roller sheet & smoothly return carriage to Col 0 for fresh feed
          paperCanvas.clear();
          line = 0;
          col = 0;
          bellRung = false;
          totalChars = 0;
          returnProgress = 0.65;
        }

        if (t <= 0.72) {
          const uB = smoothstep(0.3, 0.72, t);
          bez2(
            st.flyingOut.position,
            paperAnim.outStart,
            paperAnim.outMid,
            paperAnim.outLand.pos,
            uB,
          );
          st.flyingOut.rotation.set(
            THREE.MathUtils.lerp(-0.24, -Math.PI / 2, uB),
            0,
            THREE.MathUtils.lerp(0, paperAnim.outLand.ry, uB),
          );
          st.flyingOut.scale.setScalar(THREE.MathUtils.lerp(1.06, 1.0, uB));
          st.bendSheet(
            st.flyingOut,
            Math.sin(uB * Math.PI) * 0.024,
            Math.sin(uB * Math.PI) * 0.008,
          );
        } else if (!paperAnim.outPlaced) {
          paperAnim.outPlaced = true;
          st.flyingOut.visible = false;
          st.addFinishedSheet(paperAnim.snapshot);
          if (paperAnim.pendingArchive) {
            archivedPages.push(paperAnim.pendingArchive);
            paperAnim.pendingArchive = null;
          }
          audio.playPaperPlace();
        }

        if (t >= 0.46 && t < 0.94) {
          if (!paperAnim.inPicked) {
            paperAnim.inPicked = true;
            st.tw.carriageGroup.updateMatrixWorld(true);
            paperAnim.inEnd
              .set(0, 150, -46)
              .applyMatrix4(st.tw.carriageGroup.matrixWorld);
            paperAnim.inMid.set(
              (paperAnim.inStart.pos.x + paperAnim.inEnd.x) * 0.5 + 0.03,
              0.36,
              (paperAnim.inStart.pos.z + paperAnim.inEnd.z) * 0.5 - 0.02,
            );
            st.flyingIn.visible = true;
            audio.playPaperPick();
          }
          const uC = smoothstep(0.46, 0.94, t);
          bez2(
            st.flyingIn.position,
            paperAnim.inStart.pos,
            paperAnim.inMid,
            paperAnim.inEnd,
            uC,
          );
          st.flyingIn.rotation.set(
            THREE.MathUtils.lerp(-Math.PI / 2, -0.24, uC),
            0,
            THREE.MathUtils.lerp(paperAnim.inStart.ry, 0, uC),
          );
          st.flyingIn.scale.setScalar(THREE.MathUtils.lerp(1.0, 1.06, uC));
          st.bendSheet(
            st.flyingIn,
            Math.sin(uC * Math.PI) * -0.022,
            Math.sin(uC * Math.PI) * -0.006,
          );
        }

        if (t < 0.94) {
          paperState.hidePaper = true;
        } else if (t < paperAnim.dur) {
          if (!paperAnim.inSlotted) {
            paperAnim.inSlotted = true;
            st.flyingIn.visible = false;
            audio.playPaperFeed();
          }
          const uD = smoothstep(0.94, paperAnim.dur, t);
          paperState.hidePaper = false;
          paperState.paperFeedOffset = 190 * (1 - uD);
          paperState.platenSpinOffset = -8.0 * uD;
        } else {
          if (!paperAnim.outPlaced) {
            paperAnim.outPlaced = true;
            st.addFinishedSheet(paperAnim.snapshot);
            if (paperAnim.pendingArchive) {
              archivedPages.push(paperAnim.pendingArchive);
              paperAnim.pendingArchive = null;
            }
          }
          st.flyingOut.visible = false;
          st.flyingIn.visible = false;
          paperAnim.active = false;
          paperState.hidePaper = false;
          paperState.paperFeedOffset = 0;
          paperState.platenSpinOffset = 0;
        }
      }
    }

    st.setCut(cut, 0);
    st.frame(
      {
        activeCode,
        strokeP,
        line,
        col,
        carriageCol: smoothCol,
        totalChars,
        returnProgress,
        hidePaper: paperState.hidePaper,
        paperFeedOffset: paperState.paperFeedOffset,
        platenSpinOffset: paperState.platenSpinOffset,
        explode: explodeVal,
        isolate: false,
        arrows: exploded || cut === 'section',
      },
      {...cam, az: cam.az * D2R, el: cam.el * D2R},
    );

    const callouts = [];
    if (labels) {
      const vw = st.size.w;
      const vh = st.size.h;
      const maxLx = Math.max(220, vw - 200);
      const maxLy = Math.max(120, vh - 108);
      for (const cd of CALLOUT_DEFS) {
        const pt = cd.p(explodeVal);
        const p = st.project(pt[0], pt[1], pt[2]);
        if (p) {
          callouts.push({
            name: cd.name,
            sub: cd.sub,
            at: p,
            label: [
              clamp(p[0] + cd.dx, 24, maxLx),
              clamp(p[1] + cd.dy, 72, maxLy),
            ],
          });
        }
      }
    }

    ui.update({
      page: pageCounter + 1,
      archiveCount: archivedPages.length,
      archiveOpen: ui.isArchiveOpen(),
      col,
      line,
      promptHidden,
      autoType,
      sound: soundEnabled,
      rain: rainEnabled,
      lamp: lampEnabled,
      exploded,
      labels,
      theme,
      view,
      cut,
      callouts,
    });

    requestAnimationFrame(loop);
  };

  warmComposer(st.renderer, st.composer, st.scene, st.camera).then(() =>
    requestAnimationFrame(loop),
  );
}

runApp();
