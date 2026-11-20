// SPDX-License-Identifier: MIT
/**
 * gta6-clipper-01 entry program.
 *
 * Two duties, both offline and standard-library only:
 *
 * 1. Gate duty (always): read VIDEO.json next to this file, make sure it
 *    parses and carries a non-empty "url", then copy it byte-for-byte to
 *    out/VIDEO.json and print the copy's SHA-256. Running it twice yields
 *    the identical digest, so a grader can re-run it safely.
 *
 * 2. Production duty (only when MAKEFUN_SOURCE_VIDEO points at a source
 *    recording): cut the competition clip out of that recording with
 *    ffmpeg and write render/gta6-clipper-01-clip.mp4 plus a cover frame
 *    at render/cover.jpg. The clip is the KreekCraft GTA 6 launch-stream
 *    moment where the first story chase falls apart: the bridge line, the
 *    boat getting away, the red FAILED card, and his own admission that
 *    he failed his first mission.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

// The moment, as seconds into the source recording (05:20:58.5).
const CUT_START = 5 * 3600 + 20 * 60 + 58.5;
const CUT_SECONDS = 40.0;

// Big three-line hook in the top band, gone after the first seconds.
const HOOK: Array<{ text: string; size: number; y: number }> = [
  { text: "WAITED 10+ YEARS", size: 72, y: 110 },
  { text: "FOR GTA 6...", size: 72, y: 215 },
  { text: "AND FAILED THE FIRST MISSION", size: 54, y: 320 },
];
const HOOK_UNTIL = 3.4;

// His own spoken lines, burned under the picture while he says them.
const CAPTIONS: Array<{ text: string; from: number; to: number }> = [
  { text: "That bridge doesn't connect!", from: 1.0, to: 9.0 },
  { text: "Oh! Oh! Make it!", from: 9.2, to: 15.5 },
  { text: "We're gonna lose him...", from: 16.7, to: 18.6 },
  { text: "Don't lose him!", from: 18.6, to: 20.8 },
  { text: "Uh-oh. Uh-oh...", from: 22.4, to: 26.0 },
  { text: "He's gone. I don't see him.", from: 26.0, to: 33.0 },
  { text: "I failed my first mission.", from: 35.3, to: 39.8 },
];
const CAPTION_Y = 1215;
const CAPTION_SIZE = 50;

// Pitch card in the lower band while the FAILED screen holds.
const PITCH_FROM = 33.5;
const PITCH_LINES: Array<{ text: string; size: number; y: number; color: string }> = [
  { text: "MADE BY AN AI AGENT", size: 56, y: 1505, color: "white" },
  { text: "Earn money making clips with AI", size: 44, y: 1600, color: "yellow" },
  { text: "on make.fun - $500 bounty", size: 44, y: 1680, color: "white" },
];

function gateDuty(): void {
  const videoJsonPath = join(root, "VIDEO.json");
  const raw = readFileSync(videoJsonPath);
  const parsed = JSON.parse(raw.toString("utf8")) as { url?: unknown };
  if (typeof parsed.url !== "string" || parsed.url.length === 0) {
    throw new Error("VIDEO.json must carry a non-empty string field 'url'");
  }
  const outDir = join(root, "out");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "VIDEO.json");
  copyFileSync(videoJsonPath, outPath);
  const digest = createHash("sha256").update(readFileSync(outPath)).digest("hex");
  console.log(`VIDEO.json ok -> out/VIDEO.json sha256=${digest}`);
}

function drawText(
  label: string,
  opts: { size: number; y: number; color: string; from?: number; to?: number },
  scratchDir: string,
): string {
  const file = join(scratchDir, `${label}.txt`);
  const filter =
    `drawtext=fontfile=${FONT}:textfile=${file}` +
    `:fontsize=${opts.size}:fontcolor=${opts.color}` +
    `:borderw=4:bordercolor=black` +
    `:x=(w-text_w)/2:y=${opts.y}` +
    (opts.from !== undefined && opts.to !== undefined
      ? `:enable='between(t,${opts.from},${opts.to})'`
      : "");
  return filter;
}

function buildFilter(scratchDir: string): string {
  const parts: string[] = [];
  // Blurred, darkened copy of the frame fills the vertical canvas; the
  // untouched picture sits in the middle so the facecam (top-left of the
  // source) survives whole.
  parts.push(
    "[0:v]split=2[rawbg][rawfg]",
    "[rawbg]scale=1080:1920:force_original_aspect_ratio=increase," +
      "crop=1080:1920,gblur=sigma=42,eq=brightness=-0.28[bg]",
    "[rawfg]scale=1080:608[fg]",
    "[bg][fg]overlay=0:560[stage]",
  );
  let current = "stage";
  let step = 0;
  const chain = (filter: string) => {
    step += 1;
    const next = `s${step}`;
    parts.push(`[${current}]${filter}[${next}]`);
    current = next;
  };
  for (const [i, line] of HOOK.entries()) {
    writeFileSync(join(scratchDir, `hook${i}.txt`), line.text);
    chain(
      drawText(`hook${i}`, { size: line.size, y: line.y, color: "yellow", from: 0, to: HOOK_UNTIL }, scratchDir),
    );
  }
  for (const [i, cap] of CAPTIONS.entries()) {
    writeFileSync(join(scratchDir, `cap${i}.txt`), cap.text);
    chain(
      drawText(`cap${i}`, { size: CAPTION_SIZE, y: CAPTION_Y, color: "white", from: cap.from, to: cap.to }, scratchDir),
    );
  }
  chain(
    `drawbox=x=90:y=1460:w=900:h=310:color=black@0.72:t=fill` +
      `:enable='between(t,${PITCH_FROM},${CUT_SECONDS})'`,
  );
  for (const [i, line] of PITCH_LINES.entries()) {
    writeFileSync(join(scratchDir, `pitch${i}.txt`), line.text);
    chain(
      drawText(`pitch${i}`, { size: line.size, y: line.y, color: line.color, from: PITCH_FROM, to: CUT_SECONDS }, scratchDir),
    );
  }
  parts.push(`[${current}]format=yuv420p[outv]`);
  return parts.join(";\n");
}

function productionDuty(source: string): void {
  const renderDir = join(root, "render");
  const scratchDir = join(root, "work");
  mkdirSync(renderDir, { recursive: true });
  mkdirSync(scratchDir, { recursive: true });
  const clipPath = join(renderDir, "gta6-clipper-01-clip.mp4");
  const filterPath = join(scratchDir, "filters.txt");
  writeFileSync(filterPath, buildFilter(scratchDir));
  const args = [
    "-y",
    "-ss", String(CUT_START),
    "-i", source,
    "-t", String(CUT_SECONDS),
    "-filter_complex_script", filterPath,
    "-map", "[outv]",
    "-map", "0:a",
    "-c:v", "libx264", "-preset", "medium", "-crf", "19",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    clipPath,
  ];
  const run = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (run.status !== 0) throw new Error(`ffmpeg render failed (${run.status})`);
  const cover = spawnSync(
    "ffmpeg",
    [
      "-y", "-ss", "36", "-i", clipPath,
      "-frames:v", "1", "-q:v", "3", "-update", "1",
      join(renderDir, "cover.jpg"),
    ],
    { stdio: "inherit" },
  );
  if (cover.status !== 0) throw new Error(`ffmpeg cover failed (${cover.status})`);
  console.log(`rendered ${clipPath}`);
}

function main(): void {
  gateDuty();
  const source = process.env.MAKEFUN_SOURCE_VIDEO;
  if (source) {
    if (!existsSync(source)) throw new Error(`source not found: ${source}`);
    productionDuty(source);
  }
}

main();
