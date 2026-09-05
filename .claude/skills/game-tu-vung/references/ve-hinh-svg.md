# Vẽ hình minh hoạ bằng SVG

Hình vẽ tay bằng SVG nội tuyến, **không tải ảnh** → chạy offline tuyệt đối, không bao giờ vỡ ảnh, mỗi hình chỉ vài trăm byte.

Khung chuẩn: `viewBox="0 0 160 120"` (tỉ lệ 4:3, khớp với ảnh thật đã nén 480×360).

## Ba quy tắc không được phá

**1. Không đặt chữ tiếng Anh trong hình.** Câu "xem hình chọn từ" sẽ lộ đáp án ngay. Ký hiệu `?`, mũi tên, số, vạch đo thì được. Test chặn mọi `<text>` chứa từ 2 chữ cái trở lên.

**2. Không dùng `id` hay `<defs>`.** Cùng một hình có thể xuất hiện 2–4 lần trên màn hình (4 ô lựa chọn), `id` trùng là gradient/mask hỏng hết. Cần loang sáng thì xếp nhiều vòng tròn mờ chồng nhau (`glow()`), đừng dùng `radialGradient`.

**3. Từ trừu tượng phải vẽ sơ đồ, không vẽ vật.** `gravity` không phải là quả táo — nó là *lực kéo*. Nên hình phải có mũi tên chỉ hướng hút. `diameter` là *đường kẻ qua tâm*, phải có mũi tên hai đầu và điểm tâm.

## Bộ hàm dựng hình có sẵn

Đã nằm sẵn trong file game, dùng lại được ngay:

| Hàm | Dùng để |
|---|---|
| `svg(inner)` | Bọc ngoài, tự thêm nền + sao |
| `st(x,y,r,o)` | Một ngôi sao nhỏ (đốm trắng) |
| `glow(x,y,r,màu,độ_mờ)` | Vòng sáng mờ — xếp nhiều lớp thành hiệu ứng phát sáng |
| `star4(x,y,tỉ_lệ,màu)` | Ngôi sao 4 cánh có quầng sáng |
| `arw(x1,y1,x2,y2,màu,dày)` | **Mũi tên** — tự tính góc đầu mũi. Xương sống của mọi hình trừu tượng |
| `dash(path,màu,dày)` | Đường kẻ nét đứt (quỹ đạo, đường đo) |
| `sect(cx,cy,r,góc1,góc2,màu)` | Hình quạt — cắt quả cầu để lộ lớp bên trong (`core`) |
| `spiral(x,y,tỉ_lệ,góc)` | Xoắn ốc kiểu thiên hà |

`BG` là nền trời đêm + 15 ngôi sao, `svg()` tự chèn. Nếu chủ đề không phải không gian (động vật, đồ ăn…) thì **sửa `BG`** cho phù hợp: đổi màu nền, bỏ sao, thêm mặt đất/trời xanh.

## Bảng màu

```
Nền trời      #0D1436     Đất/đá      #8E8378 / #6E655C
Kim loại      #EDF1FA / #9FB0D4        Trắng sáng  #fff
Mũi tên nhấn  #3DE0C0     Nét đứt     #8FA0D8
Vàng/nắng     #FFC63D / #FFE58A        Hồng nhấn   #FF5B7F
Xanh dương    #2E7BD6 / #3AC8F5        Xanh lá     #4FBF7A
Tím           #7C6CF0 / #B79BFF        Đỏ          #F2544B
```

## Mẫu vẽ từ trừu tượng

Đây là phần khó nhất, chép cách làm:

```js
/* gravity — lực kéo: quả táo rơi + 3 mũi tên hút xuống trái đất */
gravity: svg(
  st(22,18,1.4,.8) +
  `<circle cx="80" cy="152" r="70" fill="#2E7BD6"/>` +              // trái đất nhô từ dưới
  `<path d="M42 99c11 6 22-2 33 2s20 7 31 2 10 0 16 4" fill="none"
      stroke="#4FBF7A" stroke-width="9" stroke-linecap="round"/>` + // lục địa
  `<circle cx="80" cy="30" r="12.5" fill="#F2544B"/>` +             // quả táo
  arw(48,46,48,74) + arw(80,50,80,80,"#3DE0C0",3.2) + arw(112,46,112,74)),

/* diameter — đường kẻ qua tâm: mũi tên hai đầu + điểm tâm */
diameter: svg(
  `<circle cx="80" cy="62" r="40" fill="#7C6CF0"/>` +
  arw(80,62,120,62,"#3DE0C0",3) + arw(80,62,40,62,"#3DE0C0",3) +    // hai chiều từ tâm
  `<circle cx="80" cy="62" r="3.6" fill="#fff"/>` +                 // điểm tâm
  dash("M40 44h80","#3DE0C0",1.8)),

/* unique — độc nhất: bốn cái xám giống nhau, một cái khác biệt lấp lánh */
unique: svg(
  `<circle cx="26" cy="86" r="12" fill="#6E7590"/><circle cx="58" cy="86" r="12" fill="#6E7590"/>` +
  `<circle cx="102" cy="86" r="12" fill="#6E7590"/><circle cx="134" cy="86" r="12" fill="#6E7590"/>` +
  glow(80,48,34,"#3DE0C0",.18) +
  `<circle cx="80" cy="48" r="22" fill="#2E7BD6"/>` +
  star4(110,26,.55) + star4(50,26,.46)),
```

Ý tưởng chung: **so sánh, mũi tên, cắt lớp, đo đạc** — bốn thủ pháp giải thích được gần hết từ trừu tượng.
- `distance` → hai vật + mũi tên đo hai chiều + dấu `?`
- `surface` → mặt cắt, tô sáng lớp trên cùng, mũi tên chỉ vào
- `core` → `sect()` cắt quạt, ba lớp đồng tâm, mũi tên chỉ vào giữa
- `orbit` → `dash()` hình ellipse + mũi tên chỉ chiều chạy
- `matter` → ba khung: cục đá, giọt nước, đám khí

## Kiểm hình bằng mắt

Toạ độ tự tính rất dễ lệch. Sau khi vẽ, **luôn render ra ảnh rồi tự nhìn**:

```bash
# dựng một trang chứa hết hình, chụp lại, rồi đọc bằng công cụ Read
node -e "…dựng contact sheet từ ART…" && chrome --headless --screenshot=…
```

Những lỗi chỉ nhìn mới thấy, test không bắt được:
- màu tô tràn ra ngoài hình (nét vẽ lục địa chìa khỏi quả cầu)
- quầng sáng quá mạnh che mất chủ thể
- chi tiết quá nhỏ, xuống ô lựa chọn 140px là mất hút
- hai hình khác nghĩa mà trông giống nhau
