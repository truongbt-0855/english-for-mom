/* Kiểm tra một file game từ vựng.
 *   node kiem-tra.js game_universe.html
 * Chạy toàn bộ script của file trong một DOM giả rồi soi dữ liệu và bộ sinh câu hỏi.
 * Thoát mã 1 nếu có lỗi.
 */
const fs = require("fs");
const path = require("path");

const target = process.argv[2];
if (!target) { console.error("Thiếu tham số: node kiem-tra.js <file.html>"); process.exit(2); }
const FILE = path.resolve(target);
if (!fs.existsSync(FILE)) { console.error("Không thấy file: " + FILE); process.exit(2); }
const DIR = path.dirname(FILE);
const IMGDIR = path.join(DIR, "img");

const html = fs.readFileSync(FILE, "utf8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("File không có khối <script>"); process.exit(2); }
const code = m[1];

/* ---------- DOM giả: mọi element là proxy nuốt mọi thao tác ---------- */
const store = {};
function fakeEl() {
  const self = {
    innerHTML: "", textContent: "", value: "", hidden: false, disabled: false, className: "",
    style: new Proxy({ setProperty() {} }, { get: (t, k) => (k in t ? t[k] : ""), set: (t, k, v) => (t[k] = v, true) }),
    dataset: {}, offsetWidth: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, appendChild() {}, remove() {},
    addEventListener() {}, querySelector: () => fakeEl(), querySelectorAll: () => [],
    closest: () => null, onclick: null, oninput: null, onchange: null,
  };
  self.firstElementChild = { style: { width: "" }, classList: self.classList };
  return self;
}
const els = {};
global.document = {
  getElementById: (id) => (els[id] = els[id] || fakeEl()),
  createElement: () => fakeEl(),
  addEventListener() {}, querySelectorAll: () => [],
  body: { appendChild() {} }, hidden: false,
};
global.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)) };
global.speechSynthesis = { getVoices: () => [], cancel() {}, speak() {}, onvoiceschanged: null };
global.SpeechSynthesisUtterance = function () {};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 0;
global.cancelAnimationFrame = () => {};
global.setInterval = () => 0;
global.clearInterval = () => {};
global.setTimeout = () => 0;
global.confirm = () => false;
global.alert = () => {};
global.addEventListener = () => {};
global.navigator = {};
global.scrollTo = () => {};
global.location = { href: "" };
global.window = global;
global.window.AudioContext = null;
global.window.webkitAudioContext = null;

const probe = `\n;module.exports={ART,WORDS,TOPIC,makeQ,buildRound,LABEL,EASY,MID,HARD,single,others,shuffle,artOf,hintText,HINT_MULT};`;
const mod = { exports: {} };
try {
  new Function("module", "exports", code + probe)(mod, mod.exports);
} catch (e) {
  console.error("✗ Script trong file lỗi ngay khi chạy: " + e.message);
  process.exit(1);
}
const G = mod.exports;

let fail = 0;
const bad = (s) => { console.log("  ✗ " + s); fail++; };
const ok = (s) => console.log("  ✓ " + s);
const sec = (s) => console.log("\n" + s);

console.log("Kiểm tra: " + path.basename(FILE) + "  —  chủ đề \"" + G.TOPIC.name + "\", " + G.WORDS.length + " từ");

