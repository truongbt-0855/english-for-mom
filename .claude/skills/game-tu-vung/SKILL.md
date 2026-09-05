---
name: game-tu-vung
description: Tạo một file game HTML ôn từ vựng tiếng Anh cho học sinh lớp 4 từ một danh sách từ mới. Dùng khi user dán vào một loạt từ tiếng Anh theo chủ đề (ví dụ "astronomer, telescope, galaxy..." hay "lion, tiger, elephant...") và muốn có game cho bé học/ôn. Cũng dùng khi user nói "làm game cho chủ đề này", "thêm chủ đề mới", "tạo game từ vựng".
---

# Tạo game ôn từ vựng cho bé lớp 4

User dán danh sách từ mới → sinh ra **một file `moon/<chuđề>.html` tự chứa**, chạy offline, cài được về điện thoại.

## Cấu trúc repo

```
index.html                       TRANG CHỦ — chia 2 phần, có mảng MOON liệt kê chủ đề
manifest.webmanifest             manifest cũ, start_url trỏ mit/ (giữ cho app đã cài)
manifest-home.webmanifest        manifest của trang chủ
sw.js                            service worker chung cho cả repo
icons/                           icon dùng chung
mit/index.html                   phần của Mít (bé 2 tuổi) — KHÔNG đụng vào
moon/<chuđề>.html                phần của Moon (lớp 4) — mỗi chủ đề một file  ← nơi làm việc
moon/img/                        ảnh thật dùng chung cho các game của Moon
moon/manifest-<chuđề>.webmanifest
```

Hai bé, hai phần riêng: **Mít** (2 tuổi, câu cho mẹ nói) và **Moon** (lớp 4, game từ vựng). Skill này chỉ làm phần của Moon.

## Yêu cầu bất di bất dịch của user

1. **100% câu hỏi phải có hình minh hoạ.** Không có ngoại lệ. Câu nào không có hình to thì 4 lựa chọn phải là hình.
2. **Câu hỏi bằng tiếng Anh**, dùng từ đơn giản cho trẻ lớp 4. Phụ đề tiếng Việt bên dưới.
3. **Đa dạng kiểu câu hỏi** — điền từ còn thiếu, sắp xếp chữ, sắp xếp câu, nghe chọn hình...
4. **Có nhạc** để bé hứng thú.
5. **Giọng đọc tự nhiên.**
6. Kiểu chơi giống wayground.com (Quizizz): đồng hồ, điểm, chuỗi đúng, hiệu ứng.

## Quy trình

### Bước 1 — Đặt tên chủ đề

Nhìn danh sách từ, tự suy ra chủ đề. Đặt `moon/<slug>.html` (`moon/universe.html`, `moon/animals.html`...). Slug tiếng Anh, không dấu, thường một từ.

### Bước 2 — Copy game mới nhất làm nền

```bash
ls -t moon/*.html | head -1        # file mới nhất = bản có đủ mọi bản vá
cp moon/universe.html moon/<slug>.html
cp moon/manifest-universe.webmanifest moon/manifest-<slug>.webmanifest
```

**Không viết lại engine từ đầu.** File cũ đã chứa: 9 kiểu câu hỏi, gợi ý 3 mức, nhạc WebAudio, chấm giọng đọc, game ghép hình, màn kết quả, và các bản vá đã tốn công tìm ra. Chỉ thay phần dữ liệu.

Cần sửa 5 chỗ:

| Chỗ | Sửa gì |
|---|---|
| `const TOPIC={...}` | `id`, `name`, `vi`, `em`, và toàn bộ `words[]` |
| `const ART={...}` | Hình SVG cho các từ không có ảnh thật |
| `<title>`, `.logo`, `.hero`, thẻ `<link rel="manifest">` | Tên và emoji chủ đề |
| `moon/manifest-<slug>.webmanifest` | Đổi `name`, `description`, `start_url` thành `<slug>.html` |
| **`index.html` — mảng `MOON`** | Thêm đúng một dòng, nếu không sẽ không ai vào được game |

```js
// trong index.html, mảng MOON
{ file:"moon/animals.html", em:"🦁", en:"Animals", vi:"Động vật", n:18 },
```

### Bước 3 — Viết dữ liệu từ

Xem `references/du-lieu-tu.md` để biết đủ 10 field bắt buộc và cách viết câu ví dụ / gợi ý.

### Bước 4 — Ảnh thật (làm trước khi vẽ SVG)

```bash
node .claude/skills/game-tu-vung/scripts/tim-anh.js "telescope,galaxy,comet"
```

Script tải ứng viên về `<scratchpad>/anh/` và tạo `contact-sheet.html`.

> **BẮT BUỘC mở ảnh contact sheet ra xem bằng mắt trước khi chọn.**
> Kinh nghiệm thật: NASA trả về sai rất nhiều — tìm "astronomer" ra tinh vân, "observatory" ra núi lửa phun trào, "spacecraft" ra **ảnh bàn tiệc buffet**. Ảnh sai nghĩa còn hại hơn không có ảnh. Chụp sheet bằng Chrome headless rồi đọc bằng công cụ Read.

