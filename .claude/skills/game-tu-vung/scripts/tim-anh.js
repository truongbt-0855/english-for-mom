/* Tìm ảnh thật public-domain của NASA cho một danh sách từ.
 *   node tim-anh.js "telescope,galaxy,comet" [thư-mục-ra]
 *   node tim-anh.js "comet=Comet NEOWISE,galaxy=spiral galaxy Hubble"   (tự đặt từ khoá tìm)
 *
 * Tải về mỗi từ vài ứng viên rồi dựng contact-sheet.html.
 * BẮT BUỘC mở sheet xem bằng mắt rồi mới chọn — NASA trả về sai rất nhiều.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const arg = process.argv[2];
if (!arg) {
  console.error('Thiếu tham số. Ví dụ: node tim-anh.js "telescope,galaxy,comet"');
  process.exit(2);
}
const OUT = path.resolve(process.argv[3] || "anh-ung-vien");
const PER = 3;                                  // số ứng viên mỗi từ

const items = arg.split(",").map((s) => s.trim()).filter(Boolean).map((s) => {
  const i = s.indexOf("=");
  return i > 0 ? { key: s.slice(0, i).trim(), q: s.slice(i + 1).trim() } : { key: s, q: s };
});

const get = (url, redirects = 0) => new Promise((res, rej) => {
  if (redirects > 5) return rej(new Error("chuyển hướng quá nhiều"));
  https.get(url, { headers: { "User-Agent": "node" } }, (r) => {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
      r.resume();
      return get(r.headers.location, redirects + 1).then(res, rej);
    }
    const c = [];
    r.on("data", (d) => c.push(d));
    r.on("end", () => res({ status: r.statusCode, buf: Buffer.concat(c) }));
  }).on("error", rej);
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const meta = {};
  for (const it of items) {
    meta[it.key] = [];
    let r;
    try {
      r = await get("https://images-api.nasa.gov/search?media_type=image&q=" + encodeURIComponent(it.q));
    } catch (e) { console.log(`${it.key}: lỗi mạng (${e.message})`); continue; }
    let coll;
    try { coll = JSON.parse(r.buf.toString()).collection; } catch (e) { console.log(`${it.key}: API trả về không đọc được`); continue; }
    const list = (coll.items || []).filter((x) => x.links && x.links[0]).slice(0, PER);
    let n = 0;
    for (const x of list) {
      const url = x.links[0].href.replace("~thumb.jpg", "~small.jpg");
      let img;
      try { img = await get(url); } catch (e) { continue; }
      if (img.status !== 200 || img.buf.length < 3000) continue;
      const file = `${it.key}_${n}.jpg`;
      fs.writeFileSync(path.join(OUT, file), img.buf);
      meta[it.key].push({
        file, title: (x.data[0].title || "").slice(0, 70),
        center: x.data[0].center || "", id: x.data[0].nasa_id || "",
        kb: Math.round(img.buf.length / 1024),
      });
      n++;
    }
    console.log(`${it.key.padEnd(14)} → ${meta[it.key].length} ảnh   (tìm: "${it.q}")`);
  }

  fs.writeFileSync(path.join(OUT, "ung-vien.json"), JSON.stringify(meta, null, 1));

  const rows = Object.entries(meta).map(([k, arr]) => {
    if (!arr.length) return `<div class="k">${k} — KHÔNG TÌM ĐƯỢC ẢNH NÀO</div>`;
    return `<div class="k">${k}</div><div class="f">` + arr.map((a) =>
      `<figure><img src="${a.file}"><figcaption><b>${a.file.replace(".jpg", "")}</b><br>${a.title}<br>${a.center} · ${a.kb}KB</figcaption></figure>`
    ).join("") + "</div>";
  }).join("\n");

  fs.writeFileSync(path.join(OUT, "contact-sheet.html"), `<!doctype html><meta charset="utf-8">
<style>body{margin:0;background:#161033;font-family:Segoe UI,sans-serif;padding:10px}
.k{color:#ffd84d;font:700 15px/1.8 Segoe UI}
.f{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}
figure{margin:0;width:210px}
img{width:210px;height:158px;object-fit:cover;border-radius:9px;display:block;background:#000}
figcaption{color:#cfc6ec;font-size:10px;line-height:1.3;padding-top:3px}
b{color:#7ef}</style>
${rows}`);

  const total = Object.values(meta).reduce((a, x) => a + x.length, 0);
  console.log(`\nĐã tải ${total} ảnh vào: ${OUT}`);
  console.log(`Xem: ${path.join(OUT, "contact-sheet.html")}`);
  console.log("\n⚠ PHẢI mở sheet ra nhìn bằng mắt trước khi chọn.");
  console.log("  NASA trả về sai rất nhiều: tìm \"astronomer\" ra tinh vân, \"observatory\" ra núi lửa,");
  console.log("  \"spacecraft\" ra ảnh bàn tiệc. Ảnh sai nghĩa hại hơn không có ảnh — thà vẽ SVG.");
})();
