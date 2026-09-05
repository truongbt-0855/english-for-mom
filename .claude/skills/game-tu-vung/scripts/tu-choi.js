/* Tự chơi hết một lượt trong Chrome headless để bắt lỗi vòng chơi.
 *   node tu-choi.js game_universe.html
 * Bắt được những thứ test tĩnh không thấy: kẹt câu, nhảy mất câu, lỗi console,
 * bảng kết quả hiện sai từ, điểm không giảm đúng bậc khi dùng gợi ý.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const target = process.argv[2];
if (!target) { console.error("Thiếu tham số: node tu-choi.js <file.html>"); process.exit(2); }
const FILE = path.resolve(target);
if (!fs.existsSync(FILE)) { console.error("Không thấy file: " + FILE); process.exit(2); }

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find((p) => fs.existsSync(p));
if (!CHROME) { console.error("Không tìm thấy Chrome hay Edge để chạy headless"); process.exit(2); }

/* Kịch bản chèn vào cuối file: trả lời đúng mọi câu, cứ 3 câu thì xin gợi ý
   (xoay vòng 1→2→3) để kiểm tra bậc trừ điểm. */
const driver = [
  '<div id="KETQUA">chua chay</div>',
  "<script>",
  "var E = [], LOG = [], pend = null, guard = 0;",
  'window.addEventListener("error", function (e) { E.push("JS: " + e.message) });',
  'function out(m) { document.getElementById("KETQUA").textContent = m }',
  "countdown = function (done) { done() };",
  "timerOn = false;",                                   // bỏ đồng hồ: virtual time làm nó hết giờ sai
  'document.getElementById("lenSel").value = String(WORDS.length * 2);',
  "try { startQuiz(WORDS) } catch (err) { out(\"LOI startQuiz: \" + err.message) }",
  "function step() {",
  '  if (++guard > 300) { E.push("KET: qua 300 vong"); return fin() }',
  '  if (document.getElementById("s-res").classList.contains("on")) return fin();',
  "  var q = Q[qi];",
  "  var want = qi % 3 === 0 ? (Math.floor(qi / 3) % 3) + 1 : 0;",
  "  for (var i = 0; i < want; i++) {",
  '    var hb = document.getElementById("qHint");',
  '    if (hb.hidden) { E.push("cau " + qi + ": nut goi y an som"); break }',
  "    hb.click();",
  "  }",
  '  if (hintLv !== want) E.push("cau " + qi + ": xin " + want + " goi y nhung hintLv=" + hintLv);',
  '  var cards = document.querySelectorAll("#qHints .hcard").length;',
  '  if (cards !== hintLv) E.push("cau " + qi + ": hintLv=" + hintLv + " nhung hien " + cards + " the");',
  "  pend = { before: score, q: q, hint: hintLv, i: qi };",
  '  if (q.kind === "build") {',
  "    var wants = B.q.cells.filter(function (c) { return c.want !== undefined }).map(function (c) { return c.want });",
  "    for (var k = 0; k < wants.length; k++) {",
  '      var tiles = document.querySelectorAll("#tiles .tile"), t = null;',
  '      for (var j = 0; j < tiles.length; j++) if (!tiles[j].classList.contains("used") && tiles[j].textContent === wants[k]) { t = tiles[j]; break }',
  '      if (!t) { E.push("cau " + qi + "/" + q.type + ": thieu quan " + wants[k]); break }',
  "      t.click();",
  "    }",
  "  } else {",
  '    var opts = document.querySelectorAll("#qOpts .opt"), rb = null;',
  "    for (var a = 0; a < opts.length; a++) if (String(opts[a].dataset.v).toLowerCase() === String(q.answer).toLowerCase()) rb = opts[a];",
  '    if (!rb) { E.push("cau " + qi + " (" + q.type + ") khong co nut dap an dung"); return fin() }',
  "    rb.click();",
  "  }",
  "  setTimeout(after, 400);",              // câu ghép chữ tự kiểm tra sau 180ms, phải chờ
  "}",
  "function after() {",
  "  var p = pend, gain = score - p.before;",
  '  if (gain <= 0) E.push("cau " + p.i + " " + p.q.kind + "/" + p.q.type + " -> 0 diem du tra loi dung");',
  '  LOG.push(p.q.type + ":h" + p.hint + ":" + gain);',
  '  var h3 = document.querySelector("#fb .frow h3");',
  '  if (!h3) { E.push("cau " + p.i + ": khong hien bang ket qua"); return fin() }',
  '  if (h3.textContent !== p.q.w.en) { E.push("cau " + p.i + ": bang ket qua hien [" + h3.textContent + "] thay vi [" + p.q.w.en + "]"); return fin() }',
  '  document.getElementById("fbNext").click();',
  "  setTimeout(step, 400);",
  "}",
  "function fin() {",
  "  var g = {};",
  '  LOG.forEach(function (x) { var p = x.split(":"); (g[p[1]] = g[p[1]] || []).push(+p[2]) });',
  '  function avg(k) { return g[k] ? Math.round(g[k].reduce(function (a, b) { return a + b }) / g[k].length) : "-" }',
  '  var kinds = {}; LOG.forEach(function (x) { kinds[x.split(":")[0]] = 1 });',
  '  var drop = avg("h0") > avg("h1") && avg("h1") > avg("h3");',
  '  if (LOG.length && !drop) E.push("diem khong giam dan theo so goi y");',
  '  out("ERR:" + JSON.stringify(E) + " | " + LOG.length + " cau | " + Object.keys(kinds).length + " kieu"',
  '    + " | diem TB h0=" + avg("h0") + " h1=" + avg("h1") + " h2=" + avg("h2") + " h3=" + avg("h3")',
  '    + " | tong " + document.getElementById("rScore").textContent);',
  "}",
  "setTimeout(step, 60);",
  "<\/script>",
].join("\n");

const tmp = path.join(os.tmpdir(), "tuchoi-" + Date.now() + ".html");
fs.writeFileSync(tmp, fs.readFileSync(FILE, "utf8").replace("</body>", driver + "\n</body>"));

let dom = "";
try {
  dom = execFileSync(CHROME, [
    "--headless", "--disable-gpu", "--allow-file-access-from-files",
    "--virtual-time-budget=180000", "--dump-dom", "file:///" + tmp.replace(/\\/g, "/"),
  ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
} catch (e) {
  console.error("Chrome chạy lỗi: " + e.message); process.exit(2);
} finally { try { fs.unlinkSync(tmp) } catch (e) {} }

const r = dom.match(/<div id="KETQUA">([\s\S]*?)<\/div>/);
if (!r) { console.error("✗ Không đọc được kết quả — có thể script trong file lỗi ngay từ đầu"); process.exit(1); }
const text = r[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

if (text === "chua chay") { console.error("✗ Kịch bản không chạy — nhiều khả năng lỗi cú pháp trong file game"); process.exit(1); }
console.log(text);

const errs = (text.match(/^ERR:(\[.*?\])\s\|/) || [])[1];
let list = [];
try { list = JSON.parse(errs || "[]") } catch (e) { list = ["khong doc duoc danh sach loi"] }
if (list.length) { console.log("\n❌ " + list.length + " lỗi khi chơi thật"); process.exit(1); }
console.log("\n✅ Chơi hết lượt, không lỗi");
