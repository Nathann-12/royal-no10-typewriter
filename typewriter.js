// Royal Model 10 (1938) — Built in millimetres (scaled 0.001 to metres) in the teardown engineering study look:
// precision toothed escapement starwheel & carriage rack, 43 helical coil key-return springs, pivoted keylevers &
// angled draw-wires, 40 radial typebars converging through a slotted segment, bevel-geared ribbon spools,
// dynamically wrapped platen paper, cutaway modes (glass / section + stencil cap / solid), isolate, explode, & arrows.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {D2R, KEYS, M_SPEC, solveKeystroke} from './kin.js';
import {
  createKeycapTexture,
  createNameplateTexture,
  createRulerTexture,
} from './textures.js';

const V3 = THREE.Vector3;

export const THEMES = {
  midnight: {color: '#141518', roughness: 0.28, metalness: 0.22, clearcoat: 0.78},
  forest: {color: '#153025', roughness: 0.28, metalness: 0.18, clearcoat: 0.78},
  cream: {color: '#d6cbb4', roughness: 0.32, metalness: 0.08, clearcoat: 0.65},
  burgundy: {color: '#4c161d', roughness: 0.28, metalness: 0.2, clearcoat: 0.8},
};

function gearGeo(teeth, rOut, rRoot, width, holeR = 0) {
  const sh = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const da = (Math.PI * 2) / teeth;
    const pts = [
      [rRoot, a0],
      [rRoot, a0 + da * 0.2],
      [rOut, a0 + da * 0.34],
      [rOut, a0 + da * 0.62],
      [rRoot, a0 + da * 0.76],
    ];
    pts.forEach(([r, a], k) =>
      i === 0 && k === 0
        ? sh.moveTo(r * Math.cos(a), r * Math.sin(a))
        : sh.lineTo(r * Math.cos(a), r * Math.sin(a)),
    );
  }
  sh.closePath();
  if (holeR) {
    const h = new THREE.Path();
    h.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.5,
    bevelSize: 0.4,
    bevelSegments: 1,
    curveSegments: 4,
  });
  g.translate(0, 0, -width / 2);
  g.computeVertexNormals();
  return g;
}

function rackGeo(len, w, h, pitch) {
  const sh = new THREE.Shape();
  sh.moveTo(-len / 2, h / 2);
  sh.lineTo(len / 2, h / 2);
  sh.lineTo(len / 2, -h / 2);
  const n = Math.floor(len / pitch);
  for (let i = n - 1; i >= 0; i--) {
    const x0 = -len / 2 + i * pitch;
    sh.lineTo(x0 + pitch * 0.78, -h / 2);
    sh.lineTo(x0 + pitch * 0.6, -h / 2 - 2.2);
    sh.lineTo(x0 + pitch * 0.4, -h / 2 - 2.2);
    sh.lineTo(x0 + pitch * 0.22, -h / 2);
  }
  sh.lineTo(-len / 2, -h / 2);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: w,
    bevelEnabled: true,
    bevelThickness: 0.35,
    bevelSize: 0.35,
    bevelSegments: 1,
  });
  g.translate(0, 0, -w / 2);
  return g;
}

function helixGeo(r, wire, turns, len, seg = 110) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const a = u * turns * Math.PI * 2;
    pts.push(new V3(Math.cos(a) * r, u * len, Math.sin(a) * r));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, wire, 6, false);
}

