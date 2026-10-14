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
- [ ] **Task 1.1**: Tích hợp Three.js qua CDN/ESM module trong [index.html](file:///d:/ltcbao/Aquarium/index.html) (sử dụng Three.js r160+).
  - *Verify*: Mở console gõ `THREE.REVISION` hiển thị phiên bản thành công.
- [ ] **Task 1.2**: Tạo module [js/render/three-scene.js](file:///d:/ltcbao/Aquarium/js/render/three-scene.js) quản lý `Scene`, `PerspectiveCamera` (FOV 50), và `WebGLRenderer` (antialias, alpha).
  - *Verify*: Canvas Three.js hiển thị toàn màn hình nằm dưới lớp HTML HUD mà không che các nút bấm.
- [ ] **Task 1.3**: Thiết lập cơ chế resize đồng bộ `camera.aspect` và `renderer.setSize(window.innerWidth, window.innerHeight)`.
  - *Verify*: Co giãn cửa sổ trình duyệt không bị méo tỷ lệ khung hình.

### Pha 2: Môi trường Bể cá, Nước & Chiếu sáng (Waterbox & Lighting)
- [ ] **Task 2.1**: Dựng khối kính bể cá 3D (Tank Enclosure) với chất liệu `MeshPhysicalMaterial` (transmission 0.95, roughness 0.05, ior 1.333).
  - *Verify*: Nhìn thấy viền vát kính Starphire khúc xạ ánh sáng trong không gian 3D.
- [ ] **Task 2.2**: Thiết lập hệ thống chiếu sáng động: `AmbientLight` (sáng tổng thể) + `DirectionalLight` (ánh sáng mặt trời chiếu xuyên nước đổ bóng `castShadow = true`).
  - *Verify*: Đồ vật có bóng râm thực tế rơi xuống đáy cát.
- [ ] **Task 2.3**: Dựng đáy cát 3D uốn lượn (Substrate Mesh với `PlaneGeometry` và displacement texture/noise).
  - *Verify*: Đáy bể có độ gồ ghề tự nhiên theo chiều sâu Z.
- [ ] **Task 2.4**: Tạo Caustics Shader & Volumetric Fog bằng GLSL ShaderMaterial.
  - *Verify*: Dải nắng lung linh và các vệt sóng khúc xạ nhảy múa dưới đáy hồ.

### Pha 3: Hệ thống Cá 3D & Vertex Wiggle Shader (Fish Entity Migration)
- [ ] **Task 3.1**: Thiết kế Mesh cá cơ bản dạng Procedural Low-Poly (Body dạng `Cone/ExtrudeGeometry` + Fins phẳng) với Shader uốn đuôi theo sóng sin trên GPU (`gl_Position.x += sin(time + position.z) * amplitude`).
  - *Verify*: Cá bơi uốn mình mềm mại 100% bằng GPU, CPU không cần tính bezier curve.
- [ ] **Task 3.2**: Chuyển đổi màu sắc và đột biến (Morphs: Prism, Cosmic, Albino, Gold) sang Three.js Materials (`MeshStandardMaterial` hỗ trợ emissive, metalness, rainbow uniforms).
  - *Verify*: Cá Cosmic phát sáng dạ quang neon tím trong bóng tối, cá Prism chuyển màu tán sắc lấp lánh.
- [ ] **Task 3.3**: Ánh xạ vị trí từ physics engine 2.5D sang không gian 3D thực $(x, y, z)$ với trục $Z$ tự do bơi từ trước ra sau kính.
  - *Verify*: 64 cá bơi tung tăng khắp thể tích hồ nước theo cả 3 chiều không gian.
- [ ] **Task 3.4**: Áp dụng `InstancedMesh` cho các loài cá bầy (Neon Tetra, Guppy, Harlequin Rasbora) để gom hàng trăm con cá vào **1 duy nhất Draw Call**.
  - *Verify*: Bật 100 cá Neon Tetra chạy mượt mà ở mức 60 FPS cố định với < 5 draw calls.

### Pha 4: Thực vật & Đồ trang trí Thủy sinh 3D (Aquascape Flora & Hardscape)
- [ ] **Task 4.1**: Dựng 3D Hardscape (Đá Dragon Stone, Seiryu Rock, Gỗ Lũa, Đền Atlantis) bằng Procedural Mesh hoặc low-poly glTF assets.
  - *Verify*: Các khối đá có khối nổi khối 3D góc cạnh rõ rệt khi xoay góc nhìn.
- [ ] **Task 4.2**: Cây thủy sinh 3D (Amazon Sword, Ludwigia, Rotala) có vertex shader lay động trong nước khi cá bơi lướt qua.
  - *Verify*: Tán lá đung đưa mượt mà theo dòng thủy lưu.
- [ ] **Task 4.3**: Bọt khí oxy 3D bằng `InstancedMesh` hạt bong bóng nổi từ đáy lên mặt nước có ánh xạ phản chiếu.
  - *Verify*: Hàng trăm bọt khí li ti phản quang nổi lên mặt nước.

### Pha 5: Tương tác 3D Raycasting, Laser Toy & Hoàn thiện
- [ ] **Task 5.1**: Tích hợp `THREE.Raycaster` để xử lý tương tác chuột: Nhấp chuột gõ kính làm cá giật mình, click chọn cá để mở bảng Inspector HUD.
  - *Verify*: Click trúng bất kỳ con cá 3D nào đều kích hoạt mở bảng thông tin chi tiết.
- [ ] **Task 5.2**: Con trỏ đèn Laser Toy 3D chiếu tia sáng đỏ xuyên qua cột nước tạo điểm sáng rực rỡ ở đáy hồ.
  - *Verify*: Đàn cá bơi lội đuổi theo điểm sáng laser 3D.
- [ ] **Task 5.3**: Thêm chế độ Camera Cinematic (OrbitControls mượt mà cho phép người dùng tự do xoay 360 độ ngắm bể cá từ mọi góc).
  - *Verify*: Người chơi có thể xoay nhìn từ trên mặt nước xuống hoặc nhìn ngang kính.
- [ ] **Task 5.4**: Kiểm tra Memory Leaks & VRAM disposal (giải phóng buffer khi bán cá hoặc đổi layout bể).
  - *Verify*: Không phát sinh hiện tượng tràn VRAM sau 30 phút chơi liên tục.

---

## 💡 Đề xuất Chiến lược Thực thi (Recommendation)

Thay vì đập đi xây lại toàn bộ cùng một lúc (rất dễ gãy game logic), **chiến lược tối ưu nhất là tiếp cận theo hình thức Hybrid Dual-Engine**:
1. Giữ nguyên toàn bộ cấu trúc hiện tại.
2. Thêm một toggle ở Settings: **`Chế độ Render: [ Canvas 2D (Cổ điển) | Three.js 3D (Next-Gen) ]`**.
3. Người dùng máy yếu/văn phòng vẫn chạy Canvas 2D mượt mà, máy có card đồ họa có thể bật chế độ 3D Three.js để trải nghiệm hiệu ứng đồ họa chân thực đỉnh cao.
