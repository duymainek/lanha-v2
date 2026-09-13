/* Là Nhà Apartment — mô hình 3D low-poly isometric bằng Three.js r128 */
(function () {
'use strict';

/* ============================================================
   0. HẰNG SỐ KÍCH THƯỚC (mét) — nhà 228 Nguyễn Đình Chiểu (NDC)
   Nhà xây trên đất dốc: mặt tiền NDC (z=0) cao hơn mặt sau Nước Mặn 6 (z=HOUSE_D).
   Khối chính (Trệt/T2/T3/Tum) giống layout Nguyễn Quý Anh nhưng tỉ lệ 4.24m x 30m
   (thay vì 5m x 20m) và dùng cửa 1 cánh thay cửa lùa kính. Vì đất dốc, có thêm 1
   TẦNG HẦM riêng biệt (floor -1) nằm NGẦM dưới nửa sau (phía Nước Mặn 6) của khối
   chính — chỉ lộ ra mặt Nước Mặn 6 (thấp hơn), không có cửa/lối đi thông lên Trệt.
   ============================================================ */
const HOUSE_W = 4.24;   // chiều ngang nhà
const HOUSE_D = 30;     // chiều sâu khối nhà chính (Trệt→Tum)
const STAIR_D = 4.5;    // chiều sâu khoang cầu thang (tỉ lệ theo HOUSE_D/20*3)
const STAIR_Y0 = 12.75; // cầu thang bắt đầu tại mét 12.75 từ mặt tiền (tỉ lệ theo HOUSE_D/20*8.5)
const STAIR_Y1 = STAIR_Y0 + STAIR_D; // 17.25
const UNIT_D = STAIR_Y0; // 12.75m mỗi bên

const DOOR_H = 2.1;     // chiều cao cửa (cầu thang->phòng, ngủ->ban công)
const DOOR_W = 0.9;     // chiều rộng cửa

const FLOOR_H = 3.1;    // chiều cao mỗi tầng
const N_FLOORS = 3;     // trệt + 2 tầng ở (index 0..2); tum riêng ở index 3
const TUM_H = 2.6;

// Tầng hầm: riêng biệt, cao độ THẤP HƠN Trệt, chỉ nằm dưới nửa sau (z=[HOUSE_D-HAM_D, HOUSE_D])
// của khối chính — nửa trước (phía NDC, đất cao hơn) là móng đặc, không có không gian sử dụng.
const HAM_D = 15;       // chiều sâu tầng hầm
const HAM_H = FLOOR_H;  // chiều cao tầng hầm
const HAM_BY = -HAM_H;  // cao độ sàn hầm (dưới cao độ 0 của Trệt)
const HAM_Z0 = HOUSE_D - HAM_D; // z bắt đầu của hầm (=15)

// Trục toạ độ thế giới: X = ngang nhà, Z = chiều sâu (0=mặt tiền NDC .. HOUSE_D=mặt sau Nước Mặn 6), Y = chiều cao
// Ta đặt gốc toạ độ X=0 ở giữa bề ngang nhà, Z=0 ở mặt tiền NDC (giáp đường)

/* ============================================================
   1. DỮ LIỆU PHÒNG / NHÃN — data-driven để dễ sửa
   ============================================================ */

// Mỗi item: id, floor (0=trệt,1..3=tầng ở,4=tum), label, kind, world position (x,y,z), desc
const ROOMS = [];

function floorBaseY(floor) {
  return floor * FLOOR_H;
}

// Layout 1 phòng ở "chuẩn" (ngủ+bếp+wc, WC lồng trong góc bếp) — dùng chung cho Trệt, Hầm và
// mỗi nửa (A/B) của T2/T3. Tỉ lệ theo HOUSE_D/20*(nguD gốc 5.3, wc 1.8) để giữ đúng tỉ lệ NQA.
const SCALE = HOUSE_D / 20; // 1.5
const ROOM_NGU_D = 5.3 * SCALE;   // 7.95
const WC_SIZE = 1.8 * SCALE;      // 2.7

// ---- Tầng trệt (floor 0): Nhà xe (nửa trước, phía NDC) + Cầu thang + 1 phòng ở chuẩn (nửa sau, phía Nước Mặn 6) ----
{
  const by = floorBaseY(0);
  ROOMS.push({ id:'f0-garage', floor:0, label:'Nhà xe', kind:'garage', x:0, y:by+0.1, z:UNIT_D/2, w:HOUSE_W, d:UNIT_D,
    desc:'Khu để xe máy/ô tô, ngay sau cổng sắt (mặt tiền Nguyễn Đình Chiểu) — gặp đầu tiên khi vào nhà.' });
  ROOMS.push({ id:'f0-stair', floor:0, label:'Cầu thang', kind:'stair', x:0, y:by+0.1, z:(STAIR_Y0+STAIR_Y1)/2, w:HOUSE_W, d:STAIR_D,
    desc:'Khoang cầu thang + hành lang, chính giữa nhà, thẳng cột lên các tầng trên.' });
  // Phòng ở chuẩn nửa sau (z=[STAIR_Y1, HOUSE_D]), hướng ra mặt Nước Mặn 6 — WC lồng góc bếp
  // (giống Bếp A/B các tầng trên), KHÔNG còn kiểu P.101 cũ (bếp/WC ra ban công riêng).
  {
    const nguD = ROOM_NGU_D, bepD = UNIT_D - nguD;
    let z = HOUSE_D;
    ROOMS.push({ id:'f0-ngu', floor:0, label:'Phòng ngủ (Trệt)', kind:'bedroom', x:0, y:by+0.1, z:z-nguD/2, w:HOUSE_W, d:nguD,
      desc:'Tầng trệt — phòng ngủ: giường, tủ áo, bàn làm việc, điều hoà, cửa ra ban công phía sau (có máy giặt).' });
    z -= nguD;
    ROOMS.push({ id:'f0-bep', floor:0, label:'Bếp (Trệt)', kind:'kitchen', x:0, y:by+0.1, z:z-bepD/2, w:HOUSE_W, d:bepD, hasWindow:false,
      wcCutout: { wcSize: WC_SIZE, cornerZ: 1 },
      desc:'Tầng trệt — bếp + ăn, WC lồng trong góc.' });
    ROOMS.push({ id:'f0-wc', floor:0, label:'WC (Trệt)', kind:'wc', x:-HOUSE_W/2+WC_SIZE/2, y:by+0.1, z:z-WC_SIZE/2, w:WC_SIZE, d:WC_SIZE,
      desc:'Tầng trệt — toilet, góc trái sát tường phòng ngủ.' });
  }
}

// ---- Tầng hầm (floor -1): tách biệt hoàn toàn, chỉ lộ ra mặt Nước Mặn 6 (đất dốc che khuất
// phía NDC) — 1 phòng ở chuẩn duy nhất, không ban công (cửa đi thẳng ra vỉa hè Nước Mặn 6),
// không cầu thang/không thông với các tầng khác. Nằm dưới nửa sau (z=[HAM_Z0, HOUSE_D]) của
// khối nhà chính; nửa trước (z=[0, HAM_Z0], phía NDC, đất cao hơn) là móng đặc không dựng.
// Thứ tự từ cửa vào (z=HOUSE_D, mặt Nước Mặn 6) đi vào trong: Bếp (có WC lồng góc) trước, rồi
// Phòng ngủ nằm sâu nhất (xa cửa nhất, phía z nhỏ hơn, giáp khối đất/móng đặc).
{
  const by = HAM_BY;
  const nguD = ROOM_NGU_D, bepD = HAM_D - nguD;
  let z = HOUSE_D;
  ROOMS.push({ id:'ham-bep', floor:-1, label:'Bếp (Hầm)', kind:'kitchen', x:0, y:by+0.1, z:z-bepD/2, w:HOUSE_W, d:bepD, hasWindow:false,
    wcCutout: { wcSize: WC_SIZE, cornerZ: -1 },
    desc:'Tầng hầm — bếp + ăn, WC lồng trong góc giáp phòng ngủ. Không thông với cầu thang/các tầng khác.' });
  ROOMS.push({ id:'ham-wc', floor:-1, label:'WC (Hầm)', kind:'wc', x:-HOUSE_W/2+WC_SIZE/2, y:by+0.1, z:z-bepD+WC_SIZE/2, w:WC_SIZE, d:WC_SIZE,
    desc:'Tầng hầm — toilet, góc trái giáp vách tường phòng ngủ.' });
  z -= bepD;
  ROOMS.push({ id:'ham-ngu', floor:-1, label:'Phòng ngủ (Hầm)', kind:'bedroom', x:0, y:by+0.1, z:z-nguD/2, w:HOUSE_W, d:nguD, noBalconyDoor:true,
    desc:'Tầng hầm — phòng ngủ: giường, tủ áo, bàn làm việc, điều hoà. Nằm sâu nhất, xa cửa ra vào nhất (không có ban công).' });
}

// ---- Tầng 2/3 (floor 1,2): 2 căn đối lưng nhau qua cầu thang, cửa 1 cánh (không phải cửa lùa) ----
const UNIT_LAYOUT = (() => {
  const nguD = ROOM_NGU_D, bepD = UNIT_D - nguD;
  return { nguD, bepD };
})();

for (let floor = 1; floor <= 2; floor++) {
  const by = floorBaseY(floor);
  const fname = ['', 'Tầng 2', 'Tầng 3'][floor];
  const hasWindow = floor >= 2; // T3 có cửa sổ bếp; T2 không

  // Căn A: hướng ra mặt tiền NDC (z tăng dần từ 0 tới stair)
  {
    const { nguD, bepD } = UNIT_LAYOUT;
    let z = 0;
    ROOMS.push({ id:`f${floor}-A-ngu`, floor, label:`Ngủ A`, kind:'bedroom', x:0, y:by+0.1, z:z+nguD/2, w:HOUSE_W, d:nguD,
      desc:`${fname}, Căn A — phòng ngủ: giường, tủ áo, bàn làm việc, điều hoà, cửa ra ban công mặt tiền (có máy giặt).` });
    z += nguD;
    ROOMS.push({ id:`f${floor}-A-bep`, floor, label:`Bếp A`, kind:'kitchen', x:0, y:by+0.1, z:z+bepD/2, w:HOUSE_W, d:bepD, hasWindow,
      wcCutout: { wcSize: WC_SIZE, cornerZ: -1 },
      desc:`${fname}, Căn A — bếp + ăn.${hasWindow ? ' Có cửa sổ bên phải nhà.' : ' Không có cửa sổ.'}` });
    ROOMS.push({ id:`f${floor}-A-wc`, floor, label:`WC A`, kind:'wc', x:-HOUSE_W/2+WC_SIZE/2, y:by+0.1, z:z+WC_SIZE/2, w:WC_SIZE, d:WC_SIZE,
      desc:`${fname}, Căn A — toilet, góc trái sát tường phòng ngủ.` });
  }

  // Cầu thang (chung)
  ROOMS.push({ id:`f${floor}-stair`, floor, label:'Cầu thang', kind:'stair', x:0, y:by+0.1, z:(STAIR_Y0+STAIR_Y1)/2, w:HOUSE_W, d:STAIR_D,
    desc:`${fname} — khoang cầu thang & hành lang, chính giữa, thẳng cột.` });

  // Căn B: hướng ra mặt sau Nước Mặn 6 (mirror)
  {
    const { nguD, bepD } = UNIT_LAYOUT;
    let z = HOUSE_D;
    ROOMS.push({ id:`f${floor}-B-ngu`, floor, label:`Ngủ B`, kind:'bedroom', x:0, y:by+0.1, z:z-nguD/2, w:HOUSE_W, d:nguD,
      desc:`${fname}, Căn B — phòng ngủ: giường, tủ áo, bàn làm việc, điều hoà, cửa ra ban công phía sau (có máy giặt).` });
    z -= nguD;
    ROOMS.push({ id:`f${floor}-B-bep`, floor, label:`Bếp B`, kind:'kitchen', x:0, y:by+0.1, z:z-bepD/2, w:HOUSE_W, d:bepD, hasWindow,
      wcCutout: { wcSize: WC_SIZE, cornerZ: 1 },
      desc:`${fname}, Căn B — bếp + ăn.${hasWindow ? ' Có cửa sổ bên phải nhà.' : ' Không có cửa sổ.'}` });
    ROOMS.push({ id:`f${floor}-B-wc`, floor, label:`WC B`, kind:'wc', x:-HOUSE_W/2+WC_SIZE/2, y:by+0.1, z:z-WC_SIZE/2, w:WC_SIZE, d:WC_SIZE,
      desc:`${fname}, Căn B — toilet, góc trái sát tường phòng ngủ.` });
  }
}

// ---- Tum / sân thượng (floor 3) ----
// Thứ tự từ mặt tiền NDC (z=0) tới mặt sau Nước Mặn 6 (z=HOUSE_D): Sân thượng trước (full width x
// 6m) -> [khối CÓ TƯỜNG+MÁI: Phòng studio (trống bên trong) + Cầu thang tum] -> Sân thượng sau
// (phía Nước Mặn 6, LỘ THIÊN — có WC nhỏ bên trong, dính LIỀN vách tường ngoài của khối Cầu thang
// tum, không có khoảng hở). QUAN TRỌNG: Cầu thang tum PHẢI thẳng hàng và cùng bề rộng (STAIR_D=4.5m,
// z=[STAIR_Y0,STAIR_Y1]) với khoang cầu thang chính của Trệt/T2/T3 bên dưới — không phải 1 khoang
// nhỏ riêng biệt — nên Phòng studio chỉ còn chiếm đúng khoảng còn lại giữa Sân thượng trước và
// đầu khoang cầu thang (z=[roofFrontD, STAIR_Y0]).
{
  const by = floorBaseY(3);
  const roofFrontD = 6; // "Sân thượng trước" full width x 6m cố định theo đề bài
  const tumWcD = 1.8;
  let z = 0;
  ROOMS.push({ id:'roof-front', floor:3, label:'Sân thượng trước', kind:'roofdeck', x:0, y:by+0.05, z:z+roofFrontD/2, w:HOUSE_W, d:roofFrontD,
    desc:'Sân thượng phía trước (mặt Nguyễn Đình Chiểu), full width x 6m.' });
  z += roofFrontD;
  const studioD = STAIR_Y0 - z; // phần còn lại tới đúng đầu khoang cầu thang chính
  ROOMS.push({ id:'tum', floor:3, label:'Phòng studio (Tum)', kind:'tum', x:0, y:by+0.05, z:z+studioD/2, w:HOUSE_W, d:studioD,
    desc:'Phòng studio trên tum, không gian trống hoàn toàn bên trong — có tường bao quanh như phòng thật.' });
  z = STAIR_Y0;
  // Cầu thang tum: thẳng hàng ĐÚNG vị trí + bề rộng khoang cầu thang chính (z=[STAIR_Y0,STAIR_Y1],
  // rộng STAIR_D) — không phải khoang nhỏ riêng như trước.
  ROOMS.push({ id:'tum-stair', floor:3, label:'Cầu thang tum', kind:'stair', x:0, y:by+0.05, z:(STAIR_Y0+STAIR_Y1)/2, w:HOUSE_W, d:STAIR_D,
    desc:'Khoang cầu thang bộ nối lên tum, thẳng hàng và cùng bề rộng với khoang cầu thang chính bên dưới, có tường bao quanh.' });
  z = STAIR_Y1;
  // Sân thượng sau: lộ thiên, chứa 1 WC nhỏ ĐỘC LẬP (không dính tường/mái với khối Studio+Cầu
  // thang phía trước) — đặt lệch về đầu gần cầu thang, lệch phải (world x dương).
  const roofBackD = HOUSE_D - z;
  const roofBackZ0 = z;
  ROOMS.push({ id:'roof-back', floor:3, label:'Sân thượng sau', kind:'roofdeck', x:0, y:by+0.05, z:z+roofBackD/2, w:HOUSE_W, d:roofBackD,
    desc:'Sân thượng phía sau (mặt Nước Mặn 6), lộ thiên, dùng để phơi đồ, lan can bao quanh — có WC nhỏ đứng độc lập bên trong.' });
  // Lệch về world x ÂM (đối diện phía cửa cầu thang<->sân thượng sau, world x dương) để không
  // chặn lối đi qua cửa đó.
  const tumWcW = WC_SIZE, tumWcX = -(HOUSE_W/2 - tumWcW/2);
  // WC dính LIỀN vào vách tường ngoài của khối Cầu thang tum (không có khoảng hở) — mép trong
  // (z nhỏ) của WC trùng đúng roofBackZ0 (= mép ngoài tường Cầu thang tum).
  ROOMS.push({ id:'tum-wc', floor:3, label:'WC (Tum)', kind:'wc', x:tumWcX, y:by+0.05, z:roofBackZ0+tumWcD/2, w:tumWcW, d:tumWcD,
    desc:'WC nhỏ trên Sân thượng sau, lệch bên phải toà nhà, dính liền vách tường Cầu thang tum, cửa mở sang trái.' });
}

/* ============================================================
   1b. DỮ LIỆU CĂN HỘ CHO THUÊ (data thương mại — giá/tiện ích/trạng thái)
   ============================================================
   Mỗi unit gộp 3 phòng con (ngủ/bếp/wc) của 1 căn tại 1 tầng — ban công không còn là phòng
   riêng bên trong nhà, mà là phần sàn nhô ra ngoài trời gắn liền với phòng ngủ (xem
   buildBalconySlab), truy cập qua cửa/cửa sổ trên tường mặt tiền/mặt sau của chính phòng ngủ.
   roomIds trỏ tới đúng id trong ROOMS phía trên để: (1) mở panel unit khi
   click bất kỳ phòng con nào, (2) tính vị trí trung tâm để đặt hotspot to.
   Giá/trạng thái hiện hardcode theo xác nhận của chủ nhà — sửa trực tiếp ở đây. */
const AMENITY_ICONS = {
  wifi:'Wifi tốc độ cao', ac:'Điều hoà', washer:'Máy giặt riêng', fridge:'Tủ lạnh',
  bed:'Giường 1m8', desk:'Bàn làm việc', wardrobe:'Tủ quần áo', kitchen:'Bếp từ + bàn ăn',
  privateWC:'WC riêng khép kín', balcony:'Ban công riêng', parking:'Chỗ để xe', hotwater:'Nước nóng',
  lock:'Khoá vân tay/cửa riêng', cam:'Camera an ninh 24/7', kitchenWindow:'Bếp có cửa sổ lấy sáng',
};
const UNIT_STANDARD_AMENITIES = ['wifi','ac','washer','fridge','bed','wardrobe','desk','kitchen','privateWC','balcony','hotwater','parking','lock','cam'];

const UNITS = [];
for (let floor = 1; floor <= 2; floor++) {
  const fname = ['', 'Tầng 2', 'Tầng 3'][floor];
  for (const key of ['A','B']) {
    const facing = key === 'A' ? 'Mặt tiền (hướng đường Nguyễn Đình Chiểu)' : 'Phía sau nhà (hướng đường Nước Mặn 6, yên tĩnh hơn)';
    const roomIds = [`f${floor}-${key}-ngu`, `f${floor}-${key}-bep`, `f${floor}-${key}-wc`];
    UNITS.push({
      id: `unit-${floor}-${key}`,
      floor, unitKey: key,
      label: `${fname} · Căn ${key}`,
      shortLabel: `${floor+1}${key}`,
      facing,
      roomIds,
      price: 5500000,
      priceLabel: '5.5 triệu/tháng',
      area: 45,
      bedrooms: 1,
      deposit: '1 tháng',
      contractTerms: ['6 tháng', '12 tháng'],
      // TODO: hardcode tạm — cập nhật đúng thực tế cho từng căn khi có lịch thuê mới.
      available: false,
      amenities: UNIT_STANDARD_AMENITIES.concat(floor >= 2 ? ['kitchenWindow'] : []),
      photos: [], // TODO: chèn ảnh thật của từng căn khi có — tạm dùng placeholder chung theo `kind`
      desc: `Căn hộ 1 phòng ngủ khép kín, ${facing.toLowerCase()}, đầy đủ nội thất — sẵn sàng dọn vào ở ngay.`,
    });
  }
}
// Tầng hầm: 1 phòng duy nhất, không phải kiểu "2 căn A/B" — vẫn coi là 1 unit cho thuê riêng.
{
  const roomIds = ['ham-ngu', 'ham-bep', 'ham-wc'];
  UNITS.push({
    id: 'unit-ham',
    floor: -1, unitKey: 'HAM',
    label: 'Tầng hầm',
    shortLabel: 'Hầm',
    facing: 'Mặt tiền đường Nước Mặn 6 (lối đi riêng, không chung cầu thang)',
    roomIds,
    price: 4500000,
    priceLabel: '4.5 triệu/tháng',
    area: 45,
    bedrooms: 1,
    deposit: '1 tháng',
    contractTerms: ['6 tháng', '12 tháng'],
    available: false,
    amenities: UNIT_STANDARD_AMENITIES.filter(a => a !== 'balcony'),
    photos: [],
    desc: 'Căn hộ 1 phòng ngủ khép kín, tầng hầm, lối đi riêng biệt trực tiếp ra đường Nước Mặn 6 — không đi chung cầu thang với các tầng trên, không có ban công.',
  });
}
// map ngược: roomId -> unit (để click phòng con mở đúng panel căn hộ)
const ROOM_ID_TO_UNIT = {};
for (const u of UNITS) for (const rid of u.roomIds) ROOM_ID_TO_UNIT[rid] = u.id;

const ZONE_LABELS = {
  overview: ['f0-garage','f0-stair','f0-bep','f0-ngu','f0-wc',
             'ham-ngu','ham-bep','ham-wc',
             'f1-stair','f2-stair','tum'].reduce((s,id)=>{s[id]=true;return s;},{}),
};
// simpler: for overview show only outer/context labels; for floorX show all rooms of that floor
function labelsVisibleFor(view) {
  if (view === 'overview') {
    return new Set(['f0-garage']);
  }
  if (view === 'roof') {
    return new Set(ROOMS.filter(r=>r.floor===3).map(r=>r.id));
  }
  if (view === 'ham') {
    return new Set(ROOMS.filter(r=>r.floor===-1).map(r=>r.id));
  }
  const m = view.match(/^floor(\d)$/);
  if (m) {
    const floor = parseInt(m[1],10);
    return new Set(ROOMS.filter(r=>r.floor===floor).map(r=>r.id));
  }
  return new Set();
}

// Nhãn cấp CĂN HỘ (to, nổi bật) — chỉ có ý nghĩa ở các tầng có người ở (hầm,1,2).
// Đây là nhãn chính khách thuê sẽ thấy và click; nhãn phòng con (bếp/ngủ/wc)
// vẫn tồn tại cho raycasting/prev-next nhưng không hiển thị nhãn riêng ở view floorN nữa.
function unitsVisibleFor(view) {
  if (view === 'ham') return new Set(UNITS.filter(u=>u.floor===-1).map(u=>u.id));
  const m = view.match(/^floor([1-2])$/);
  if (!m) return new Set();
  const floor = parseInt(m[1],10);
  return new Set(UNITS.filter(u=>u.floor===floor).map(u=>u.id));
}
function unitCenter(unit) {
  // trung tâm hình học = trung bình vị trí các phòng con (ngủ/bếp/wc, đã ở cùng world space)
  const v = new THREE.Vector3();
  for (const rid of unit.roomIds) {
    const r = ROOMS.find(x=>x.id===rid);
    v.add(new THREE.Vector3(r.x, 0, r.z));
  }
  v.divideScalar(unit.roomIds.length);
  return v;
}

/* ============================================================
   2. SCENE / CAMERA / RENDERER
   ============================================================ */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbcd9ec);
scene.fog = new THREE.Fog(0xbcd9ec, 40, 110);

const totalHeight = HAM_H + N_FLOORS * FLOOR_H + TUM_H;
const centerTarget = new THREE.Vector3(0, totalHeight*0.35, HOUSE_D/2);

const frustumSize = 30;
let aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
  -frustumSize*aspect/2, frustumSize*aspect/2, frustumSize/2, -frustumSize/2, 0.1, 300
);

