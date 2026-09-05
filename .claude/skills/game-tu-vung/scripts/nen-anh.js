/* Cắt ảnh về khung 4:3 rồi nén cho nhẹ.
 *   node nen-anh.js <thư-mục-nguồn> <thư-mục-ra> [rộng] [cao] [chất-lượng]
 *   node nen-anh.js ./da-chon ./img
 *
 * Ảnh gốc NASA ~150KB/tấm → sau khi chạy còn ~25KB.
 * Khung 4:3 khớp viewBox của hình vẽ SVG (160x120) nên ảnh và hình vẽ cùng tỉ lệ.
 *
 * Dùng System.Drawing của Windows qua PowerShell inline (-Command), KHÔNG dùng file .ps1
 * vì execution policy trên máy công ty thường chặn chạy file script.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const [, , srcArg, outArg, wArg, hArg, qArg] = process.argv;
if (!srcArg || !outArg) {
  console.error("Dùng: node nen-anh.js <thư-mục-nguồn> <thư-mục-ra> [rộng=480] [cao=360] [chất-lượng=76]");
  process.exit(2);
}
const SRC = path.resolve(srcArg);
const OUT = path.resolve(outArg);
const W = +(wArg || 480), H = +(hArg || 360), Q = +(qArg || 76);

if (!fs.existsSync(SRC)) { console.error("Không thấy thư mục nguồn: " + SRC); process.exit(2); }
const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (!files.length) { console.error("Không có ảnh nào trong " + SRC); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const ps = `
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq 'image/jpeg'}
$prm=New-Object System.Drawing.Imaging.EncoderParameters(1)
$prm.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,${Q})
Get-ChildItem -LiteralPath '${SRC.replace(/'/g, "''")}' -File | Where-Object { $_.Extension -match '^\\.(jpg|jpeg|png)$' } | ForEach-Object {
  $src=[System.Drawing.Image]::FromFile($_.FullName)
  $scale=[Math]::Max(${W}/$src.Width, ${H}/$src.Height)
  $sw=$src.Width*$scale; $sh=$src.Height*$scale
  $bmp=New-Object System.Drawing.Bitmap(${W},${H})
  $g=[System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode='HighQualityBicubic'
  $g.DrawImage($src, (${W}-$sw)/2, (${H}-$sh)/2, $sw, $sh)
  $name=[System.IO.Path]::GetFileNameWithoutExtension($_.Name)+'.jpg'
  $dest=Join-Path '${OUT.replace(/'/g, "''")}' $name
  $bmp.Save($dest,$enc,$prm)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose()
  Write-Output ($name + '|' + (Get-Item $dest).Length)
}`;

let out = "";
try {
  out = execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
} catch (e) {
  console.error("Nén ảnh lỗi: " + (e.stdout || e.message));
  process.exit(1);
}

let total = 0, n = 0;
out.split(/\r?\n/).filter(Boolean).forEach((line) => {
  const [name, size] = line.split("|");
  if (!size) return;
  const kb = Math.round(+size / 1024);
  total += kb; n++;
  console.log(`${name.padEnd(18)} ${W}x${H}  ${kb}KB`);
});
console.log(`---- tổng: ${total}KB cho ${n} ảnh`);
if (total > 400) console.log("⚠ Trên 400KB là nặng cho điện thoại — giảm chất lượng hoặc bớt ảnh.");
