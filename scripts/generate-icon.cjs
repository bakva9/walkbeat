/**
 * WalkBeat アプリアイコン・スプラッシュ生成スクリプト
 *
 * OpenAI gpt-image-1 API を使って以下を生成:
 *   - resources/icon-only.png       (1024x1024, 透過背景, 前景のみ)
 *   - resources/icon-background.png (1024x1024, グラデーション背景)
 *   - resources/splash.png          (1024x1024, アイコン + 広い背景)
 *
 * 使い方:
 *   1. プロジェクトルートに .env を用意 (OPENAI_API_KEY=sk-...)
 *   2. node scripts/generate-icon.js
 *      特定のアセットだけ生成する場合: node scripts/generate-icon.js icon-only
 *
 * 参考実装:
 *   C:/projects/weekly-apps/pagecraft/scripts/generate-buildings-v3.js
 *   C:/company/.company/dev/tech-stock/gpt-image-1.md
 */

const fs = require("fs");
const path = require("path");

// .env を手動でロード（依存なし）
(function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
})();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY is not set.");
  console.error("Create a .env file at the project root with: OPENAI_API_KEY=sk-...");
  process.exit(1);
}

const OUT = path.join(__dirname, "..", "resources");
fs.mkdirSync(OUT, { recursive: true });

// ============================================================
// プロンプト定義
// ============================================================

const ICON_ONLY_PROMPT = `
A modern minimalist mobile app icon foreground for a music app called WalkBeat.
The app turns footsteps into music.

Centered composition on a 1024x1024 square canvas with a FULLY TRANSPARENT background.

The foreground shows a pair of white shoe footprints walking upward.
Each footprint is clearly recognizable as a shoe sole shape.
From the footprints, musical notes (eighth notes and quarter notes) are rising upward
like they are being born from each step.
The musical notes float and scatter above the footprints as if the act of walking
is literally creating music with every step.

The footprints are at the bottom-center, the musical notes drift upward and outward.
The overall composition tells the story: "walking creates music."

Bold, clean, flat vector style. Solid white color only, no gradients within the symbol,
no textures, no thin details that would disappear at small sizes.
No text, no letters, no numbers, no HUD, no UI elements.

Leave at least 15% padding on all sides (safe area for Android adaptive icons).
The symbol must be fully contained within the inner 70% of the canvas.

Transparent background (checkerboard pattern is fine in preview).
`.trim().replace(/\s+/g, " ");

const ICON_BACKGROUND_PROMPT = `
A perfectly smooth solid color gradient for a mobile app icon background.
1024x1024 square canvas, completely filled edge to edge.

The gradient goes diagonally from the top-left corner in deep teal color (#0EA5A4)
to the bottom-right corner in vibrant purple (#7C3AED),
passing through a rich indigo in the middle.

Smooth continuous gradient with no banding, no dithering, no noise, no texture,
no patterns, no shapes, no symbols, no text, no objects.
Just pure smooth color transition filling the entire square.

The image is ONLY the background color gradient. Nothing else.
`.trim().replace(/\s+/g, " ");

const SPLASH_PROMPT = `
A splash screen for a mobile music app called WalkBeat.
1024x1024 square canvas.

The entire background is a smooth diagonal gradient from deep teal (#0EA5A4)
at the top-left to vibrant purple (#7C3AED) at the bottom-right,
passing through rich indigo in the middle.

In the exact center of the canvas, a pair of white shoe footprints walking upward,
with musical notes (eighth notes and quarter notes) rising from the footprints
as if each step creates music. The notes float and scatter upward.
The symbol occupies approximately 40% of the canvas width, leaving generous empty space around it.

Flat vector style, solid white foreground, no text, no letters, no UI, no app name.
Clean, minimal, atmospheric.
`.trim().replace(/\s+/g, " ");

// ============================================================
// 生成対象
// ============================================================

const TARGETS = {
  "icon-only": {
    prompt: ICON_ONLY_PROMPT,
    filename: "icon-only.png",
    background: "transparent",
    quality: "high",
  },
  "icon-background": {
    prompt: ICON_BACKGROUND_PROMPT,
    filename: "icon-background.png",
    background: "opaque",
    quality: "medium", // グラデーションのみなので medium で十分
  },
  "splash": {
    prompt: SPLASH_PROMPT,
    filename: "splash.png",
    background: "opaque",
    quality: "high",
  },
};

// ============================================================
// 生成ロジック
// ============================================================

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generate(target, retries = 2) {
  const outPath = path.join(OUT, target.filename);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Generating ${target.filename}${attempt > 0 ? ` (retry ${attempt})` : ""}...`);
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: target.prompt,
          n: 1,
          size: "1024x1024",
          quality: target.quality,
          background: target.background,
          output_format: "png",
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`  ERROR ${res.status}: ${err.substring(0, 300)}`);
        if (attempt < retries) {
          await sleep(5000);
          continue;
        }
        return false;
      }

      const json = await res.json();
      const b64 = json.data[0].b64_json;
      fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
      const size = fs.statSync(outPath).size;
      console.log(`  OK: ${target.filename} (${(size / 1024).toFixed(1)} KB)`);
      return true;
    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
      if (attempt < retries) {
        await sleep(5000);
        continue;
      }
      return false;
    }
  }
}

async function main() {
  const targetArg = process.argv[2];
  console.log("=== WalkBeat Icon Generator (gpt-image-1) ===");
  console.log(`Output: ${OUT}\n`);

  const keys = targetArg ? [targetArg] : Object.keys(TARGETS);
  const invalid = keys.filter((k) => !TARGETS[k]);
  if (invalid.length > 0) {
    console.error(`Unknown target(s): ${invalid.join(", ")}`);
    console.error(`Available: ${Object.keys(TARGETS).join(", ")}`);
    process.exit(1);
  }

  let ok = 0, ng = 0;
  for (const key of keys) {
    const success = await generate(TARGETS[key]);
    if (success) ok++; else ng++;
    await sleep(2000);
  }

  console.log(`\nDone. Success: ${ok}, Failed: ${ng}`);
  if (ng > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