// spherical camera state around centerTarget
const camState = { radius: 30, theta: Math.PI*0.25, phi: Math.PI*0.35, target: centerTarget.clone(), zoom: 1 };

function updateCamera() {
  const r = camState.radius;
  const x = r * Math.sin(camState.phi) * Math.sin(camState.theta);
  const y = r * Math.cos(camState.phi);
  const z = r * Math.sin(camState.phi) * Math.cos(camState.theta);
  camera.position.set(camState.target.x + x, camState.target.y + y, camState.target.z + z);
  camera.lookAt(camState.target);
  camera.zoom = camState.zoom;
  camera.updateProjectionMatrix();
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  aspect = w / h;
  camera.left = -frustumSize*aspect/2;
  camera.right = frustumSize*aspect/2;
  camera.top = frustumSize/2;
  camera.bottom = -frustumSize/2;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
window.addEventListener('resize', resize);

/* ============================================================
   3. ÁNH SÁNG (ngày / đêm)
   ============================================================ */
const hemi = new THREE.HemisphereLight(0xfff3e0, 0x8ea6b8, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffe9c7, 1.1);
sun.position.set(18, 26, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -25; sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25; sun.shadow.camera.bottom = -25;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 80;
sun.shadow.bias = -0.0015;
scene.add(sun);
scene.add(sun.target);

const fillLight = new THREE.DirectionalLight(0xbcd9ff, 0.35);
fillLight.position.set(-10, 12, -10);
scene.add(fillLight);

// nhóm đèn cửa sổ ban đêm (bật/tắt theo mode)
const nightLights = new THREE.Group();
scene.add(nightLights);
const streetLights = new THREE.Group();
scene.add(streetLights);

let starPoints = null;
function buildStars() {
  const geo = new THREE.BufferGeometry();
  const N = 400;
  const positions = new Float32Array(N*3);
  for (let i=0;i<N;i++){
    const r = 80 + Math.random()*40;
    const th = Math.random()*Math.PI*2;
    const ph = Math.random()*Math.PI*0.5;
    positions[i*3] = r*Math.sin(ph)*Math.cos(th);
    positions[i*3+1] = 20 + r*Math.cos(ph)*0.6 + Math.random()*20;
    positions[i*3+2] = r*Math.sin(ph)*Math.sin(th);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const mat = new THREE.PointsMaterial({ color:0xffffff, size:0.5, sizeAttenuation:true });
  starPoints = new THREE.Points(geo, mat);
  starPoints.visible = false;
  scene.add(starPoints);
}

/* ============================================================
   4. VẬT LIỆU DÙNG CHUNG
   ============================================================ */
const MAT = {
  wallWhite: new THREE.MeshLambertMaterial({ color: 0xf3f1ea }),
  wallGray: new THREE.MeshLambertMaterial({ color: 0xd8dcdf }),
  floorTile: new THREE.MeshLambertMaterial({ color: 0x9a9d9f }), // gạch bếp xám đậm, tách biệt rõ với sàn gỗ ngủ và sàn WC
  floorWood: new THREE.MeshLambertMaterial({ color: 0xb98a5c }),
  floorDark: new THREE.MeshLambertMaterial({ color: 0x555b60 }),
  glassDark: new THREE.MeshBasicMaterial({ color: 0xcfe8f0, transparent:true, opacity:0.12, depthWrite:false }),
  glassFrosted: new THREE.MeshPhongMaterial({ color: 0xdfe9ec, shininess:40, transparent:true, opacity:0.55 }),
  frameBlack: new THREE.MeshLambertMaterial({ color: 0x22262b }),
  railBlack: new THREE.MeshLambertMaterial({ color: 0x2a2f34 }),
  woodMed: new THREE.MeshLambertMaterial({ color: 0xa9784c }),
  woodDark: new THREE.MeshLambertMaterial({ color: 0x6b4a30 }),
  woodLight: new THREE.MeshLambertMaterial({ color: 0xdcc9a8 }),
  concrete: new THREE.MeshLambertMaterial({ color: 0xc9c6bd }),
  concreteDark: new THREE.MeshLambertMaterial({ color: 0x9a978d }),
  roadAsphalt: new THREE.MeshLambertMaterial({ color: 0x3c3f42 }),
  sidewalk: new THREE.MeshLambertMaterial({ color: 0xcfc9bd }),
  grass: new THREE.MeshLambertMaterial({ color: 0x8fae63 }),
  dirt: new THREE.MeshLambertMaterial({ color: 0xa89570 }),
  leaf: new THREE.MeshLambertMaterial({ color: 0x5f9153 }),
  trunk: new THREE.MeshLambertMaterial({ color: 0x6b4a30 }),
  applianceBlack: new THREE.MeshLambertMaterial({ color: 0x1e2124 }),
  counterTop: new THREE.MeshLambertMaterial({ color: 0x2f3336 }),
  bedFrame: new THREE.MeshLambertMaterial({ color: 0xc79a63 }),
  bedSheet: new THREE.MeshLambertMaterial({ color: 0xf2efe9 }),
  wcTile: new THREE.MeshLambertMaterial({ color: 0xdadfe0 }),
  wcFloor: new THREE.MeshLambertMaterial({ color: 0xa9d8cf }), // xanh ngọc nhạt, đặc trưng phòng tắm
  porcelain: new THREE.MeshLambertMaterial({ color: 0xfafafa }),
  metal: new THREE.MeshLambertMaterial({ color: 0xb7bdc2 }),
  ac: new THREE.MeshLambertMaterial({ color: 0xf5f7f8 }),
  chairBrown: new THREE.MeshLambertMaterial({ color: 0x5a3a28 }),
  marble: new THREE.MeshLambertMaterial({ color: 0xefeee9 }),
  cloth: new THREE.MeshLambertMaterial({ color: 0xb5bfc4 }),
  windowLit: new THREE.MeshBasicMaterial({ color: 0xffd98a }),
  bikeBody: new THREE.MeshLambertMaterial({ color: 0x2b3947 }),
  carBody: new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }),
  poleGray: new THREE.MeshLambertMaterial({ color: 0x8a8f93 }),
  wireBlack: new THREE.LineBasicMaterial({ color: 0x2a2a2a }),
  craneYellow: new THREE.MeshLambertMaterial({ color: 0xf0c33c }),
  buildingFar: new THREE.MeshLambertMaterial({ color: 0xc7cdd2 }),
  houseCream: new THREE.MeshLambertMaterial({ color: 0xf0e2c5 }),
  houseSalmon: new THREE.MeshLambertMaterial({ color: 0xe8b39a }),
  houseBlue: new THREE.MeshLambertMaterial({ color: 0xaecbd6 }),
  houseWhite: new THREE.MeshLambertMaterial({ color: 0xf6f4ee }),
  houseGreen: new THREE.MeshLambertMaterial({ color: 0xb9c98f }),
  signRed: new THREE.MeshLambertMaterial({ color: 0xb93a34 }),
  signOrange: new THREE.MeshLambertMaterial({ color: 0xe07a2c }),
};

const worldGroup = new THREE.Group();
scene.add(worldGroup);
const houseGroup = new THREE.Group();
worldGroup.add(houseGroup);
const envGroup = new THREE.Group();
worldGroup.add(envGroup);

/* helper: box mesh at given center (x,y,z) with size (w,h,d) */
function box(w,h,d, mat, x=0,y=0,z=0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt,rb,h,mat,x=0,y=0,z=0,seg=10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), mat);
  m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* Cửa đơn (khung đen + mặt kính tối), kích thước chuẩn DOOR_W x DOOR_H.
   axis: 'x' nếu cửa nằm trên tường chạy dọc trục x (bản thân cửa nằm ngang theo x);
         'z' nếu cửa nằm trên tường chạy dọc trục z (bản thân cửa nằm ngang theo z). */
/* Tường mặt tiền/mặt sau CÓ KHOÉT LỖ thật cho 1 cửa đi (chạm sàn, cao DOOR_H, world x=doorX)
   và 1 cửa sổ lơ lửng (cao 1.1m quanh y=1.7, world x=windowX) — thay vì dựng tường đặc nguyên
   khối rồi phủ kính chồng lên phía trước (kính khi đó dù trong suốt vẫn vô nghĩa vì ngay sau
   nó luôn là tường liền). Chia tường thành các dải ngang theo chiều cao; trong mỗi dải, khoét
   theo trục X đúng những lỗ cắt qua dải đó (dùng chung thuật toán "segments giữa các gap" như
   wallWithGaps ở buildRoomWalls, áp dụng lặp lại cho từng dải).
   z: vị trí mặt tường theo trục sâu (0 = mặt tiền, HOUSE_D = mặt sau). */
function buildFacadeWallWithOpenings(shell, wallMat, t, by, z, doorX, windowX) {
  const winH = 1.1, winY0 = 1.7 - winH/2, winY1 = 1.7 + winH/2;
  const doorW = DOOR_W + 0.06, winW = 1.0 + 0.06; // nới nhẹ để không z-fight với khung cửa/cửa sổ
  const hasWindow = windowX !== null && windowX !== undefined; // windowX=null -> tường không có cửa sổ (chỉ cửa đi), vd. tường ngoài Hầm
  const doorGap = { center: doorX, width: doorW };
  const winGap = hasWindow ? { center: windowX, width: winW } : null;
  const xSpan = HOUSE_W;
  let mainMesh = null;

  function stripWithGaps(y0, y1, gaps) {
    const h = y1 - y0;
    if (h < 0.03) return;
    const segs = [];
    let cursor = -xSpan/2;
    const sorted = gaps.slice().sort((a,b)=>a.center-b.center);
    for (const gap of sorted) {
      const gapStart = gap.center - gap.width/2;
      if (gapStart > cursor) segs.push([cursor, gapStart]);
      cursor = Math.max(cursor, gap.center + gap.width/2);
    }
    if (cursor < xSpan/2) segs.push([cursor, xSpan/2]);
    for (const [x0, x1] of segs) {
      const w = x1 - x0;
      if (w < 0.03) continue;
      const m = box(w, h, t, wallMat, (x0+x1)/2, by+(y0+y1)/2, z);
      shell.add(m);
      const area = w*h;
      if (!mainMesh || area > mainMesh.userData._area) { m.userData._area = area; mainMesh = m; }
    }
  }

  // Các mốc chiều cao theo thứ tự tăng dần, gộp cả đỉnh cửa sổ và đỉnh cửa đi (DOOR_H) vì
  // winY1 (2.25m) và DOOR_H (2.1m) không trùng nhau — cửa đi đã kết thúc TRƯỚC khi cửa sổ kết
  // thúc, nên dải [DOOR_H, winY1] chỉ còn lỗ cửa sổ, không còn lỗ cửa đi.
  const marks = (hasWindow
      ? [0, winY0, Math.min(DOOR_H, winY1), Math.max(DOOR_H, winY1), FLOOR_H]
      : [0, DOOR_H, FLOOR_H])
    .filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
  for (let i=0; i<marks.length-1; i++) {
    const y0 = marks[i], y1 = marks[i+1];
    const gaps = [];
    if (y0 < DOOR_H) gaps.push(doorGap);       // dải này còn nằm trong chiều cao cửa đi
    if (hasWindow && y0 >= winY0 && y0 < winY1) gaps.push(winGap); // dải này còn nằm trong chiều cao cửa sổ
    stripWithGaps(y0, y1, gaps);
  }
  return mainMesh;
}

/* Tường hông bên phải (world x = +HOUSE_W/2, dài suốt HOUSE_D=20m): khoét lỗ thật cho 3 cửa sổ
   bếp Căn A / bếp Căn B / khoang cầu thang (chỉ tầng có cửa sổ, xem buildWindowsForFloor) —
   cùng thuật toán "segments giữa các gap theo trục z" như buildFacadeWallWithOpenings dùng theo
   trục x. Không có cửa đi trên tường này. */
function buildSideWallWithOpenings(shell, wallMat, t, by, floor) {
  const x = HOUSE_W/2;
  const hasWindows = floor >= 2;
  const winH = 1.0, winY0 = 1.7 - winH/2, winY1 = 1.7 + winH/2;
  const winW = 1.4 + 0.06; // nới nhẹ để không z-fight với khung kính

  if (!hasWindows) {
    shell.add(box(t, FLOOR_H, HOUSE_D, wallMat, x, by+FLOOR_H/2, HOUSE_D/2));
    return;
  }

  const { nguD, bepD } = UNIT_LAYOUT;
  const zBepA = nguD + bepD/2;
  const zBepB = HOUSE_D - (nguD + bepD/2);
  const zStair = (STAIR_Y0 + STAIR_Y1) / 2;
  const gaps = [zBepA, zBepB, zStair].map(center => ({ center, width: winW }));

  function stripWithGaps(y0, y1, activeGaps) {
    const h = y1 - y0;
    if (h < 0.03) return;
    const segs = [];
    let cursor = 0;
    const sorted = activeGaps.slice().sort((a,b)=>a.center-b.center);
    for (const gap of sorted) {
      const gapStart = gap.center - gap.width/2;
      if (gapStart > cursor) segs.push([cursor, gapStart]);
      cursor = Math.max(cursor, gap.center + gap.width/2);
    }
    if (cursor < HOUSE_D) segs.push([cursor, HOUSE_D]);
    for (const [z0, z1] of segs) {
      const len = z1 - z0;
      if (len < 0.03) continue;
      shell.add(box(t, h, len, wallMat, x, by+(y0+y1)/2, (z0+z1)/2));
    }
  }

  const marks = [0, winY0, winY1, FLOOR_H];
  for (let i=0; i<marks.length-1; i++) {
    const y0 = marks[i], y1 = marks[i+1];
    const activeGaps = (y0 >= winY0 && y0 < winY1) ? gaps : [];
    stripWithGaps(y0, y1, activeGaps);
  }
}