export function buildTypewriter(paperCanvas, opts = {}) {
  const root = new THREE.Group();

  const M = {
    shell: new THREE.MeshPhysicalMaterial({
      color: THEMES.midnight.color,
      roughness: 0.08,
      metalness: 0.05,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      clearcoat: 0.9,
      envMapIntensity: 1.6,
    }),
    enamel: new THREE.MeshPhysicalMaterial({
      color: THEMES.midnight.color,
      roughness: THEMES.midnight.roughness,
      metalness: THEMES.midnight.metalness,
      clearcoat: THEMES.midnight.clearcoat,
      clearcoatRoughness: 0.16,
    }),
    cast: new THREE.MeshPhysicalMaterial({
      color: '#1e2024',
      roughness: 0.52,
      metalness: 0.25,
      clearcoat: 0.25,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: '#cfd3d8',
      roughness: 0.22,
      metalness: 0.96,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: '#c4984c',
      roughness: 0.26,
      metalness: 0.9,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: '#191a1d',
      roughness: 0.84,
      metalness: 0.04,
    }),
    felt: new THREE.MeshStandardMaterial({
      color: '#8f1d24',
      roughness: 0.94,
      metalness: 0,
    }),
    ribbon: new THREE.MeshStandardMaterial({
      color: '#151517',
      roughness: 0.72,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      envMapIntensity: 1.5,
    }),
    red: new THREE.MeshBasicMaterial({
      color: '#d6182b',
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
  };

  const extraMats = [];
  const add = (parent, geo, mat, cast = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // Sub-assembly groups for exploded view & subsystem isolation
  const chassisGroup = new THREE.Group();
  const keybankGroup = new THREE.Group();
  const linkageGroup = new THREE.Group();
  const basketGroup = new THREE.Group();
  const escapementGroup = new THREE.Group();
  const ribbonGroup = new THREE.Group();
  const carriageGroup = new THREE.Group();
  const paperGroup = new THREE.Group();
  const arrowsGroup = new THREE.Group();

  root.add(
    chassisGroup,
    keybankGroup,
    linkageGroup,
    basketGroup,
    escapementGroup,
    ribbonGroup,
    carriageGroup,
    arrowsGroup,
  );

  // ------------------------------------------------------------ 1. CHASSIS (feet, sculpted cheeks, front cowl, rear wall)
  {
    const footGeo = new THREE.CylinderGeometry(13, 16, 9, 24);
    for (const [x, z] of [
      [-142, 136],
      [142, 136],
      [-142, -108],
      [142, -108],
    ]) {
      add(chassisGroup, footGeo, M.rubber).position.set(x, 4.5, z);
    }

    // Solid internal base plate (stays solid even in glass cutaway!)
    const base = add(
      chassisGroup,
      new RoundedBoxGeometry(304, 7, 266, 3, 1.5),
      M.cast,
    );
    base.position.set(0, 11.5, 14);

    // Sculpted side cheeks with lightening window cutouts (shell material turns glass in cutaway!)
    const sideShape = new THREE.Shape();
    sideShape.moveTo(-124, 9);
    sideShape.lineTo(154, 9);
    sideShape.lineTo(154, 34);
    sideShape.lineTo(86, 62);
    sideShape.quadraticCurveTo(45, 88, 25, 114);
    sideShape.lineTo(-36, 127);
    sideShape.quadraticCurveTo(-76, 135, -124, 133);
    sideShape.closePath();

    // Beveled side inspection window cutout
    const winHole = new THREE.Path();
    winHole.moveTo(-78, 52);
    winHole.lineTo(-16, 52);
    winHole.lineTo(-16, 92);
    winHole.lineTo(-78, 92);
    winHole.closePath();
    sideShape.holes.push(winHole);

    const sideGeo = new THREE.ExtrudeGeometry(sideShape, {
      depth: 14,
      bevelEnabled: true,
      bevelThickness: 3.2,
      bevelSize: 2.8,
      bevelSegments: 5,
      curveSegments: 48,
    });
    sideGeo.rotateY(Math.PI / 2);

    const leftSide = add(chassisGroup, sideGeo, M.shell);
    leftSide.position.set(-160, 0, 0);
    const rightSide = add(chassisGroup, sideGeo, M.shell);
    rightSide.position.set(146, 0, 0);

    // Side window brass bezel & clear glass pane
    const winGlassGeo = new THREE.PlaneGeometry(60, 38);
    [-162, 162].forEach((wx, idx) => {
      const pane = add(chassisGroup, winGlassGeo, M.glass, false);
      pane.position.set(wx, 72, -47);
      pane.rotation.y = idx === 0 ? -Math.PI / 2 : Math.PI / 2;

      const rim = add(
        chassisGroup,
        new RoundedBoxGeometry(3, 44, 66, 2, 1),
        M.brass,
        false,
      );
      rim.position.set(wx * 0.99, 72, -47);
      // Hollow look via top/bottom brass rails
      rim.scale.set(1, 0.08, 1);
      rim.position.y = 93;
      const rimB = rim.clone();
      rimB.position.y = 51;
      chassisGroup.add(rimB);
    });

    // Rear housing wall with machined inspection window opening for escapement visibility
    const rearShape = new THREE.Shape();
    rearShape.moveTo(-152, 16);
    rearShape.lineTo(152, 16);
    rearShape.lineTo(152, 128);
    rearShape.lineTo(-152, 128);
    rearShape.closePath();
    const escWindow = new THREE.Path();
    escWindow.moveTo(-48, 72);
    escWindow.lineTo(48, 72);
    escWindow.lineTo(48, 122);
    escWindow.lineTo(-48, 122);
    escWindow.closePath();
    rearShape.holes.push(escWindow);

    const rearGeo = new THREE.ExtrudeGeometry(rearShape, {
      depth: 16,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1.8,
      bevelSegments: 3,
    });
    rearGeo.translate(0, 0, -8);
    const rearWall = add(chassisGroup, rearGeo, M.shell);
    rearWall.position.set(0, 0, -115);

    // Front lower rail
    const frontRail = add(
      chassisGroup,
      new RoundedBoxGeometry(318, 17, 15, 3, 2),
      M.shell,
    );
    frontRail.position.set(0, 17.5, 150);

    // Front arched ribbon bridge / cowl
    const cowlShape = new THREE.Shape();
    cowlShape.moveTo(-144, 0);
    cowlShape.lineTo(-144, 34);
    cowlShape.quadraticCurveTo(-110, 42, -78, 22);
    cowlShape.lineTo(-55, 14);
    cowlShape.lineTo(55, 14);
    cowlShape.lineTo(78, 22);
    cowlShape.quadraticCurveTo(110, 42, 144, 34);
    cowlShape.lineTo(144, 0);
    cowlShape.closePath();

    const cowlGeo = new THREE.ExtrudeGeometry(cowlShape, {
      depth: 22,
      bevelEnabled: true,
      bevelThickness: 2.2,
      bevelSize: 2.0,
      bevelSegments: 5,
      curveSegments: 48,
    });
    const frontBridge = add(chassisGroup, cowlGeo, M.shell);
    frontBridge.position.set(0, 86, 24);

    // Gold pinstripe & Royal brass nameplate
    const trim = add(
      chassisGroup,
      new THREE.BoxGeometry(284, 1.4, 1.4),
      M.brass,
    );
    trim.position.set(0, 88, 48.2);

    const plateBacking = add(
      chassisGroup,
      new RoundedBoxGeometry(80, 20, 2.6, 2, 0.6),
      M.brass,
    );
    plateBacking.position.set(0, 96, 47.6);

    const plateMat = new THREE.MeshStandardMaterial({
      map: createNameplateTexture(),
      roughness: 0.32,
      metalness: 0.65,
    });
    extraMats.push(plateMat);
    const nameplate = add(
      chassisGroup,
      new THREE.PlaneGeometry(76, 17),
      plateMat,
      false,
    );
    nameplate.position.set(0, 96, 49.1);

    // Precision chrome carriage rails (stationary lower track)
    const railGeo = new THREE.CylinderGeometry(3.2, 3.2, 312, 20);
    railGeo.rotateZ(Math.PI / 2);
    add(chassisGroup, railGeo, M.steel).position.set(0, 124, -50);
    add(chassisGroup, railGeo, M.steel).position.set(0, 124, -100);
  }

  // ------------------------------------------------------------ 2. KEYBANK & KEYLEVERS & HELICAL RETURN SPRINGS
  const keyVisuals = new Map();
  const clickableMeshes = [];
  const springGeo = helixGeo(2.8, 0.55, 5.5, 16);
  const cupGeo = new THREE.CylinderGeometry(9.5, 9.8, 4.2, 32);
  const rimGeo = new THREE.TorusGeometry(9.0, 1.1, 10, 32);
  rimGeo.rotateX(Math.PI / 2);
  const faceGeo = new THREE.CircleGeometry(8.3, 32);
  faceGeo.rotateX(-Math.PI / 2);
  const lensGeo = new THREE.CylinderGeometry(8.1, 8.3, 0.8, 28);

  // Fulcrum shaft & universal trip bar
  const fulcrumShaft = add(
    keybankGroup,
    new THREE.CylinderGeometry(2.6, 2.6, 270, 20).rotateZ(Math.PI / 2),
    M.steel,
  );
  fulcrumShaft.position.set(0, 24, -12);

  const universalBar = add(
    keybankGroup,
    new THREE.BoxGeometry(246, 4, 6),
    M.brass,
  );
  universalBar.position.set(0, 20, 36);

  KEYS.forEach((k) => {
    if (k.code === 'Space') {
      const spaceGroup = new THREE.Group();
      spaceGroup.position.set(0, k.y, k.z);

      const bar = add(
        spaceGroup,
        new RoundedBoxGeometry(150, 6.5, 14, 3, 1.8),
        M.rubber,
      );
      bar.userData.keyCode = 'Space';
      clickableMeshes.push(bar);

      for (const sx of [-58, 58]) {
        const arm = add(
          spaceGroup,
          new THREE.BoxGeometry(3.6, 3.6, 28),
          M.steel,
        );
        arm.position.set(sx, -2, -15);
        const sp = add(spaceGroup, springGeo, M.brass);
        sp.position.set(sx, -18, -10);
      }

      keybankGroup.add(spaceGroup);
      keyVisuals.set('Space', {
        keyGroup: spaceGroup,
        restY: k.y,
        leverPivot: null,
        springMesh: null,
        drawWire: null,
        def: k,
      });
      return;
    }

    // Keycap + vertical stem
    const keyGroup = new THREE.Group();
    keyGroup.position.set(k.x, k.y, k.z);
    const cupMat = k.isAction ? M.brass : M.steel;

    const cup = add(keyGroup, cupGeo, cupMat);
    const rim = add(keyGroup, rimGeo, cupMat);
    rim.position.y = 2.1;

    const faceMat = new THREE.MeshStandardMaterial({
      map: createKeycapTexture(k.label, k.sub || '', !k.isAction),
      roughness: 0.3,
      metalness: 0.04,
    });
    extraMats.push(faceMat);
    const face = add(keyGroup, faceGeo, faceMat);
    face.position.y = 2.2;

    const lens = add(keyGroup, lensGeo, M.glass, false);
    lens.position.y = 2.6;

    const stemH = k.y - 16;
    const stem = add(
      keyGroup,
      new THREE.CylinderGeometry(1.3, 1.3, stemH, 10),
      M.steel,
    );
    stem.position.set(0, -stemH / 2, 0);

    cup.userData.keyCode = k.code;
    face.userData.keyCode = k.code;
    clickableMeshes.push(cup, face);
    keybankGroup.add(keyGroup);

    // Helical return spring seated on the base frame around the stem
    const springMesh = add(keybankGroup, springGeo, M.brass);
    springMesh.position.set(k.x, 15, k.z);

    // Horizontal keylever pivoting around fulcrum (z = -12, y = 24)
    const leverLen = k.z + 12;
    const leverPivot = new THREE.Group();
    leverPivot.position.set(k.x, 24, -12);
    const leverArm = add(
      leverPivot,
      new THREE.BoxGeometry(1.6, 4.0, leverLen),
      M.cast,
    );
    leverArm.position.set(0, 0, leverLen / 2);
    keybankGroup.add(leverPivot);

    // Angled pull-wire linking keylever rear lug up to its typebar heel
    let drawWire = null;
    if (k.typebarIndex >= 0) {
      const fanRad = k.fanDeg * D2R;
      const pivotX = Math.sin(fanRad) * M_SPEC.segR;
      const pivotZ = M_SPEC.segCenterZ + Math.cos(fanRad) * M_SPEC.segR;
      const start = new V3(k.x * 0.72, 26, 10);
      const end = new V3(pivotX, M_SPEC.segCenterY - 4, pivotZ + 4);
      const delta = end.clone().sub(start);
      const wireLen = delta.length();

      drawWire = add(
        linkageGroup,
        new THREE.CylinderGeometry(0.75, 0.75, wireLen, 8),
        M.steel,
      );
      drawWire.position.copy(start).add(end).multiplyScalar(0.5);
      drawWire.quaternion.setFromUnitVectors(
        new V3(0, 1, 0),
        delta.clone().normalize(),
      );
      drawWire.userData.basePos = drawWire.position.clone();
      drawWire.userData.dir = delta.clone().normalize();
    }

    keyVisuals.set(k.code, {
      keyGroup,
      restY: k.y,
      leverPivot,
      springMesh,
      drawWire,
      def: k,
    });
  });

  // ------------------------------------------------------------ 3. TYPEBAR SEGMENT & 40 RADIAL HAMMERS
  const typebars = [];
  {
    basketGroup.position.set(0, M_SPEC.segCenterY, M_SPEC.segCenterZ);

    // Cast-iron semicircular slotted segment
    const segGeo = new THREE.CylinderGeometry(
      M_SPEC.segR + 5,
      M_SPEC.segR + 5,
      11,
      48,
      1,
      false,
      -Math.PI * 0.42,
      Math.PI * 0.84,
    );
    add(basketGroup, segGeo, M.cast).position.set(0, -3, 0);

    // Individual machined brass comb teeth along the segment arc
    for (let i = 0; i < 41; i++) {
      const a = (-63 + (i / 40) * 126) * D2R;
      const tooth = add(
        basketGroup,
        new THREE.BoxGeometry(1.1, 7, 9),
        M.brass,
      );
      tooth.position.set(
        Math.sin(a) * M_SPEC.segR,
        3.5,
        Math.cos(a) * M_SPEC.segR,
      );
      tooth.rotation.y = a;
    }

    // Crimson felt cushion arc resting under the typebars
    const cushionGeo = new THREE.TorusGeometry(
      M_SPEC.segR + 46,
      3.5,
      12,
      44,
      Math.PI * 0.78,
    );
    const cushion = add(basketGroup, cushionGeo, M.felt);
    cushion.rotation.x = Math.PI / 2;
    cushion.rotation.z = Math.PI * 0.11;
    cushion.position.set(0, 14, 0);

    // Chrome V-type-guide right at the platen printing point (0, strikeY - segCenterY, 0)
    const guideY = M_SPEC.strikeY - M_SPEC.segCenterY - 2;
    for (const sgn of [-1, 1]) {
      const wing = add(
        basketGroup,
        new THREE.BoxGeometry(3.2, 13, 3.6),
        M.steel,
      );
      wing.position.set(sgn * 4.2, guideY, 2);
      wing.rotation.z = -sgn * 0.24;
    }

    // Build 40 radial typebar hammers pointing along +Z at theta=0, swinging -theta up & back to strike (0, 139.3, -56)
    const barGeo = new THREE.BoxGeometry(1.4, 2.6, M_SPEC.typebarLen);
    barGeo.translate(0, 0, M_SPEC.typebarLen / 2);
    const slugGeo = new RoundedBoxGeometry(3.8, 6.2, 2.8, 2, 0.5);

    const totalBars = 40;
    for (let i = 0; i < totalBars; i++) {
      const fanDeg = -62 + (i / (totalBars - 1)) * 124;
      const fanRad = fanDeg * D2R;

      const holder = new THREE.Group();
      holder.position.set(
        Math.sin(fanRad) * M_SPEC.segR,
        0,
        Math.cos(fanRad) * M_SPEC.segR,
      );
      holder.rotation.y = fanRad;

      const pivot = new THREE.Group();
      pivot.rotation.x = -M_SPEC.restAngleDeg * D2R;

      add(pivot, barGeo, M.steel);
      const slug = add(pivot, slugGeo, M.brass);
      slug.position.set(0, 1.2, M_SPEC.typebarLen);

      holder.add(pivot);
      basketGroup.add(holder);
      typebars.push({pivot, holder, fanDeg, index: i});
    }
  }

  // ------------------------------------------------------------ 4. REAL ESCAPEMENT & MAINSPRING DRUM
  let starwheelMesh;
  let pinionMesh;
  let rockerDogMesh;
  let mainspringDrum;
  {
    escapementGroup.position.set(0, 102, -88);

    // Rear escapement bracket
    const bracket = add(
      escapementGroup,
      new RoundedBoxGeometry(66, 36, 12, 3, 1.5),
      M.cast,
    );
    bracket.position.set(0, 0, -6);

    // 12-tooth brass starwheel (vertical plane, turns 30° per letter!)
    starwheelMesh = add(
      escapementGroup,
      gearGeo(M_SPEC.escTeeth, 16, 12.2, 4.5, 4),
      M.brass,
    );
    starwheelMesh.position.set(16, 4, 2);

    // Escapement rocker dog (pivots to release starwheel teeth one by one)
    rockerDogMesh = new THREE.Group();
    rockerDogMesh.position.set(-4, -10, 4);
    const dogArm = add(
      rockerDogMesh,
      new RoundedBoxGeometry(20, 4.5, 4, 2, 0.8),
      M.steel,
    );
    dogArm.position.set(6, 8, 0);
    dogArm.rotation.z = 0.38;
    escapementGroup.add(rockerDogMesh);

    // Carriage drive pinion (meshes upward into the carriage brass rack!)
    pinionMesh = add(
      escapementGroup,
      gearGeo(M_SPEC.pinionTeeth, 14, 11.2, 5, 3.5),
      M.steel,
    );
    pinionMesh.position.set(-14, 14, 2);

    // Mainspring drum barrel on left rear
    mainspringDrum = add(
      escapementGroup,
      new THREE.CylinderGeometry(24, 24, 14, 32).rotateX(Math.PI / 2),
      M.cast,
    );
    mainspringDrum.position.set(-72, -10, -4);
    const drumHub = add(
      escapementGroup,
      new THREE.CylinderGeometry(7, 7, 17, 16).rotateX(Math.PI / 2),
      M.brass,
    );
    drumHub.position.set(-72, -10, -4);
  }

  // ------------------------------------------------------------ 5. RIBBON SPOOLS & VIBRATOR
  let leftSpool;
  let rightSpool;
  let ribbonVibrator;
  {
    const makeSpool = (x) => {
      const sp = new THREE.Group();
      sp.position.set(x, 108, 8);

      const botFlange = add(
        sp,
        new THREE.CylinderGeometry(28, 28, 1.4, 36),
        M.cast,
      );
      botFlange.position.y = -5.5;

      const topRim = add(
        sp,
        new THREE.TorusGeometry(26.5, 1.6, 10, 36),
        M.cast,
      );
      topRim.rotation.x = Math.PI / 2;
      topRim.position.y = 5.5;

      for (let s = 0; s < 3; s++) {
        const spoke = add(sp, new THREE.BoxGeometry(51, 1.1, 3.2), M.cast);
        spoke.position.y = 5.5;
        spoke.rotation.y = (s * Math.PI) / 3;
      }

      add(sp, new THREE.CylinderGeometry(22, 22, 7.2, 28), M.ribbon).position.y = 1;
      add(sp, new THREE.CylinderGeometry(22.1, 22.1, 2.2, 28), M.felt).position.y = -3.6;

      // Bevel drive gear under spool
      const bGear = add(sp, gearGeo(20, 14, 11.5, 3, 4), M.brass);
      bGear.rotation.x = Math.PI / 2;
      bGear.position.y = -8;

      add(sp, new THREE.CylinderGeometry(5.8, 6.8, 14.5, 16), M.brass);
      add(sp, new THREE.CylinderGeometry(3.6, 3.6, 16, 16), M.steel);
      return sp;
    };

    leftSpool = makeSpool(-102);
    rightSpool = makeSpool(102);
    ribbonGroup.add(leftSpool, rightSpool);

    ribbonVibrator = new THREE.Group();
    ribbonVibrator.position.set(0, 124, -52);
    add(ribbonVibrator, new THREE.BoxGeometry(24, 9, 1.6), M.steel);
    add(ribbonVibrator, new THREE.PlaneGeometry(26, 6), M.ribbon).position.set(
      0,
      2,
      -1,
    );
    ribbonGroup.add(ribbonVibrator);

    const leadGeo = new THREE.PlaneGeometry(104, 5.5);
    const lLead = add(ribbonGroup, leadGeo, M.ribbon, false);
    lLead.position.set(-54, 115, -24);
    lLead.rotation.y = -0.56;
    const rLead = add(ribbonGroup, leadGeo, M.ribbon, false);
    rLead.position.set(54, 115, -24);
    rLead.rotation.y = 0.56;
  }

  // ------------------------------------------------------------ 6. SLIDING CARRIAGE, PLATEN, RACK, RETURN LEVER & PAPER
  let platenMesh;
  let knobL;
  let knobR;
  let returnLeverPivot;
  let paperMesh;
  let paperBaseY;
  const paperW = 215;
  const paperH = 295;
  {
    carriageGroup.position.set(0, M_SPEC.platenCenterY, M_SPEC.platenCenterZ);

    // Carriage cast frame base
    const frame = add(
      carriageGroup,
      new RoundedBoxGeometry(286, 12, 54, 3, 1.8),
      M.cast,
    );
    frame.position.set(0, -14, 0);

    // Brass precision rack on underside of carriage (meshes with drive pinion!)
    const rack = add(
      carriageGroup,
      rackGeo(190, 5, 7, M_SPEC.pitch),
      M.brass,
    );
    rack.position.set(0, -21, -8);

    // Side end-plates
    for (const ex of [-143, 143]) {
      const endP = add(
        carriageGroup,
        new RoundedBoxGeometry(8, 34, 54, 2, 1.5),
        M.enamel,
      );
      endP.position.set(ex, 0, 0);
    }

    // Rubber Platen Roller
    platenMesh = add(
      carriageGroup,
      new THREE.CylinderGeometry(
        M_SPEC.platenR,
        M_SPEC.platenR,
        274,
        40,
      ).rotateZ(Math.PI / 2),
      M.rubber,
    );

    // Steel platen axle + fluted brass & rubber knobs
    add(
      carriageGroup,
      new THREE.CylinderGeometry(4, 4, 336, 18).rotateZ(Math.PI / 2),
      M.steel,
    );

    const makeKnob = (x) => {
      const kg = new THREE.Group();
      kg.position.set(x, 0, 0);
      add(
        kg,
        new THREE.CylinderGeometry(14.5, 14.5, 14, 32).rotateZ(Math.PI / 2),
        M.rubber,
      );
      for (let r = 0; r < 12; r++) {
        const a = (r / 12) * Math.PI * 2;
        const rib = add(kg, new THREE.BoxGeometry(13, 1.6, 1.8), M.brass);
        rib.position.set(0, Math.cos(a) * 14.5, Math.sin(a) * 14.5);
        rib.rotation.x = a;
      }
      add(
        kg,
        new THREE.CylinderGeometry(6, 6, 15.5, 20).rotateZ(Math.PI / 2),
        M.steel,
      );
      return kg;
    };
    knobL = makeKnob(-166);
    knobR = makeKnob(166);
    carriageGroup.add(knobL, knobR);

    // Chrome margin ruler scale
    const rulerMat = new THREE.MeshStandardMaterial({
      map: createRulerTexture(),
      roughness: 0.28,
      metalness: 0.65,
    });
    extraMats.push(rulerMat);
    const ruler = add(
      carriageGroup,
      new THREE.BoxGeometry(255, 5.5, 1.8),
      rulerMat,
    );
    ruler.position.set(0, -14, 26);
    ruler.rotation.x = -0.35;

    // Paper bail bar + rollers (high enough so typed text is always crisp & clear)
    add(
      carriageGroup,
      new THREE.CylinderGeometry(1.4, 1.4, 265, 12).rotateZ(Math.PI / 2),
      M.steel,
    ).position.set(0, 29, 15);
    const srGeo = new THREE.CylinderGeometry(3.2, 3.2, 9, 16).rotateZ(
      Math.PI / 2,
    );
    add(carriageGroup, srGeo, M.rubber).position.set(-85, 29, 15);
    add(carriageGroup, srGeo, M.rubber).position.set(85, 29, 15);

    // Paper table behind platen
    const table = add(
      carriageGroup,
      new RoundedBoxGeometry(254, 86, 3.2, 2, 0.8),
      M.enamel,
    );
    table.position.set(0, 42, -26);
    table.rotation.x = -0.24;

    // Curved chrome carriage-return lever
    returnLeverPivot = new THREE.Group();
    returnLeverPivot.position.set(-146, 16, 4);
    const leverCurve = new THREE.CatmullRomCurve3([
      new V3(0, 0, 0),
      new V3(0, 5, 22),
      new V3(-4, 4, 46),
      new V3(-8, 2, 62),
    ]);
    add(
      returnLeverPivot,
      new THREE.TubeGeometry(leverCurve, 24, 2.2, 12, false),
      M.steel,
    );
    const paddle = add(
      returnLeverPivot,
      new RoundedBoxGeometry(13, 2.4, 19, 2, 0.8),
      M.steel,
    );
    paddle.position.set(-9, 2, 66);
    paddle.rotation.y = 0.28;
    carriageGroup.add(returnLeverPivot);

    // Dynamic curved cotton paper sheet
    const pGeo = new THREE.PlaneGeometry(paperW, paperH, 8, 56);
    const pos = pGeo.attributes.position;
    paperBaseY = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) paperBaseY[i] = pos.getY(i);

    const paperMat = new THREE.MeshStandardMaterial({
      map: paperCanvas.texture,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    extraMats.push(paperMat);
    paperMesh = add(paperGroup, pGeo, paperMat);
    carriageGroup.add(paperGroup);
  }

  // ------------------------------------------------------------ 7. TEARDOWN KINEMATIC ARROWS (active stroke & carriage feed)
  let hammerArrow;
  let carriageArrow;
  {
    hammerArrow = new THREE.Group();
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(42, 1.4, 8, 28, Math.PI * 0.45),
      M.red,
    );
    arc.rotation.y = Math.PI / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(3.6, 8, 12), M.red);
    tip.position.set(0, 42, 0);
    tip.rotation.x = -Math.PI / 2;
    hammerArrow.add(arc, tip);
    hammerArrow.position.set(0, 96, -24);
    hammerArrow.renderOrder = 5;
    arrowsGroup.add(hammerArrow);

    carriageArrow = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 28, 10), M.red);
    sh.rotation.z = Math.PI / 2;
    const ctip = new THREE.Mesh(new THREE.ConeGeometry(3.6, 8, 12), M.red);
    ctip.rotation.z = Math.PI / 2;
    ctip.position.x = -16;
    carriageArrow.add(sh, ctip);
    carriageArrow.position.set(0, 174, -62);
    carriageArrow.renderOrder = 5;
    arrowsGroup.add(carriageArrow);
  }

  // ------------------------------------------------------------ CUTAWAY (GLASS / SECTION + STENCIL CAP / SOLID) & ISOLATE
  const CLIP = new THREE.Plane(new V3(-1, 0, 0), 0);
  const allMats = [...Object.values(M), ...extraMats];
  const GHOST = new Map(
    allMats.map((m) => {
      const g = m.clone();
      g.transparent = true;
      g.depthWrite = false;
      return [m, g];
    }),
  );
  root.traverse((m) => m.isMesh && (m.userData.mat0 = m.material));
  const ghosted = new Set();

  let cap = null;
  const helpers = [];
  if (opts.caps) {
    const inc = THREE.IncrementWrapStencilOp;
    const dec = THREE.DecrementWrapStencilOp;
    const count = (side, op) =>
      new THREE.MeshBasicMaterial({
        side,
        colorWrite: false,
        depthWrite: false,
        depthTest: false,
        stencilWrite: true,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilFail: op,
        stencilZFail: op,
        stencilZPass: op,
        clippingPlanes: [CLIP],
      });
    helpers.push(count(THREE.BackSide, inc), count(THREE.FrontSide, dec));
    const solidSet = new Set([M.enamel, M.cast, M.steel, M.brass, M.rubber]);
    const parts = [];
    root.traverse((m) => m.isMesh && solidSet.has(m.material) && parts.push(m));
    for (const m of parts) {
      for (const hm of helpers) {
        const h = new THREE.Mesh(m.geometry, hm);
        h.renderOrder = 1;
        m.add(h);
      }
    }
    const rep = THREE.ReplaceStencilOp;
    cap = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.6),
      new THREE.MeshStandardMaterial({
        color: opts.caps,
        roughness: 0.55,
        metalness: 0,
        side: THREE.DoubleSide,
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: rep,
        stencilZFail: rep,
        stencilZPass: rep,
      }),
    );
    cap.position.set(0, 0.11, 0);
    cap.rotation.y = Math.PI / 2;
    cap.renderOrder = 1.1;
    cap.onAfterRender = (r) => r.clearStencil();
    for (const hm of [...helpers, cap.material]) hm.visible = false;
  }

  let cutMode = 'glass';
  const setCut = (mode, xWorld = 0) => {
    CLIP.constant = xWorld;
    if (cap) cap.position.x = xWorld;
    if (mode === cutMode) return;
    cutMode = mode;

    const isSec = mode === 'section';
    for (const m of [...allMats, ...GHOST.values()]) {
      m.clippingPlanes = isSec ? [CLIP] : null;
      m.needsUpdate = true;
    }
    if (cap) {
      for (const hm of [...helpers, cap.material]) hm.visible = isSec;
    }

    const solidShell = mode === 'solid' || isSec;
    M.shell.color.copy(M.enamel.color);
    M.shell.roughness = solidShell ? M.enamel.roughness : 0.08;
    M.shell.metalness = solidShell ? M.enamel.metalness : 0.05;
    M.shell.transparent = !solidShell;
    M.shell.opacity = solidShell ? 1.0 : 0.16;
    M.shell.depthWrite = solidShell;
    M.shell.needsUpdate = true;
  };

  const setTheme = (name) => {
    const t = THEMES[name] || THEMES.midnight;
    M.enamel.color.set(t.color);
    M.enamel.roughness = t.roughness;
    M.enamel.metalness = t.metalness;
    M.enamel.clearcoat = t.clearcoat;
    M.shell.color.set(t.color);
  };

  let lastStrikeFromBottom = NaN;
  const updatePaperCurve = (strikeFromBottom) => {
    if (strikeFromBottom === lastStrikeFromBottom) return;
    lastStrikeFromBottom = strikeFromBottom;
    const geo = paperMesh.geometry;
    const pos = geo.attributes.position;
    const pR = M_SPEC.platenR + 1.1;
    const tAng = 0.24;
    const backArc = Math.PI * 0.96;
    const bx = Math.sin(backArc) * -pR + 1;
    const bz = Math.cos(backArc) * pR;
    for (let i = 0; i < pos.count; i++) {
      const fromBot = paperBaseY[i] + paperH / 2;
      const delta = fromBot - strikeFromBottom;
      if (delta >= 0) {
        pos.setY(i, 1 + delta * Math.cos(tAng));
        pos.setZ(i, pR - delta * Math.sin(tAng));
      } else if (-delta / pR <= backArc) {
        const arc = -delta / pR;
        pos.setY(i, Math.sin(arc) * -pR + 1);
        pos.setZ(i, Math.cos(arc) * pR);
      } else {
        const rem = -delta - backArc * pR;
        const visRem = 72 * Math.tanh(rem / 72);
        pos.setY(i, bx + visRem * Math.cos(tAng));
        pos.setZ(i, bz - visRem * Math.sin(tAng));
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

  // Scale model from mm -> metres (teardown convention)
  root.scale.setScalar(0.001);

  /**
   * Pose the entire typewriter purely from kinematic state:
   * - activeCode: key code currently actuated (or last key)
   * - strokeP: normalized stroke [0..1]
   * - line, col: paper line & column (carriage X & paper feed)
   * - carriageFrac: smooth carriage X in columns
   * - returnAngle: carriage return lever sweep [0..1]
   * - explode: [0..1]
   * - isolate: bool (fade non-active subsystems)
   * - arrows: bool (show red motion arrows)
   */
  const update = (st) => {
    // Clear previous ghost overrides
    for (const m of ghosted) m.material = m.userData.mat0;
    ghosted.clear();

    const kin = solveKeystroke(st.strokeP ?? 0);
    const activeCode = st.activeCode || 'KeyR';
    const activeEntry = keyVisuals.get(activeCode);

    // 1. Reset all keys, springs, levers, wires, hammers
    for (const [code, kv] of keyVisuals.entries()) {
      const active = code === activeCode && kin.travel > 0.001;
      const dip = active ? kin.keyDip : 0;
      kv.keyGroup.position.y = kv.restY - dip;
      if (kv.springMesh) {
        kv.springMesh.scale.y = active ? kin.springRatio : 1;
      }
      if (kv.leverPivot) {
        kv.leverPivot.rotation.x = active ? kin.leverAngleRad : 0;
      }
      if (kv.drawWire) {
        const shift = active ? kin.travel * 5.2 : 0;
        kv.drawWire.position
          .copy(kv.drawWire.userData.basePos)
          .addScaledVector(kv.drawWire.userData.dir, -shift);
      }
    }

    const activeBarIdx = activeEntry ? activeEntry.def.typebarIndex : -1;
    for (const tb of typebars) {
      const deg =
        tb.index === activeBarIdx
          ? kin.hammerDeg
          : M_SPEC.restAngleDeg;
      tb.pivot.rotation.x = -deg * D2R;
    }

    // 2. Ribbon vibrator & spool rotation
    ribbonVibrator.position.y = 124 + kin.vibratorLift;
    const spoolAngle = (st.totalChars || 0) * 0.08 + kin.travel * 0.04;
    leftSpool.rotation.y = spoolAngle;
    rightSpool.rotation.y = spoolAngle;

    // 3. Escapement starwheel, rocker dog & drive pinion
    const totalSteps = (st.carriageCol ?? 0) + kin.escAdvance * (activeBarIdx >= 0 || activeCode === 'Space' ? 1 : 0);
    starwheelMesh.rotation.z = -(totalSteps * (360 / M_SPEC.escTeeth)) * D2R;
    pinionMesh.rotation.z = -(totalSteps * (360 / M_SPEC.pinionTeeth)) * D2R;
    rockerDogMesh.rotation.z = kin.rockerTiltDeg * D2R;
    mainspringDrum.rotation.z = (st.carriageCol ?? 0) * 0.06;

    // 4. Carriage position & curved paper feed
    const colFloat = st.carriageCol ?? 0;
    const colFrac = (colFloat + 0.5) / M_SPEC.maxCols;
    const marginFrac = paperCanvas.marginLeft / paperCanvas.width;
    const usableFrac =
      (M_SPEC.maxCols * paperCanvas.charWidth) / paperCanvas.width;
    const localPaperX = (-0.5 + marginFrac + colFrac * usableFrac) * paperW;
    const carriageX = -localPaperX;

    const lineStep =
      (paperCanvas.lineHeight / paperCanvas.height) * paperH;
    const topMargin = (paperCanvas.marginTop / paperCanvas.height) * paperH;
    const strikeFromBottom =
      paperH - topMargin - (st.line ?? 0) * lineStep + (st.paperFeedOffset ?? 0);
    paperMesh.visible = !st.hidePaper;
    if (paperMesh.visible) updatePaperCurve(strikeFromBottom);
    const rotPlaten = -(st.line ?? 0) * 0.28 + (st.platenSpinOffset ?? 0);
    platenMesh.rotation.x = rotPlaten;
    knobL.rotation.x = rotPlaten;
    knobR.rotation.x = rotPlaten;
    returnLeverPivot.rotation.y = -(st.returnProgress ?? 0) * 0.55;

    // 5. Exploded view layer offsets (in mm)
    const ex = st.explode ?? 0;
    const smoother = (x) => {
      const u = Math.min(1, Math.max(0, x));
      return u * u * u * (u * (u * 6 - 15) + 10);
    };
    const lay = (a) => smoother((ex - a) / 0.45);
    const eKey = lay(0.0);
    const eLink = lay(0.12);
    const eBasket = lay(0.22);
    const eEsc = lay(0.3);
    const eRib = lay(0.38);
    const eCar = lay(0.48);
    const ePap = lay(0.6);

    keybankGroup.position.set(0, -6 * eKey, 86 * eKey);
    linkageGroup.position.set(0, 32 * eLink, 32 * eLink);
    basketGroup.position.set(0, M_SPEC.segCenterY + 62 * eBasket, M_SPEC.segCenterZ + 8 * eBasket);
    escapementGroup.position.set(0, 102 + 78 * eEsc, -88 - 55 * eEsc);
    ribbonGroup.position.set(0, 108 * eRib, 6 * eRib);
    leftSpool.position.x = -102 - 34 * eRib;
    rightSpool.position.x = 102 + 34 * eRib;
    carriageGroup.position.set(
      carriageX,
      M_SPEC.platenCenterY + 122 * eCar,
      M_SPEC.platenCenterZ - 48 * eCar,
    );
    paperGroup.position.set(0, 68 * ePap, -18 * ePap);

    // 6. Arrows overlay
    const showArrows = !!st.arrows;
    arrowsGroup.visible = showArrows;
    if (showArrows) {
      hammerArrow.visible = kin.travel > 0.05 && activeBarIdx >= 0;
      hammerArrow.scale.setScalar(0.75 + 0.35 * kin.travel);
      carriageArrow.position.set(
        carriageX - 30,
        M_SPEC.platenCenterY + 122 * eCar + 44,
        M_SPEC.platenCenterZ - 48 * eCar + 16,
      );
      carriageArrow.visible = true;
    }

    // 7. Isolate mode: keep active key -> spring -> lever -> draw-wire -> active typebar -> escapement starwheel crisp, ghost rest
    if (st.isolate) {
      for (const [, g] of GHOST) g.opacity = 0.09;
      const keep = new Set();
      if (activeEntry) {
        activeEntry.keyGroup.traverse((o) => o.isMesh && keep.add(o));
        if (activeEntry.springMesh) keep.add(activeEntry.springMesh);
        if (activeEntry.leverPivot) activeEntry.leverPivot.traverse((o) => o.isMesh && keep.add(o));
        if (activeEntry.drawWire) keep.add(activeEntry.drawWire);
      }
      if (activeBarIdx >= 0) {
        typebars[activeBarIdx].holder.traverse((o) => o.isMesh && keep.add(o));
      }
      escapementGroup.traverse((o) => o.isMesh && keep.add(o));
      ribbonVibrator.traverse((o) => o.isMesh && keep.add(o));
      paperMesh && keep.add(paperMesh);

      root.traverse((m) => {
        if (m.isMesh && !keep.has(m) && GHOST.has(m.userData.mat0)) {
          m.material = GHOST.get(m.userData.mat0);
          ghosted.add(m);
        }
      });
    }

    return kin;
  };

  return {
    root,
    M,
    CLIP,
    cap,
    clickableMeshes,
    paperMesh,
    carriageGroup,
    paperW,
    paperH,
    setCut,
    setTheme,
    update,
  };
}