/* ===== 1. Dữ liệu từ ===== */
sec("[1] Dữ liệu từ");
{
  const need = ["en", "art", "ipa", "vi", "def", "sent", "sq", "t", "f", "hint"];
  const f0 = fail;
  const seen = new Set();
  G.WORDS.forEach((w) => {
    need.forEach((k) => { if (!w[k] || !String(w[k]).trim()) bad(`${w.en || "?"}: thiếu field "${k}"`); });
    if (seen.has(w.en)) bad(`từ "${w.en}" bị lặp`); seen.add(w.en);
    if (!w.photo && !G.ART[w.art]) bad(`${w.en}: không có ảnh mà cũng không có hình vẽ ART["${w.art}"]`);
    if (w.sent && w.sent.indexOf("___") < 0) bad(`${w.en}: câu điền từ thiếu chỗ trống ___`);
    if (w.sq && w.sq.toLowerCase().indexOf(w.en.toLowerCase()) < 0) bad(`${w.en}: câu sắp xếp không chứa chính từ đó`);
    if (w.t && w.f && w.t === w.f) bad(`${w.en}: câu Đúng và câu Sai giống nhau`);
  });
  if (G.WORDS.length < 6) bad(`chỉ có ${G.WORDS.length} từ — quá ít để dựng 4 lựa chọn`);
  if (fail === f0) ok(`${G.WORDS.length} từ, đủ 10 field, không trùng lặp`);
}

/* ===== 2. Hình vẽ SVG ===== */
sec("[2] Hình vẽ SVG");
{
  const f0 = fail;
  const wellFormed = (s) => {
    const st = [], re = /<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
    let x;
    while ((x = re.exec(s))) {
      if (x[1]) { if (st.pop() !== x[2]) return `đóng sai ở </${x[2]}>`; }
      else if (!x[4]) st.push(x[2]);
    }
    return st.length ? "chưa đóng thẻ: " + st.join(",") : null;
  };
  Object.entries(G.ART).forEach(([k, s]) => {
    const e = wellFormed(s);
    if (e) bad(`ART.${k}: ${e}`);
    if (!/^<svg /.test(s) || !/<\/svg>$/.test(s)) bad(`ART.${k}: không mở/đóng bằng <svg>`);
    if (/NaN|undefined/.test(s)) bad(`ART.${k}: có NaN/undefined trong toạ độ`);
    // chữ trong hình sẽ lộ đáp án của câu "xem hình chọn từ"
    [...s.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].forEach((t) => {
      if (/[a-zA-Z]{2}/.test(t[1])) bad(`ART.${k}: hình chứa chữ "${t[1]}" → lộ đáp án`);
    });
  });
  // từ dùng ảnh thật vẫn giữ hình vẽ làm dự phòng khi ảnh lỗi, nên vẫn tính là có dùng
  const used = new Set(G.WORDS.map((w) => w.art));
  Object.keys(G.ART).forEach((k) => { if (!used.has(k)) bad(`ART.${k} không từ nào dùng tới`); });
  G.WORDS.filter((w) => w.photo).forEach((w) => {
    if (!G.ART[w.art]) bad(`${w.en}: dùng ảnh thật nhưng không có hình vẽ dự phòng ART["${w.art}"]`);
  });
  if (fail === f0) ok(`${Object.keys(G.ART).length} hình SVG hợp lệ, không chứa chữ lộ đáp án`);
}