function buildDoor(x, yBase, z, axis, group, mat) {
  const doorMat = mat || MAT.glassDark;
  const g = new THREE.Group();
  const frameT = 0.06;
  const w = DOOR_W, h = DOOR_H;
  const edge = 0.05; // bề rộng viền khung thật sự nhìn thấy quanh mặt kính
  let glassMesh;
  if (axis === 'x') {
    // Khung chỉ là 4 thanh viền mỏng (trên/dưới/trái/phải) thay vì 1 tấm đặc phủ sau kính —
    // trước đây tấm đặc đó (kích thước gần bằng cả cửa) làm kính trong suốt phía trước bị chính
    // nó che khuất, khiến cả cửa trông đục màu đen dù vật liệu kính có opacity thấp.
    g.add(box(w, edge, frameT, MAT.frameBlack, 0, h-edge/2, 0));
    g.add(box(w, edge, frameT, MAT.frameBlack, 0, edge/2, 0));
    g.add(box(edge, h, frameT, MAT.frameBlack, -w/2+edge/2, h/2, 0));
    g.add(box(edge, h, frameT, MAT.frameBlack, w/2-edge/2, h/2, 0));
    glassMesh = box(w-edge*2, h-edge*2, frameT*0.5, doorMat, 0, h/2, 0);
    g.add(glassMesh);
  } else {
    g.add(box(frameT, edge, w, MAT.frameBlack, 0, h-edge/2, 0));
    g.add(box(frameT, edge, w, MAT.frameBlack, 0, edge/2, 0));
    g.add(box(frameT, h, edge, MAT.frameBlack, 0, h/2, -w/2+edge/2));
    g.add(box(frameT, h, edge, MAT.frameBlack, 0, h/2, w/2-edge/2));
    glassMesh = box(frameT*0.5, h-edge*2, w-edge*2, doorMat, 0, h/2, 0);
    g.add(glassMesh);
  }
  g.position.set(x, yBase, z);
  (group || houseGroup).add(g);
  g.userData.glassMesh = glassMesh; // để caller đăng ký vào sideWindowMeshes nếu cần sáng đèn ban đêm
  return g;
}

/* ============================================================
   5. DỰNG NỀN ĐẤT / ĐƯỜNG / BỐI CẢNH XUNG QUANH
   ============================================================ */
// Nhà xây trên đất dốc, GIẬT CẤP VUÔNG GÓC (không nghiêng thoải dần): nền đất phẳng ngang mặt
// tiền NDC (y=0) cho z<CLIFF_Z, rồi hạ THẲNG ĐỨNG xuống cao độ sàn hầm (HAM_BY, khoảng -3.1m)
// ngay tại z=CLIFF_Z (=HAM_Z0=15, đúng ranh giới tầng hầm), giữ nguyên cao độ thấp đó cho tới
// hết (phía đường Nước Mặn 6). Vách đứng nối 2 mặt phẳng được dựng riêng ở buildCliffWall().
const CLIFF_Z = HAM_Z0; // 15 — nơi nền đất giật cấp xuống thấp
function terrainY(z) {
  return z < CLIFF_Z ? 0 : HAM_BY;
}

// Vách đứng (tường chắn đất bê tông) nối mặt đất cao (z<CLIFF_Z, y=0) với mặt đất thấp
// (z>=CLIFF_Z, y=HAM_BY) tại đúng z=CLIFF_Z — kéo dài suốt bề ngang khu đất, chỉ chừa đúng
// đoạn bề ngang nhà chính (HOUSE_W) vì đoạn đó đã có tường ngoài thật của buildHamFloor.
function buildCliffWall() {
  const wallH = -HAM_BY; // 3.1
  const halfSpan = 70; // nửa bề ngang khu đất (groundSize/2)
  const gapHalf = HOUSE_W/2 + 0.1; // chừa đúng bề ngang nhà (khớp buildHamFloor phía trong)
  for (const [x0, x1] of [[-halfSpan, -gapHalf], [gapHalf, halfSpan]]) {
    const len = x1 - x0;
    if (len <= 0) continue;
    envGroup.add(box(len, wallH, 0.2, MAT.concreteDark, (x0+x1)/2, HAM_BY + wallH/2, CLIFF_Z));
  }
}

function buildGround() {
  // Sân đất trống rộng — 2 mặt phẳng riêng biệt (cao/thấp) thay vì 1 mặt dốc, khớp terrainY
  // dạng bậc thang. Mặt cao (phía NDC, z<CLIFF_Z) và mặt thấp (phía Nước Mặn 6, z>=CLIFF_Z).
  const groundSize = 140;
  const highDepth = CLIFF_Z + groundSize/2; // đủ phủ về phía trước (z âm) tới xa
  const groundHigh = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, highDepth), MAT.dirt);
  groundHigh.rotation.x = -Math.PI/2;
  groundHigh.position.set(0, 0, CLIFF_Z - highDepth/2);
  groundHigh.receiveShadow = true;
  envGroup.add(groundHigh);

  const lowDepth = (HOUSE_D + groundSize/2) - CLIFF_Z; // đủ phủ về phía sau (z lớn) tới xa
  const groundLow = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, lowDepth), MAT.dirt);
  groundLow.rotation.x = -Math.PI/2;
  groundLow.position.set(0, HAM_BY, CLIFF_Z + lowDepth/2);
  groundLow.receiveShadow = true;
  envGroup.add(groundLow);

  buildCliffWall();

  // cỏ dại rải rác quanh nhà (không lát gạch) — bám theo cao độ mặt đất dốc tại từng vị trí z
  for (let i=0;i<40;i++){
    const gx = (Math.random()-0.5)*40;
    const gz = HOUSE_D/2 + (Math.random()-0.5)*40;
    if (Math.abs(gx) < 4 && gz > -2 && gz < HOUSE_D+2) continue;
    const g = box(0.5+Math.random()*0.4, 0.25, 0.5+Math.random()*0.4, MAT.grass, gx, terrainY(gz)+0.1, gz);
    g.rotation.y = Math.random()*Math.PI;
    envGroup.add(g);
  }

  // Đường Nguyễn Đình Chiểu (mặt tiền, rộng 7m theo thực tế) — cùng kiểu thiết kế với đường
  // Nước Mặn 6 phía sau: vỉa hè 2 bên, vạch tim đường đứt quãng, biển tên đường. Mép gần đường
  // cách nhà 3m (chỗ cho vỉa hè trước nhà); tim đường tại z=-nqaRoadNear-nqaRoadW/2.
  const nqaRoadW = 7;
  const nqaRoadNear = -3; // mép đường gần nhà (âm = phía trước nhà)
  const nqaZ = nqaRoadNear - nqaRoadW/2; // tim đường

  envGroup.add(box(HOUSE_W+3, 0.12, 3, MAT.sidewalk, 0, 0.06, -1.5)); // vỉa hè sát nhà (giữa nhà và đường)
  envGroup.add(box(HOUSE_W+18, 0.1, nqaRoadW, MAT.roadAsphalt, 0, 0.02, nqaZ)); // mặt đường nhựa
  envGroup.add(box(HOUSE_W+18, 0.12, 1.6, MAT.sidewalk, 0, 0.06, nqaZ-nqaRoadW/2-0.8)); // vỉa hè phía đối diện

  // vạch tim đường đứt quãng
  for (let x=-(HOUSE_W+18)/2+1; x<(HOUSE_W+18)/2; x+=3) {
    envGroup.add(box(1.4, 0.11, 0.15, MAT.sidewalk, x, 0.03, nqaZ));
  }

  // biển tên đường "Đ. Nguyễn Đình Chiểu" cắm cạnh vỉa hè phía đối diện nhà
  envGroup.add(cyl(0.04,0.04,2.0, MAT.poleGray, 12, 1.0, nqaZ-nqaRoadW/2-1.8));
  envGroup.add(box(1.5,0.4,0.03, MAT.signRed, 12, 2.0, nqaZ-nqaRoadW/2-1.8));

  // cột điện + dây + đèn đường (bật sáng vào ban đêm)
  function pole(x,z){
    const p = cyl(0.09,0.11,7,MAT.poleGray,x,3.5,z);
    envGroup.add(p);
    // cánh tay đèn + bóng đèn
    envGroup.add(box(0.6,0.05,0.05, MAT.poleGray, x+0.3, 6.9, z));
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14,10,10), MAT.windowLit);
    bulb.position.set(x+0.6, 6.75, z);
    bulb.visible = false;
    streetLights.add(bulb);
    const pl = new THREE.PointLight(0xffd98a, 0, 9);
    pl.position.copy(bulb.position);
    streetLights.add(pl);
    return new THREE.Vector3(x,6.6,z);
  }
  const p1 = pole(4.2,-5.5);
  const p2 = pole(-9,-4.8);
  const p3 = pole(10,-0.5);
  [[p1,p2],[p1,p3],[p2,p3]].forEach(([a,b])=>{
    const pts = [];
    const segN = 12;
    for (let i=0;i<=segN;i++){
      const t = i/segN;
      const x = a.x+(b.x-a.x)*t;
      const z = a.z+(b.z-a.z)*t;
      const y = a.y+(b.y-a.y)*t - Math.sin(t*Math.PI)*0.6;
      pts.push(new THREE.Vector3(x,y,z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    envGroup.add(new THREE.Line(geo, MAT.wireBlack));
  });

  // xe máy + ô tô đậu vỉa hè
  function motorbike(x,z,rotY=0){
    const g = new THREE.Group();
    g.add(box(0.35,0.4,1.1,MAT.bikeBody,0,0.35,0));
    g.add(cyl(0.18,0.18,0.08,MAT.applianceBlack,0.12,0.18,0.5,10).rotateOnAxis(new THREE.Vector3(0,0,1),Math.PI/2));
    const w1 = cyl(0.18,0.18,0.08,MAT.applianceBlack,0,0.18,0.5,10); w1.rotation.z=Math.PI/2; g.add(w1);
    const w2 = cyl(0.18,0.18,0.08,MAT.applianceBlack,0,0.18,-0.5,10); w2.rotation.z=Math.PI/2; g.add(w2);
    g.position.set(x,0,z); g.rotation.y = rotY;
    envGroup.add(g);
  }
  motorbike(-2.0,-1.6, 0.15);
  motorbike(-1.3,-1.7, -0.1);
  function car(x,z,rotY=0){
    const g = new THREE.Group();
    g.add(box(1.7,0.55,3.6,MAT.carBody,0,0.55,0));
    g.add(box(1.5,0.4,1.8,MAT.glassDark,0,0.95,-0.1));
    for (const dx of [-0.75,0.75]) for (const dz of [-1.2,1.2]) {
      const w = cyl(0.32,0.32,0.22,MAT.applianceBlack,dx,0.32,dz,12); w.rotation.z=Math.PI/2; g.add(w);
    }
    g.position.set(x,0,z); g.rotation.y = rotY;
    envGroup.add(g);
  }
  car(3.6,-2.0, 0.05);

  // nhà xưởng thấp tầng bên trái (đơn giản hoá)
  const shed = box(6,3,10, MAT.concreteDark, -13, 1.5, 4);
  envGroup.add(shed);
  const shedRoof = box(6.4,0.2,10.4, MAT.roadAsphalt, -13,3.05,4);
  envGroup.add(shedRoof);

  // chung cư cao tầng xa xa + cẩu tháp (đơn giản hoá, phía sau)
  function farTower(x,z,h,w=6,d=6){
    const g = new THREE.Group();
    g.position.set(x,terrainY(z),z);
    envGroup.add(g);
    g.add(box(w,h,d, MAT.buildingFar, 0, h/2, 0));
    for (let fy=2; fy<h-1; fy+=2.2){
      for (let fx=-w/2+0.8; fx<w/2; fx+=1.4){
        const win = box(0.6,0.9,0.06, MAT.glassDark, fx, fy, d/2+0.03);
        win.castShadow=false;
        g.add(win);
      }
    }
  }
  farTower(42, 34, 22, 8, 8);
  farTower(52, 24, 16, 6, 6);
  farTower(-45, 36, 18, 7, 7);

  function crane(x,z){
    const g = new THREE.Group();
    g.add(box(0.3,20,0.3, MAT.craneYellow, 0,10,0));
    g.add(box(10,0.25,0.25, MAT.craneYellow, 4,20,0));
    g.add(box(3,0.25,0.25, MAT.craneYellow, -2.5,20,0));
    const cable = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(8,20,0), new THREE.Vector3(8,13,0)]);
    g.add(new THREE.Line(cable, MAT.wireBlack));
    g.position.set(x,terrainY(z),z);
    envGroup.add(g);
  }
  crane(38,30);
  crane(-40,34);

  // cây xanh rải quanh nhà (tán lá low-poly nhiều khối chồng lệch, kiểu isometric)
  function tree(x,z,scale=1){
    const g = new THREE.Group();
    const trunkH = 1.6*scale;
    g.add(cyl(0.09*scale,0.13*scale,trunkH,MAT.trunk,0,trunkH/2,0,7));
    // bóng mềm dưới gốc
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.3*scale,16), MAT.grass);
    shadow.rotation.x = -Math.PI/2;
    shadow.position.set(0.15*scale,0.015,0.1*scale);
    shadow.material = shadow.material.clone();
    shadow.material.color.set(0x6f8f57);
    shadow.material.transparent = true;
    shadow.material.opacity = 0.35;
    shadow.receiveShadow = true;
    g.add(shadow);
    // tán lá: vài khối icosahedron chồng lệch, xoay ngẫu nhiên nhẹ cho tự nhiên
    const canopyY = trunkH;
    const lumps = [
      {r:1.15*scale, dx:0,          dy:0.55*scale, dz:0},
      {r:0.85*scale, dx:0.55*scale, dy:0.25*scale, dz:0.15*scale},
      {r:0.75*scale, dx:-0.5*scale, dy:0.35*scale, dz:-0.2*scale},
      {r:0.7*scale,  dx:0.05*scale, dy:0.85*scale, dz:0.3*scale},
    ];
    lumps.forEach(l=>{
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(l.r,0), MAT.leaf);
      m.position.set(l.dx, canopyY+l.dy, l.dz);
      m.rotation.y = Math.random()*Math.PI;
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    });
    g.position.set(x,terrainY(z),z);
    g.rotation.y = Math.random()*Math.PI*2;
    envGroup.add(g);
  }
  // hàng cây dọc vỉa hè trước nhà (giữa nhà và đường)
  [-11.5,-6.5, 6.5,11.5].forEach((x,i)=> tree(x, -3.2, 0.95+ (i%2)*0.1));
  // cây lớn cạnh cổng, giống ảnh tham chiếu
  tree(3.1, -1.2, 1.15);
  // cây rải rác trên đất trống quanh nhà (tránh chồng lên nhà/đường/vỉa hè/đường Nước Mặn 6 z=[38,44])
  const scatterTrees = [
    [-16,10,1.05], [-18,20,0.9], [-15,25,1.1], [-10,38,0.85],
    [14,9,1.0], [18,16,1.15], [16,25,0.9], [11,39,1.05],
    [-8,-3.5,0.8], [9,-3.8,0.85], [22,3,0.95], [-22,6,1.0],
  ];
  scatterTrees.forEach(([x,z,s])=> tree(x,z,s));

  buildSongHaoStreet();
}

/* ============================================================
   4b. HẺM NƯỚC MẶN 6 — chạy ngang phía sau nhà (song song mặt tiền Nguyễn Đình Chiểu), thấp hơn
   mặt tiền NDC đúng 1 tầng hầm (cao độ HAM_BY) vì đất dốc. Đây là 1 con HẺM NHỎ (không phải
   đường lớn) — mặt hẻm bê tông hẹp, không vỉa hè, không vạch kẻ tim đường, không biển tên đường
   kiểu chính thức lớn.
   Khoảng cách: nhà chính (mặt sau z=HOUSE_D=30, đã hạ tới cao độ HAM_BY) -> sân trống 3m -> mép
   hẻm (z=33) -> lòng hẻm rộng 2.5m.
   ============================================================ */
function buildSongHaoStreet() {
  const roadNear = HOUSE_D + 3;      // mép hẻm gần nhà chính (z=33) — sát chân dốc (z=30, y=HAM_BY)
  const roadW = 2.5;                 // hẻm nhỏ, không phải đường lớn
  const songHaoZ = roadNear + roadW/2; // tim hẻm (z=34.25)
  const by = HAM_BY; // toàn bộ hẻm Nước Mặn 6 nằm ở cao độ tầng hầm (đất đã hạ hết dốc tại z>=HOUSE_D)

  // mặt hẻm bê tông hẹp — không vỉa hè, không vạch kẻ tim đường (khác đường chính NDC)
  envGroup.add(box(90, 0.1, roadW, MAT.sidewalk, 0, by+0.02, songHaoZ));
}

/* ============================================================
   6. NỘI THẤT — HÀM DỰNG THEO LOẠI PHÒNG
   ============================================================ */

function furnishBedroom(g, room) {
  const { w, d } = room;
  // phòng rộng theo x (ngang nhà), hẹp theo z (chỉ ~2.2m sâu) -> giường đặt DỌC theo z, nằm sát 1 bên tường ngang
  const bedW = Math.min(1.8, d - 0.3);  // chiều "ngang" giường nằm dọc theo trục z (chiều sâu hẹp)
  const bedL = Math.min(2.0, w * 0.4);  // chiều dài giường nằm dọc theo trục x
  const bed = new THREE.Group();
  bed.add(box(bedL, 0.4, bedW, MAT.bedFrame, 0,0.2,0));
  bed.add(box(bedL-0.12, 0.16, bedW-0.12, MAT.bedSheet, 0,0.49,0));
  bed.add(box(0.12, 0.55, bedW, MAT.bedFrame, -bedL/2+0.06,0.68,0));
  bed.position.set(-w/2+bedL/2+0.2, 0, 0);
  g.add(bed);

  // tủ quần áo — áp sát tường sau (z dương), chiếm góc phải
  const wardrobe = box(0.65, 2.0, 1.1, MAT.woodLight, w/2-0.4, 1.0, d/2-0.6);
  g.add(wardrobe);
  const wardrobeAccent = box(0.66, 2.0, 0.35, MAT.woodMed, w/2-0.4, 1.0, d/2-0.6+0.38);
  g.add(wardrobeAccent);

  // điều hoà treo tường
  g.add(box(0.75,0.25,0.2, MAT.ac, w/2-0.5, FLOOR_H-0.55, d/2-0.15));

  // thảm sàn nhỏ cạnh giường để tăng chi tiết/độ tương phản
  g.add(box(bedL+0.3, 0.02, 0.8, MAT.cloth, -w/2+bedL/2+0.2, 0.03, bedW/2+0.45));
}

