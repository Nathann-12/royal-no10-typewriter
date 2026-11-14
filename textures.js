import * as THREE from 'three';

export function createKeycapTexture(label, subLabel = '', isDark = true) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');

  const grad = g.createRadialGradient(
    size * 0.45,
    size * 0.4,
    size * 0.04,
    size * 0.5,
    size * 0.5,
    size * 0.52,
  );
  if (isDark) {
    grad.addColorStop(0, '#272624');
    grad.addColorStop(0.8, '#171614');
    grad.addColorStop(1, '#0e0d0c');
  } else {
    grad.addColorStop(0, '#f7f1e3');
    grad.addColorStop(0.85, '#e2d7bc');
    grad.addColorStop(1, '#c3b495');
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);

  g.strokeStyle = isDark ? 'rgba(255,245,220,0.14)' : 'rgba(60,45,30,0.16)';
  g.lineWidth = 10;
  g.beginPath();
  g.arc(size / 2, size / 2, size * 0.43, 0, Math.PI * 2);
  g.stroke();

  g.fillStyle = isDark ? '#f2e8cf' : '#1f1b17';
  g.textAlign = 'center';
  g.textBaseline = 'middle';

  if (subLabel) {
    g.font = '700 62px "JetBrains Mono", Georgia, serif';
    g.fillText(subLabel, size / 2, size * 0.34);
    g.font = '700 72px "JetBrains Mono", Georgia, serif';
    g.fillText(label, size / 2, size * 0.67);
  } else {
    const fs = label.length > 2 ? 42 : 98;
    g.font = `700 ${fs}px "JetBrains Mono", Georgia, serif`;
    g.fillText(label, size / 2, size * 0.53);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createNameplateTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d');

  g.fillStyle = '#141312';
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = '#c89e52';
  g.lineWidth = 6;
  g.strokeRect(10, 10, 492, 108);

  g.fillStyle = '#e5c174';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 50px Georgia, serif';
  g.fillText('R O Y A L', 256, 54);

  g.font = '600 18px "JetBrains Mono", monospace';
  g.fillStyle = '#b9934c';
  g.fillText('STANDARD  NO. 10  ·  1938', 256, 94);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createRulerTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 64;
  const g = c.getContext('2d');

  g.fillStyle = '#cfd3d8';
  g.fillRect(0, 0, 1024, 64);

  g.strokeStyle = '#181a1e';
  g.fillStyle = '#181a1e';
  g.font = '700 20px "JetBrains Mono", monospace';
  g.textAlign = 'center';

  for (let i = 0; i <= 52; i++) {
    const x = 48 + (i / 52) * 928;
    const isTen = i % 10 === 0;
    const isFive = i % 5 === 0;
    const h = isTen ? 26 : isFive ? 18 : 11;
    g.lineWidth = isTen ? 3 : 1.5;
    g.beginPath();
    g.moveTo(x, 64);
    g.lineTo(x, 64 - h);
    g.stroke();
    if (isTen) g.fillText(String(i), x, 24);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export class PaperSheetCanvas {
  constructor() {
    this.width = 1536;
    this.height = 2112;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d');

    this.marginLeft = 128;
    this.marginTop = 160;
    this.charWidth = 24.5;
    this.lineHeight = 52;
    this.maxCols = 52;
    this.maxLines = 34;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 16;

    this.clear();
  }

  clear() {
    const {ctx, width, height} = this;
    ctx.fillStyle = '#f7f2e7';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillStyle =
        Math.random() > 0.5
          ? 'rgba(170,155,130,0.08)'
          : 'rgba(255,255,252,0.16)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    // Subtle mechanical letterhead watermark on sheet
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 165, 142, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, width - 92, height - 92);
    ctx.restore();

    this.texture.needsUpdate = true;
  }

  stampChar(char, line, col) {
    if (line >= this.maxLines || col >= this.maxCols) return;
    const {ctx} = this;
    const x =
      this.marginLeft + col * this.charWidth + (Math.random() - 0.5) * 0.6;
    const y =
      this.marginTop + line * this.lineHeight + (Math.random() - 0.5) * 1.0;

    const inkAlpha = 0.92 + Math.random() * 0.08;
    ctx.save();
    ctx.font = '700 40px "JetBrains Mono", "Courier New", monospace';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = `rgba(22, 18, 16, ${inkAlpha * 0.32})`;
    ctx.fillText(char, x + 0.7, y + 0.6);

    ctx.fillStyle = `rgba(14, 14, 15, ${inkAlpha})`;
    ctx.fillText(char, x, y);
    ctx.restore();

    this.texture.needsUpdate = true;
  }
}

export function createWoodTextures() {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');

  const rc = document.createElement('canvas');
  rc.width = rc.height = size;
  const rg = rc.getContext('2d');

  // Rich walnut desk base
  g.fillStyle = '#332015';
  g.fillRect(0, 0, size, size);
  rg.fillStyle = '#a0a0a0';
  rg.fillRect(0, 0, size, size);

  // Subtle deterministic wood grain streaks
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 420; i++) {
    const y = rand() * size;
    const h = 1 + rand() * 5;
    const alpha = 0.04 + rand() * 0.09;
    const dark = rand() > 0.35;
    g.fillStyle = dark
      ? `rgba(16, 9, 5, ${alpha})`
      : `rgba(92, 58, 36, ${alpha * 0.85})`;

    g.beginPath();
    g.moveTo(0, y);
    const wave = (rand() - 0.5) * 14;
    g.bezierCurveTo(
      size * 0.33,
      y + wave,
      size * 0.66,
      y - wave,
      size,
      y + (rand() - 0.5) * 8,
    );
    g.lineTo(size, y + h);
    g.lineTo(0, y + h);
    g.closePath();
    g.fill();

    rg.fillStyle = dark
      ? `rgba(192, 192, 192, ${alpha})`
      : `rgba(112, 112, 112, ${alpha})`;
    rg.fillRect(0, y, size, h);
  }

  const colorTex = new THREE.CanvasTexture(c);
  colorTex.colorSpace = THREE.SRGBColorSpace;
  colorTex.wrapS = colorTex.wrapT = THREE.RepeatWrapping;
  colorTex.repeat.set(3.2, 2.6);

  const roughTex = new THREE.CanvasTexture(rc);
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(3.2, 2.6);

  return {colorTex, roughTex};
}
