# Biome & Aquatic Vegetation Ecosystem Implementation Plan

## Objective
Nâng cấp toàn diện hệ thống Nền bể cá (Multi-Biomes, Parallax 3 lớp chiều sâu, Caustics gợn sóng) và Hệ sinh thái thực vật thủy sinh (Vòng đời sinh trưởng, Quang hợp tạo Oxy, Vật lý đung đưa phản ứng khi cá bơi chạm vào, và Chế độ Chăm sóc/Làm vườn/Cắt tỉa nhận thưởng).

---

## 1. Data Layer (`js/data/themes.js`, `js/data/decorations.js`)
- [x] **Task 1.1: Multi-Biomes Catalog** (`BIOMES_CATALOG` trong `js/data/themes.js`):
  - `amazon_freshwater`: Rừng ngập nước Amazon, nước xanh lục hổ phách ấm, rễ cây đước cổ thụ xa mờ, cát sông vàng mịn.
  - `coral_reef`: Rạn san hô Đại dương rực rỡ, nước xanh ngọc lam biển sâu, rạn san hô xa xăm, cát san hô trắng mịn.
  - `atlantis_abyss`: Di tích Atlantis cổ linh thiêng, nước tím than huyền bí, cột đá & cổng vòm chìm trong bóng tối, đáy đá bazan đen tuyền.
  - `cyber_trench`: Hẻm vực rãnh biển sâu phát quang rực rỡ neon.
- [x] **Task 1.2: Bổ sung các loài thực vật & cơ chế sinh trưởng** (`js/data/decorations.js`):
  - Cập nhật các cây hiện có (`amazon_sword`, `anubias_log`, `red_ludwigia`) với metadata thực vật: `isPlant: true`, `maxGrowth: 100`, `oxygenRate: 0.18`, `pruneReward: 25`.
  - Thêm 2 loài thực vật mới:
    - `giant_kelp`: Rừng tảo bẹ khổng lồ vươn cao với bóng khí và phiến lá dài đung đưa.
    - `lotus_lily`: Cụm sen/súng thủy sinh với cuống mềm, lá nổi trên mặt nước và hoa súng nở khi trưởng thành.
    - `neon_coral`: San hô dạ quang với xúc tu nhấp nháy phát sáng trong đêm.

---

## 2. Core & Simulation Engine (`js/core/state.js`, `js/core/save-system.js`, `js/engine/simulation.js`)
- [x] **Task 2.1: Quản lý State & Lưu trữ**:
  - `state.currentBiome` (mặc định `'amazon_freshwater'`), đồng bộ với `save-system.js`.
  - Khởi tạo thuộc tính sinh trưởng cho từng cây trong `state.decorations`: `growth` (0-100), `health` (100), `stage` (`sprout` / `mature` / `flowering`), `floweringTimer`.
- [x] **Task 2.2: Vòng đời sinh trưởng & Quang hợp**:
  - Trong `updateSimulation()`: Cây quang hợp tăng dần `growth` theo thời gian. Nước sạch và ánh sáng tốt giúp cây lớn nhanh hơn.
  - Cây trưởng thành sinh bọt khí oxy tí hon lọc nước (`state.waterQuality += bonus`), hấp thụ chất thải cá (`state.waste`).
  - Khi cây đạt 100% `growth`, chuyển sang giai đoạn `flowering` (nở hoa lộng lẫy).

---

## 3. Rendering Engine (`js/render/canvas-bg.js`, `js/render/canvas-decor.js`)
- [x] **Task 3.1: Parallax 3 lớp & Tia sáng Caustics khúc xạ** (`canvas-bg.js`):
  - Lớp 1 (Deep Water Gradient & Sky Light): Màu nước biến đổi mượt mà theo Biome và chu kỳ sự kiện.
  - Lớp 2 (Distant Biome Silhouettes): Hình bóng rễ cây Amazon, rạn san hô biển xa, hoặc tàn tích vòm cột Atlantis trôi nhẹ theo góc nhìn (Parallax).
  - Lớp 3 (Caustics Refraction Mesh): Lưới tia sáng gợn sóng khúc xạ chân thực nhảy múa trên nền nước và đáy bể.
  - Substrate theo Biome: Đáy cát đổi màu và vân hạt tương ứng từng quần xã sinh thái.
- [x] **Task 3.2: Vật lý thực vật mềm & Trực quan hóa vòng đời** (`canvas-decor.js`):
  - Kích thước và số lượng lá tỷ lệ với `growth`. Khi `flowering`, vẽ thêm nụ hoa nở rực rỡ và hạt phấn lấp lánh.
  - Vật lý phản ứng va chạm: Khi cá bơi qua gần thân cây ($d < 35$), cành lá uốn cong tự nhiên theo hướng bơi của cá rồi đàn hồi trở lại.

---

## 4. UI & Gardening Interaction (`js/ui/ui-hud.js`, `js/ui/interaction.js`, `index.html`, `css/styles.css`)
- [x] **Task 4.1: Thanh chọn Quần xã sinh thái (Biome Selector)**:
  - Thêm nút/menu chuyển đổi Biome nhanh chóng trên thanh Header/HUD với icon và hiệu ứng chuyển cảnh mượt.
- [x] **Task 4.2: Chế độ Làm vườn Thủy sinh (Garden Care Mode)**:
  - Thêm nút chế độ **Garden** (Icon Cành lá `ph-plant` / `ph-scissors`) trên thanh Dock hoặc Sub-toolbar.
  - **Tưới dinh dưỡng/Bón phân**: Click vào cây để tăng tốc độ lớn + hiệu ứng hạt sinh khí xanh lá.
  - **Cắt tỉa (Pruning)**: Click vào cây khi đã nở hoa/trưởng thành để tỉa cành, nhận thưởng Coins + XP và bọt nước may mắn.

---

## 5. Verification & Final Checklist
- [x] Syntax AST check toàn bộ 29+ file JS.
- [x] Kiểm tra mượt mà 60 FPS, không gây rò rỉ bộ nhớ (Garbage Collection friendly, Gradient/Mesh caching).
- [x] Kiểm tra responsive trên Desktop và Mobile.