function furnishKitchen(g, room, hasWindow) {
  const { w, d } = room;
  const counterH = 0.9, counterD = 0.55;
  const fridgeSize = 0.6;
  const wcCutout = room.wcCutout;

  if (wcCutout) {
    // Bếp A/B (tầng 1-3): WC là phòng RIÊNG BIỆT lồng ở góc trái (x=[-w/2, -w/2+wcSize]),
    // phía z chỉ định bởi cornerZ (-1 = góc z âm/Căn A, +1 = góc z dương/Căn B).
    // Kệ bếp là 1 DẢI THẲNG áp tường trái (x=-w/2), chạy dọc suốt phần chiều sâu KHÔNG bị
    // WC chiếm (không ôm quanh WC) — không lấn sang vùng WC.
    const { wcSize, cornerZ } = wcCutout;
    const wcEdgeZ = cornerZ * (d/2 - wcSize); // biên trong (xa góc) của ô WC theo z
    // Đoạn sàn TỰ DO (không có WC) theo z: từ wcEdgeZ tới mép đối diện góc WC.
    const farEdgeZ = -cornerZ * d/2; // mép đối diện góc WC
    const counterZ0 = Math.min(wcEdgeZ, farEdgeZ), counterZ1 = Math.max(wcEdgeZ, farEdgeZ);
    const counterLen = counterZ1 - counterZ0;
    const counterCenterZ = (counterZ0 + counterZ1) / 2;
    const counterX = -w/2 + counterD/2;
    g.add(box(counterD, counterH, counterLen, MAT.woodMed, counterX, counterH/2, counterCenterZ));
    g.add(box(counterD+0.05, 0.05, counterLen+0.05, MAT.counterTop, counterX, counterH+0.02, counterCenterZ));

    // bồn rửa gần đầu kệ sát WC; máy hút mùi phía đầu kia (khu nấu)
    const sinkZ = counterCenterZ - cornerZ*(counterLen/2 - 0.4);
    const cookZ = counterCenterZ + cornerZ*(counterLen/2 - 0.4);
    g.add(box(0.35,0.08,0.4, MAT.metal, counterX, counterH+0.04, sinkZ));
    g.add(box(0.45,0.3,0.5, MAT.applianceBlack, counterX, 2.15, cookZ));

    // tủ lạnh đen — đặt cạnh kệ (không kẹp giữa kệ và WC), lùi vào phía trong phòng một
    // khoảng bằng bề sâu kệ + gap, ngay sát đầu kệ gần WC nhất.
    const gap = 0.1;
    const fridgeX = -w/2 + counterD + gap + fridgeSize/2;
    const fridgeZ = counterCenterZ - cornerZ*(counterLen/2 - fridgeSize/2 - 0.05);
    g.add(box(fridgeSize,1.65,fridgeSize, MAT.applianceBlack, fridgeX, 0.82, fridgeZ));
  } else {
    // Bếp P.101 (không có WC lồng trong, floor 0): kệ chạy dọc SUỐT chiều sâu phòng áp tường
    // trái (không phải né WC như Bếp A/B) — bồn rửa gần đầu Ngủ, bếp nấu gần đầu Cầu thang,
    // tủ lạnh cạnh kệ đầu Cầu thang. Bàn ăn giữ nguyên vị trí mặc định (giữa phòng, lệch phải).
    const counterLen = d - 0.1;
    const counterX = -w/2 + counterD/2;
    g.add(box(counterD, counterH, counterLen, MAT.woodMed, counterX, counterH/2, 0));
    g.add(box(counterD+0.05, 0.05, counterLen+0.05, MAT.counterTop, counterX, counterH+0.02, 0));

    const sinkZ = -counterLen/2 + 0.4;   // gần đầu Ngủ (z âm cục bộ)
    const cookZ = counterLen/2 - 0.4;    // gần đầu Cầu thang (z dương cục bộ)
    g.add(box(0.35,0.08,0.4, MAT.metal, counterX, counterH+0.04, sinkZ));
    g.add(box(0.45,0.3,0.5, MAT.applianceBlack, counterX, 2.15, cookZ));

    const gap = 0.1;
    const fridgeX = -w/2 + counterD + gap + fridgeSize/2;
    const fridgeZ = counterLen/2 - fridgeSize/2 - 0.05; // sát đầu Cầu thang, cạnh kệ
    g.add(box(fridgeSize,1.65,fridgeSize, MAT.applianceBlack, fridgeX, 0.82, fridgeZ));
  }

  if (hasWindow) {
    const win = box(0.9,1.0,0.06, MAT.glassDark, w/2+0.03, 1.6, 0);
    g.add(win);
  }
}

function furnishWC(g, room) {
  const { w, d } = room;
  const floorTile = box(w-0.06, 0.02, d-0.06, MAT.wcFloor, 0, 0.02, 0);
  g.add(floorTile);
  g.add(box(0.38,0.75,0.4, MAT.porcelain, -w/2+0.35, 0.375, -d/2+0.35)); // bồn cầu
  g.add(box(0.5,0.15,0.4, MAT.porcelain, w/2-0.35, 0.85, -d/2+0.3)); // lavabo
  g.add(cyl(0.05,0.05,0.85, MAT.metal, w/2-0.35, 0.43,-d/2+0.3, 8)); // chân lavabo
  g.add(box(0.05,0.6,0.05, MAT.metal, w/2-0.55, 2.0, d/2-0.35)); // ống sen
  g.add(box(0.18,0.05,0.18, MAT.metal, w/2-0.55, 2.32, d/2-0.35)); // đầu sen
  if (room.floor === 0) {
    // WC phòng 101: chỉ vào được từ Ban công, nằm CẠNH ban công theo trục X (ban công ở x lớn hơn)
    // -> cửa mở theo hướng X dương (sang phải, về phía ban công).
    g.add(box(0.06,2.0,0.75, MAT.woodDark, w/2+0.02, 1.0, 0));
  } else {
    // WC các tầng trên: nằm ở góc trái-trước của Bếp, cửa mở sang PHẢI (x dương cục bộ) vào giữa phòng bếp.
    g.add(box(0.06,2.0,0.75, MAT.woodDark, w/2+0.02, 1.0, 0));
  }
}

// Máy giặt dùng chung cho ban công tầng trệt (lồng trong room group cục bộ) và ban công các
// tầng trên (lồng trực tiếp vào wallGroup/world space qua buildBalconySlab) — tách riêng để
// không lặp lại code, tham số đều ở hệ toạ độ cục bộ của group `g` truyền vào.
function furnishWasher(g, w, d, outerIsPositiveZ, washerZ) {
  const washerX = -w/2+0.5;
  const washerFrontZ = washerZ + 0.28*(outerIsPositiveZ?1:-1); // mặt lồng giặt hướng ra ngoài
  g.add(box(0.55,0.85,0.55, MAT.ac, washerX, 0.425, washerZ)); // thân máy
  g.add(box(0.56,0.06,0.56, MAT.applianceBlack, washerX, 0.83, washerZ)); // nắp trên (viền tối)
  g.add(cyl(0.19,0.19,0.04, MAT.applianceBlack, washerX, 0.45, washerFrontZ, 20)); // viền lồng giặt (đen)
  g.add(cyl(0.15,0.15,0.03, MAT.metal, washerX, 0.45, washerFrontZ+0.02*(outerIsPositiveZ?1:-1), 20)); // cửa kính lồng giặt
  g.add(box(0.5,0.06,0.5, MAT.applianceBlack, washerX, 0.03, washerZ)); // chân đế tối màu
}

function furnishBalcony(g, room) {
  const { w, d } = room;
  // Ban công tầng trệt (phòng 101) KHÔNG nhô ra — nằm chìm trong mặt bằng vuông vắn, mép ngoài
  // của nó trùng với tường bao chính của nhà (đã có sẵn), không cần lan can riêng ở đó (chỉ cần
  // lan can 2 bên hông để phân định không gian, tránh trông "lơ lửng" ngoài trời). Ban công các
  // tầng 1-3 giờ nhô hẳn ra ngoài khối nhà chính, dựng riêng ở buildBalconySlab.
  g.add(box(0.06,1.0,d-0.1, MAT.railBlack, -w/2+0.03, 0.5, 0));
  g.add(box(0.06,1.0,d-0.1, MAT.railBlack, w/2-0.03, 0.5, 0));
}

function furnishGarage(g, room) {
  const { w, d } = room;
  function motorbike(x,z,rotY, color){
    const gg = new THREE.Group();
    const bodyMat = color || MAT.bikeBody;
    gg.add(box(0.24,0.3,0.85, bodyMat, 0,0.42,0));      // thân xe
    gg.add(box(0.12,0.08,0.3, MAT.porcelain, 0,0.62,0.2)); // yên xe
    gg.add(box(0.02,0.35,0.02, MAT.metal, 0,0.75,-0.4));   // tay lái (cột)
    gg.add(box(0.36,0.04,0.04, MAT.applianceBlack, 0,0.9,-0.42)); // ghi đông
    const w1 = cyl(0.17,0.17,0.07,MAT.applianceBlack,0,0.17,0.32,14); w1.rotation.z=Math.PI/2; gg.add(w1);
    const w2 = cyl(0.17,0.17,0.07,MAT.applianceBlack,0,0.17,-0.32,14); w2.rotation.z=Math.PI/2; gg.add(w2);
    gg.position.set(x,0,z); gg.rotation.y = rotY;
    g.add(gg);
  }
  const colors = [MAT.bikeBody, MAT.carBody, MAT.chairBrown, MAT.bikeBody, MAT.craneYellow];
  let i = 0;
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const x = -w/2 + 0.55 + row*0.85;
      const z = -d/2 + 0.7 + col*1.05;
      if (z > d/2 - 0.5) continue;
      motorbike(x, z, (Math.random()-0.5)*0.15, colors[i % colors.length]);
      i++;
    }
  }
}

function furnishRoofdeck(g, room) {
  const { w, d } = room;
  const railH = 0.95;
  g.add(box(w-0.1,railH,0.06, MAT.railBlack, 0, railH/2, d/2-0.03));
  g.add(box(w-0.1,railH,0.06, MAT.railBlack, 0, railH/2, -d/2+0.03));
  g.add(box(0.06,railH,d-0.1, MAT.railBlack, -w/2+0.03, railH/2, 0));
  g.add(box(0.06,railH,d-0.1, MAT.railBlack, w/2-0.03, railH/2, 0));
  // dây phơi + quần áo treo lủng lẳng, đung đưa nhẹ theo "gió" (xem updateSwingingClothes) —
  // mỗi món là 1 group xoay quanh điểm móc trên dây (pivot ở y=lineY, mesh vải treo xuống dưới),
  // để rotation.z dao động mô phỏng đúng chuyển động đung đưa thật thay vì trượt ngang.
  const lineY = 1.5;
  const clothMats = [MAT.bedSheet, MAT.cloth, MAT.chairBrown, MAT.woodLight, MAT.applianceBlack];
  let clothIdx = 0;
  for (let i=0;i<3;i++){
    const zz = -d/2+0.6+i*(d-1.2)/2;
    const x0 = -w/2+0.5, x1 = w/2-0.5;
    const pts = [new THREE.Vector3(x0,lineY,zz), new THREE.Vector3(x1,lineY,zz)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), MAT.wireBlack));

    const lineLen = x1 - x0;
    const nCloth = 3 + (i % 2); // xen kẽ 3/4 món mỗi dây, đỡ đều tăm tắp
    for (let j=0;j<nCloth;j++){
      const cx = x0 + lineLen*(j+0.5)/nCloth + (Math.random()-0.5)*0.15;
      const clothH = 0.45 + Math.random()*0.25;
      const clothW = 0.32 + Math.random()*0.1;
      const pivot = new THREE.Group();
      pivot.position.set(cx, lineY, zz);
      const cloth = box(clothW, clothH, 0.02, clothMats[clothIdx % clothMats.length], 0, -clothH/2, 0);
      pivot.add(cloth);
      g.add(pivot);
      swingingClothes.push({ pivot, phase: Math.random()*Math.PI*2, speed: 0.9+Math.random()*0.6, amp: 0.16+Math.random()*0.1 });
      clothIdx++;
    }
  }
}

function furnishTum(g, room) {
  // Phòng studio (Tum) NDC: có 1 giường ngủ đơn giản (không đầy đủ nội thất như phòng chuẩn,
  // chỉ 1 món đồ theo yêu cầu chủ nhà), không tường bao trong hàm này (tường đã dựng riêng ở
  // buildRoofAndTum). KHÔNG đặt bồn nước ở đây nữa — phòng không có mái riêng nên bất kỳ vật gì
  // đặt cao hơn TUM_H sẽ lộ "lơ lửng" giữa không trung khi nhìn từ view Sân thượng (xuyên nóc).
  const { w, d } = room;
  const bedW = 1.8, bedL = 2.0;
  const bed = new THREE.Group();
  bed.add(box(bedL, 0.4, bedW, MAT.bedFrame, 0,0.2,0));
  bed.add(box(bedL-0.12, 0.16, bedW-0.12, MAT.bedSheet, 0,0.49,0));
  bed.add(box(0.12, 0.55, bedW, MAT.bedFrame, -bedL/2+0.06,0.68,0));
  bed.position.set(-w/2+bedL/2+0.4, 0, -d/2+bedW/2+0.4);
  g.add(bed);
}

/* ============================================================
   7. DỰNG KẾT CẤU CHÍNH: SÀN, TƯỜNG NGOÀI, CẦU THANG
   ============================================================ */
function toWorldX(x){ return x; }
function toWorldZ(z){ return z - HOUSE_D/2; } // houseGroup dịch để center ở HOUSE_D/2 (khớp ground); ta sẽ set houseGroup vị trí Z=0 và dùng room.z trực tiếp thay vì dịch — đơn giản hoá bên dưới

// Mỗi tầng có 2 group riêng:
//  - slabGroups: sàn (luôn hiện khi floor <= tầng đang xem cắt lớp)
//  - wallGroups: tường bao/ban công/cửa sổ (ẩn hoàn toàn ở MỌI tầng khi đang cắt lớp bất kỳ tầng nào,
//    để nhìn xuyên được vào nội thất — giống cách dựng của trang tham khảo ecomdy-office.vercel.app)
const slabGroups = [];
const wallGroups = [];
function getSlabGroup(floor) {
  if (!slabGroups[floor]) {
    const g = new THREE.Group();
    houseGroup.add(g);
    slabGroups[floor] = g;
  }
  return slabGroups[floor];
}
function getWallGroup(floor) {
  if (!wallGroups[floor]) {
    const g = new THREE.Group();
    houseGroup.add(g);
    wallGroups[floor] = g;
  }
  return wallGroups[floor];
}

// Đơn giản hoá: đặt toàn bộ house tại Z gốc = 0 (mặt tiền), room.z đã là toạ độ tuyệt đối theo chiều sâu.
function buildFloorSlab(floor) {
  const by = floorBaseY(floor);
  const slab = box(HOUSE_W+0.2, 0.2, HOUSE_D+0.2, MAT.concrete, 0, by, HOUSE_D/2);
  getSlabGroup(floor).add(slab);
}

function buildExteriorWalls(floor) {
  const by = floorBaseY(floor);
  const wallMat = MAT.wallWhite;
  const t = 0.12;
  const shell = getWallGroup(floor);
  // 2 tường hông dài suốt 20m. Tường trái (world x âm) luôn đặc, không có cửa sổ.
  shell.add(box(t, FLOOR_H, HOUSE_D, wallMat, -HOUSE_W/2, by+FLOOR_H/2, HOUSE_D/2));
  // Tường phải (world x dương): T3 có 3 cửa sổ bếp/cầu thang thật sự KHOÉT LỖ trên tường
  // (không phải kính dựng đè lên tường đặc — nếu không thì dù kính trong suốt vẫn không nhìn
  // xuyên được vì ngay sau nó luôn là khối tường liền). Khoét đúng bằng buildSideWallWithOpenings.
  buildSideWallWithOpenings(shell, wallMat, t, by, floor);
  // tường sau (cuối nhà, z=HOUSE_D=30): KHOÉT LỖ thật cho cửa đi + cửa sổ — áp dụng cho MỌI
  // tầng thân chính kể cả Trệt (floor=0), vì Phòng ngủ Trệt giờ có layout chuẩn giống Căn A/B
  // (ban công + cửa sổ ra mặt sau Nước Mặn 6), không còn kiểu P.101 cũ của bản gốc NQA.
  buildFacadeWallWithOpenings(shell, wallMat, t, by, HOUSE_D, 1.3, -1.3);
  // mặt tiền: tầng trệt là nhà xe, KHÔNG xây tường đặc ở đây — chỉ có cổng sắt song đứng
  // (buildGate) làm ranh giới, nhìn xuyên được từ ngoài đường vào thấy xe cộ bên trong, đúng
  // ảnh thực tế công trình. Tầng có người ở (1-2): tường có khoét lỗ cửa đi + cửa sổ thật.
  let front = null;
  if (floor >= 1) {
    front = buildFacadeWallWithOpenings(shell, wallMat, t, by, 0, 1.3, -1.3);
    front.userData.isFront = true;
    front.userData.floor = floor;
  }

  // Cửa đi + cửa sổ ra ban công — CẢ HAI đều thuộc PHÒNG NGỦ (không phải bếp), đặt NHÔ RA NGOÀI
  // mặt tường (tránh z-fighting), lấp đúng vào lỗ vừa khoét ở buildFacadeWallWithOpenings.
  // Đã xác nhận thực tế: nhìn từ mặt tiền (đứng ngoài đường), cửa đi ở BÊN TRÁI, cửa sổ ở BÊN
  // PHẢI -> world x DƯƠNG hiện bên trái màn hình khi nhìn chính diện (xem ghi chú toạ độ ở
  // buildRoomWalls) nên cửa đi đặt world x DƯƠNG, cửa sổ world x ÂM. Vì mặt sau dùng chung 1
  // cặp toạ độ này, khi đứng phía sau nhìn ngược lại, trái/phải của người quan sát tự đảo theo
  // — đúng với thực tế: mặt sau cửa bên phải, cửa sổ bên trái. Không có cửa sổ bếp trên mặt
  // tiền/mặt sau — cửa sổ bếp nằm ở tường HÔNG (buildWindowsForFloor).
  // Mặt TRƯỚC (z=0): chỉ có ở tầng có người ở (floor>=1) vì Trệt là nhà xe/cổng ở mặt này.
  if (floor >= 1) {
    const doorX = 1.3, windowX = -1.3;
    const outOffset = t/2 + 0.035; // nhô ra ngoài mặt tường một khoảng an toàn
    const doorFront = buildDoor(doorX, by+0.02, -outOffset, 'x', shell);        // cửa đi ra ban công mặt tiền (Căn A)
    sideWindowMeshes.push(doorFront.userData.glassMesh);
    const bcWin1 = box(1.0, 1.1, 0.06, MAT.glassDark, windowX, by+1.7, -outOffset);
    shell.add(bcWin1); sideWindowMeshes.push(bcWin1);
  }
  // Mặt SAU (z=HOUSE_D): mọi tầng thân chính đều có (kể cả Trệt) vì phòng ngủ hướng Nước Mặn 6
  // luôn có ban công/cửa sổ, bất kể tầng đó có nhà xe ở mặt tiền hay không.
  {
    const doorX = 1.3, windowX = -1.3;
    const outOffset = t/2 + 0.035;
    const doorBack = buildDoor(doorX, by+0.02, HOUSE_D+outOffset, 'x', shell);
    sideWindowMeshes.push(doorBack.userData.glassMesh);
    const bcWin2 = box(1.0, 1.1, 0.06, MAT.glassDark, windowX, by+1.7, HOUSE_D+outOffset);
    shell.add(bcWin2); sideWindowMeshes.push(bcWin2);
  }

  return front;
}

/* ============================================================
   7a. TẦNG HẦM (floor -1) — hoàn toàn TÁCH BIỆT khỏi thân chính (Trệt/T2/T3/Tum): không dùng
   chung buildFloorSlab/buildExteriorWalls/buildStaircaseShaft (các hàm đó lặp theo index mảng
   0..N_FLOORS, không hợp với floor=-1). Hầm chỉ nằm dưới nửa sau (z=[HAM_Z0,HOUSE_D]) của nhà,
   không có cầu thang, không thông với Trệt phía trên, không có ban công.
   ============================================================ */
let hamSlabGroup = null, hamWallGroup = null;
let tumRoofEdgeMesh = null; // viền mái đen của khối Studio+Cầu thang tum — ẩn riêng ở view 'roof'
let tumMidWallEdgeMesh = null; // viền đen đỉnh vách ngăn Studio<->Cầu thang tum — LUÔN hiện (khác
                                // tumRoofEdgeMesh ở mép ngoài, vách ngăn trong này cần thấy rõ cả
                                // khi đang ở view "Sân thượng" xem trực tiếp nội thất)