Chọn xong thì cắt 4:3 và nén:

```bash
node .claude/skills/game-tu-vung/scripts/nen-anh.js <thư mục đã chọn> moon/img
```

Ảnh nguồn ~150KB → sau khi nén ~25KB. Cả bộ nên dưới 300KB.

Chi tiết ở `references/anh-that.md`.

### Bước 5 — Vẽ SVG cho các từ còn lại

Từ nào **không** có ảnh đạt thì vẽ. Xem `references/ve-hinh-svg.md` để có sẵn bộ hàm dựng hình (`star4`, `arw`, `sect`, `spiral`, `dash`...) và bảng màu.

Hai loại từ luôn phải vẽ, đừng mất công tìm ảnh:
- **Từ trừu tượng** (`gravity`, `orbit`, `distance`, `diameter`, `unique`, `matter`, `core`): không tồn tại ảnh chụp nào dạy được nghĩa. Phải vẽ sơ đồ có mũi tên chỉ vào đúng khái niệm.
- **Từ dễ nhầm nhau**: hình vẽ phóng đại được đặc điểm riêng (sao chổi có đuôi sáng, thiên thạch có hố va chạm), ảnh thật thì cả ba đều là cục đá xám giống hệt.

### Bước 6 — Kiểm tra

```bash
node .claude/skills/game-tu-vung/scripts/kiem-tra.js moon/<slug>.html
```

9 nhóm test. Phải xanh hết mới đi tiếp. Test tự kiểm luôn cả `sw.js` lẫn thẻ trên trang chủ nên quên bước nào nó báo ngay.

Rồi chạy thật trong trình duyệt — test tĩnh không bắt được lỗi vòng chơi:

```bash
node .claude/skills/game-tu-vung/scripts/tu-choi.js moon/<slug>.html
```

Script tự chơi hết một lượt, kiểm tra không kẹt câu, không lỗi console, điểm giảm đúng bậc theo gợi ý.

Cuối cùng chụp màn hình bằng Chrome headless và **tự nhìn** — test không thấy được hình xấu, chữ tràn, ảnh cắt mất chủ thể.

### Bước 7 — Deploy

1. Thêm `moon/<slug>.html`, `moon/manifest-<slug>.webmanifest` và từng file `moon/img/*.jpg` vào `ASSETS` trong `sw.js`, **tăng số version cache** (`efm-v4` → `efm-v5`), nếu không máy cũ sẽ giữ bản cache cũ.
2. Commit, push lên `main`.
3. Đợi Pages build rồi **verify link thật bằng curl + chụp màn hình**, đừng chỉ tin là đã push.

Link công khai: `https://truongbt-0855.github.io/english-for-mom/moon/<slug>.html`
(project site → có tên repo ở giữa; mọi đường dẫn trong file phải là **tương đối**)

## Những lỗi đã từng mắc — đừng lặp lại

**Chữ tiếng Anh trong SVG làm lộ đáp án.** Câu "xem hình chọn từ" mà hình có sẵn chữ thì hỏng. Ký hiệu `?`, mũi tên, số thì được. Test có chặn.

**Gợi ý mức 1 và 2 không được chứa chính từ đó.** Hai mức đó chỉ *mô tả* nghĩa; mức 3 mới ghi thẳng nghĩa tiếng Việt. Test có chặn.

**Độ khó phải tăng theo vị trí trong lượt, không theo số lần quét hết bộ từ.** Lỗi cũ: chia độ khó theo "pass" nên lượt 38 câu chỉ vừa 2 pass → 2 kiểu câu hỏi khó không bao giờ xuất hiện, lượt 20 câu chỉ dùng ~4/9 kiểu. Test nhóm 7 chặn cái này.

**Xoá hẹn giờ tự-chuyển-câu khi sang câu mới.** Lỗi cũ: bé trả lời nhanh thì timer 2.6s của câu trước nổ và đẩy qua câu kế, làm mất câu (chơi 38 câu chỉ đi được 34). `nextQ()` phải gọi `clearFbTimers()`.

**Từ có 2 chữ (`space probe`, `solar system`) không dùng được kiểu xếp chữ rời.** Và từ dài mới gặp lần đầu cũng không nên bắt xếp chữ.

**Viết hoa đầu câu ví dụ.** Từ điền vào chỗ trống có thể nằm ngay đầu câu → `cap()`.

**Đường dẫn phải tương đối, và file game nằm sâu một cấp.** Repo deploy kiểu project site (`user.github.io/<repo>/`) nên viết `/sw.js` là vỡ hết. File trong `moon/` phải trỏ `../icons/`, `../sw.js`; riêng ảnh và manifest thì cùng cấp nên vẫn là `img/...` và `manifest-<slug>.webmanifest`. Copy từ file game cũ thì đã đúng sẵn.

## Khi test báo lỗi

Đừng vội kết luận app hỏng. Đã có lần script test báo "câu xếp chữ chấm 0 điểm" nhưng thật ra là test đọc điểm trước khi hàm kiểm tra chạy xong (nó chạy trễ 180ms). Trước khi sửa code, hãy in ra giá trị thật đang được so sánh để xác minh lỗi nằm ở đâu.
