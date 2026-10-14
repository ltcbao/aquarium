# Task: AquaVerse Features & Performance Optimization

## Overview
Triển khai trọn bộ tính năng gameplay hấp dẫn và tối ưu hóa hiệu năng toàn diện cho AquaVerse theo các quyết định kỹ thuật từ Socratic Gate.

---

## 📋 Task Breakdown

### Phase 1: Performance Optimization Core
- [ ] Task 1.1: Xây dựng cấu trúc Spatial Partitioning Grid trong `js/engine/physics.js` để giảm O(N²) Boids schooling xuống O(N).
- [ ] Task 1.2: Caching Background & Substrate Gradients trong `js/render/canvas-bg.js` và loại bỏ gradient dư thừa trong `js/render/fish-renderer.js`.
- [ ] Task 1.3: Tối ưu hóa mảng hạt VFX, wake rings và bọt khí (Object Recycling / Pooling) trong `js/render/renderer.js` & `js/render/vfx.js`.
- [ ] Task 1.4: Xây dựng Live HUD FPS / Frame Budget Profiler Widget trong `js/render/renderer.js` & `index.html`.

### Phase 2: Interactive Laser Toy Mode
- [ ] Task 2.1: Bổ sung chế độ `'laser'` trong `js/core/state.js` và cập nhật UI Bottom Dock / Sub-toolbar trong `index.html` & `js/ui/interaction.js`.
- [ ] Task 2.2: Vẽ hiệu ứng điểm Laser dạ quang neon + caustic glow trong Canvas render loop (`js/render/renderer.js`).
- [ ] Task 2.3: Thêm tập tính cá đuổi theo tia Laser trong `js/engine/physics.js` kèm âm thanh Web Audio mới trong `js/core/audio.js`.

### Phase 3: Daily Quests & Achievements System
- [ ] Task 3.1: Tạo file cấu hình `js/data/quests.js` chứa danh mục nhiệm vụ hàng ngày và thành tựu huy hiệu.
- [ ] Task 3.2: Tích hợp logic theo dõi tiến độ nhiệm vụ trong `js/engine/simulation.js`, `js/ui/interaction.js`, `js/engine/food.js`.
- [ ] Task 3.3: Bổ sung Drawer/View "Quests & Trophies" trong `js/ui/ui-drawer.js` và nút truy cập trên Bottom Dock trong `index.html`.

### Phase 4: Dynamic Environmental Events & Weather
- [ ] Task 4.1: Thêm bộ điều phối sự kiện môi trường (Golden Hour, Bioluminescent Night, Algae Bloom, Oxygen Rush) trong `js/engine/simulation.js`.
- [ ] Task 4.2: Tích hợp hiệu ứng thị giác và banner sự kiện trên Canvas & HUD trong `js/render/canvas-bg.js` & `js/ui/ui-hud.js`.

### Phase 5: Verification & Testing
- [ ] Task 5.1: Chạy AST Syntax Check (`npm test`) trên toàn bộ 28+ file JS.
- [ ] Task 5.2: Kiểm tra tính tương thích ngược của save data (`localStorage`).
- [ ] Task 5.3: Xác nhận hiệu năng 60 FPS mượt mà trên browser.
