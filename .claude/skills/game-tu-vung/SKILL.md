---
name: game-tu-vung
description: Tạo một file game HTML ôn từ vựng tiếng Anh cho học sinh lớp 4 từ một danh sách từ mới. Dùng khi user dán vào một loạt từ tiếng Anh theo chủ đề (ví dụ "astronomer, telescope, galaxy..." hay "lion, tiger, elephant...") và muốn có game cho bé học/ôn. Cũng dùng khi user nói "làm game cho chủ đề này", "thêm chủ đề mới", "tạo game từ vựng".
---

# Tạo game ôn từ vựng cho bé lớp 4

User dán danh sách từ mới → sinh ra **một file `game_<chuđề>.html` tự chứa**, chạy offline, cài được về điện thoại.

## Yêu cầu bất di bất dịch của user

1. **100% câu hỏi phải có hình minh hoạ.** Không có ngoại lệ. Câu nào không có hình to thì 4 lựa chọn phải là hình.
2. **Câu hỏi bằng tiếng Anh**, dùng từ đơn giản cho trẻ lớp 4. Phụ đề tiếng Việt bên dưới.
3. **Đa dạng kiểu câu hỏi** — điền từ còn thiếu, sắp xếp chữ, sắp xếp câu, nghe chọn hình...
4. **Có nhạc** để bé hứng thú.
5. **Giọng đọc tự nhiên.**
6. Kiểu chơi giống wayground.com (Quizizz): đồng hồ, điểm, chuỗi đúng, hiệu ứng.

## Quy trình

### Bước 1 — Đặt tên chủ đề

Nhìn danh sách từ, tự suy ra chủ đề. Đặt `game_<slug>.html` ở gốc repo (`game_universe.html`, `game_animals.html`...). Slug tiếng Anh, không dấu, thường một từ.

### Bước 2 — Copy game mới nhất làm nền

```bash
ls -t game_*.html | head -1        # file mới nhất = bản có đủ mọi bản vá
cp game_universe.html game_<slug>.html
```

**Không viết lại engine từ đầu.** File cũ đã chứa: 9 kiểu câu hỏi, gợi ý 3 mức, nhạc WebAudio, chấm giọng đọc, game ghép hình, màn kết quả, và các bản vá đã tốn công tìm ra. Chỉ thay phần dữ liệu.

Chỉ cần sửa 4 chỗ:

| Chỗ | Sửa gì |
|---|---|
| `const TOPIC={...}` | `id`, `name`, `vi`, `em`, và toàn bộ `words[]` |
| `const ART={...}` | Hình SVG cho các từ không có ảnh thật |
| `<title>`, `.logo`, `.hero` | Tên và emoji chủ đề |
| `manifest-<slug>.webmanifest` | Copy từ manifest cũ, đổi `name` và `start_url` |

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
node .claude/skills/game-tu-vung/scripts/nen-anh.js <thư mục đã chọn> img
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
node .claude/skills/game-tu-vung/scripts/kiem-tra.js game_<slug>.html
```

9 nhóm test. Phải xanh hết mới đi tiếp.

Rồi chạy thật trong trình duyệt — test tĩnh không bắt được lỗi vòng chơi:

```bash
node .claude/skills/game-tu-vung/scripts/tu-choi.js game_<slug>.html
```

Script tự chơi hết một lượt, kiểm tra không kẹt câu, không lỗi console, điểm giảm đúng bậc theo gợi ý.

Cuối cùng chụp màn hình bằng Chrome headless và **tự nhìn** — test không thấy được hình xấu, chữ tràn, ảnh cắt mất chủ thể.

### Bước 7 — Deploy

1. Thêm file game + thư mục `img/` vào `ASSETS` trong `sw.js`, **tăng số version cache** (`efm-v3` → `efm-v4`), nếu không máy cũ sẽ giữ bản cache cũ.
2. Commit, push lên `main`.
3. Đợi Pages build rồi **verify link thật bằng curl + chụp màn hình**, đừng chỉ tin là đã push.

## Những lỗi đã từng mắc — đừng lặp lại

**Chữ tiếng Anh trong SVG làm lộ đáp án.** Câu "xem hình chọn từ" mà hình có sẵn chữ thì hỏng. Ký hiệu `?`, mũi tên, số thì được. Test có chặn.

**Gợi ý mức 1 và 2 không được chứa chính từ đó.** Hai mức đó chỉ *mô tả* nghĩa; mức 3 mới ghi thẳng nghĩa tiếng Việt. Test có chặn.

**Độ khó phải tăng theo vị trí trong lượt, không theo số lần quét hết bộ từ.** Lỗi cũ: chia độ khó theo "pass" nên lượt 38 câu chỉ vừa 2 pass → 2 kiểu câu hỏi khó không bao giờ xuất hiện, lượt 20 câu chỉ dùng ~4/9 kiểu. Test nhóm 7 chặn cái này.

**Xoá hẹn giờ tự-chuyển-câu khi sang câu mới.** Lỗi cũ: bé trả lời nhanh thì timer 2.6s của câu trước nổ và đẩy qua câu kế, làm mất câu (chơi 38 câu chỉ đi được 34). `nextQ()` phải gọi `clearFbTimers()`.

**Từ có 2 chữ (`space probe`, `solar system`) không dùng được kiểu xếp chữ rời.** Và từ dài mới gặp lần đầu cũng không nên bắt xếp chữ.

**Viết hoa đầu câu ví dụ.** Từ điền vào chỗ trống có thể nằm ngay đầu câu → `cap()`.

**Đường dẫn phải tương đối.** Repo deploy kiểu project site (`user.github.io/<repo>/`), viết `/sw.js` là vỡ hết.

## Khi test báo lỗi

Đừng vội kết luận app hỏng. Đã có lần script test báo "câu xếp chữ chấm 0 điểm" nhưng thật ra là test đọc điểm trước khi hàm kiểm tra chạy xong (nó chạy trễ 180ms). Trước khi sửa code, hãy in ra giá trị thật đang được so sánh để xác minh lỗi nằm ở đâu.
