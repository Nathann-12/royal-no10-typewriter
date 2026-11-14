// Cozy Minimalist Glassmorphic Pill HUD + Dark-Acrylic Exploded Callouts
// Styled after the warm writer's desk aesthetic with on-demand Explode & Cutaway toggles.
// Fonts ('Inter' and 'JetBrains Mono') are base64-inlined automatically by teardown build.mjs.

export const VIEWS = ['desk', 'keywell', 'escapement', 'paper', 'hero'];
export const CUTS = ['solid', 'glass', 'section'];
export const THEMES = ['midnight', 'forest', 'cream', 'burgundy'];

const VIEW_LABELS = {
  desk: 'Desk View',
  keywell: 'Hammers',
  escapement: 'Gears',
  paper: 'Paper',
  hero: '3/4 Hero',
};

const CUT_LABELS = {
  solid: 'Solid',
  glass: 'Glass',
  section: 'Section',
};

const THEME_META = {
  midnight: {color: '#16181c', title: 'Midnight Enamel'},
  forest: {color: '#173329', title: 'British Racing Green'},
  cream: {color: '#d9cdb8', title: 'Vintage Ivory'},
  burgundy: {color: '#4a181d', title: 'Oxblood Lacquer'},
};

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0;user-select:none}
  .tw-hud{position:fixed;inset:0;pointer-events:none;z-index:10;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:#f3ede2}
  .tw-call-svg{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5}
  .tw-call-layer{position:fixed;inset:0;pointer-events:none;z-index:6}

  .hud-top-left,.hud-top-right,.hud-bottom{position:fixed;z-index:12;display:flex;align-items:center;gap:10px;pointer-events:none}
  .hud-top-left{top:18px;left:22px;flex-direction:column;align-items:flex-start;gap:6px}
  .hud-top-right{top:18px;right:22px;background:rgba(20,17,14,0.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,236,200,0.12);border-radius:999px;padding:5px 8px;pointer-events:auto;box-shadow:0 10px 30px rgba(0,0,0,0.28)}
  .hud-bottom{bottom:18px;left:50%;transform:translateX(-50%);gap:8px;pointer-events:auto;width:max-content;max-width:calc(100vw - 20px);justify-content:center}

  .brand-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border-radius:999px;background:rgba(20,17,14,0.62);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,228,180,0.14);font-size:11px;letter-spacing:0.14em;font-weight:600;color:#e8d5b5;box-shadow:0 8px 24px rgba(0,0,0,0.25)}
  .brand-badge .dot{width:6px;height:6px;border-radius:50%;background:#d8a657;box-shadow:0 0 8px #d8a657}
  .status-line{padding-left:10px;font-family:'JetBrains Mono',monospace;font-size:12px;color:rgba(243,237,226,0.78);letter-spacing:0.04em;text-shadow:0 1px 6px rgba(0,0,0,0.85)}

  .control-group{display:flex;align-items:center;gap:2px}
  .hud-bottom .control-group{background:rgba(20,17,14,0.68);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,236,200,0.12);border-radius:999px;padding:4px 6px;box-shadow:0 10px 30px rgba(0,0,0,0.3)}
  .divider{width:1px;height:16px;background:rgba(255,236,200,0.14);margin:0 3px}

  .swatch{width:17px;height:17px;border-radius:50%;border:2px solid rgba(255,255,255,0.2);background:var(--c);cursor:pointer;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
  .swatch:hover{transform:scale(1.14)}
  .swatch.active{border-color:#f0c67a;box-shadow:0 0 0 2px rgba(240,198,122,0.28)}

  .pill-btn,.icon-btn{border:none;background:transparent;color:rgba(243,237,226,0.74);font-family:inherit;font-size:11.5px;font-weight:500;padding:5px 8px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:background .16s ease,color .16s ease}
  .pill-btn:hover,.icon-btn:hover{background:rgba(255,236,200,0.1);color:#fff8eb}
  .pill-btn.active,.icon-btn.active{background:rgba(216,166,87,0.22);color:#f4d399}
  .icon-btn .ic{font-size:12px;line-height:1}

  .typing-prompt{position:fixed;bottom:72px;left:50%;transform:translateX(-50%);z-index:9;text-align:center;pointer-events:none;padding:9px 20px;border-radius:14px;background:rgba(18,15,12,0.62);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,236,200,0.12);transition:opacity .55s ease,transform .55s ease}
  .typing-prompt.hidden{opacity:0;transform:translateX(-50%) translateY(10px)}
  .prompt-title{font-family:'JetBrains Mono',monospace;font-size:13px;color:#f3dfb8;margin-bottom:3px}
  .prompt-sub{font-size:11px;color:rgba(243,237,226,0.64)}

  .tw-call{position:absolute;padding:4px 8px;background:rgba(16,13,10,0.84);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(240,198,122,0.28);border-radius:6px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.35)}
  .tw-call b{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:9.5px;font-weight:700;letter-spacing:0.06em;color:#f5ead5;line-height:1.25}
  .tw-call b i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#d8a657;box-shadow:0 0 6px #d8a657}
  .tw-call span{display:block;font-family:'JetBrains Mono',monospace;font-size:8px;letter-spacing:0.05em;color:#bca989;padding-left:10px}
  .icon-btn .cnt{padding:1px 6px;border-radius:999px;background:rgba(216,166,87,0.22);color:#f4d399;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700}
  .icon-btn.empty{opacity:0.5}

  .tw-modal-backdrop{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:rgba(8,7,5,0.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);pointer-events:auto;padding:24px}
  .tw-modal-backdrop.open{display:flex}
  .tw-modal{width:min(860px,94vw);height:min(660px,88vh);display:flex;flex-direction:column;background:rgba(24,20,16,0.94);border:1px solid rgba(240,198,122,0.22);border-radius:18px;box-shadow:0 24px 64px rgba(0,0,0,0.62);overflow:hidden;color:#f3ede2}
  .tw-modal-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,236,200,0.1)}
  .tw-modal-title{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;letter-spacing:0.06em;color:#f4d399}
  .tw-modal-meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(243,237,226,0.62);margin-top:2px}
  .tw-modal-close{border:1px solid rgba(255,236,200,0.15);background:rgba(255,255,255,0.04);color:#f3ede2;border-radius:999px;padding:5px 12px;font-size:12px;cursor:pointer}
  .tw-modal-close:hover{background:rgba(255,236,200,0.12)}
  .tw-modal-body{flex:1;min-height:0;display:flex;gap:0}
  .tw-modal-thumbs{width:176px;flex-shrink:0;overflow-y:auto;padding:12px;border-right:1px solid rgba(255,236,200,0.09);display:flex;flex-direction:column;gap:8px;background:rgba(14,11,9,0.55)}
  .tw-thumb-item{border:1px solid rgba(255,236,200,0.1);border-radius:10px;padding:6px;background:rgba(255,255,255,0.03);cursor:pointer;text-align:left;transition:border-color .15s,background .15s}
  .tw-thumb-item:hover{background:rgba(255,236,200,0.07)}
  .tw-thumb-item.active{border-color:#d8a657;background:rgba(216,166,87,0.15)}
  .tw-thumb-item img{display:block;width:100%;height:110px;object-fit:cover;object-position:top center;border-radius:5px;margin-bottom:5px;background:#f7f2e7}
  .tw-thumb-lbl{font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;color:#f3ede2}
  .tw-thumb-sub{font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(243,237,226,0.58)}
  .tw-modal-stage{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;padding:18px;background:radial-gradient(circle at center,rgba(45,35,24,0.4),rgba(12,10,8,0.8));overflow:auto}
  .tw-modal-stage img{max-width:100%;max-height:100%;object-fit:contain;border-radius:4px;box-shadow:0 16px 40px rgba(0,0,0,0.55);background:#f7f2e7}
  .tw-modal-empty{font-family:'JetBrains Mono',monospace;font-size:13px;color:rgba(243,237,226,0.65);text-align:center;line-height:1.7}
  .tw-modal-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid rgba(255,236,200,0.1);gap:10px}
  .tw-modal-nav{display:flex;align-items:center;gap:6px}
  .tw-btn{border:1px solid rgba(255,236,200,0.16);background:rgba(255,236,200,0.06);color:#f3ede2;border-radius:999px;padding:7px 14px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .15s,border-color .15s}
  .tw-btn:hover:not(:disabled){background:rgba(255,236,200,0.14)}
  .tw-btn:disabled{opacity:0.35;cursor:default}
  .tw-btn.primary{background:#d8a657;color:#17120c;border-color:#e4b96d;font-weight:600}
  .tw-btn.primary:hover:not(:disabled){background:#e6b86a}

  @media (max-width:740px){
    .hud-bottom{flex-wrap:wrap}
    .hud-top-right{max-width:calc(100vw - 230px);flex-wrap:wrap;justify-content:flex-end;border-radius:16px}
    .typing-prompt{bottom:108px}
    .tw-modal-body{flex-direction:column}
    .tw-modal-thumbs{width:100%;height:132px;flex-direction:row;overflow-x:auto;overflow-y:hidden;border-right:none;border-bottom:1px solid rgba(255,236,200,0.09)}
    .tw-thumb-item{width:96px;flex-shrink:0}
    .tw-thumb-item img{height:68px}
  }
`;

export function createConsole(container) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'tw-hud';
  container.appendChild(root);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'tw-call-svg');
  root.appendChild(svg);

  const callLayer = document.createElement('div');
  callLayer.className = 'tw-call-layer';
  root.appendChild(callLayer);

  // Top-left brand + typing cursor status
  const topLeft = document.createElement('div');
  topLeft.className = 'hud-top-left';
  topLeft.innerHTML = `
    <div class="brand-badge"><span class="dot"></span><span>ROYAL NO. 10 · 1938</span></div>
    <div class="status-line">Page <span id="tw-page">1</span> · Line <span id="tw-line">1</span> · Col <span id="tw-col">0</span>/52</div>
  `;
  root.appendChild(topLeft);
  const pageEl = topLeft.querySelector('#tw-page');
  const lineEl = topLeft.querySelector('#tw-line');
  const colEl = topLeft.querySelector('#tw-col');

  // Top-right enamel swatches & camera presets
  const topRight = document.createElement('div');
  topRight.className = 'hud-top-right';
  const swatchGroup = document.createElement('div');
  swatchGroup.className = 'control-group';
  const dividerTop = document.createElement('div');
  dividerTop.className = 'divider';
  const viewGroup = document.createElement('div');
  viewGroup.className = 'control-group';
  topRight.append(swatchGroup, dividerTop, viewGroup);
  root.appendChild(topRight);

  // Center typing prompt
  const promptEl = document.createElement('div');
  promptEl.className = 'typing-prompt';
  promptEl.innerHTML = `
    <div class="prompt-title">Click anywhere &amp; start typing</div>
    <div class="prompt-sub">Keyboard supported · Click 3D keys · Drag to orbit · Scroll to zoom</div>
  `;
  root.appendChild(promptEl);

  // Bottom floating dock
  const bottom = document.createElement('div');
  bottom.className = 'hud-bottom';
  const grpSound = document.createElement('div');
  grpSound.className = 'control-group';
  const grpMech = document.createElement('div');
  grpMech.className = 'control-group';
  const grpSheet = document.createElement('div');
  grpSheet.className = 'control-group';
  bottom.append(grpSound, grpMech, grpSheet);
  root.appendChild(bottom);

  const btn = {};

  for (const th of THEMES) {
    const b = document.createElement('button');
    b.className = 'swatch';
    b.style.setProperty('--c', THEME_META[th].color);
    b.title = THEME_META[th].title;
    swatchGroup.appendChild(b);
    btn['theme_' + th] = b;
  }

  for (const v of VIEWS) {
    const b = document.createElement('button');
    b.className = 'pill-btn';
    b.textContent = VIEW_LABELS[v];
    viewGroup.appendChild(b);
    btn[v] = b;
  }

  const mkIconBtn = (parent, icon, label, title) => {
    const b = document.createElement('button');
    b.className = 'icon-btn';
    b.title = title;
    b.innerHTML = icon
      ? `<span class="ic">${icon}</span><span>${label}</span>`
      : `<span>${label}</span>`;
    parent.appendChild(b);
    return b;
  };

  btn.sound = mkIconBtn(grpSound, '🔊', 'Clack', 'Toggle Typewriter Clack Sound');
  btn.rain = mkIconBtn(grpSound, '🌧️', 'Rain', 'Toggle Cozy Rain Ambience');
  btn.lamp = mkIconBtn(grpSound, '💡', 'Lamp', 'Toggle Desk Lamp Warmth');

  btn.exploded = mkIconBtn(grpMech, '⚙️', 'Explode', 'Exploded Mechanical View');
  const mechDiv = document.createElement('div');
  mechDiv.className = 'divider';
  grpMech.appendChild(mechDiv);

  for (const c of CUTS) {
    const b = document.createElement('button');
    b.className = 'pill-btn';
    b.textContent = CUT_LABELS[c];
    b.title = `${CUT_LABELS[c]} Housing Mode`;
    grpMech.appendChild(b);
    btn[c] = b;
  }
  btn.labels = mkIconBtn(grpMech, '', 'Labels', 'Toggle Mechanical Part Callouts');
  btn.labels.className = 'pill-btn';

  btn.auto = mkIconBtn(grpSheet, '▶', 'Demo', 'Toggle Auto-Type Demonstration');
  btn.newSheet = mkIconBtn(grpSheet, '📄', 'New Sheet', 'Eject & Stack Typed Sheet, Load Fresh Sheet');
  btn.sheets = document.createElement('button');
  btn.sheets.className = 'icon-btn empty';
  btn.sheets.title = 'Browse & Download Old Typed Sheets (or click left paper stack)';
  btn.sheets.innerHTML = `<span class="ic">🗂️</span><span>Sheets</span><span class="cnt" id="tw-sheet-cnt">0</span>`;
  grpSheet.appendChild(btn.sheets);
  const sheetCntEl = btn.sheets.querySelector('#tw-sheet-cnt');
  btn.savePng = mkIconBtn(grpSheet, '⬇️', 'Save PNG', 'Download Current Sheet as PNG');

  // Archive modal DOM
  const modalBg = document.createElement('div');
  modalBg.className = 'tw-modal-backdrop';
  modalBg.innerHTML = `
    <div class="tw-modal" role="dialog" aria-modal="true">
      <div class="tw-modal-head">
        <div>
          <div class="tw-modal-title" id="tw-arch-title">TYPED SHEETS ARCHIVE</div>
          <div class="tw-modal-meta" id="tw-arch-meta"></div>
        </div>
        <button class="tw-modal-close" id="tw-arch-close">✕ Esc</button>
      </div>
      <div class="tw-modal-body">
        <div class="tw-modal-thumbs" id="tw-arch-thumbs"></div>
        <div class="tw-modal-stage" id="tw-arch-stage"></div>
      </div>
      <div class="tw-modal-foot">
        <div class="tw-modal-nav">
          <button class="tw-btn" id="tw-arch-prev">← Prev</button>
          <button class="tw-btn" id="tw-arch-next">Next →</button>
        </div>
        <div class="tw-modal-nav">
          <button class="tw-btn primary" id="tw-arch-dl">⬇️ Download PNG</button>
        </div>
      </div>
    </div>
  `;
  root.appendChild(modalBg);

  const archTitleEl = modalBg.querySelector('#tw-arch-title');
  const archMetaEl = modalBg.querySelector('#tw-arch-meta');
  const archThumbsEl = modalBg.querySelector('#tw-arch-thumbs');
  const archStageEl = modalBg.querySelector('#tw-arch-stage');
  const archCloseBtn = modalBg.querySelector('#tw-arch-close');
  const archPrevBtn = modalBg.querySelector('#tw-arch-prev');
  const archNextBtn = modalBg.querySelector('#tw-arch-next');
  const archDlBtn = modalBg.querySelector('#tw-arch-dl');

  let archPages = [];
  let archIdx = 0;
  let archCallbacks = {};

  const renderArchive = () => {
    if (!archPages.length) {
      archTitleEl.textContent = 'TYPED SHEETS ARCHIVE';
      archMetaEl.textContent = 'No archived pages yet';
      archThumbsEl.innerHTML = '';
      archStageEl.innerHTML = `<div class="tw-modal-empty">ยังไม่มีกระดาษเก่าในกองครับ<br/>พิมพ์ข้อความแล้วกด New Sheet (หรือคลิกกองกระดาษขวา)<br/>เพื่อย้ายแผ่นที่พิมพ์แล้วมาวางเก็บทางซ้าย</div>`;
      archPrevBtn.disabled = true;
      archNextBtn.disabled = true;
      archDlBtn.disabled = true;
      return;
    }

    archIdx = Math.max(0, Math.min(archPages.length - 1, archIdx));
    const cur = archPages[archIdx];
    archTitleEl.textContent = `PAGE ${cur.pageNumber} OF ${archPages.length} SAVED SHEETS`;
    archMetaEl.textContent = `${cur.timeLabel} · ${cur.charCount} chars · ${cur.lineCount} lines`;

    archStageEl.innerHTML = `<img src="${cur.dataUrl}" alt="Page ${cur.pageNumber}" />`;
    archPrevBtn.disabled = archIdx <= 0;
    archNextBtn.disabled = archIdx >= archPages.length - 1;
    archDlBtn.disabled = false;

    archThumbsEl.innerHTML = '';
    archPages.forEach((pg, i) => {
      const b = document.createElement('button');
      b.className = `tw-thumb-item${i === archIdx ? ' active' : ''}`;
      b.innerHTML = `
        <img src="${pg.dataUrl}" alt="Page ${pg.pageNumber}" />
        <div class="tw-thumb-lbl">Page ${pg.pageNumber}</div>
        <div class="tw-thumb-sub">${pg.charCount} chars · ${pg.timeLabel}</div>
      `;
      b.addEventListener('click', () => {
        b.blur();
        selectArchivePage(i, true);
      });
      archThumbsEl.appendChild(b);
    });
  };

  const selectArchivePage = (idx, notify = false) => {
    if (!archPages.length) return;
    archIdx = Math.max(0, Math.min(archPages.length - 1, idx));
    renderArchive();
    if (notify) archCallbacks.onFlip?.(archIdx);
  };

  const closeArchive = () => {
    modalBg.classList.remove('open');
    archCallbacks.onClose?.();
  };

  const openArchive = (pages, startIndex = -1, cbs = {}) => {
    archPages = pages || [];
    archCallbacks = cbs;
    archIdx =
      startIndex >= 0
        ? startIndex
        : Math.max(0, archPages.length - 1);
    renderArchive();
    modalBg.classList.add('open');
  };

  archCloseBtn.addEventListener('click', (e) => {
    e.currentTarget.blur();
    closeArchive();
  });
  modalBg.addEventListener('click', (e) => {
    if (e.target === modalBg) closeArchive();
  });
  archPrevBtn.addEventListener('click', (e) => {
    e.currentTarget.blur();
    selectArchivePage(archIdx - 1, true);
  });
  archNextBtn.addEventListener('click', (e) => {
    e.currentTarget.blur();
    selectArchivePage(archIdx + 1, true);
  });
  archDlBtn.addEventListener('click', (e) => {
    e.currentTarget.blur();
    if (!archPages.length) return;
    archCallbacks.onDownload?.(archPages[archIdx]);
  });

  const setActive = (el, on) => el.classList.toggle('active', !!on);

  return {
    root,
    btn,
    openArchive,
    selectArchivePage,
    closeArchive,
    isArchiveOpen: () => modalBg.classList.contains('open'),
    update(s) {
      pageEl.textContent = String(s.page ?? 1);
      lineEl.textContent = String((s.line ?? 0) + 1);
      colEl.textContent = String(s.col ?? 0);
      sheetCntEl.textContent = String(s.archiveCount ?? 0);
      btn.sheets.classList.toggle('empty', !(s.archiveCount > 0));
      setActive(btn.sheets, s.archiveOpen);
      promptEl.classList.toggle('hidden', !!s.promptHidden);

      for (const th of THEMES) setActive(btn['theme_' + th], s.theme === th);
      for (const v of VIEWS) setActive(btn[v], s.view === v);
      for (const c of CUTS) setActive(btn[c], s.cut === c);

      setActive(btn.sound, s.sound);
      setActive(btn.rain, s.rain);
      setActive(btn.lamp, s.lamp);
      setActive(btn.exploded, s.exploded);
      setActive(btn.labels, s.labels);
      setActive(btn.auto, s.autoType);

      if (s.labels && s.callouts?.length) {
        let lh = '';
        let ch = '';
        for (const c of s.callouts) {
          if (!c.at) continue;
          const [ax, ay] = c.at;
          const [lx, ly] = c.label;
          lh += `<polyline points="${ax.toFixed(1)},${ay.toFixed(1)} ${lx.toFixed(1)},${(ly + 14).toFixed(1)} ${(lx + 115).toFixed(1)},${(ly + 14).toFixed(1)}" fill="none" stroke="rgba(216,166,87,0.58)" stroke-width="1"/>`;
          lh += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.6" fill="#d8a657"/>`;
          ch += `<div class="tw-call" style="left:${lx.toFixed(1)}px;top:${(ly - 8).toFixed(1)}px"><b><i></i>${c.name}</b><span>${c.sub}</span></div>`;
        }
        svg.innerHTML = lh;
        callLayer.innerHTML = ch;
      } else {
        if (svg.innerHTML) svg.innerHTML = '';
        if (callLayer.innerHTML) callLayer.innerHTML = '';
      }
    },
  };
}