/* ===== 3. Ảnh thật ===== */
sec("[3] Ảnh thật");
{
  const f0 = fail;
  const withPhoto = G.WORDS.filter((w) => w.photo);
  withPhoto.forEach((w) => {
    const p = path.join(IMGDIR, w.photo);
    if (!fs.existsSync(p)) return bad(`${w.en}: thiếu file img/${w.photo}`);
    const b = fs.readFileSync(p);
    if (b.length < 4000) bad(`${w.en}: ảnh chỉ ${b.length} byte — nhiều khả năng hỏng`);
    const jpg = b[0] === 0xff && b[1] === 0xd8;
    const png = b[0] === 0x89 && b[1] === 0x50;
    if (!jpg && !png) bad(`${w.en}: không phải JPEG/PNG hợp lệ`);
    const tag = G.artOf(w);
    if (!/^<img /.test(tag)) bad(`${w.en}: có photo nhưng artOf không trả về <img>`);
    if (!tag.includes(`src="img/${w.photo}"`)) bad(`${w.en}: đường dẫn ảnh sai trong thẻ img`);
    if (/src="\//.test(tag)) bad(`${w.en}: đường dẫn tuyệt đối sẽ vỡ trên GitHub project site`);
  });
  G.WORDS.filter((w) => !w.photo).forEach((w) => {
    if (!/^<svg /.test(G.artOf(w))) bad(`${w.en}: artOf không trả về hình vẽ`);
  });
  if (fs.existsSync(IMGDIR)) {
    const usedImg = new Set(withPhoto.map((w) => w.photo));
    fs.readdirSync(IMGDIR).forEach((n) => { if (!usedImg.has(n)) bad(`img/${n} không từ nào dùng tới`); });
    const tot = withPhoto.reduce((a, w) => a + fs.statSync(path.join(IMGDIR, w.photo)).size, 0);
    if (tot > 600 * 1024) bad(`ảnh tổng ${Math.round(tot / 1024)}KB — quá nặng cho điện thoại`);
    else if (withPhoto.length) ok(`${withPhoto.length} ảnh thật, tổng ${Math.round(tot / 1024)}KB`);
  }
  if (fail === f0) ok(`${withPhoto.length} từ dùng ảnh, ${G.WORDS.length - withPhoto.length} từ dùng hình vẽ — không từ nào thiếu hình`);
}

/* ===== 4. Sinh câu hỏi ===== */
sec("[4] Sinh câu hỏi — mọi kiểu × mọi từ");
{
  const f0 = fail, count = {};
  G.WORDS.forEach((w) => {
    Object.keys(G.LABEL).forEach((t) => {
      if ((t === "spell" || t === "scramble") && !G.single(w)) return;
      let q;
      try { q = G.makeQ(w, t); } catch (e) { return bad(`${w.en}/${t}: lỗi ${e.message}`); }
      count[t] = (count[t] || 0) + 1;
      if (!q.ask) bad(`${w.en}/${t}: không có câu hỏi`);
      if (!q.label) bad(`${w.en}/${t}: không có nhãn kiểu`);
      // YÊU CẦU CỐT LÕI: câu nào cũng phải có hình
      if (!q.art && q.kind !== "pic") bad(`${w.en}/${t}: KHÔNG CÓ HÌNH MINH HOẠ`);
      if (q.kind === "text" || q.kind === "tf") {
        if (q.options.indexOf(q.answer) < 0) bad(`${w.en}/${t}: đáp án không nằm trong lựa chọn`);
        if (new Set(q.options).size !== q.options.length) bad(`${w.en}/${t}: lựa chọn bị trùng`);
        if (q.kind === "text" && q.options.length !== 4) bad(`${w.en}/${t}: không đủ 4 lựa chọn`);
      }
      if (q.kind === "pic") {
        if (!q.options.some((o) => o.en === q.answer)) bad(`${w.en}/${t}: hình đúng không có trong lựa chọn`);
        if (q.options.length !== 4) bad(`${w.en}/${t}: không đủ 4 hình`);
        q.options.forEach((o) => { if (!G.artOf(o)) bad(`${w.en}/${t}: một lựa chọn thiếu hình`); });
      }
      if (q.kind === "build") {
        const got = q.cells.map((c) => (c.gap ? " " : c.fixed !== undefined ? c.fixed : c.want))
          .join(q.wordMode ? " " : "").replace(/\s+/g, " ").trim();
        if (got.toLowerCase() !== String(q.answer).toLowerCase())
          bad(`${w.en}/${t}: ghép các ô ra "${got}" ≠ đáp án "${q.answer}"`);
        const pool = q.tiles.slice();
        q.cells.filter((c) => c.want !== undefined).forEach((c) => {
          const i = pool.indexOf(c.want);
          if (i < 0) bad(`${w.en}/${t}: khay thiếu quân "${c.want}"`); else pool.splice(i, 1);
        });
        if (t === "spell" && !q.cells.some((c) => c.fixed !== undefined)) bad(`${w.en}/spell: không chừa sẵn chữ nào`);
        if (t === "scramble" && q.cells.some((c) => c.fixed !== undefined)) bad(`${w.en}/scramble: không được có chữ cho sẵn`);
      }
      if (t === "truefalse" && ["True", "False"].indexOf(q.answer) < 0) bad(`${w.en}: đáp án Đúng/Sai không hợp lệ`);
    });
  });
  if (fail === f0) ok("mọi câu hỏi hợp lệ, có hình, đáp án nằm trong lựa chọn");
  console.log("  → số câu sinh được mỗi kiểu: " + JSON.stringify(count));
  const tf = { True: 0, False: 0 };
  for (let i = 0; i < 400; i++) tf[G.makeQ(G.WORDS[i % G.WORDS.length], "truefalse").answer]++;
  if (!tf.True || !tf.False) bad("câu Đúng/Sai chỉ ra một chiều: " + JSON.stringify(tf));
  else ok(`câu Đúng/Sai ra cả hai chiều (True ${tf.True} / False ${tf.False})`);
}

/* ===== 5. Lượt chơi ===== */
sec("[5] Dựng lượt chơi");
{
  const sizes = [10, 20, G.WORDS.length * 2];
  sizes.forEach((n) => {
    const qs = G.buildRound(G.WORDS, n);
    if (qs.length !== n) return bad(`xin ${n} câu nhưng nhận ${qs.length}`);
    const noArt = qs.filter((q) => !q.art && q.kind !== "pic").length;
    if (noArt) bad(`${n} câu: có ${noArt} câu không hình`);
    let dup = 0;
    for (let i = 1; i < qs.length; i++) if (qs[i].type === qs[i - 1].type) dup++;
    const words = new Set(qs.map((q) => q.w.en));
    ok(`${n} câu: ${words.size} từ khác nhau, ${dup} lần lặp kiểu liền kề, 0 câu thiếu hình`);
  });
}

/* ===== 6. Đa dạng kiểu câu hỏi ===== */
sec("[6] Đa dạng kiểu câu hỏi");
{
  const all = Object.keys(G.LABEL);
  [10, 20, G.WORDS.length * 2].forEach((n) => {
    const hit = {};
    for (let r = 0; r < 60; r++) G.buildRound(G.WORDS, n).forEach((q) => (hit[q.type] = 1));
    const miss = all.filter((t) => !hit[t]);
    if (miss.length) bad(`${n} câu (60 lượt): không bao giờ ra kiểu ${miss.join(", ")}`);
    else ok(`${n} câu: 60 lượt đi qua đủ ${all.length}/${all.length} kiểu`);
  });
  const kinds = [];
  for (let r = 0; r < 30; r++) kinds.push(new Set(G.buildRound(G.WORDS, 20).map((q) => q.type)).size);
  const min = Math.min(...kinds);
  if (min < 5) bad(`có lượt 20 câu chỉ dùng ${min} kiểu — quá đơn điệu`);
  else ok(`mỗi lượt 20 câu dùng ${min}–${Math.max(...kinds)} kiểu`);
  let viol = 0;
  for (let r = 0; r < 40; r++) {
    const seen = {};
    G.buildRound(G.WORDS, G.WORDS.length * 2).forEach((q) => {
      if (!seen[q.w.en] && q.type === "scramble" && q.w.en.length > 7) viol++;
      seen[q.w.en] = 1;
    });
  }
  if (viol) bad(`${viol} lần bắt xếp chữ rời một từ dài ngay lần đầu gặp`);
  else ok("không bắt xếp chữ rời từ dài ngay lần đầu gặp");
}

/* ===== 7. Gợi ý 3 mức ===== */
sec("[7] Gợi ý 3 mức");
{
  if (JSON.stringify(G.HINT_MULT) !== JSON.stringify([1, 0.75, 0.5, 0.25]))
    bad("bậc điểm gợi ý sai: " + JSON.stringify(G.HINT_MULT));
  else ok("bậc điểm 100% → 75% → 50% → 25%");
  const f0 = fail;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const VN = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  G.WORDS.forEach((w) => {
    Object.keys(G.LABEL).forEach((t) => {
      if ((t === "spell" || t === "scramble") && !G.single(w)) return;
      const q = G.makeQ(w, t);
      const h = [1, 2, 3].map((lv) => G.hintText(q, lv));
      h.forEach((x, i) => { if (!x || !String(x).trim()) bad(`${w.en}/${t}: gợi ý mức ${i + 1} rỗng`); });
      const re = new RegExp("\\b" + esc(w.en) + "\\b", "i");
      [0, 1].forEach((i) => {
        if (re.test(String(h[i]))) bad(`${w.en}/${t}: gợi ý mức ${i + 1} lộ chính từ đó → "${String(h[i]).slice(0, 55)}"`);
      });
      if (h[2] !== w.vi) bad(`${w.en}/${t}: gợi ý mức 3 phải là nghĩa tiếng Việt`);
      if (t === "def2word" && h[0] === w.def) bad(`${w.en}: gợi ý mức 1 lặp lại phần đã hiện trên đề bài`);
      if (!VN.test(String(h[1]))) bad(`${w.en}: gợi ý mức 2 không phải tiếng Việt`);
    });
  });
  if (fail === f0) ok("mọi từ × mọi kiểu đủ 3 mức, mức 1–2 không lộ đáp án");
  const base = 210;
  const pts = G.HINT_MULT.map((x) => Math.round(base * x));
  if (!(pts[0] > pts[1] && pts[1] > pts[2] && pts[2] > pts[3])) bad("điểm không giảm dần: " + pts.join(" > "));
  else ok(`điểm tối đa mỗi bậc: ${pts.join(" → ")}`);
}

/* ===== 8. Đường dẫn & deploy ===== */
sec("[8] Đường dẫn & deploy");
{
  const f0 = fail;
  [...html.matchAll(/(?:href|src)="(\/[^"/][^"]*)"/g)].forEach((x) =>
    bad(`đường dẫn tuyệt đối "${x[1]}" sẽ vỡ trên GitHub project site`));
  const sw = path.join(DIR, "sw.js");
  if (fs.existsSync(sw)) {
    const s = fs.readFileSync(sw, "utf8");
    const base = path.basename(FILE);
    if (!s.includes(base)) bad(`sw.js chưa liệt kê ${base} → không chạy offline được`);
    G.WORDS.filter((w) => w.photo).forEach((w) => {
      if (!s.includes("img/" + w.photo)) bad(`sw.js chưa liệt kê img/${w.photo}`);
    });
    if (fail === f0) ok("sw.js đã cache đủ file game và ảnh");
  }
  const mani = (html.match(/rel="manifest" href="([^"]+)"/) || [])[1];
  if (mani) {
    const mp = path.join(DIR, mani);
    if (!fs.existsSync(mp)) bad(`thiếu file manifest: ${mani}`);
    else {
      const j = JSON.parse(fs.readFileSync(mp, "utf8"));
      if (j.start_url !== path.basename(FILE)) bad(`manifest start_url là "${j.start_url}", phải là "${path.basename(FILE)}"`);
      else ok(`manifest trỏ đúng ${j.start_url}`);
    }
  }
}

/* ===== 9. Nội dung hợp lứa tuổi ===== */
sec("[9] Nội dung cho lớp 4");
{
  const f0 = fail;
  G.WORDS.forEach((w) => {
    const words = w.def.split(/\s+/).length;
    if (words > 18) bad(`${w.en}: câu định nghĩa ${words} chữ — dài quá cho lớp 4`);
    if (w.sq.split(/\s+/).length > 9) bad(`${w.en}: câu sắp xếp quá dài (${w.sq.split(/\s+/).length} từ)`);
    if (!/^[A-Z]/.test(w.def)) bad(`${w.en}: câu định nghĩa không viết hoa đầu câu`);
  });
  if (fail === f0) ok("câu định nghĩa và câu sắp xếp đều đủ ngắn cho lớp 4");
}

console.log("\n" + (fail ? "❌ " + fail + " lỗi" : "✅ TẤT CẢ ĐỀU PASS"));
process.exit(fail ? 1 : 0);