function buildHamFloor() {
  hamSlabGroup = new THREE.Group();
  houseGroup.add(hamSlabGroup);
  hamWallGroup = new THREE.Group();
  houseGroup.add(hamWallGroup);

  const wallMat = MAT.wallWhite;
  const t = 0.12;
  const hamZCenter = HAM_Z0 + HAM_D/2;

  // Sàn hầm: 1 slab bê tông tại cao độ HAM_BY (âm, thấp hơn Trệt), trải đúng phạm vi z của hầm
  // (không phải toàn bộ HOUSE_D như buildFloorSlab của thân chính).
  hamSlabGroup.add(box(HOUSE_W+0.2, 0.2, HAM_D+0.2, MAT.concrete, 0, HAM_BY, hamZCenter));

  // 2 tường hông dài HAM_D, đặc hoàn toàn (không cửa sổ).
  hamWallGroup.add(box(t, HAM_H, HAM_D, wallMat, -HOUSE_W/2, HAM_BY+HAM_H/2, hamZCenter));
  hamWallGroup.add(box(t, HAM_H, HAM_D, wallMat, HOUSE_W/2, HAM_BY+HAM_H/2, hamZCenter));

  // Tường "trước" tại z=HAM_Z0: ranh giới ảo với khối đất/móng đặc phía mặt tiền NDC — vẽ đặc
  // hoàn toàn, coi như tường chắn đất, không cần cửa (đất dốc che khuất, không lộ ra ngoài).
  hamWallGroup.add(box(HOUSE_W, HAM_H, t, wallMat, 0, HAM_BY+HAM_H/2, HAM_Z0));

  // Tường "sau" tại z=HOUSE_D: mặt ngoài THẬT, giáp đường Nước Mặn 6 — khoét 1 lỗ cửa đi (DOOR_W)
  // đúng vị trí world x=1.0 để phòng ngủ Hầm (ham-ngu, noBalconyDoor:true) đi THẲNG ra ngoài,
  // không qua ban công (Hầm không có ban công). Dùng lại thuật toán "segments giữa các gap"
  // của buildFacadeWallWithOpenings (chỉ 1 lỗ cửa, không có cửa sổ, cho đơn giản/đúng trước).
  const hamDoorX = 1.0;
  buildFacadeWallWithOpenings(hamWallGroup, wallMat, t, HAM_BY, HOUSE_D, hamDoorX, null);

  const outOffset = t/2 + 0.035;
  const hamDoor = buildDoor(hamDoorX, HAM_BY+0.02, HOUSE_D+outOffset, 'x', hamWallGroup);
  sideWindowMeshes.push(hamDoor.userData.glassMesh);
}

const frontWalls = [];

function buildBalconySlab(floor, z, front) {
  // ban công nhô ra phía trước hoặc phía sau (chỉ tầng 1-3, không phải trệt)
  const by = floorBaseY(floor);
  const depth = 1.1;
  const zz = front ? -depth/2 : HOUSE_D + depth/2;
  const shell = getWallGroup(floor);
  const slab = box(HOUSE_W+0.3, 0.15, depth, MAT.concrete, 0, by-0.05, zz);
  shell.add(slab);

  // Lan can THẬT là song sắt đứng thưa (nhìn xuyên được qua khe hở), không phải tấm đặc bịt kín
  // — theo đúng ảnh thực tế công trình: chân đế bê tông thấp ~12cm, phía trên là các thanh sắt
  // dọc mảnh cách đều, trên cùng có tay vịn ngang.
  const railH = 1.0;
  const toeH = 0.12; // chân đế đặc thấp dưới cùng (bó vỉa bê tông, thường thấy ở lan can thật)
  const barGap = 0.14; // khoảng cách tâm giữa 2 song sắt liền kề
  const barT = 0.025;  // bề dày mỗi song sắt
  const edgeZ = front ? -depth : HOUSE_D+depth;

  function railSpan(lengthAxis, fixedPos, length) {
    // chân đế đặc thấp
    if (lengthAxis === 'x') {
      shell.add(box(length, toeH, 0.06, MAT.concrete, fixedPos.x, by+toeH/2, fixedPos.z));
    } else {
      shell.add(box(0.06, toeH, length, MAT.concrete, fixedPos.x, by+toeH/2, fixedPos.z));
    }
    // tay vịn ngang trên cùng
    if (lengthAxis === 'x') {
      shell.add(box(length, 0.05, 0.06, MAT.railBlack, fixedPos.x, by+railH, fixedPos.z));
    } else {
      shell.add(box(0.06, 0.05, length, MAT.railBlack, fixedPos.x, by+railH, fixedPos.z));
    }
    // các song sắt đứng, cách đều, từ trên chân đế tới dưới tay vịn
    const barH = railH - toeH - 0.05;
    const n = Math.max(2, Math.round(length / barGap));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const off = (t - 0.5) * length;
      const x = lengthAxis === 'x' ? fixedPos.x + off : fixedPos.x;
      const zPos = lengthAxis === 'z' ? fixedPos.z + off : fixedPos.z;
      shell.add(box(barT, barH, barT, MAT.railBlack, x, by+toeH+barH/2, zPos));
    }
  }

  railSpan('x', {x:0, z:edgeZ}, HOUSE_W+0.3);
  railSpan('z', {x:-HOUSE_W/2-0.12, z:zz}, depth);
  railSpan('z', {x:HOUSE_W/2+0.12, z:zz}, depth);

  // Máy giặt — đặt chính giữa chiều sâu ban công thật (nhô ra ngoài), mặt lồng giặt quay ra
  // mép ngoài cùng để nhìn thấy rõ từ phía lan can ngoài trời.
  const washerGroup = new THREE.Group();
  washerGroup.position.set(0, by, zz);
  shell.add(washerGroup);
  furnishWasher(washerGroup, HOUSE_W, depth, !front, 0);
}

function buildStaircaseShaft() {
  // Cầu thang chữ U (đúng thực tế công trình): 2 vế thang song song chạy dọc theo 2 cạnh
  // ngang (trục X) của khoang thang, nối nhau bằng 1 chiếu nghỉ ở giữa chiều cao tầng, xoay
  // 180° giữa vế lên và vế xuống. Vế 1 (x âm) đi từ sàn tầng dưới lên chiếu nghỉ theo chiều Z
  // tăng dần; chiếu nghỉ nằm sát cạnh z=STAIR_Y1; vế 2 (x dương) đi từ chiếu nghỉ lên sàn tầng
  // trên theo chiều Z giảm dần — nhìn từ trên xuống là 1 khoang chữ U có giếng trời hở ở giữa.
  // Mỗi đoạn (vế 1 + chiếu nghỉ + vế 2) XUẤT PHÁT từ tầng floor nên gắn vào slabGroup(floor).
  const flightZ0 = STAIR_Y0 + 0.3;      // vế thang lùi vào 0.3m tính từ tường ngoài khoang, tránh sát tường
  const flightZ1 = STAIR_Y1 - 0.3;
  const flightLen = flightZ1 - flightZ0; // chiều dài mỗi vế theo Z
  const landingD = 1.1;                  // chiều sâu chiếu nghỉ (theo Z)
  const runLen = flightLen - landingD;   // đoạn có bậc thực sự trên mỗi vế (phần còn lại là chiếu nghỉ)
  const flightW = 1.2;                   // bề rộng mỗi vế thang
  const gapX = 0.3;                      // khe hở giếng trời ở giữa 2 vế theo X
  const xLeft = -flightW/2 - gapX/2;     // tâm vế trái (x âm)
  const xRight = flightW/2 + gapX/2;     // tâm vế phải (x dương)
  const nSteps = 10;                     // số bậc mỗi vế (nửa chiều cao tầng mỗi vế)
  const stepH = (FLOOR_H/2) / nSteps;
  const stepD = runLen / nSteps;

  for (let floor=0; floor<N_FLOORS; floor++) {
    const by = floorBaseY(floor);
    const midY = by + FLOOR_H/2; // cao độ chiếu nghỉ (giữa 2 tầng)
    const targetGroup = getSlabGroup(floor);

    // Vế 1: từ sàn tầng floor (by, z=flightZ0) đi lên chiếu nghỉ (midY, z=flightZ0+runLen),
    // chạy dọc x=xLeft, mặt bậc hướng ra giếng trời (x dương). Vế 1 chỉ chiếm đoạn Z
    // [flightZ0, flightZ0+runLen] — phần còn lại [flightZ0+runLen, flightZ1] là chiếu nghỉ.
    for (let i=0;i<nSteps;i++){
      const stepY = by + (i+1)*stepH;
      const stepZ0 = flightZ0 + i*stepD;
      targetGroup.add(box(flightW, 0.18, stepD+0.02, MAT.floorDark, xLeft, stepY, stepZ0+stepD/2));
    }
    // Chiếu nghỉ: bản sàn phẳng ở cao độ midY, nối 2 vế, trải hết bề ngang khoang thang, nằm ở
    // đầu xa (phía flightZ1) — đúng phần Z mà cả 2 vế đều KHÔNG chiếm.
    const landingCenterZ = flightZ1 - landingD/2;
    targetGroup.add(box(HOUSE_W-0.2, 0.18, landingD, MAT.floorDark, 0, midY, landingCenterZ));
    // Vế 2: từ chiếu nghỉ (midY) đi lên sàn tầng floor+1 (by+FLOOR_H), chạy dọc x=xRight, ĐỐI
    // XỨNG vế 1 qua trục X — chiếm CÙNG đoạn Z [flightZ0, flightZ0+runLen] như vế 1 (không phải
    // đoạn Z của chiếu nghỉ), nhưng đi ngược chiều: cao dần khi Z giảm về flightZ0.
    for (let i=0;i<nSteps;i++){
      const stepY = midY + (i+1)*stepH;
      const stepZ0 = flightZ0 + runLen - i*stepD;
      targetGroup.add(box(flightW, 0.18, stepD+0.02, MAT.floorDark, xRight, stepY, stepZ0-stepD/2));
    }

    // Lan can + tay vịn gỗ dọc theo mép giếng trời (cạnh trong) của mỗi vế + chiếu nghỉ, cùng
    // độ cao 0.9m so với mặt bậc tại từng điểm — dùng 1 đường cong nối liền cả 3 đoạn: vế 1 đi
    // lên tới đầu chiếu nghỉ gần (flightZ0+runLen), vòng qua chiếu nghỉ tới đầu xa (flightZ1),
    // rồi vế 2 đi ngược lại từ flightZ1 (điểm đối xứng) về flightZ0+runLen khi lên tới tầng trên.
    const railPts = [];
    for (let i=0;i<=nSteps;i++) railPts.push(new THREE.Vector3(xLeft+flightW/2, by+i*stepH+0.9, flightZ0+i*stepD));
    railPts.push(new THREE.Vector3(xRight-flightW/2, midY+0.9, flightZ0+runLen));
    for (let i=0;i<=nSteps;i++) railPts.push(new THREE.Vector3(xRight-flightW/2, midY+i*stepH+0.9, flightZ0+runLen-i*stepD));
    const curve = new THREE.CatmullRomCurve3(railPts);
    const railGeo = new THREE.TubeGeometry(curve, 40, 0.035, 6, false);
    targetGroup.add(new THREE.Mesh(railGeo, MAT.woodDark));

    // Song sắt đứng dưới tay vịn (mật độ vừa phải), theo cả 2 vế.
    for (let i=0;i<=nSteps;i+=2) {
      const y1 = by+i*stepH, z1 = flightZ0+i*stepD;
      targetGroup.add(box(0.03, y1-by+0.75, 0.03, MAT.railBlack, xLeft+flightW/2, by+(y1-by)/2, z1));
      const y2 = midY+i*stepH, z2 = flightZ0+runLen-i*stepD;
      targetGroup.add(box(0.03, y2-midY+0.75, 0.03, MAT.railBlack, xRight-flightW/2, midY+(y2-midY)/2, z2));
    }

    // đèn hắt chiếu nghỉ
    const lightBulb = new THREE.Mesh(new THREE.SphereGeometry(0.06,8,8), MAT.windowLit);
    lightBulb.position.set(0, midY+1.6, landingCenterZ);
    lightBulb.visible = false;
    nightLights.add(lightBulb);
    const pl = new THREE.PointLight(0xffcf8a, 0, 4);
    pl.position.copy(lightBulb.position);
    nightLights.add(pl);
    lightBulb.userData.pointLight = pl;
  }
}

function buildGate() {
  // cổng sắt 2 cánh ở mặt tiền, z=0 — mỗi cánh phủ gần hết nửa HOUSE_W để 2 cánh cộng lại che
  // kín gần trọn chiều rộng mặt tiền (giống ảnh thực tế công trình), không để hở lộ cầu thang
  // phía sau qua khoảng trống giữa 2 cánh.
  const gateH = 2.2;
  const leafW = HOUSE_W/2 - 0.1; // mỗi cánh, trừ khe hở nhỏ ở giữa
  const barGap = 0.16;
  const nBars = Math.round(leafW / barGap);
  const g = new THREE.Group();
  for (let side of [-1,1]) {
    const leaf = new THREE.Group();
    for (let i=0;i<=nBars;i++){
      leaf.add(box(0.04, gateH, 0.04, MAT.railBlack, i*(leafW/nBars), gateH/2, 0));
    }
    leaf.add(box(leafW, 0.05, 0.04, MAT.railBlack, leafW/2, gateH-0.1, 0));
    leaf.position.set(side>0 ? 0.05 : -0.05-leafW, 0, -0.02);
    g.add(leaf);
  }
  g.position.set(0,0,-0.15);
  envGroup.add(g);

  // trụ cổng đá
  houseGroup.add(box(0.25, gateH+0.3, 0.25, MAT.concreteDark, -HOUSE_W/2-0.15, (gateH+0.3)/2, -0.1));
  houseGroup.add(box(0.25, gateH+0.3, 0.25, MAT.concreteDark, HOUSE_W/2+0.15, (gateH+0.3)/2, -0.1));

  // biển tên
  const signCanvasMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  houseGroup.add(box(1.4,0.4,0.05, signCanvasMat, 0, 2.6, -0.05));
}

function buildRoofAndTum() {
  const topY = floorBaseY(N_FLOORS);
  const slabG = getSlabGroup(N_FLOORS); // floor index N_FLOORS(=3) = sân thượng/tum
  const wallG = getWallGroup(N_FLOORS);
  // mái sân thượng (sàn) — 1 khối phẳng chung cho toàn bộ tầng (đúng cao độ thật)
  slabG.add(box(HOUSE_W+0.2, 0.15, HOUSE_D+0.2, MAT.concrete, 0, topY, HOUSE_D/2));

  // Ranh giới khối "có mái" (Phòng studio + Cầu thang tum) tách biệt khỏi 2 sân thượng lộ thiên
  // — lấy trực tiếp từ dữ liệu ROOMS để không lặp lại phép tính z thủ công (nguồn lỗi nếu đổi
  // kích thước sau này). Khối này cần tường ĐẶC bao quanh, khác lan can hở của sân thượng. WC
  // KHÔNG thuộc khối này nữa — nó đứng độc lập ngoài trời trên Sân thượng sau (roof-back), tự
  // dựng 4 tường riêng trong buildRooms (room.kind==='wc' && room.floor===3).
  const tumRoom = ROOMS.find(r => r.id === 'tum');
  const tumStairRoom = ROOMS.find(r => r.id === 'tum-stair');
  const coveredZ0 = tumRoom.z - tumRoom.d/2;         // đầu khối có mái (giáp roof-front, phía studio)
  const coveredZ1 = tumStairRoom.z + tumStairRoom.d/2; // cuối khối có mái (giáp roof-back, phía cầu thang)
  const t = 0.12;

  // Lan can hở cho Sân thượng trước (z=[0,coveredZ0]) và Sân thượng sau (z=[coveredZ1,HOUSE_D])
  // — mép ngoài (trước/sau/2 hông) mỗi đoạn, không nối liền qua khối có mái ở giữa.
  const railH = 0.95;
  function railDeck(z0, z1) {
    const dLen = z1 - z0, zc = (z0+z1)/2;
    if (dLen < 0.05) return;
    wallG.add(box(HOUSE_W+0.2, railH, 0.06, MAT.railBlack, 0, topY+railH/2, z0));
    wallG.add(box(HOUSE_W+0.2, railH, 0.06, MAT.railBlack, 0, topY+railH/2, z1));
    wallG.add(box(0.06, railH, dLen, MAT.railBlack, -HOUSE_W/2, topY+railH/2, zc));
    wallG.add(box(0.06, railH, dLen, MAT.railBlack, HOUSE_W/2, topY+railH/2, zc));
  }
  railDeck(0, coveredZ0);
  railDeck(coveredZ1, HOUSE_D);

  // Tường ĐẶC bao quanh khối có mái (WC + cầu thang tum + studio) — 2 tường hông dài suốt khối,
  // 2 tường đầu/cuối (giáp sân thượng trước/sau) có cửa đi thật để bước từ sân thượng vào trong.
  // Dùng wallGray (không phải wallWhite) — tường trắng trên nền sàn/mái trắng gần như vô hình
  // khi nhìn top-down (view "Sân thượng"/"Toàn cảnh" từ trên), xám tạo tương phản tự nhiên mà
  // không cần thêm viền đen riêng ở mọi mặt tường.
  const tumWallMat = MAT.wallGray;
  const coveredLen = coveredZ1 - coveredZ0, coveredZc = (coveredZ0+coveredZ1)/2;
  wallG.add(box(t, TUM_H, coveredLen, tumWallMat, -HOUSE_W/2, topY+TUM_H/2, coveredZc));
  wallG.add(box(t, TUM_H, coveredLen, tumWallMat, HOUSE_W/2, topY+TUM_H/2, coveredZc));
  // Mọi cửa đi trong khối Tum đều lệch sang TRÁI (theo hướng nhìn từ NDC vào nhà) theo yêu cầu
  // chủ nhà, thay vì ở giữa (x=0). Theo quy ước toạ độ đã xác nhận ở buildExteriorWalls: world x
  // DƯƠNG hiện ra bên TRÁI màn hình khi đứng ngoài đường nhìn vào mặt tiền — nên "lệch trái"
  // nghĩa là world x DƯƠNG (+1.3), không phải âm.
  const doorOffsetX = 1.3;
  const frontDoorGap = { center: doorOffsetX, width: DOOR_W + 0.06 };
  buildFacadeStrip(wallG, tumWallMat, t, topY, coveredZ0, TUM_H, [frontDoorGap]);
  buildFacadeStrip(wallG, tumWallMat, t, topY, coveredZ1, TUM_H, [frontDoorGap]);
  buildDoor(doorOffsetX, topY+0.02, coveredZ0-(t/2+0.035), 'x', wallG);
  buildDoor(doorOffsetX, topY+0.02, coveredZ1+(t/2+0.035), 'x', wallG);
  // Vách tường THẬT ngăn giữa Phòng studio và Cầu thang tum (ranh giới trong khối có mái) — có
  // 1 cửa đi 1 cánh để di chuyển giữa 2 khu, giống mọi ranh giới phòng khác trong nhà. Vị trí
  // đúng bằng mép Studio giáp Cầu thang (z = tumRoom.z + tumRoom.d/2).
  const midZ = tumRoom.z + tumRoom.d/2;
  buildFacadeStrip(wallG, tumWallMat, t, topY, midZ, TUM_H, [frontDoorGap]);
  buildDoor(doorOffsetX, topY+0.02, midZ, 'x', wallG);
  // Viền đen mỏng trên đỉnh vách ngăn này (cùng lý do với tumRoofEdgeMesh: tường xám/trắng gần
  // như vô hình khi nhìn top-down) — cũng ẩn ở view "Sân thượng" để không chắn tầm nhìn nội thất.
  tumMidWallEdgeMesh = box(HOUSE_W+0.05, 0.08, t+0.06, MAT.frameBlack, 0, topY+TUM_H+0.04, midZ);
  wallG.add(tumMidWallEdgeMesh);
  // Viền mép mái đen mỏng chạy suốt đỉnh 4 mặt tường — tường trắng trên nền sàn trắng gần như
  // vô hình khi nhìn top-down từ xa (overview/toàn cảnh), viền tối này tạo đường phân giới rõ
  // giống cách các mép ban công/lan can khác trong nhà luôn có viền đen để dễ nhận diện từ trên.
  // Lưu riêng vào biến toàn cục (không phải push thẳng vào wallG như các mesh khác) để applyView
  // có thể ẩn riêng viền này khi đang ở đúng view "Sân thượng" — lúc đó khách xem trực tiếp nội
  // thất Studio/Cầu thang tum, viền mái sẽ che khuất/gây rối tầm nhìn từ trên xuống.
  const edgeH = 0.08;
  tumRoofEdgeMesh = box(HOUSE_W+0.15, edgeH, coveredLen+0.15, MAT.frameBlack, 0, topY+TUM_H+edgeH/2, coveredZc);
  wallG.add(tumRoofEdgeMesh);
  // KHÔNG dựng mái/trần riêng cho khối này — giống mọi phòng khác trong nhà (bedroom/kitchen/wc
  // ở các tầng dưới cũng chỉ có 4 tường, không có trần riêng), để camera nhìn thẳng từ trên
  // xuống xuyên vào thấy nội thất WC/cầu thang/studio khi ở view "Sân thượng", đúng cách các
  // view floorN khác cho nhìn xuyên nóc vào nội thất tầng đang xem.
}

