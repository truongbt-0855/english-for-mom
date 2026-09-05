# Dùng ảnh thật

User muốn ảnh chân thực. Nhưng chỉ khoảng **một nửa số từ** là tìm được ảnh dùng được — phần còn lại phải vẽ. Đừng cố nhồi ảnh cho đủ.

## Nguồn ảnh

**NASA Image Library** — `https://images-api.nasa.gov/search?media_type=image&q=<từ khoá>`

Public domain, dùng thoải mái, không cần xin phép. Ghi nguồn ở chân trang là đủ lịch sự.

Chỉ tốt cho chủ đề không gian / khoa học / trái đất. Chủ đề khác (động vật, đồ ăn, đồ dùng học tập…) thì NASA không có gì — phải tìm nguồn public-domain khác, hoặc vẽ SVG hết. **Không lấy ảnh có bản quyền từ Google Images.**

## Quy trình

```bash
# 1. tải ứng viên (3 ảnh mỗi từ)
node .claude/skills/game-tu-vung/scripts/tim-anh.js "telescope,galaxy,comet" <scratchpad>/anh

# tự đặt từ khoá tìm nếu tên từ không ra kết quả tốt:
node …/tim-anh.js "comet=Comet NEOWISE,probe=Voyager spacecraft" <scratchpad>/anh
```

```bash
# 2. chụp contact sheet rồi ĐỌC BẰNG MẮT
chrome --headless --disable-gpu --hide-scrollbars --allow-file-access-from-files \
  --virtual-time-budget=8000 --screenshot=<scratchpad>/sheet.png --window-size=700,2000 \
  "file:///<scratchpad>/anh/contact-sheet.html"
# rồi dùng công cụ Read để xem sheet.png
```

```bash
# 3. copy những ảnh đã chọn sang một thư mục riêng, đổi tên theo khoá `art` của từ
#    (observatory.jpg, galaxy.jpg…) rồi cắt 4:3 + nén
node .claude/skills/game-tu-vung/scripts/nen-anh.js <scratchpad>/da-chon img
```

```bash
# 4. gắn vào dữ liệu: thêm  photo:"galaxy.jpg"  vào từ tương ứng
# 5. thêm từng file img/*.jpg vào ASSETS trong sw.js + tăng version cache
```

## Bước xem bằng mắt là bắt buộc

NASA search trả về sai rất nhiều. Số liệu thật từ lần làm chủ đề Vũ trụ — tìm 3 đợt, 9 bộ từ khoá khác nhau cho 12 từ:

| Từ khoá tìm | Ảnh nhận được |
|---|---|
| `astronomer` | 3 ảnh **tinh vân**, không có người |
| `observatory dome building` | ảnh **núi lửa đang phun trào** |
| `space shuttle launch` | ảnh **bàn tiệc buffet** (!) |
| `ground telescope` | giàn giáo bệ phóng |
| `Comet NEOWISE` | trường sao mờ, không thấy đuôi |

Kết quả cuối: **9/19 từ** dùng được ảnh. `astronomer`, `telescope`, `comet` tìm 3 đợt vẫn không ra ảnh nào bé lớp 4 nhìn vào hiểu được → giữ hình vẽ.

Ảnh sai nghĩa **hại hơn** không có ảnh: bé nhìn tinh vân rồi học rằng "astronomer" nghĩa là đám mây màu. Thà vẽ.

## Chuẩn kỹ thuật

- **Cắt 4:3, 480×360.** Trùng tỉ lệ với `viewBox` của SVG nên ảnh và hình vẽ nằm cạnh nhau không giật cục. Script cắt kiểu *cover* (phóng vừa đủ rồi cắt giữa), không bóp méo.
- **Mỗi ảnh ~25KB, cả bộ dưới 300KB.** Ảnh gốc NASA 150–450KB/tấm là quá nặng cho điện thoại dùng 3G. Lần đầu tao lấy nguyên gốc: 1.45MB cho 9 ảnh, nén xuống còn 239KB — nhẹ hơn 6 lần mà nhìn không khác gì ở kích thước hiển thị.
- **Sau khi cắt phải xem lại lần nữa.** Ảnh dọc (tỉ lệ 480×662) cắt về 4:3 có thể chặt mất đầu tên lửa.

## Hình dự phòng

Từ dùng ảnh thật thì **vẫn giữ hình vẽ SVG** trong `ART`. `artOf()` gắn `onerror` để ảnh lỗi (mất mạng, cache hụt) thì tự rơi về hình vẽ — giữ đúng quy tắc "100% câu có hình" cả khi ảnh chết. Test bắt lỗi nếu từ có `photo` mà thiếu hình vẽ dự phòng.

## Ghi nguồn

Chân trang chính có dòng: `Ảnh thật: NASA (public domain) · Từ trừu tượng dùng hình vẽ minh hoạ`. Đổi tên nguồn nếu dùng nguồn khác.
