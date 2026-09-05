# Cách viết dữ liệu cho một từ

Mỗi từ là một object trong `TOPIC.words[]`. **Đủ 10 field, thiếu một cái là test đỏ.**

```js
{en:"comet", art:"comet", photo:"comet.jpg", ipa:"/ˈkɒmɪt/", vi:"sao chổi",
 hint:"Khối băng và bụi, kéo theo một cái đuôi dài phát sáng.",
 def:"A ball of ice and dust with a long, bright tail.",
 sent:"The ___ has a long, bright tail of ice and dust.",
 sq:"The comet has a long tail.",
 t:"A comet has a long, bright tail.", f:"A comet has no tail at all."},
```

| Field | Là gì | Quy tắc |
|---|---|---|
| `en` | Từ tiếng Anh | Viết thường, đúng như user đưa |
| `art` | Khoá trỏ vào `ART` | Một từ, không dấu cách (`solar system` → `solarsystem`) |
| `photo` | Tên file trong `img/` | **Tuỳ chọn.** Có thì dùng ảnh thật, không có thì dùng hình vẽ |
| `ipa` | Phiên âm | Có dấu `/.../` hai đầu |
| `vi` | Nghĩa tiếng Việt | Ngắn gọn. Đây là **gợi ý mức 3** |
| `hint` | Mô tả nghĩa bằng tiếng Việt | Đây là **gợi ý mức 2**. Xem quy tắc dưới |
| `def` | Mô tả nghĩa bằng tiếng Anh | Đây là **gợi ý mức 1**, và là đề bài của kiểu "đọc nghĩa chọn từ" |
| `sent` | Câu điền từ còn thiếu | **Phải có `___`** đúng chỗ của từ |
| `sq` | Câu để bé sắp xếp | **Phải chứa chính từ đó**. 5–7 từ |
| `t` / `f` | Một câu đúng và một câu sai | Dùng cho kiểu Đúng/Sai |

## Quy tắc bắt buộc

**`hint` và `def` KHÔNG được chứa chính từ đó.** Hai cái này là gợi ý mức 1 và 2 — chỉ *mô tả* nghĩa. Nếu chứa từ đó thì bé đọc gợi ý là biết đáp án ngay, mà vẫn bị trừ điểm. Test chặn cái này.

```
✗ hint:"Sao chổi là khối băng có đuôi dài."     ← lộ luôn đáp án
✓ hint:"Khối băng và bụi, kéo theo một cái đuôi dài phát sáng."
```

**`def` phải dùng từ đơn giản, dưới 18 chữ.** Bé lớp 4 đọc được. Test đếm số chữ.

```
✗ def:"An icy small Solar System body that releases gas when passing close to the Sun."
✓ def:"A ball of ice and dust with a long, bright tail."
```

**`t` và `f` phải rõ ràng đúng/sai**, đừng mơ hồ. Câu sai nên sai hẳn để bé không tranh cãi được.

```
✓ t:"A comet has a long, bright tail."
✓ f:"A comet has no tail at all."
✗ f:"A comet is quite big."               ← to là bao nhiêu? mơ hồ
```

**`sq` viết ngắn, 5–7 từ, không dấu phẩy.** Bé phải kéo từng ô chữ, dài quá thì mệt và tràn màn hình điện thoại. Test chặn quá 9 từ.

```
✓ sq:"The comet has a long tail."
✗ sq:"The comet, made of ice and dust, has a very long bright tail."
```

**`sent` để dấu `___` đúng vị trí ngữ pháp.** Từ có thể nằm đầu câu — engine tự viết hoa bằng `cap()` khi hiện câu ví dụ, không cần tự viết hoa trong dữ liệu.

```
✓ sent:"___ makes the apple fall down from the tree."       (gravity)
✓ sent:"The ___ has a long, bright tail of ice and dust."   (comet)
```

## Từ có hai chữ

`space probe`, `solar system`… vẫn dùng được bình thường, engine tự loại chúng khỏi kiểu xếp chữ rời. Nhớ `art` phải bỏ dấu cách: `art:"probe"`, `art:"solarsystem"`.

## Số lượng từ

Cần **tối thiểu 6 từ** để dựng được 4 lựa chọn có 3 đáp án nhiễu. Ngọt nhất là 15–20 từ một chủ đề.

## Đừng để hai từ quá giống nhau về hình

Nếu chủ đề có `asteroid`, `meteorite`, `comet` — ba cục đá trong không gian — thì hình phải phóng đại đặc điểm riêng, nếu không bé không phân biệt được ở câu "chọn hình đúng". Ảnh thật hay bị lỗi này (đều là đá xám), hình vẽ thì chủ động tô đậm được nét riêng.