// Dựng 1 dải tường đặc theo trục X (mặt cắt ngang nhà) tại vị trí z cố định, cao caoH, có thể
// khoét lỗ cửa theo danh sách gaps ({center, width} theo world x) — dùng thuật toán "segments
// giữa các gap" giống buildFacadeWallWithOpenings nhưng đơn giản hoá (không cửa sổ, 1 dải chiều
// cao duy nhất) vì khối Tum chỉ cần 1 cửa đi, không có cửa sổ trên các mặt này.
function buildFacadeStrip(group, mat, t, by, z, caoH, gaps) {
  const xSpan = HOUSE_W;
  const segs = [];
  let cursor = -xSpan/2;
  const sorted = gaps.slice().sort((a,b)=>a.center-b.center);
  for (const gap of sorted) {
    const gapStart = gap.center - gap.width/2;
    if (gapStart > cursor) segs.push([cursor, gapStart]);
    cursor = Math.max(cursor, gap.center + gap.width/2);
  }
  if (cursor < xSpan/2) segs.push([cursor, xSpan/2]);
  for (const [x0, x1] of segs) {
    const w = x1 - x0;
    if (w < 0.03) continue;
    group.add(box(w, caoH, t, mat, (x0+x1)/2, by+caoH/2, z));
  }
  // lanh tô phía trên cửa (không cần vì DOOR_H ở đây dùng chung caoH cho khối thấp — Tum chỉ cao
  // TUM_H=2.6, cửa DOOR_H=2.1 < TUM_H nên vẫn cần khoá phần trên cửa để không hở tới mái)
  if (DOOR_H < caoH) {
    for (const gap of sorted) {
      const w = gap.width;
      group.add(box(w, caoH-DOOR_H, t, mat, gap.center, by+DOOR_H+(caoH-DOOR_H)/2, z));
    }
  }
}

const sideWindowMeshes = []; // đổi màu sáng ấm khi bật ban đêm
function buildWindowsForFloor(floor) {
  if (floor === 0) return; // trệt có cổng, không cần cửa sổ mặt tiền
  if (floor === 1) return; // Tầng 2 không có cửa sổ bếp (theo blueprint đã chốt)
  const by = floorBaseY(floor);
  const shell = getWallGroup(floor);
  // Cửa sổ hông (chỉ T3, floor=2 — T2 return sớm ở trên): trên TƯỜNG HÔNG world x dương (hiện
  // ra bên TRÁI màn hình khi nhìn chính diện từ đường vào — xem ghi chú toạ độ ở
  // buildExteriorWalls). Mỗi tầng 3 cửa: bếp Căn A, bếp Căn B, và khoang cầu thang giữa 2 căn.
  const { nguD, bepD } = UNIT_LAYOUT;
  const zBepA = nguD + bepD/2;          // tâm bếp Căn A
  const zBepB = HOUSE_D - (nguD + bepD/2); // tâm bếp Căn B
  const zStair = (STAIR_Y0 + STAIR_Y1) / 2;   // tâm khoang cầu thang
  const wallT = 0.12;
  const winOut = wallT/2 + 0.035;
  const winMeshA = box(0.06, 1.0, 1.4, MAT.glassDark, HOUSE_W/2+winOut, by+1.7, zBepA);
  shell.add(winMeshA); sideWindowMeshes.push(winMeshA);
  const winMeshB = box(0.06, 1.0, 1.4, MAT.glassDark, HOUSE_W/2+winOut, by+1.7, zBepB);
  shell.add(winMeshB); sideWindowMeshes.push(winMeshB);
  const winMeshStair = box(0.06, 1.0, 1.4, MAT.glassDark, HOUSE_W/2+winOut, by+1.7, zStair);
  shell.add(winMeshStair); sideWindowMeshes.push(winMeshStair);
}

/* ============================================================
   7b. CỬA: cầu thang↔phòng, ngủ↔ban công, tum↔sân thượng (2.1m x 0.9m)
   ============================================================ */
function buildAllDoors() {
  // Cửa đặt trong slabGroup (không phải wallGroup) của TỪNG tầng: slabGroup luôn hiện khi
  // floor <= tầng đang cắt lớp xem, nên cửa vẫn thấy được để biết lối đi giữa các phòng,
  // trong khi tường bao (wallGroup) vẫn ẩn hoàn toàn để nhìn xuyên vào nội thất.

  // --- Tầng trệt: 1 cửa từ khoang cầu thang vào Bếp (P.101), bên PHẢI toà nhà (world x dương) ---
  {
    const slabG = getSlabGroup(0);
    buildDoor(1.4, floorBaseY(0)+0.1, STAIR_Y1, 'x', slabG);
  }

  // --- Tầng 2/3: mỗi tầng 2 cửa cầu thang->bếp (Căn A tại z=STAIR_Y0, Căn B tại z=STAIR_Y1) ---
  // Cửa cầu thang<->bếp LUÔN nằm bên PHẢI toà nhà (world x dương, đối diện phía WC ở bên trái).
  // Chỉ 2 tầng ở thật (T2,T3) ngoài Trệt — không còn "tầng 4" như bản gốc NQA (N_FLOORS=3).
  for (let floor = 1; floor <= 2; floor++) {
    const slabG = getSlabGroup(floor);
    const by = floorBaseY(floor);
    const bepDoorX = 1.4;

    // cửa cầu thang -> bếp, mỗi căn
    buildDoor(bepDoorX, by+0.1, STAIR_Y0, 'x', slabG);
    buildDoor(bepDoorX, by+0.1, STAIR_Y1, 'x', slabG);
  }

  // --- Tum: bố cục NDC theo thứ tự z tăng dần là roof-front -> tum-wc -> tum-stair -> tum
  // (studio) -> roof-back (khác hẳn roof-front/tum/roof-back của bản gốc NQA). Phòng "tum"
  // (studio) hoàn toàn trống, không có tường bao (xem furnishTum) -> KHÔNG có cửa giữa
  // tum-stair|tum và tum|roof-back: không có tường thật ở các ranh giới đó nên một khung cửa lơ
  // lửng không tường xung quanh sẽ vô nghĩa/trông lạ — để mở hoàn toàn, đi thẳng từ khu cầu
  // thang vào studio rồi ra sân thượng sau. Cửa duy nhất của khu Tum (tum-wc mở trái vào khu
  // cầu thang) đã được dựng riêng trong buildRooms (nhánh room.kind==='wc' && room.floor===3)
  // vì nó gắn liền với khung 4 tường của chính WC — không cần lặp lại ở đây.
}

/* ============================================================
   7c. TƯỜNG NGĂN GIỮA CÁC PHÒNG — ẩn động theo hướng camera đang nhìn
   Mỗi tường lưu userData.normal (hướng pháp tuyến ra ngoài phòng, trong mặt phẳng XZ).
   Mỗi frame: nếu tường đang "quay mặt" về phía camera (dot(normal, dirToCamera) > 0)
   thì đó là tường ở gần camera, đang che view -> ẩn nó đi để nhìn xuyên vào phòng.
   ============================================================ */
const cameraFacingWalls = []; // { mesh, room, normal: THREE.Vector3 }

// Quần áo phơi trên sân thượng: mỗi item { pivot, phase, speed, amp } — pivot dao động theo 2
// trục lệch tần số (Z: lắc chính theo hướng gió, X: đung đưa phụ nhẹ hơn) để trông như vải phất
// phơ trong gió thay vì chỉ nghiêng đều 1 trục (xem furnishRoofdeck, updateSwingingClothes).
const swingingClothes = [];
function updateSwingingClothes(t) {
  for (const c of swingingClothes) {
    c.pivot.rotation.z = Math.sin(t*c.speed + c.phase) * c.amp;
    c.pivot.rotation.x = Math.sin(t*c.speed*1.7 + c.phase*1.3) * c.amp*0.35;
  }
}

function addFacingWall(g, room, normal, mesh) {
  mesh.userData.roomWorldGetter = () => { const v = new THREE.Vector3(); g.getWorldPosition(v); return v; };
  cameraFacingWalls.push({ mesh, normal: normal.clone() });
}

// Dựng tường ngăn (đầy đủ chiều cao FLOOR_H) quanh 1 phòng hình chữ nhật (room.w x room.d),
// có khoét lỗ cửa tại các vị trí đã biết (doorGapsZ: mảng {z, w} theo trục mà tường đó nằm ngang).
function buildRoomWalls(g, room, opts) {
  const { w, d } = room;
  // wallH: chiều cao tường tuỳ chọn — mặc định FLOOR_H-0.05 (chiều cao tầng chuẩn), nhưng phòng
  // nằm trong khối thấp hơn (vd. WC Tum, cao TUM_H=2.6m thay vì FLOOR_H=3.1m) cần truyền riêng
  // để tường không nhô cao hơn khối xung quanh.
  const H = (opts && opts.wallH) || (FLOOR_H - 0.05);
  const wallT = 0.12; // tăng độ dày để tường ngăn vẫn dễ nhận diện ở góc nhìn gần thẳng đứng (top-down)
  const doorGapsFront = (opts && opts.doorGapsFront) || []; // lỗ cửa trên tường z=-d/2 (phía mặt tiền/trước)
  const doorGapsBack = (opts && opts.doorGapsBack) || [];   // lỗ cửa trên tường z=+d/2 (phía sau/cầu thang)
  const doorGapsLeft = (opts && opts.doorGapsLeft) || [];   // lỗ cửa trên tường x=-w/2
  const doorGapsRight = (opts && opts.doorGapsRight) || []; // lỗ cửa trên tường x=+w/2
  const skipFront = (opts && opts.skipFront) || false; // bỏ hẳn tường này (giáp mặt ngoài nhà, đã có wallGroup lo)
  const skipBack = (opts && opts.skipBack) || false;
  const skipLeft = (opts && opts.skipLeft) || false;
  const skipRight = (opts && opts.skipRight) || false;
  // alwaysVisible: tường LUÔN hiện, không đăng ký vào cơ chế ẩn-theo-camera — dùng cho các
  // phòng nhỏ lồng bên trong phòng khác (vd. WC trong góc Bếp) để ranh giới phòng luôn rõ
  // ràng, tránh nhìn nhầm là nội thất rời rạc thay vì 1 phòng có tường bao kín.
  const alwaysVisible = (opts && opts.alwaysVisible) || false;
  const wallMat = (opts && opts.wallMat) || MAT.wallWhite;

  function wallWithGaps(lengthAxis, fixedPos, gaps, normal) {
    // lengthAxis: tổng chiều dài tường (w cho tường trước/sau, d cho tường trái/phải)
    // fixedPos: {axis:'z'|'x', value} vị trí cố định của tường
    // gaps: [{center, width}] theo toạ độ cục bộ dọc lengthAxis (tính từ -lengthAxis/2)
    const segs = [];
    let cursor = -lengthAxis/2;
    const sorted = gaps.slice().sort((a,b)=>a.center-b.center);
    for (const gap of sorted) {
      const gapStart = gap.center - gap.width/2;
      if (gapStart > cursor) segs.push([cursor, gapStart]);
      cursor = Math.max(cursor, gap.center + gap.width/2);
    }
    if (cursor < lengthAxis/2) segs.push([cursor, lengthAxis/2]);

    function addSlab(s0, s1, y0, y1) {
      const segLen = s1 - s0;
      const segH = y1 - y0;
      if (segLen < 0.05 || segH < 0.05) return;
      const mid = (s0+s1)/2;
      let mesh;
      if (fixedPos.axis === 'z') {
        mesh = box(segLen, segH, wallT, wallMat, mid, (y0+y1)/2, fixedPos.value);
      } else {
        mesh = box(wallT, segH, segLen, wallMat, fixedPos.value, (y0+y1)/2, mid);
      }
      g.add(mesh);
      if (!alwaysVisible) addFacingWall(g, room, normal, mesh);
    }

    for (const [s0, s1] of segs) addSlab(s0, s1, 0, H);
    // Lanh tô cửa: phần tường phía TRÊN khung cửa (từ DOOR_H tới trần H) vẫn phải đặc, kể cả
    // ngay tại lỗ cửa — nếu không, khung cửa (cao DOOR_H) để hở một khoảng trống tới tận trần,
    // trông như tường bị thiếu một góc phía trên cửa thay vì một cửa đi bình thường.
    if (DOOR_H < H) {
      for (const gap of sorted) {
        addSlab(gap.center - gap.width/2, gap.center + gap.width/2, DOOR_H, H);
      }
    }
  }

  if (!skipFront) wallWithGaps(w, {axis:'z', value:-d/2}, doorGapsFront, new THREE.Vector3(0,0,-1));
  if (!skipBack)  wallWithGaps(w, {axis:'z', value: d/2}, doorGapsBack,  new THREE.Vector3(0,0, 1));
  if (!skipLeft)  wallWithGaps(d, {axis:'x', value:-w/2}, doorGapsLeft,  new THREE.Vector3(-1,0,0));
  if (!skipRight) wallWithGaps(d, {axis:'x', value: w/2}, doorGapsRight, new THREE.Vector3(1,0,0));
}

function updateCameraFacingWalls() {
  // Tường ngăn phòng LUÔN hiện đầy đủ (không còn tự ẩn theo hướng camera) — nhà hiển thị như
  // thật, có tường đặc; khách xem nội thất qua cửa ra vào/cửa sổ hoặc khi xoay đúng góc.
  for (const { mesh } of cameraFacingWalls) {
    mesh.visible = true;
  }
}

/* ============================================================
   8. DỰNG TOÀN BỘ TOÀ NHÀ TỪ DỮ LIỆU ROOMS
   ============================================================ */
const roomMeshes = {}; // id -> group (để raycast / label)
// theo floor index -1..3 (Hầm,Trệt,T2,T3,Tum) nhưng mảng JS không nhận index âm bình thường
// -> lưu qua hàm floorGroupIndex() offset +1 (floor -1 -> 0, floor 0 -> 1, ..., floor 3 -> 4).
// MỌI nơi đọc/ghi floorRoomGroups PHẢI đi qua floorGroupIndex() để nhất quán.
function floorGroupIndex(floor) { return floor + 1; }
const floorRoomGroups = [[],[],[],[],[]]; // index = floorGroupIndex(floor), floor -1..3

