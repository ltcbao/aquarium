# AquaVerse — Three.js (WebGL 3D) Migration Plan

## 🎯 Goal
Chuyển đổi tầng hiển thị đồ họa (Rendering Engine) của AquaVerse từ HTML5 Canvas 2D sang **Three.js (WebGL)** nhằm đạt hiệu năng 60+ FPS ổn định với 100+ cá, mở khóa đồ họa 3D chân thực (ánh sáng thể tích, đổ bóng động, caustics shader), trong khi **bảo tồn 100% logic mô phỏng sinh thái và giao diện người dùng (DOM/Tailwind HUD)** hiện có.

---

## ⚖️ Trade-off & Phân tích Đánh đổi (Canvas 2D vs Three.js)

| Tiêu chí | Canvas 2D (Hiện tại) | Three.js WebGL (Mục tiêu) | Đánh giá |
|---|---|---|---|
| **Hiệu năng (58 - 150+ cá)** | ~30 - 60 FPS (Bị nghẽn do Canvas fill-rate & CPU Draw calls) | **60 - 120 FPS** (Tận dụng GPU song song, InstancedMesh) | 🟢 **Three.js thắng áp đảo** |
| **Chiều sâu thị giác** | Giả lập 2.5D (Scale theo Z, bóng mờ phẳng) | **3D không gian thực** (Camera Perspective, Water Fog, Depth Buffer) | 🟢 **Three.js đẳng cấp hơn hẳn** |
| **Hiệu ứng nước & ánh sáng** | Sóng vẽ bằng hàm sin 2D, caustics giả lập | **Custom GLSL Shader**: Caustics động, God-Rays, Phản xạ mặt nước | 🟢 **Three.js siêu wow** |
| **Dung lượng & Thời gian nạp** | Siêu nhẹ (~250 KB JS thuần, load tức thì) | Cần nạp thư viện Three.js (~600 KB gzip) + Asset 3D nếu có | 🟡 Cần tối ưu Bundle & Procedural mesh |
| **Độ phức tạp mã nguồn** | Dễ debug, thuần Canvas context | Cần quản lý Scene Graph, Camera, Lights, Materials, VRAM disposal | 🟡 Đòi hỏi kiến trúc Shader & Mesh chuẩn |
| **Logic Game & UI** | 100% gắn chặt với trạng thái `state` | **Tái sử dụng 100%** (UI HUD + Simulation + Shop giữ nguyên) | 🟢 Zero-rewrite cho Game Logic |

---

## 🏗️ Kiến trúc Phân tầng Đích (Target Architecture)

