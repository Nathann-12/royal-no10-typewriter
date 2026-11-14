# Royal No. 10 (1938) — Interactive 3D Mechanical Typewriter Studio

เครื่องพิมพ์ดีดกลไกคลาสสิก **Royal Model No. 10 (1938)** ในรูปแบบ **Interactive 3D Simulator & Mechanical Teardown** ที่พิมพ์ได้จริงบนโต๊ะทำงานไม้ Walnuts ใต้โคมไฟ Emerald Banker's Lamp พร้อมเสียงกลไก Web Audio ระดับสตูดิโอ อนิเมชั่นเปลี่ยนกระดาษ และคลังเปิดอ่าน/ดาวน์โหลดกระดาษแผ่นเก่า

> Built with **Three.js** (`GTAOPass`, `VSMShadowMap`, `PMREMGenerator`), procedural CAD linkage kinematics (`kin.js`), synthesized mechanical & ambient foley (`audio.js`), and a single-file offline bundler (`scripts/build.mjs`).

---

## ✨ ฟีเจอร์หลัก (Features)

- **สมจริงระดับ CAD & กลไกจริง (Kinematic Linkage)**: แป้นพิมพ์ 44 ปุ่ม (4 แถว Qwerty) ขยับก้านโยง Keylever, Sublever และ Typebar พุ่งเข้าตีผ้าหมึกสู่ลูกกลิ้ง (`platen`) แบบเรียลไทม์ พร้อมลูกกลิ้งเลื่อนแคร่ (`Carriage`), กระดิ่งเตือนขอบขวา, และคันโยกปัดแคร่ขึ้นบรรทัดใหม่
- **ห้องทำงาน Cozy Writer's Desk**: พื้นโต๊ะไม้ Walnut ลายละเอียด แผ่นรองหนังเย็บขอบ โคมไฟ Emerald Brass Banker's Lamp เปิด-ปิดไฟได้ พร้อมกองกระดาษเปล่าทางขวาและกองชีทที่พิมพ์เสร็จทางซ้าย
- **เสียงฟิน ๆ แบบ Procedural Web Audio (`audio.js`)**: ระบบสังเคราะห์เสียงกลไกแบบเรียลไทม์ผ่าน `DynamicsCompressorNode` — เสียงก้านพิมพ์ดีดกระแทกกระดาษแยกตำแหน่งซ้าย-ขวา, Spacebar ทุ้มนุ่ม, Backspace, กริ่งทองเหลือง, เสียงฝนตกคลอเบา ๆ (`Rain`), และเสียงเสียบ/ดึง/วางกระดาษครบ 4 จังหวะ
- **ระบบเปลี่ยนกระดาษมีอนิเมชั่น (`New Sheet` / คลิกกองกระดาษขวา)**: ชีทเดิมถูกหมุนลูกบิดดึงออกโค้งไปวางซ้อนทางซ้าย (สูงสุด 16 ชั้น) แล้วดึงแผ่นใหม่เข้าช่องป้อนด้านหลังอย่างนุ่มนวล
- **คลังเก็บและดาวน์โหลดชีทเก่า (`🗂️ Sheets` / คลิกกองกระดาษซ้าย)**: เปิด Modal ดูหน้ากระดาษเก่าความละเอียดสูง (`1536 × 2112 px`) สลับหน้าได้ด้วยปุ่มหรือลูกศรซ้าย-ขวา และกดดาวน์โหลดเป็นไฟล์ `.png` ได้ทุกแผ่น
- **โหมดถอดประกอบกลไก (On-Demand Mechanical Teardown)**:
  - `Solid` / `Glass` / `Section` (ผ่าซีกโชว์ไส้ใน)
  - `Explode` (แยกชิ้นส่วน 3 มิติพร้อมป้าย Callout อธิบายชิ้นส่วน)
  - 4 สีเคลือบ Enamel วินเทจ: *Midnight Enamel*, *British Racing Green*, *Vintage Ivory*, *Oxblood Lacquer*

---

## 📦 วิธีดาวน์โหลดและติดตั้ง (Download & Setup)

สามารถใช้งานได้ **2 วิธี** (ไม่ต้องติดตั้งอะไรก็เปิดเล่นได้เลย หรือรันแบบ Developer Build):

### วิธีที่ 1: เปิดเล่นทันที (Zero-Install Offline HTML)

โปรเจคนี้ build ไฟล์ออฟไลน์สำเร็จรูปขนาด ~820 KB ไว้ให้แล้ว (รวม Three.js และฟอนต์ในตัว):

1. กด **Code -> Download ZIP** บน GitHub แล้วแตกไฟล์
2. ดับเบิลคลิกเปิดไฟล์ [`dist/index.html`](dist/index.html) ด้วย Chrome / Edge / Safari ได้ทันที

> หมายเหตุ: บางเบราว์เซอร์อาจจำกัด Web Audio จนกว่าจะคลิกบนหน้าเว็บ 1 ครั้ง — เพียงคลิกที่โต๊ะหรือแป้นพิมพ์ เสียงจะทำงานทันที