function buildRooms() {
  for (const room of ROOMS) {
    const g = new THREE.Group();
    g.position.set(room.x, room.y, room.z);
    houseGroup.add(g);
    roomMeshes[room.id] = g;
    floorRoomGroups[floorGroupIndex(room.floor)].push(g);

    // sàn phòng riêng (tuỳ loại). Khoang cầu thang (kind='stair') KHÔNG vẽ sàn đặc — bản chất
    // giếng thang phải thông suốt từ trệt lên mái (nhìn xuyên được các tầng qua giếng trời giữa
    // 2 vế thang); mặt "sàn" duy nhất ở đó là các bậc thang + chiếu nghỉ thật đã dựng riêng ở
    // buildStaircaseShaft. Một lớp sàn phủ kín toàn khoang (như trước đây) sẽ chặn mất khoảng
    // thông tầng, sai bản chất kiến trúc cầu thang thật.
    let floorMat = MAT.floorTile;
    if (room.kind === 'bedroom') floorMat = MAT.floorWood;
    if (room.kind === 'wc') floorMat = MAT.wcFloor;
    if (room.kind === 'garage' || room.kind === 'balcony') floorMat = MAT.concrete;
    if (room.kind !== 'roofdeck' && room.kind !== 'tum' && room.kind !== 'stair') {
      if (room.kind === 'kitchen' && room.wcCutout) {
        // Bếp có WC lồng ở góc (x dương, cornerZ chỉ phía z của góc đó): KHÔNG vẽ sàn Bếp
        // tràn xuống dưới chân WC (tránh 2 lớp sàn chồng nhau / lẫn màu) — chỉ vẽ 2 dải sàn
        // còn lại sau khi trừ đi ô vuông WC.
        const { wcSize, cornerZ } = room.wcCutout;
        const wcEdgeZ = cornerZ * (room.d/2 - wcSize); // biên trong (xa góc) của ô WC theo z
        const wcCenterZLocal = cornerZ * (room.d/2 - wcSize/2);
        // Dải 1: toàn bộ chiều rộng x, phần z còn lại (phía đối diện góc WC)
        const stripD = room.d - wcSize;
        if (stripD > 0.02) {
          const stripCenterZ = wcEdgeZ - cornerZ*stripD/2;
          const fl1 = box(room.w-0.04, 0.03, stripD-0.02, floorMat, 0, 0.02, stripCenterZ);
          fl1.receiveShadow = true;
          g.add(fl1);
        }
        // Dải 2: phần x còn lại (trừ bề ngang WC, luôn ở góc x ÂM theo ROOMS data) tại dải z
        // ngang hàng với WC — biên trái là mép phải của ô WC (-w/2+wcSize), biên phải là mép
        // phải phòng (w/2), nên tâm đúng là +wcSize/2 (trước đây bị đặt sai dấu -wcSize/2,
        // khiến dải này chồng ngược lên đúng vị trí WC thay vì phần sàn Bếp còn lại).
        const stripW = room.w - wcSize;
        if (stripW > 0.02) {
          const fl2 = box(stripW-0.02, 0.03, wcSize-0.04, floorMat, wcSize/2, 0.02, wcCenterZLocal);
          fl2.receiveShadow = true;
          g.add(fl2);
        }
      } else {
        const fl = box(room.w-0.04, 0.03, room.d-0.04, floorMat, 0, 0.02, 0);
        fl.receiveShadow = true;
        g.add(fl);
      }
    }

    switch (room.kind) {
      case 'bedroom': furnishBedroom(g, room); break;
      case 'kitchen': furnishKitchen(g, room, room.hasWindow); break;
      case 'wc': furnishWC(g, room); break;
      case 'balcony': furnishBalcony(g, room); break;
      case 'garage': furnishGarage(g, room); break;
      case 'roofdeck': furnishRoofdeck(g, room); break;
      case 'tum': furnishTum(g, room); break;
      case 'stair': break; // đã dựng riêng ở buildStaircaseShaft
    }

    // Tường ngăn phòng (đầy đủ chiều cao, có lỗ cửa) — ẩn động theo hướng camera để
    // khách thuê vẫn thấy rõ ranh giới phòng riêng biệt (không phải kiểu studio mở),
    // trong khi vẫn nhìn được nội thất bên trong.
    // "Front" = mặt z nhỏ hơn room.z, "Back" = mặt z lớn hơn (KHÔNG cố định theo Căn A/B,
    // vì Căn B bố trí ngược chiều z so với Căn A).
    // QUAN TRỌNG: vị trí lỗ cửa ở đây PHẢI khớp với vị trí cửa đi/cửa sổ thật đã dựng trên
    // tường mặt tiền/mặt sau (buildExteriorWalls: doorX=1.3, windowX=-1.3) và cửa cầu thang<->bếp
    // (buildAllDoors: bepDoorX=1.4). Ngủ<->Ban công có 2 lỗ (cửa đi world x=1.3 VÀ cửa sổ world x=-1.3).
    if (room.kind === 'bedroom') {
      // NDC dùng CỬA 1 CÁNH thường (buildDoor) ở MỌI ranh giới trong nhà của phòng ngủ — không
      // còn cửa lùa kính nào (buildSlidingGlassWall không còn được gọi ở NDC). Ranh giới Ngủ<->
      // Bếp: tường đặc, khoét 1 lỗ DOOR_W lệch về phía KHÔNG có WC (WC luôn ở góc x âm của Bếp,
      // nên đặt cửa ở world x dương, x=1.0, đồng bộ với cửa Ngủ<->Ban công tầng trệt/hầm) rồi
      // lấp khung cửa 1 cánh. Ranh giới Ngủ<->mặt ngoài (ban công/tường ngoài thật) KHÔNG vẽ gì
      // ở đây — buildExteriorWalls (floor>=1) hoặc buildHamFloor (floor=-1) đã tự khoét cửa/cửa
      // sổ trên chính tường ngoài rồi, vẽ thêm ở đây sẽ chồng 2 lớp tường.
      const { w, d } = room;
      // Tìm phòng Bếp liền kề (cùng tầng, cùng "unit", cách room theo z trong phạm vi UNIT_D)
      // để xác định Bếp nằm ở phía Front (z nhỏ hơn room.z) hay Back (z lớn hơn).
      const bepRoom = ROOMS.find(r => r.floor === room.floor && r.kind === 'kitchen' &&
        Math.abs(r.z - room.z) < UNIT_D);
      const bepIsFront = bepRoom ? bepRoom.z < room.z : true;
      const doorWorldX = 1.0;
      const nguBepGap = [{ center: doorWorldX - room.x, width: DOOR_W + 0.06 }];
      buildRoomWalls(g, room, {
        skipFront: !bepIsFront, // mặt Front: nếu không giáp Bếp thì đó là mặt ngoài -> skip
        skipBack: bepIsFront,   // mặt Back: nếu không giáp Bếp thì đó là mặt ngoài -> skip
        doorGapsFront: bepIsFront ? nguBepGap : [],
        doorGapsBack: bepIsFront ? [] : nguBepGap,
        skipLeft: true, skipRight: true,
      });
      buildDoor(nguBepGap[0].center, 0.02, bepIsFront ? -d/2 : d/2, 'x', g);
    } else if (room.kind === 'kitchen' && room.floor === 0) {
      // Bếp Trệt (f0-bep): "Front" (z NHỎ HƠN room.z) giáp Cầu thang (f0-stair), "Back" (z LỚN
      // HƠN) giáp Ngủ Trệt (f0-ngu) — Ngủ đã tự vẽ tường+cửa ở phía của nó (nhánh bedroom phía
      // trên) nên ở đây KHÔNG vẽ gì cho mặt Back, tránh chồng 2 lớp tường tại cùng ranh giới.
      // Front (giáp cầu thang): cửa tại world x=1.4 (bên phải). Dùng woodMed (khác wallWhite
      // mặc định) để ranh giới Bếp/Cầu thang luôn dễ nhận ra, tránh chìm màu với sàn/tường xung
      // quanh ở góc nhìn isometric.
      const stairGap = [{ center: 1.4 - room.x, width: DOOR_W + 0.06 }];
      buildRoomWalls(g, room, {
        skipBack: true,
        doorGapsFront: stairGap,
        skipLeft: true, skipRight: true,
        wallMat: MAT.woodMed,
      });
    } else if (room.kind === 'kitchen' && room.floor === -1) {
      // Bếp Hầm (ham-bep): KHÔNG có cầu thang liền kề (Hầm tách biệt hoàn toàn) — chỉ giáp Ngủ
      // Hầm (ham-ngu) ở 1 phía (Ngủ tự vẽ tường+cửa ở phía của nó, skip ở đây); phía còn lại
      // (giáp khối đất/móng đặc phía mặt tiền NDC, world z=HAM_Z0) là tường chắn đất do
      // buildHamFloor dựng riêng — ở buildRooms chỉ cần bỏ qua (skip) cả 2 mặt Front/Back vì
      // không có cửa nào thuộc về phòng Bếp tại các ranh giới đó (mặt giáp Ngủ do Ngủ vẽ, mặt
      // giáp đất là tường ngoài do buildHamFloor vẽ).
      buildRoomWalls(g, room, {
        skipFront: true, skipBack: true, skipLeft: true, skipRight: true,
      });
    } else if (room.kind === 'kitchen') {
      // Bếp full-width (T2/T3, Căn A/B): cửa cầu thang ở world x=1.4 (bên phải toà nhà). Phía
      // Ngủ KHÔNG vẽ gì — bedroom đã tự vẽ tường+cửa 1 cánh ở phía của nó (tránh chồng 2 lớp).
      // Xác định Front/Back theo đúng phía thực tế (Ngủ vs Cầu thang) dựa vào ROOMS data.
      const stairGap = [{ center: 1.4 - room.x, width: DOOR_W + 0.06 }];
      const nguRoom = ROOMS.find(r => r.floor===room.floor && r.kind==='bedroom' &&
        Math.abs(r.z - room.z) < UNIT_D);
      const nguIsFront = nguRoom ? nguRoom.z < room.z : true;
      buildRoomWalls(g, room, {
        skipFront: nguIsFront,
        skipBack: !nguIsFront,
        doorGapsFront: nguIsFront ? [] : stairGap,
        doorGapsBack: nguIsFront ? stairGap : [],
        skipLeft: true, skipRight: true,
      });
    } else if (room.kind === 'wc' && room.floor !== 3) {
      // WC lồng góc Bếp (Trệt, Hầm, T2/T3 Căn A/B — mọi floor trừ Tum): phòng RIÊNG BIỆT lồng
      // ở góc trái-trước của Bếp (world x âm, sát cạnh giáp Ngủ), cửa mở sang phải (x dương)
      // vào giữa phòng bếp. Vẽ ĐỦ 4 mặt tường (kể cả các mặt trùng ranh giới ngoài của Bếp) và
      // luôn hiện (alwaysVisible) — không phụ thuộc cơ chế ẩn-theo-camera — để khách thuê luôn
      // thấy rõ WC là phòng kín, không lẫn với bếp. Áp dụng đồng nhất cho f0-wc/ham-wc/WC A/B
      // — không còn kiểu WC "P.101" cũ (nối Ban công) của bản gốc NQA.
      const doorGap = [{ center: 0, width: 0.75 + 0.06 }];
      buildRoomWalls(g, room, {
        doorGapsRight: doorGap,
        alwaysVisible: true,
        wallMat: MAT.wcTile,
      });
    } else if (room.kind === 'wc' && room.floor === 3) {
      // WC Tum (tum-wc): phòng WC ĐỘC LẬP đứng trên Sân thượng sau (roof-back), dính liền vách
      // tường ngoài khối Studio+Cầu thang tum — đủ 4 mặt tường riêng biệt (giống 1 chòi nhỏ giữa
      // sân thượng). Chỉ 1 cửa mở sang TRÁI (theo hướng nhìn từ NDC vào, world x DƯƠNG — cùng quy
      // ước với mọi cửa khác trong khối Tum, xem buildRoofAndTum) theo đúng yêu cầu chủ nhà.
      const doorGapRight = [{ center: 0, width: DOOR_W + 0.06 }]; // "phải" trong hệ toạ độ cục bộ ứng với world x dương = "trái" thực tế
      buildRoomWalls(g, room, {
        doorGapsRight: doorGapRight,
        alwaysVisible: true,
        wallMat: MAT.wcTile,
        wallH: TUM_H, // thấp hơn tường tầng chuẩn (FLOOR_H) — khớp chiều cao khối Studio+Cầu thang bên cạnh, tránh nhô cao hơn mái chung
      });
      buildDoor(room.w/2, 0.02, 0, 'z', g);
      // Mái/trần riêng cho WC Tum — KHÁC mọi WC khác trong nhà (chúng dùng sàn tầng trên làm
      // trần), vì WC này đứng NGOÀI TRỜI trên sân thượng, không có tầng nào phía trên che nó;
      // thiếu mái sẽ trông như toilet lộ thiên. Dùng cùng màu tối (frameBlack) với viền mái khối
      // Studio+Cầu thang để đồng bộ hình ảnh khi nhìn từ trên.
      g.add(box(room.w+0.1, 0.1, room.d+0.1, MAT.frameBlack, 0, TUM_H+0.05, 0));
    } else if (room.kind === 'garage') {
      // Nhà xe (tầng trệt): tường ngăn với khoang Cầu thang ở mặt Back (z lớn hơn, giáp
      // f0-stair tại z=UNIT_D=8.5), có cửa đi tại world x=1.4 (đồng bộ vị trí cửa Cầu
      // thang<->Bếp các tầng trên). Front/Left/Right đã có cổng sắt + tường bao ngoài lo,
      // không vẽ đè lên ở đây.
      const stairGap = [{ center: 1.4 - room.x, width: DOOR_W + 0.06 }];
      buildRoomWalls(g, room, {
        doorGapsBack: stairGap,
        skipFront: true, skipLeft: true, skipRight: true,
        wallMat: MAT.woodMed,
      });
    }

    // đèn trần ban đêm cho phòng có người (ngủ/bếp) — bóng đèn (mesh) + nguồn sáng (PointLight)
    // đi kèm, giống cách dựng đèn hắt cầu thang (buildStaircaseShaft).
    if (room.kind === 'bedroom' || room.kind === 'kitchen') {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07,8,8), MAT.windowLit);
      bulb.position.set(0, FLOOR_H-0.15, 0);
      bulb.visible = false;
      g.add(bulb);
      nightLights.add(bulb);
      const glow = new THREE.PointLight(0xffd98a, 0, 3.5);
      glow.position.set(0, FLOOR_H-0.15, 0);
      glow.visible = false;
      g.add(glow);
      nightLights.add(glow);
      glow.userData.isRoomGlow = true;
      // đèn fill ban ngày: cường độ nhẹ, LUÔN bật (không thuộc nightLights) — bù sáng cho góc
      // khuất bên trong phòng mà ánh mặt trời không lọt tới, để nhìn xuyên được qua cửa kính
      // ban công từ ngoài trời vào thay vì thấy toàn bóng tối dù kính đã trong suốt.
      const fill = new THREE.PointLight(0xfff6e8, 1.1, 5);
      fill.position.set(0, FLOOR_H-0.4, 0);
      g.add(fill);
    }
  }
}

/* ============================================================
   9. NHÃN 2D (HTML) THEO NGỮ CẢNH GÓC NHÌN
   ============================================================ */
const labelEls = {};
const labelContainer = document.body;
// nhãn phòng con: vẫn tạo (dùng làm fallback cho tầng trệt/sân thượng, nơi không có UNITS),
// nhưng ở tầng 1-3 chỉ nhãn UNIT mới hiển thị — xem roomLabelAllowed().
function buildLabelElements() {
  for (const room of ROOMS) {
    const el = document.createElement('div');
    el.className = 'roomLabel';
    el.textContent = room.label;
    el.style.display = 'none';
    el.addEventListener('click', () => openInfoCard(room.id));
    labelContainer.appendChild(el);
    labelEls[room.id] = el;
  }
}

const unitLabelEls = {};
function buildUnitLabelElements() {
  for (const unit of UNITS) {
    const el = document.createElement('div');
    el.className = 'unitLabel';
    el.innerHTML = `<span class="unitBadge">${unit.shortLabel}</span> ${unit.available ? 'Còn trống' : 'Đã cho thuê'}`;
    el.classList.toggle('unitTaken', !unit.available);
    el.style.display = 'none';
    el.addEventListener('click', () => openInfoCard(unit.roomIds[0]));
    labelContainer.appendChild(el);
    unitLabelEls[unit.id] = el;
  }
}

// tầng nào KHÔNG có UNITS tương ứng (hầm, trệt, tum) vẫn hiện nhãn phòng con như cũ — chỉ
// floor1/floor2 (T2/T3, có UNITS) mới ẩn nhãn phòng con để nhường chỗ cho nhãn căn hộ to.
function roomLabelsAllowedFor(view) {
  return /^floor([1-2])$/.test(view) ? new Set() : labelsVisibleFor(view);
}