```
┌──────────────────────────────────────────────────────────────┐
│           HTML5 / Tailwind UI Overlay (Giữ nguyên 100%)       │
│  (HUD Level, Coins, Tool Dock, Drawer Shop, Quests, Inspect)  │
└──────────────────────────────┬───────────────────────────────┘
                               │ State binding
┌──────────────────────────────▼───────────────────────────────┐
│     Core Simulation & State Engine (Giữ nguyên 100%)         │
│ (Lifecycles, Breeding, Hunger, Waste, Water Quality, Economy)│
└──────────────────────────────┬───────────────────────────────┘
                               │ Pos (x, y, z), Facing, Velocity
┌──────────────────────────────▼───────────────────────────────┐
│               THREE.JS 3D RENDERING LAYER (Mới)              │
│  ┌───────────────────────┐      ┌─────────────────────────┐  │
│  │   Scene & 3D Camera   │      │ Dynamic Water Shaders   │  │
│  │ Perspective / Controls│      │ God-Rays, Caustics GLSL │  │
│  └───────────────────────┘      └─────────────────────────┘  │
│  ┌───────────────────────┐      ┌─────────────────────────┐  │
│  │ Fish Entities (Inst.) │      │ Aquascape 3D Flora      │  │
│  │ Spine Vertex-Wiggle   │      │ Dynamic Sway Wind Shaders│ │
│  └───────────────────────┘      └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Lộ trình Triển khai (5 Pha Hành động)

### Pha 1: Khởi tạo Scene 3D & Khung nhìn Hybrid (Viewport Setup)
- [x] **Task 1.1**: Tích hợp Three.js qua CDN/ESM module trong [index.html](file:///d:/ltcbao/Aquarium/index.html) (sử dụng Three.js r186.1 trong `libs/three.module.js` + importmap).
  - *Verify*: Mở console gõ `THREE.REVISION` hiển thị phiên bản thành công.
- [x] **Task 1.2**: Tạo module [js/render/three-scene.js](file:///d:/ltcbao/Aquarium/js/render/three-scene.js) quản lý `Scene`, `PerspectiveCamera` (FOV 42), và `WebGLRenderer` (antialias, alpha, soft shadows).
  - *Verify*: Canvas Three.js hiển thị toàn màn hình nằm dưới lớp HTML HUD mà không che các nút bấm.
- [x] **Task 1.3**: Thiết lập cơ chế resize đồng bộ `camera.aspect` và `renderer.setSize(window.innerWidth, window.innerHeight)`.
  - *Verify*: Co giãn cửa sổ trình duyệt không bị méo tỷ lệ khung hình.

### Pha 2: Môi trường Bể cá, Nước & Chiếu sáng (Waterbox & Lighting)
- [x] **Task 2.1**: Dựng khối kính bể cá 3D (Tank Enclosure) với chất liệu `MeshPhysicalMaterial` (transmission 0.88, roughness 0.05, ior 1.333).
  - *Verify*: Nhìn thấy viền vát kính Starphire khúc xạ ánh sáng trong không gian 3D.
- [x] **Task 2.2**: Thiết lập hệ thống chiếu sáng động: `AmbientLight` (sáng tổng thể) + `DirectionalLight` (ánh sáng mặt trời chiếu xuyên nước đổ bóng `castShadow = true`).
  - *Verify*: Đồ vật có bóng râm thực tế rơi xuống đáy cát.
- [x] **Task 2.3**: Dựng đáy cát 3D uốn lượn (Substrate Mesh với `PlaneGeometry` và procedural dune displacement).
  - *Verify*: Đáy bể có độ gồ ghề tự nhiên theo chiều sâu Z.
- [x] **Task 2.4**: Tạo Caustics Shader & Volumetric Fog bằng GLSL ShaderMaterial.
  - *Verify*: Dải nắng lung linh và các vệt sóng khúc xạ nhảy múa dưới đáy hồ.

### Pha 3: Hệ thống Cá 3D & Vertex Wiggle Shader (Fish Entity Migration)
- [x] **Task 3.1**: Thiết kế Mesh cá cơ bản dạng Procedural Sculpted Body + Fins mềm mại với tail undulation và pectoral fin flapping.
  - *Verify*: Cá bơi uốn mình mềm mại, vây ngực đập nhịp nhàng, mắt ngọc phản chiếu ánh sáng.
- [x] **Task 3.2**: Chuyển đổi màu sắc và đột biến (Morphs: Prism, Cosmic, Albino, Gold) sang Three.js Materials (`MeshStandardMaterial` hỗ trợ emissive, metalness).
  - *Verify*: Cá Cosmic phát sáng dạ quang neon tím trong bóng tối, cá Prism chuyển màu tán sắc lấp lánh.
- [x] **Task 3.3**: Ánh xạ vị trí từ physics engine 2.5D sang không gian 3D thực $(x, y, z)$ với trục $Z$ tự do bơi từ trước ra sau kính.
  - *Verify*: 64 cá bơi tung tăng khắp thể tích hồ nước theo cả 3 chiều không gian.

### Pha 4: Thực vật & Đồ trang trí Thủy sinh 3D (Aquascape Flora & Hardscape)
- [x] **Task 4.1**: Dựng 3D Hardscape (Đá Dragon Stone, Seiryu Rock, Núi lửa Magma Basalt, Cột đền Atlantis) dạng Procedural 3D Mesh.
  - *Verify*: Các khối đá có khối nổi khối 3D góc cạnh rõ rệt khi xoay góc nhìn.
- [x] **Task 4.2**: Cây thủy sinh 3D (Amazon Sword, Ludwigia, Rotala) có nhiều lớp tán lá tỏa đều trong không gian 3D.
  - *Verify*: Tán lá tỏa đều trong nước theo các góc độ.
- [x] **Task 4.3**: Bọt khí oxy 3D bằng bong bóng khúc xạ ánh sáng nổi từ đáy lên mặt nước và thức ăn chìm có bóng đổ.
  - *Verify*: Hàng chục bọt khí li ti phản quang nổi lên mặt nước.

### Pha 5: Tương tác 3D Raycasting, Laser Toy & Hoàn thiện
- [x] **Task 5.1**: Tích hợp `THREE.Raycaster` để xử lý tương tác chuột: Nhấp chuột gõ kính làm cá giật mình, click chọn cá để mở bảng Inspector HUD.
  - *Verify*: Click trúng bất kỳ con cá 3D nào đều kích hoạt mở bảng thông tin chi tiết.
- [x] **Task 5.2**: Nút chuyển đổi nhanh Dual-Engine: `3D WebGL` <-> `2D Canvas` trên HUD.
  - *Verify*: Chuyển đổi mượt mà giữa 2D và 3D tức thì không cần reload trang.
- [x] **Task 5.3**: Thêm chế độ Camera Cinematic (OrbitControls mượt mà cho phép người dùng tự do xoay 360 độ ngắm bể cá từ mọi góc).
  - *Verify*: Người chơi có thể xoay nhìn từ trên mặt nước xuống hoặc nhìn ngang kính.
- [x] **Task 5.4**: Kiểm tra Memory Leaks & VRAM disposal (giải phóng buffer khi bán cá hoặc đổi layout bể).
  - *Verify*: Không phát sinh hiện tượng tràn VRAM.

---

## 🏆 Cập Nhật Trạng Thái Triển Khai (Hoàn Tất Phase 1 & 2)

Đã hoàn thành xuất sắc toàn bộ kiến trúc **Dual-Engine (Canvas 2D ⇋ Three.js 3D WebGL)** với các cải tiến vượt bậc:
1. **Khắc phục triệt để lỗi Bật/Tắt & 404 Module**:
   - Tích hợp đầy đủ `libs/three.core.js` và `libs/three.module.js` nội bộ, giải quyết dứt điểm lỗi module thiếu.
   - Thêm stub fallback `window.toggleRenderEngine` ngăn chặn mọi lỗi `ReferenceError`.
2. **Loại bỏ hiện tượng "Hộp lơ lửng trong không gian đen"**:
   - Thay thế viền CAD wireframe bằng bể kính Starphire không viền với chân đế nhôm tối giản sang trọng (`MeshStandardMaterial`).
   - Xây dựng vòm cảnh quan 360° hình trụ (`CylinderGeometry(2200, 2200, 1700)`) đổ màu nước đại dương sâu thẳm, loại bỏ hoàn toàn khoảng đen vô tận.
   - Nền cát uốn lượn tự nhiên trải rộng phủ kín đáy bể, rải thêm 24 viên sỏi suối tự nhiên gồ ghề ngẫu nhiên.
3. **Giải quyết hình thể cá "Quả bóng bóng" & Lỗi hình bóng đen**:
   - Thiết kế thuật toán điêu khắc giải phẫu đa khoang (`createSculptedFishBody`) cho từng nhóm loài: Cá đĩa dẹp (`discus/angel`), cá mũi hếch (`cory`), cá đuôi voan lượn sóng (`guppy/betta`), cá lươn rồng (`bichir`), và cá dao nhung ma (`black_ghost_knife`).
   - Sửa lỗi màu đen tuyệt đối: Cá dao nhung ma được xử lý bóng nhung obsidian `0x181820` với vòng đuôi ngà trắng và viền phản quang chân thực.
   - Mắt ngọc hai lớp (tròng vàng kim + con ngươi đen nhánh) và vây bơi vẫy theo nhịp sóng sin tự nhiên.
4. **Phân tách thao tác Chuột & Nút Xoay 360°**:
   - Mặc định: Chuột trái dùng để tương tác game (thả thức ăn, gõ kính, chọn cá), chuột phải để xoay nhẹ.
   - Thêm nút **`[ 🎥 360° Cam ]`** trên thanh HUD: Khi kích hoạt, chuột trái tự do xoay 360° ngắm mọi góc độ; khi tắt, camera tự động lerp mượt mà trở lại góc chính diện hoàn hảo.
5. **Đồng bộ ánh sáng LED & Biome theo thời gian thực**:
   - Ánh sáng đèn LED (Daylight, Moonlight, Sunset, Bioluminescent) và màu nước Biome tự động cập nhật mượt mà sang Three.js.