### วิธีที่ 2: Clone และ Build จากซอร์สโค้ด (สำหรับนักพัฒนา / รันผ่าน Local Server)

ต้องมี **Node.js v18+** และ **Git**

```bash
# 1. โคลนโปรเจคจาก GitHub
git clone https://github.com/Nathann-12/royal-no10-typewriter.git
cd royal-no10-typewriter

# 2. ติดตั้ง dependencies (three, esbuild, fonts)
npm install

# 3. สร้างไฟล์ bundle -> dist/index.html
npm run build

# 4. เปิดเซิร์ฟเวอร์จำลอง (ค่าเริ่มต้น http://localhost:4173)
npm start
```

จากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:4173` (หรือระบุพอร์ตเองด้วย `node scripts/serve.mjs --port 8080`)

---

## 🎹 วิธีใช้งาน (Usage & Controls)

| การควบคุม | การทำงาน |
|---|---|
| **พิมพ์บนคีย์บอร์ด** | พิมพ์ตัวอักษร, ตัวเลข, เครื่องหมาย, `Space`, `Enter` (ขึ้นบรรทัดใหม่ + ปัดแคร่), `Backspace` |
| **คลิกปุ่ม 3D บนตัวเครื่อง** | คลิกคีย์แคปบนเครื่องพิมพ์ดีด 3D เพื่อกดพิมพ์ได้โดยตรง |
| **ลากเมาส์ / Scroll** | ลากเมาส์เพื่อหมุนมุมกล้อง 360° · เลื่อนลูกกลิ้งเมาส์เพื่อ Zoom เข้า-ออก |
| **คลิกกองกระดาษขวา (Blank Stack)** หรือกด **`📄 New Sheet`** | ดึงชีทปัจจุบันออกวางกองทางซ้าย และป้อนกระดาษแผ่นใหม่ |
| **คลิกกองกระดาษซ้าย (Typed Pile)** หรือกด **`🗂️ Sheets`** | เปิดหน้าต่าง Archive อ่านชีทเก่า, ใช้ `←` / `→` เปลี่ยนหน้า, `Esc` เพื่อปิด และกด `Download PNG` |
| **มุมขวาบน** | เลือกสี Enamel 4 เฉด และสลับมุมกล้อง (`Desk View`, `Hammers`, `Gears`, `Paper`, `3/4 Hero`) |
| **แถบล่าง** | เปิด/ปิด `Clack`, `Rain`, `Lamp`, โหมดแยกชิ้นส่วน `Explode`, `Solid / Glass / Section`, `Labels`, `Demo` (พิมพ์อัตโนมัติ), `Save PNG` |

---

## 🗂️ โครงสร้างโปรเจค (Project Structure)

```text
.
├── main.js            # จุดเริ่มต้น, กล้อง, 3D raycasting, ลูปอนิเมชั่นเปลี่ยนกระดาษ & ระบบคลังชีท
├── typewriter.js      # โมเดล 3D Royal No. 10 (frame, keybasket, 44 typebars, platen, carriage, decals)
├── kin.js             # ข้อมูลจำเพาะชิ้นส่วนและสมการคิเนมาติกส์ของแป้นพิมพ์/แคร่/ระยะกระดาษ
├── stage.js           # ฉากโต๊ะ Walnut, โคมไฟ Emerald Lamp, กองกระดาษซ้าย-ขวา, Post-processing (GTAO)
├── textures.js        # ตัวสร้าง Texture ไม้ Walnut, หน้ากระดาษ cotton, ลายแป้นพิมพ์และอักษรพิมพ์ (1536×2112)
├── audio.js           # ระบบสังเคราะห์เสียงกลไก, ฝนตก และเสียงเสียบ/ดึง/วางกระดาษ (Web Audio API)
├── console.js         # HUD Pill Interface, Callout Labels และ Modal ดูชีทเก่า
├── kit/
│   └── warm.js        # Parallel WebGL shader warm-up helper (compileAsync + GTAO passes)
├── scripts/
│   ├── build.mjs      # สคริปต์รวม bundle และ inline fonts เป็น dist/index.html
│   └── serve.mjs      # Static HTTP server สำหรับรันทดสอบ
├── dist/
│   └── index.html     # ไฟล์เว็บสำเร็จรูปพร้อมเปิดใช้งาน
└── package.json
```

---

## 🛠️ Tech Stack

- **3D Rendering**: Three.js `0.186.1` (`GTAOPass`, `VSMShadowMap`, `RoomEnvironment` via `PMREMGenerator`, `ACESFilmicToneMapping`)
- **Audio Synthesis**: Native Web Audio API (`DynamicsCompressorNode`, filtered pink/white noise, modal bell resonances)
- **Bundler**: `esbuild` `0.28.1` with base64-inlined `@fontsource-variable/inter` & `@fontsource/jetbrains-mono`
- **License**: [MIT](LICENSE)
