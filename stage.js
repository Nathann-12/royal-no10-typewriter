// Cozy writer's walnut desk stage for Royal No. 10 (real 1:1 metre scale):
// walnut wood desk, matte leather blotter, stacked cotton sheets, emerald-glass brass banker's lamp,
// soft VSM shadows, warm/cool rim lighting, PMREM reflections, and GTAO contact occlusion.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {createWoodTextures} from './textures.js';
import {buildTypewriter} from './typewriter.js';

const V3 = THREE.Vector3;

export function createTypewriterStage({canvas, paperCanvas, look = {}}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0b09');
  scene.fog = new THREE.FogExp2('#0d0b09', 0.34);

  const camera = new THREE.PerspectiveCamera(32, 16 / 9, 0.02, 20);
  const composer = new EffectComposer(
    renderer,
    new THREE.WebGLRenderTarget(4, 4, {
      type: THREE.HalfFloatType,
      samples: 8,
      stencilBuffer: true,
    }),
  );
  composer.addPass(new RenderPass(scene, camera));

  const gtao = new GTAOPass(scene, camera, 4, 4);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = look.ao ?? 0.65;
  gtao.updateGtaoMaterial({
    radius: 0.045,
    distanceExponent: 1.4,
    thickness: 0.55,
    scale: 1.0,
    samples: 16,
    distanceFallOff: 1.0,
    screenSpaceRadius: false,
  });
  gtao.updatePdMaterial({
    lumaPhi: 10,
    depthPhi: 2,
    normalPhi: 3,
    radius: 6,
    rings: 2,
    samples: 16,
  });

  class Toggle extends Pass {
    constructor(fn) {
      super();
      this.needsSwap = false;
      this.fn = fn;
    }
    render() {
      this.fn();
    }
  }

  const tw = buildTypewriter(paperCanvas, {caps: '#d6182b'});
  scene.add(tw.root);
  if (tw.cap) scene.add(tw.cap);

  // Walnut wood desk surface (at y = 0)
  const {colorTex: woodColor, roughTex: woodRough} = createWoodTextures();
  woodColor.repeat.set(4.2, 3.6);
  woodRough.repeat.set(4.2, 3.6);
  const desk = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 3.8),
    new THREE.MeshStandardMaterial({
      map: woodColor,
      roughnessMap: woodRough,
      roughness: 0.78,
      metalness: 0.04,
    }),
  );
  desk.rotation.x = -Math.PI / 2;
  desk.position.set(0, 0, -0.2);
  desk.receiveShadow = true;
  scene.add(desk);

  // Matte dark leather desk blotter pad underneath typewriter
  const deskPad = new THREE.Mesh(
    new RoundedBoxGeometry(0.45, 0.0018, 0.41, 2, 0.0008),
    new THREE.MeshStandardMaterial({
      color: '#191714',
      roughness: 0.86,
      metalness: 0.02,
    }),
  );
  deskPad.position.set(0, 0.0009, 0.015);
  deskPad.receiveShadow = true;
  scene.add(deskPad);

  // Stack of blank cream cotton sheets on the right side of the desk
  const stackGroup = new THREE.Group();
  stackGroup.position.set(0.305, 0.0012, 0.065);
  stackGroup.rotation.y = -0.14;
  const stackMat = new THREE.MeshStandardMaterial({
    color: '#efe7d5',
    roughness: 0.92,
  });
  const blankStackMeshes = [];
  for (let s = 0; s < 5; s++) {
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(0.155, 0.0014, 0.21),
      stackMat,
    );
    const j = Math.sin(s * 2.3 + 1.1);
    sheet.position.set(j * 0.003, s * 0.0015, Math.cos(s * 1.9) * 0.003);
    sheet.rotation.y = j * 0.03;
    sheet.castShadow = true;
    sheet.receiveShadow = true;
    sheet.userData.isBlankStack = true;
    blankStackMeshes.push(sheet);
    stackGroup.add(sheet);
  }
  scene.add(stackGroup);

  // Stack of finished / typed pages accumulated on the left beside the typewriter
  const finishedStackGroup = new THREE.Group();
  finishedStackGroup.position.set(-0.305, 0.0014, 0.08);
  finishedStackGroup.rotation.y = 0.14;
  scene.add(finishedStackGroup);

  const FIN_W = 0.155;
  const FIN_H = 0.21;
  const finishedSheets = [];

  const clonePaperTexture = (srcCanvas) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 704;
    const g = c.getContext('2d');
    g.drawImage(srcCanvas, 0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  };

  const sheetSlotTransform = (idx) => {
    const j = Math.sin(idx * 2.1 + 0.7);
    const k = Math.cos(idx * 1.7 + 0.3);
    return {
      x: j * 0.004,
      y: idx * 0.0016 + 0.0008,
      z: k * 0.004,
      ry: j * 0.055,
    };
  };

  const addFinishedSheet = (srcCanvas) => {
    if (finishedSheets.length >= 16) {
      const oldest = finishedSheets.shift();
      finishedStackGroup.remove(oldest);
      oldest.geometry.dispose();
      oldest.material.map?.dispose();
      oldest.material.dispose();
      finishedSheets.forEach((m, i) => {
        const tf = sheetSlotTransform(i);
        m.position.set(tf.x, tf.y, tf.z);
        m.rotation.set(-Math.PI / 2, 0, tf.ry);
        m.userData.sheetIndex = i;
      });
    }
    const idx = finishedSheets.length;
    const tf = sheetSlotTransform(idx);
    const tex = clonePaperTexture(srcCanvas);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(FIN_W, FIN_H), mat);
    m.rotation.set(-Math.PI / 2, 0, tf.ry);
    m.position.set(tf.x, tf.y, tf.z);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.isFinishedStack = true;
    m.userData.sheetIndex = idx;
    finishedSheets.push(m);
    finishedStackGroup.add(m);
  };

  // Flexible animated flying sheets for out-eject & in-feed transitions
  const makeFlyingSheet = (mat) => {
    const geo = new THREE.PlaneGeometry(FIN_W, FIN_H, 10, 24);
    const pos = geo.attributes.position;
    const base = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      base[i * 2] = pos.getX(i);
      base[i * 2 + 1] = pos.getY(i);
    }
    geo.userData.base = base;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.visible = false;
    scene.add(mesh);
    return mesh;
  };

  const flyingOutMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.88,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const flyingInMat = new THREE.MeshStandardMaterial({
    color: '#f7f2e7',
    roughness: 0.88,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const flyingOut = makeFlyingSheet(flyingOutMat);
  const flyingIn = makeFlyingSheet(flyingInMat);

  const bendSheet = (mesh, archZ, twist = 0) => {
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const base = geo.userData.base;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 2];
      const y = base[i * 2 + 1];
      const v = y / FIN_H + 0.5;
      const bow = Math.sin(v * Math.PI);
      const z = bow * archZ + Math.sin(v * Math.PI * 1.3) * (x / FIN_W) * twist;
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };

  const setFlyingOutTexture = (srcCanvas) => {
    flyingOutMat.map?.dispose();
    flyingOutMat.map = clonePaperTexture(srcCanvas);
    flyingOutMat.needsUpdate = true;
  };

  const getFinishedLandingWorld = () => {
    const tf = sheetSlotTransform(Math.min(finishedSheets.length, 15));
    const wp = finishedStackGroup.localToWorld(new V3(tf.x, tf.y, tf.z));
    return {pos: wp, ry: finishedStackGroup.rotation.y + tf.ry};
  };

  const getBlankTopWorld = () => ({
    pos: stackGroup.localToWorld(new V3(0, 0.008, 0)),
    ry: stackGroup.rotation.y,
  });

  // Vintage brass & emerald-glass banker's lamp on the upper-left corner of desk
  const lampGroup = new THREE.Group();
  lampGroup.position.set(-0.305, 0, -0.155);
  const lampBrass = new THREE.MeshStandardMaterial({
    color: '#cfa456',
    roughness: 0.24,
    metalness: 0.9,
  });
  const lampBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.052, 0.011, 32),
    lampBrass,
  );
  lampBase.position.y = 0.0055;
  lampBase.castShadow = true;
  lampBase.receiveShadow = true;
  lampGroup.add(lampBase);

  const lampRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.024, 0.014, 24),
    lampBrass,
  );
  lampRing.position.y = 0.016;
  lampRing.castShadow = true;
  lampGroup.add(lampRing);

  const lampStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.0065, 0.25, 16),
    lampBrass,
  );
  lampStem.position.y = 0.142;
  lampStem.castShadow = true;
  lampGroup.add(lampStem);

  const shadeMat = new THREE.MeshPhysicalMaterial({
    color: '#155236',
    roughness: 0.16,
    metalness: 0.08,
    clearcoat: 0.92,
    emissive: '#134729',
    emissiveIntensity: 0.52,
    side: THREE.DoubleSide,
  });
  const shadeGroup = new THREE.Group();
  shadeGroup.position.set(0.032, 0.262, 0.032);
  shadeGroup.rotation.y = 0.56;
  const shadeRot = new THREE.Group();
  shadeRot.rotation.z = Math.PI / 2;
  shadeGroup.add(shadeRot);

  const shadeCurve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.042, 0.108, 24, 1, false, 0, Math.PI),
    shadeMat,
  );
  shadeCurve.castShadow = true;
  shadeRot.add(shadeCurve);

  // Brass end-trim bands fitted flush on the emerald shade
  for (const side of [-1, 1]) {
    const rimMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0428, 0.0428, 0.005, 24, 1, false, 0, Math.PI),
      lampBrass,
    );
    rimMesh.position.y = side * 0.052;
    shadeRot.add(rimMesh);
  }
  lampGroup.add(shadeGroup);

  const lampGlowMat = new THREE.MeshBasicMaterial({color: '#ffe2ad'});
  const lampGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.013, 16, 16),
    lampGlowMat,
  );
  lampGlow.position.set(0.032, 0.252, 0.032);
  lampGroup.add(lampGlow);

  const bulbLight = new THREE.PointLight('#ffc878', 0.24, 1.1, 1.5);
  bulbLight.position.set(0.032, 0.24, 0.032);
  lampGroup.add(bulbLight);
  scene.add(lampGroup);

  const aoSkip = (on) => {
    if (tw.cap) tw.cap.visible = on;
    lampGlow.visible = on;
  };
  composer.addPass(new Toggle(() => aoSkip(false)));
  composer.addPass(gtao);
  composer.addPass(new Toggle(() => aoSkip(true)));
  composer.addPass(new OutputPass());

  // Studio + cozy warm room PMREM reflections so chrome, brass, glass & enamel shine
  {
    const env = new THREE.Scene();
    env.background = new THREE.Color('#201c18');
    const box = (w, h, pos, col, k) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(col).multiplyScalar(k),
          side: THREE.DoubleSide,
        }),
      );
      m.position.copy(pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(10, 10, new V3(0, 14, 2), '#fff5e4', 2.2);
    box(4, 12, new V3(-12, 5, 6), '#ffdca8', 2.8);
    box(4, 12, new V3(12, 5, 2), '#c4dbff', 1.9);
    box(16, 3, new V3(0, 3, 14), '#f6ede0', 1.4);
    box(10, 8, new V3(0, 5, -14), '#ffe2b8', 1.5);
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 24),
      new THREE.MeshBasicMaterial({color: '#2d2118', side: THREE.DoubleSide}),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    env.add(floor);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.035).texture;
    scene.environmentIntensity = 0.92;
    pm.dispose();
  }

  // Lighting: warm desk-lamp key + cool window fill + rim + warm hemisphere bounce
  const hemi = new THREE.HemisphereLight('#ffebd0', '#2b2017', 0.65);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight('#ffe4ba', 2.4);
  keyLight.position.set(-0.46, 0.92, 0.46);
  keyLight.target.position.set(0, 0.08, -0.02);
  keyLight.castShadow = true;
  Object.assign(keyLight.shadow.camera, {
    left: -0.58,
    right: 0.58,
    top: 0.58,
    bottom: -0.58,
    near: 0.15,
    far: 3.5,
  });
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.radius = 9;
  keyLight.shadow.blurSamples = 18;
  keyLight.shadow.bias = -0.0003;
  keyLight.shadow.normalBias = 0.002;
  scene.add(keyLight, keyLight.target);

  const fillLight = new THREE.DirectionalLight('#a6c4f2', 0.92);
  fillLight.position.set(0.58, 0.62, 0.36);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight('#ffdfb0', 0.78);
  rimLight.position.set(0.06, 0.55, -0.76);
  scene.add(rimLight);

  const setLamp = (on) => {
    keyLight.color.set(on ? '#ffe4ba' : '#bfd4f2');
    keyLight.intensity = on ? 2.4 : 1.35;
    hemi.color.set(on ? '#ffebd0' : '#a8bdd9');
    hemi.intensity = on ? 0.65 : 0.48;
    bulbLight.intensity = on ? 0.24 : 0;
    shadeMat.emissiveIntensity = on ? 0.52 : 0.06;
    lampGlowMat.color.set(on ? '#ffe2ad' : '#35312c');
  };

  const size = {w: 1600, h: 900};
  const resize = (w, h, pr) => {
    size.w = w;
    size.h = h;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const frame = (state, cam) => {
    const kin = tw.update(state);
    const {tx, ty, tz, az, el, d} = cam;
    camera.position.set(
      tx + d * Math.cos(el) * Math.sin(az),
      ty + d * Math.sin(el),
      tz + d * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(tx, ty, tz);
    camera.setViewOffset(
      size.w,
      size.h,
      -(cam.sx ?? 0),
      -(cam.sy ?? 0),
      size.w,
      size.h,
    );
    camera.updateMatrixWorld();
    composer.render();
    return kin;
  };

  const pv = new V3();
  const project = (x, y, z) => {
    pv.set(x, y, z).project(camera);
    if (pv.z > 1) return null;
    return [(pv.x * 0.5 + 0.5) * size.w, (-pv.y * 0.5 + 0.5) * size.h];
  };

  const setQuality = ({samples, ao, shadow}) => {
    if (samples !== undefined) {
      for (const t of [composer.renderTarget1, composer.renderTarget2]) {
        t.samples = samples;
        t.dispose();
      }
    }
    if (ao !== undefined) gtao.enabled = ao;
    if (shadow !== undefined) {
      keyLight.shadow.mapSize.set(shadow, shadow);
      keyLight.shadow.map?.dispose();
      keyLight.shadow.map = null;
    }
  };

  const setCut = (mode, xWorld = 0) => {
    tw.setCut(mode, xWorld);
    gtao.normalMaterial.clippingPlanes = mode === 'section' ? [tw.CLIP] : null;
    gtao.normalMaterial.needsUpdate = true;
  };

  return {
    renderer,
    scene,
    camera,
    tw,
    composer,
    gtao,
    resize,
    frame,
    project,
    size,
    setQuality,
    setCut,
    setLamp,
    blankStackMeshes,
    flyingOut,
    flyingIn,
    bendSheet,
    setFlyingOutTexture,
    addFinishedSheet,
    getFinishedLandingWorld,
    getBlankTopWorld,
    getFinishedCount: () => finishedSheets.length,
    getFinishedMeshes: () => finishedSheets,
  };
}