let labelsEnabled = true;
function updateLabels() {
  if (!labelsEnabled) {
    for (const room of ROOMS) labelEls[room.id].style.display = 'none';
    for (const unit of UNITS) unitLabelEls[unit.id].style.display = 'none';
    return;
  }
  const visibleRooms = roomLabelsAllowedFor(state.view);
  const v = new THREE.Vector3();
  for (const room of ROOMS) {
    const el = labelEls[room.id];
    if (!visibleRooms.has(room.id)) { el.style.display = 'none'; continue; }
    const g = roomMeshes[room.id];
    v.set(0, 1.8, 0).add(g.position);
    v.project(camera);
    if (v.z > 1) { el.style.display = 'none'; continue; }
    const x = (v.x*0.5+0.5) * window.innerWidth;
    const y = (-v.y*0.5+0.5) * window.innerHeight;
    if (x < -50 || x > window.innerWidth+50 || y < -50 || y > window.innerHeight+50) { el.style.display='none'; continue; }
    el.style.display = 'block';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }

  const visibleUnits = unitsVisibleFor(state.view);
  for (const unit of UNITS) {
    const el = unitLabelEls[unit.id];
    if (!visibleUnits.has(unit.id)) { el.style.display = 'none'; continue; }
    const c = unitCenter(unit);
    const unitBaseY = unit.floor === -1 ? HAM_BY : floorBaseY(unit.floor);
    v.set(c.x, unitBaseY + 2.35, c.z);
    v.project(camera);
    if (v.z > 1) { el.style.display = 'none'; continue; }
    const x = (v.x*0.5+0.5) * window.innerWidth;
    const y = (-v.y*0.5+0.5) * window.innerHeight;
    if (x < -80 || x > window.innerWidth+80 || y < -80 || y > window.innerHeight+80) { el.style.display='none'; continue; }
    el.style.display = 'flex';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
}

/* ============================================================
   10. INFO CARD
   ============================================================ */
let currentRoomId = null;
let currentUnitId = null;

function formatPriceVND(n) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function openInfoCard(id) {
  // Nếu phòng này thuộc 1 căn hộ đang cho thuê (tầng 1-3) -> luôn mở panel CĂN HỘ,
  // vì đó là đơn vị người thuê thực sự quan tâm (không phải riêng cái bếp/cái wc).
  const unitId = ROOM_ID_TO_UNIT[id];
  if (unitId) return openUnitCard(unitId, id);
  return openRoomCard(id);
}

function showInfoCard() {
  const card = document.getElementById('infoCard');
  card.style.display = 'block';
  // ép reflow trước khi thêm .show để transition (translateX/opacity) thực sự chạy
  void card.offsetWidth;
  requestAnimationFrame(() => card.classList.add('show'));
}

function openUnitCard(unitId, focusRoomId) {
  currentUnitId = unitId;
  currentRoomId = focusRoomId || null;
  const unit = UNITS.find(u=>u.id===unitId);
  if (!unit) return;
  const card = document.getElementById('infoCard');
  showInfoCard();
  card.classList.add('unitMode');

  document.getElementById('infoTitle').textContent = unit.label;

  const statusBadge = unit.available
    ? `<span class="statusBadge statusAvailable">Còn trống</span>`
    : `<span class="statusBadge statusTaken">Đã có người thuê</span>`;

  const amenitiesHtml = unit.amenities.map(k => `<li>${AMENITY_ICONS[k] || k}</li>`).join('');

  document.getElementById('infoMeta').innerHTML = `
    ${statusBadge}
    <div class="unitPrice">${unit.priceLabel}<span class="unitPriceSub"> · đặt cọc ${unit.deposit}</span></div>
    <div class="unitFacts">
      <div><b>${unit.area} m²</b><br>Diện tích</div>
      <div><b>${unit.bedrooms} PN</b><br>1 phòng ngủ</div>
      <div><b>${unit.floor === -1 ? 'Hầm' : unit.floor+1}</b><br>Tầng</div>
    </div>
    <div class="unitFacing">${unit.facing}</div>
    <p class="unitDesc">${unit.desc}</p>
    <ul class="amenityList">${amenitiesHtml}</ul>
    <div class="contactRow">
      <a class="contactBtn callBtn" href="tel:0777460408">Gọi 0777 460 408</a>
      <a class="contactBtn zaloBtn" href="https://zalo.me/0777460408" target="_blank" rel="noopener">Chat Zalo</a>
    </div>
  `;
}

function openRoomCard(id) {
  currentUnitId = null;
  currentRoomId = id;
  const room = ROOMS.find(r=>r.id===id);
  if (!room) return;
  const card = document.getElementById('infoCard');
  showInfoCard();
  card.classList.remove('unitMode');
  document.getElementById('infoTitle').textContent = room.label;
  const floorName = room.floor === -1 ? 'Tầng hầm' : room.floor === 0 ? 'Tầng trệt' : room.floor === N_FLOORS ? 'Sân thượng/Tum' : `Tầng ${room.floor+1}`;
  document.getElementById('infoMeta').innerHTML = `<b>${floorName}</b> · ~${(room.w*room.d).toFixed(1)} m²<br>${room.desc}`;
}
document.getElementById('infoClose').addEventListener('click', () => {
  const card = document.getElementById('infoCard');
  card.classList.remove('show');
  setTimeout(() => { card.style.display = 'none'; card.classList.remove('unitMode'); }, 320);
  currentRoomId = null;
  currentUnitId = null;
});
document.getElementById('infoPrev').addEventListener('click', () => stepRoom(-1));
document.getElementById('infoNext').addEventListener('click', () => stepRoom(1));
function stepRoom(dir) {
  // Chế độ căn hộ (tầng 1-3): chuyển qua lại giữa các UNITS cùng tầng, không phải phòng con.
  if (currentUnitId) {
    const visibleUnitIds = Array.from(unitsVisibleFor(state.view));
    const idx = visibleUnitIds.indexOf(currentUnitId);
    if (idx === -1) return;
    const next = (idx + dir + visibleUnitIds.length) % visibleUnitIds.length;
    openUnitCard(visibleUnitIds[next]);
    return;
  }
  if (!currentRoomId) return;
  const visibleIds = Array.from(labelsVisibleFor(state.view));
  const idx = visibleIds.indexOf(currentRoomId);
  if (idx === -1) return;
  const next = (idx + dir + visibleIds.length) % visibleIds.length;
  openInfoCard(visibleIds[next]);
}

/* ============================================================
   11. TRẠNG THÁI VIEW / MODE + TƯƠNG TÁC CHUỘT
   ============================================================ */
const state = { view: 'overview', mode: 'day' };

// Toàn cảnh/Sân thượng: góc "từ mặt đường nhìn vào nhà" — theta nhỏ (gần chính
// diện) và phi lớn, gần ngang tầm mắt người đứng ngoài đường.
// Từng tầng (cắt lớp): cần xiên từ trên xuống nhiều hơn để nhìn xuyên nóc thấy
// nội thất bên trong — theta vẫn nhỏ hơn bản gốc (nhìn thẳng hơn), nhưng phi giữ
// mức isometric cũ để không mất tác dụng cắt lớp.
// theta=0.74π là hướng đã xác nhận nhìn đúng vào mặt tiền (cổng, đường Nguyễn Đình Chiểu) —
// dùng chung cho MỌI view để nhất quán, chỉ đổi phi (độ xiên) theo nhu cầu từng view:
// overview/roof xiên ít hơn cho cảm giác đứng ngoài đường; floor0-3 xiên nhiều hơn để
// nhìn xuyên nóc thấy nội thất khi cắt lớp.
const FRONT_THETA = Math.PI * 0.74;
// Nhà NDC dài 30m (so với NQA 20m) nên radius/frustum cần lớn hơn để bao quát hết chiều dài —
// giữ nguyên tỉ lệ radius/HOUSE_D của bản gốc (42/20=2.1, 15/8.5≈1.76 theo UNIT_D) rồi nhân theo
// SCALE=HOUSE_D/20=1.5 để camera lùi ra đúng mức tương ứng, tránh nhà bị "dẹt" vì đứng quá gần.
const VIEW_PRESETS = {
  overview: { radius: 42*SCALE, theta: FRONT_THETA, phi: Math.PI*0.36, targetY: totalHeight*0.42, targetZ: HOUSE_D*0.3 },
  ham: { radius: 15, theta: FRONT_THETA, phi: Math.PI*0.34, targetY: HAM_BY+0.9, targetZ: HAM_Z0+HAM_D/2 },
  floor0: { radius: 15*SCALE, theta: FRONT_THETA, phi: Math.PI*0.34, targetY: floorBaseY(0)+0.9, targetZ: HOUSE_D/2 },
  floor1: { radius: 15*SCALE, theta: FRONT_THETA, phi: Math.PI*0.34, targetY: floorBaseY(1)+0.9, targetZ: HOUSE_D/2 },
  floor2: { radius: 15*SCALE, theta: FRONT_THETA, phi: Math.PI*0.34, targetY: floorBaseY(2)+0.9, targetZ: HOUSE_D/2 },
  roof: { radius: 14*SCALE, theta: FRONT_THETA, phi: Math.PI*0.38, targetY: floorBaseY(N_FLOORS)+1.2, targetZ: HOUSE_D/2 },
};

function applyView(view) {
  state.view = view;
  const p = VIEW_PRESETS[view];
  camState.radius = p.radius;
  camState.theta = p.theta;
  camState.phi = p.phi;
  camState.target.set(0, p.targetY, p.targetZ);
  camState.zoom = 1;

  document.querySelectorAll('#viewMenu button').forEach(b => b.classList.toggle('active', b.dataset.view===view));

  const m = view.match(/^floor(\d)$/);
  const cutFloor = m ? parseInt(m[1],10) : null; // tầng thân chính (0..N_FLOORS) đang cắt lớp để xem, hoặc null (toàn cảnh/roof/ham — hiện hết thân chính)

  // slabGroups (sàn, thân chính 0..N_FLOORS): hiện cho mọi tầng <= tầng đang xem (hoặc tất cả
  // nếu overview/roof/ham) — view 'roof' vẫn hiện đầy đủ Trệt/T2/T3 bên dưới (giống overview),
  // chỉ khác nhau ở góc camera; nội thất Tum phía trên vẫn nhìn xuyên được vì khối Tum không có
  // trần/mái riêng (xem buildRoofAndTum).
  for (let f = 0; f <= N_FLOORS; f++) {
    const slab = slabGroups[f];
    if (!slab) continue;
    let hide = false;
    if (cutFloor !== null) hide = f > cutFloor;
    slab.visible = !hide;
  }

  // wallGroups (tường bao, ban công, cửa sổ): cùng quy tắc hiện/ẩn như slabGroups.
  for (let f = 0; f <= N_FLOORS; f++) {
    const wall = wallGroups[f];
    if (!wall) continue;
    let hide = false;
    if (cutFloor !== null) hide = f > cutFloor;
    wall.visible = !hide;
  }

  // nội thất phòng của thân chính (floor 0..N_FLOORS, tức floorGroupIndex 1..N_FLOORS+1):
  // cùng quy tắc hiện/ẩn như slabGroups/wallGroups.
  for (let f = 0; f <= N_FLOORS; f++) {
    let hide = false;
    if (cutFloor !== null) hide = f > cutFloor;
    for (const g of floorRoomGroups[floorGroupIndex(f)]) g.visible = !hide;
  }

  // Viền mái đen của khối Studio+Cầu thang tum: ẩn riêng khi đang ở đúng view "Sân thượng" (nhìn
  // trực tiếp nội thất từ trên xuống — viền sẽ che khuất/gây rối), hiện lại ở mọi view khác
  // (overview, floorN, ham) để vẫn thấy khối này nổi bật khi nhìn tổng thể từ xa.
  if (tumRoofEdgeMesh) tumRoofEdgeMesh.visible = view !== 'roof';

  // Tầng Hầm (floor=-1): nằm NGẦM dưới đất, tách biệt hoàn toàn khỏi thân chính — LUÔN hiện ở
  // mọi view (overview, ham, và các view cắt lớp floor0/1/2/roof của thân chính), vì nó nằm ở
  // cao độ riêng (dưới mặt đất thấp phía Nước Mặn 6) nên không che khuất/xung đột với tầng đang
  // xem của thân chính.
  const showHam = true;
  if (hamSlabGroup) hamSlabGroup.visible = showHam;
  if (hamWallGroup) hamWallGroup.visible = showHam;
  for (const g of floorRoomGroups[floorGroupIndex(-1)]) g.visible = showHam;

  // Ở view 'ham', ẩn toàn bộ thân chính (Trệt->Tum) để không che khuất/gây rối tầng hầm —
  // tương đương "cutFloor = -1" cho thân chính dù cutFloor (regex floor(\d)) không match 'ham'.
  if (view === 'ham') {
    for (let f = 0; f <= N_FLOORS; f++) {
      if (slabGroups[f]) slabGroups[f].visible = false;
      if (wallGroups[f]) wallGroups[f].visible = false;
      for (const g of floorRoomGroups[floorGroupIndex(f)]) g.visible = false;
    }
  }
}

document.querySelectorAll('#viewMenu button').forEach(btn => {
  btn.addEventListener('click', () => applyView(btn.dataset.view));
});

function applyMode(mode) {
  state.mode = mode;
  document.querySelectorAll('#modeMenu button').forEach(b => b.classList.toggle('active', b.dataset.mode===mode));
  const isNight = mode === 'night';
  scene.background = new THREE.Color(isNight ? 0x0c1220 : 0xbcd9ec);
  scene.fog.color.set(isNight ? 0x0c1220 : 0xbcd9ec);
  hemi.intensity = isNight ? 0.45 : 0.9;
  hemi.color.set(isNight ? 0x5a7099 : 0xfff3e0);
  sun.intensity = isNight ? 0.22 : 1.1;
  fillLight.intensity = isNight ? 0.25 : 0.35;
  if (starPoints) starPoints.visible = isNight;
  nightLights.children.forEach(obj => {
    if (obj.isPointLight) { obj.intensity = isNight ? 1.1 : 0; obj.visible = isNight; }
    if (obj.isMesh) obj.visible = isNight;
  });
  // cửa sổ hông nhà sáng đèn ấm vào ban đêm
  for (const win of sideWindowMeshes) {
    win.material = isNight ? MAT.windowLit : MAT.glassDark;
  }
  // đèn đường bật sáng vào ban đêm
  streetLights.children.forEach(obj => {
    if (obj.isPointLight) obj.intensity = isNight ? 1.4 : 0;
    if (obj.isMesh) obj.visible = isNight;
  });
}
document.querySelectorAll('#modeMenu button').forEach(btn => {
  btn.addEventListener('click', () => applyMode(btn.dataset.mode));
});


document.getElementById('labelToggle').addEventListener('change', (e) => {
  labelsEnabled = e.target.checked;
});

/* mouse orbit / pan / zoom */
let isDragging = false, dragButton = 0, lastX=0, lastY=0;
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', e => {
  isDragging = true; dragButton = e.button; lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  lastX = e.clientX; lastY = e.clientY;
  if (dragButton === 0) {
    camState.theta -= dx * 0.006;
    camState.phi = Math.min(Math.max(camState.phi - dy*0.006, 0.15), Math.PI/2 - 0.02);
  } else if (dragButton === 2) {
    const panSpeed = camState.radius * 0.0016;
    const right = new THREE.Vector3(Math.cos(camState.theta),0,-Math.sin(camState.theta));
    const up = new THREE.Vector3(0,1,0);
    camState.target.addScaledVector(right, -dx*panSpeed);
    camState.target.addScaledVector(up, dy*panSpeed);
  }
});
const ZOOM_MIN = 0.4, ZOOM_MAX = 3.5;
canvas.addEventListener('wheel', e => {
  // Zoom-out (deltaY>0) đã chạm giới hạn tối thiểu: không còn gì để tiêu thụ trong canvas, để
  // trình duyệt xử lý bình thường (cuộn trang landing xuống các section khác) thay vì nuốt hết
  // sự kiện — đây là hành vi "scroll chaining" tự nhiên người dùng mong đợi khi nhúng 3D vào
  // banner của 1 trang dài hơn. Mọi trường hợp khác (đang zoom in/out còn tác dụng) vẫn giữ
  // nguyên trong canvas như trước.
  if (e.deltaY > 0 && camState.zoom <= ZOOM_MIN) return;
  e.preventDefault();
  camState.zoom = Math.min(Math.max(camState.zoom * (1 - e.deltaY*0.001), ZOOM_MIN), ZOOM_MAX);
}, { passive:false });

/* touch orbit / pan / pinch-zoom — tương đương bộ mouse ở trên nhưng cho ngón tay.
   1 ngón kéo = xoay (giống chuột trái), 2 ngón kéo = pan (giống chuột phải),
   2 ngón chụm/mở = zoom.

   Scroll-chaining cho 1 ngón (giống hệt logic của canvas.wheel ở trên): CSS đặt
   touch-action:pan-y (không phải "none") nên trình duyệt SẴN SÀNG tự cuộn trang dọc
   nếu mình không preventDefault(). Ở touchmove đầu tiên của mỗi lần chạm, nếu cử chỉ
   chủ yếu là kéo dọc (|dy|>|dx|) VÀ góc phi đã chạm biên trên/dưới (không còn gì để
   xoay thêm theo chiều đó) thì bỏ qua, không preventDefault — trình duyệt sẽ tự nhận
   lấy cử chỉ này và cuộn trang xuống các section khác. Mọi trường hợp còn lại (kéo
   ngang, hoặc kéo dọc nhưng phi chưa chạm biên) vẫn giữ lại để xoay model như cũ.
   Phải quyết định NGAY ở lần move đầu tiên vì trình duyệt chỉ cho chọn 1 lần duy nhất
   giữa "trang tự cuộn" và "JS xử lý" cho mỗi cử chỉ chạm — không thể đổi ý giữa chừng. */
const PHI_MIN = 0.15, PHI_MAX = Math.PI/2 - 0.02;
let touchMode = null; // 'rotate' | 'pinch' | 'scrolling-page' | null (chờ quyết định)
let touchDecided = false; // đã quyết định rotate hay nhường cho trang ở lần move đầu chưa
let lastTouchX = 0, lastTouchY = 0, lastPinchDist = 0;
let touchStartX = 0, touchStartY = 0;

function touchMidpoint(t0, t1) {
  return { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
}
function touchDist(t0, t1) {
  return Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
}

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    // Chưa preventDefault ở đây: còn phải chờ hướng kéo ở touchmove đầu tiên mới biết
    // là xoay model hay nhường cho trang cuộn.
    touchMode = null;
    touchDecided = false;
    touchStartX = lastTouchX = e.touches[0].clientX;
    touchStartY = lastTouchY = e.touches[0].clientY;
  } else if (e.touches.length === 2) {
    e.preventDefault();
    touchMode = 'pinch';
    touchDecided = true;
    lastPinchDist = touchDist(e.touches[0], e.touches[1]);
    const mid = touchMidpoint(e.touches[0], e.touches[1]);
    lastTouchX = mid.x; lastTouchY = mid.y;
  }
}, { passive:false });

canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && !touchDecided) {
    touchDecided = true;
    const dx = e.touches[0].clientX - touchStartX, dy = e.touches[0].clientY - touchStartY;
    const verticalDrag = Math.abs(dy) > Math.abs(dx);
    const phiAtLimit = camState.phi <= PHI_MIN + 1e-3 || camState.phi >= PHI_MAX - 1e-3;
    if (verticalDrag && phiAtLimit) {
      // Nhường cử chỉ này cho trình duyệt cuộn trang — không preventDefault, không set
      // lại touchMode nữa (giữ null) để các lần move tiếp theo cũng bỏ qua tương tự.
      touchMode = 'scrolling-page';
      return;
    }
    touchMode = 'rotate';
  }
  if (touchMode === 'scrolling-page') return; // đã nhường cho trang, không can thiệp nữa

  e.preventDefault();
  if (touchMode === 'rotate' && e.touches.length === 1) {
    const dx = e.touches[0].clientX - lastTouchX, dy = e.touches[0].clientY - lastTouchY;
    lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY;
    camState.theta -= dx * 0.006;
    camState.phi = Math.min(Math.max(camState.phi - dy*0.006, PHI_MIN), PHI_MAX);
  } else if (touchMode === 'pinch' && e.touches.length === 2) {
    const dist = touchDist(e.touches[0], e.touches[1]);
    const zoomFactor = dist / lastPinchDist;
    lastPinchDist = dist;
    camState.zoom = Math.min(Math.max(camState.zoom * zoomFactor, ZOOM_MIN), ZOOM_MAX);

    // 2 ngón di chuyển cùng lúc (không chỉ chụm/mở) = pan, giống chuột phải
    const mid = touchMidpoint(e.touches[0], e.touches[1]);
    const dx = mid.x - lastTouchX, dy = mid.y - lastTouchY;
    lastTouchX = mid.x; lastTouchY = mid.y;
    const panSpeed = camState.radius * 0.0016;
    const right = new THREE.Vector3(Math.cos(camState.theta),0,-Math.sin(camState.theta));
    const up = new THREE.Vector3(0,1,0);
    camState.target.addScaledVector(right, -dx*panSpeed);
    camState.target.addScaledVector(up, dy*panSpeed);
  }
}, { passive:false });

function touchEnd(e) {
  if (e.touches.length === 0) {
    touchMode = null;
    touchDecided = false;
  } else if (e.touches.length === 1) {
    // Từ pinch/pan xuống còn 1 ngón: chờ quyết định lại từ đầu (giống touchstart) thay vì
    // ép luôn thành rotate — tránh trường hợp buông bớt 1 ngón giữa lúc đang ở biên phi.
    touchMode = null;
    touchDecided = false;
    touchStartX = lastTouchX = e.touches[0].clientX;
    touchStartY = lastTouchY = e.touches[0].clientY;
  }
}
canvas.addEventListener('touchend', touchEnd);
canvas.addEventListener('touchcancel', touchEnd);

document.getElementById('zoomIn').addEventListener('click', () => camState.zoom = Math.min(camState.zoom*1.2, ZOOM_MAX));
document.getElementById('zoomOut').addEventListener('click', () => camState.zoom = Math.max(camState.zoom/1.2, ZOOM_MIN));
document.getElementById('zoomHome').addEventListener('click', () => applyView(state.view));

// Tắt tự xoay: camera đứng yên đúng góc mặt tiền đã canh trong VIEW_PRESETS cho tới khi
// khách tự kéo chuột. Trước đây có auto-rotate liên tục ở view overview, nhưng nó khiến
// góc nhìn trôi dần theo thời gian — khách vào trang ở các thời điểm khác nhau sẽ thấy
// mặt tiền hoặc mặt hông một cách ngẫu nhiên, không đáng tin cậy cho trang bán hàng.
let autoRotate = false;

/* raycast click on rooms for info card (bắt trên toàn bộ mesh trong group phòng) */
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
canvas.addEventListener('click', (e) => {
  mouseNDC.x = (e.clientX/window.innerWidth)*2-1;
  mouseNDC.y = -(e.clientY/window.innerHeight)*2+1;
  raycaster.setFromCamera(mouseNDC, camera);
  const visible = labelsVisibleFor(state.view);
  const candidates = [];
  for (const id of visible) candidates.push(...roomMeshes[id].children, roomMeshes[id]);
  const hits = raycaster.intersectObjects(candidates, true);
  if (hits.length) {
    // tìm room id chứa object trúng
    for (const id of visible) {
      const g = roomMeshes[id];
      let obj = hits[0].object;
      let found = false;
      while (obj) { if (obj === g) { found = true; break; } obj = obj.parent; }
      if (found) { openInfoCard(id); break; }
    }
  }
});

/* ============================================================
   12. VÒNG LẶP RENDER
   ============================================================ */

function init() {
  buildGround();
  buildStars();
  buildGate();
  buildHamFloor();
  for (let f=0; f<N_FLOORS; f++) {
    buildFloorSlab(f);
    const fw = buildExteriorWalls(f);
    frontWalls.push(fw);
    // Ban công mặt sau (Nước Mặn 6): mọi tầng thân chính, kể cả Trệt (Phòng ngủ Trệt giờ có
    // layout chuẩn với ban công như Căn A/B). Ban công mặt trước (NDC): chỉ tầng có người ở
    // (floor>=1) vì Trệt mặt tiền là nhà xe/cổng, không có phòng ngủ ở đó.
    buildBalconySlab(f, HOUSE_D, false);
    if (f>=1) buildBalconySlab(f, 0, true);
    buildWindowsForFloor(f);
  }
  buildRoofAndTum();
  buildAllDoors();
  buildRooms();
  buildLabelElements();
  buildUnitLabelElements();

  resize();
  applyView('overview');
  applyMode('day');

  document.getElementById('loading').style.display = 'none';
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  if (autoRotate && state.view === 'overview') {
    camState.theta += 0.0018;
  }
  updateCamera();
  updateCameraFacingWalls();
  updateSwingingClothes(performance.now()/1000);
  updateLabels();
  renderer.render(scene, camera);
}

init();

})();
