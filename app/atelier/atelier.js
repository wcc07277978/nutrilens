"use client";

import { useEffect, useRef } from "react";
import styles from "./atelier.module.css";

/* ─────────────────────────────────────────────
   月梅
   人先落下一枝，AI 读形、用金线起稿、把月色和花敷上，
   最后的分枝仍由人补。时间都写在 T 里，改这里就能改节奏。
   ───────────────────────────────────────────── */

const LOOP = 16;

const T = {
  ink: [0.45, 3.45],
  read: [3.45, 4.75],
  guide: [4.75, 6.65],
  color: [6.65, 9.6],
  fork: [9.6, 11.25],
  twig: [11.25, 12.15],
  seal: [12.15, 12.7],
  hold: [12.7, 14.65],
  fade: [14.65, 15.6],
};

const LINES = [
  { t0: 0.35, t1: 3.45, k: "落墨", s: "一笔，从纸边进入" },
  { t0: 3.45, t1: 4.75, k: "读形", s: "顺着你的笔势看" },
  { t0: 4.75, t1: 6.65, k: "起稿", s: "金线标出月和花" },
  { t0: 6.65, t1: 9.6, k: "敷色", s: "花从空白里醒来" },
  { t0: 9.6, t1: 12.15, k: "收笔", s: "最后的分枝交给你" },
  { t0: 12.15, t1: 14.65, k: "月梅", s: "一张一起完成的画" },
];

const PAPER = "#f3ecdf";
const INK = "#241c16";

const MOON = { x: 268, y: 168, r: 62 };

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function seg(t, span) {
  return clamp01((t - span[0]) / (span[1] - span[0]));
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function catmull(points, slices) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < slices; s++) {
      const t = s / slices;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

function prepare(points, step, seed, wobble) {
  const dense = catmull(points, 18);
  const segLen = [0];
  for (let i = 1; i < dense.length; i++) {
    const dx = dense[i].x - dense[i - 1].x;
    const dy = dense[i].y - dense[i - 1].y;
    segLen.push(segLen[i - 1] + Math.hypot(dx, dy));
  }
  const total = segLen[segLen.length - 1];
  const out = [];
  for (let d = 0; d <= total; d += step) {
    let i = 1;
    while (i < segLen.length - 1 && segLen[i] < d) i++;
    const span = segLen[i] - segLen[i - 1] || 1;
    const u = (d - segLen[i - 1]) / span;
    const a = dense[i - 1];
    const b = dense[i];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    const nx = -ty / len;
    const ny = tx / len;
    const j = (hash(seed + out.length * 13.7) - 0.5) * wobble;
    out.push({
      x: a.x + (b.x - a.x) * u + nx * j,
      y: a.y + (b.y - a.y) * u + ny * j,
      tx: tx / len,
      ty: ty / len,
      nx,
      ny,
    });
  }
  return out;
}

function anchor(samples, u, side, dist, rotJitter) {
  const i = Math.round(clamp01(u) * (samples.length - 1));
  const s = samples[i];
  return {
    x: s.x + s.nx * side * dist,
    y: s.y + s.ny * side * dist,
    rot: hash(rotJitter) * Math.PI,
    u,
    side,
  };
}

function buildScene() {
  const mainInk = prepare(
    [
      { x: 1260, y: 648 },
      { x: 1100, y: 608 },
      { x: 940, y: 545 },
      { x: 800, y: 478 },
      { x: 670, y: 418 },
      { x: 555, y: 362 },
      { x: 455, y: 308 },
    ],
    4.5,
    2,
    1.5
  );

  const root = mainInk[Math.round(mainInk.length * 0.3)];
  const forkInk = prepare(
    [
      { x: root.x, y: root.y },
      { x: root.x + 70, y: root.y - 70 },
      { x: root.x + 150, y: root.y - 150 },
      { x: root.x + 210, y: root.y - 230 },
    ],
    4,
    9,
    1.15
  );
  const forkGuide = prepare(
    [
      { x: root.x, y: root.y },
      { x: root.x + 70, y: root.y - 70 },
      { x: root.x + 150, y: root.y - 150 },
      { x: root.x + 210, y: root.y - 230 },
    ],
    6,
    1,
    0
  );

  const twigAt = (u, bend) => {
    const i = Math.round(u * (mainInk.length - 1));
    const s = mainInk[i];
    return prepare(
      [
        { x: s.x, y: s.y },
        { x: s.x + s.nx * bend + s.tx * 28, y: s.y + s.ny * bend + s.ty * 28 },
        { x: s.x + s.nx * bend * 1.7 + s.tx * 8, y: s.y + s.ny * bend * 1.7 + s.ty * 8 },
      ],
      3.5,
      20 + u * 10,
      0.8
    );
  };

  const flowers = [
    { ...anchor(mainInk, 0.22, 1, 24, 1), radius: 23, delay: 0.1, host: "main" },
    { ...anchor(mainInk, 0.36, -1, 26, 2), radius: 28, delay: 0.48, host: "main" },
    { ...anchor(mainInk, 0.5, 1, 22, 3), radius: 21, delay: 0.86, host: "main" },
    { ...anchor(mainInk, 0.63, -1, 28, 4), radius: 26, delay: 1.22, host: "main" },
    { ...anchor(mainInk, 0.78, 1, 20, 5), radius: 18, delay: 1.58, host: "main" },
  ];

  const buds = [
    { ...anchor(mainInk, 0.12, -1, 12, 6), scale: 1, delay: 0.3, host: "main" },
    { ...anchor(mainInk, 0.9, -1, 11, 7), scale: 0.85, delay: 1.9, host: "main" },
  ];

  const forkFlowers = [
    { ...anchor(forkInk, 0.48, 1, 13, 8), radius: 20, hostU: 0.42 },
    { ...anchor(forkInk, 0.78, -1, 12, 9), radius: 16, hostU: 0.7 },
  ];
  const forkBud = { ...anchor(forkInk, 0.94, 1, 8, 10), scale: 0.7, hostU: 0.86 };

  const cx = flowers.reduce((s, f) => s + f.x, 0) / flowers.length;
  const cy = flowers.reduce((s, f) => s + f.y, 0) / flowers.length;

  return { mainInk, forkInk, forkGuide, twigA: twigAt(0.48, 46), twigB: twigAt(0.68, -40), flowers, buds, forkFlowers, forkBud, blush: { x: cx, y: cy } };
}

const SCENE = buildScene();

function contentAlpha(t) {
  if (t < 0.35) return t / 0.35;
  if (t > T.fade[0]) return 1 - seg(t, T.fade);
  return 1;
}

function strokeBrush(ctx, samples, p, widthAt, color, seed) {
  if (p <= 0) return null;
  const last = Math.max(1, Math.floor(p * (samples.length - 1)));
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 1; i <= last; i++) {
    const u = i / (samples.length - 1);
    const w = widthAt(u);
    if (u > 0.86 && w < 6 && hash(seed + i) > 0.7) continue;
    const a = samples[i - 1];
    const b = samples[i];
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    if (hash(seed * 5 + i) > 0.6) {
      const off = w * 0.36;
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = "#6b5344";
      ctx.lineWidth = Math.max(0.7, w * 0.16);
      ctx.beginPath();
      ctx.moveTo(a.x + a.nx * off, a.y + a.ny * off);
      ctx.lineTo(b.x + b.nx * off, b.y + b.ny * off);
      ctx.stroke();
    }
  }
  ctx.restore();
  return samples[last];
}

function strokeGuide(ctx, samples, p, alpha) {
  if (p <= 0 || alpha <= 0) return;
  const last = Math.max(1, Math.floor(p * (samples.length - 1)));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#9a7340";
  ctx.lineWidth = 1.15;
  ctx.setLineDash([2.5, 7]);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(samples[0].x, samples[0].y);
  for (let i = 1; i <= last; i++) ctx.lineTo(samples[i].x, samples[i].y);
  ctx.stroke();
  ctx.restore();
}

function drawWash(ctx, x, y, rx, ry, p, inner, mid) {
  if (p <= 0) return;
  const s = 0.25 + 0.75 * easeOut(p);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx * s, ry * s);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, inner);
  g.addColorStop(0.42, mid);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMoon(ctx, p) {
  if (p <= 0) return;
  const r = MOON.r * (0.9 + 0.1 * p);
  ctx.save();
  ctx.globalAlpha = clamp01(p * 1.2);
  const g = ctx.createRadialGradient(MOON.x - r * 0.28, MOON.y - r * 0.32, r * 0.08, MOON.x, MOON.y, r);
  g.addColorStop(0, "#fffaf0");
  g.addColorStop(0.58, "#f3e6c6");
  g.addColorStop(1, "#e3d0a4");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(MOON.x, MOON.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = clamp01(p) * 0.16;
  ctx.fillStyle = "#c2b28a";
  ctx.beginPath();
  ctx.ellipse(MOON.x + r * 0.16, MOON.y + r * 0.08, r * 0.26, r * 0.2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(MOON.x - r * 0.2, MOON.y + r * 0.2, r * 0.14, r * 0.1, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function petalPath(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(r * 0.22, r * 0.18, r * 0.62, r * 0.62, 0, r);
  ctx.bezierCurveTo(-r * 0.62, r * 0.62, -r * 0.22, r * 0.18, 0, 0);
  ctx.closePath();
}

function drawBlossom(ctx, x, y, rot, radius, open, tint) {
  const raw = easeOutBack(clamp01(open));
  const s = Math.max(0, raw);
  if (s <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  for (let k = 0; k < 5; k++) {
    ctx.save();
    ctx.rotate((k / 5) * Math.PI * 2 - Math.PI / 2);
    const pr = radius * (0.88 + hash(k * 19.1 + radius * 3) * 0.2);
    const g = ctx.createLinearGradient(0, 0, 0, pr);
    g.addColorStop(0, "#fffaf7");
    g.addColorStop(0.48, tint);
    g.addColorStop(1, "#e3a8a4");
    ctx.fillStyle = g;
    petalPath(ctx, pr);
    ctx.fill();
    ctx.strokeStyle = "rgba(160, 90, 90, 0.18)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, pr * 0.18);
    ctx.quadraticCurveTo(pr * 0.04, pr * 0.55, 0, pr * 0.88);
    ctx.stroke();
    ctx.restore();
  }
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + 0.2;
    const len = radius * 0.22;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.strokeStyle = "#b9913e";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(Math.cos(a) * len, Math.sin(a) * len, 1.25, 0, Math.PI * 2);
    ctx.fillStyle = "#e0b44a";
    ctx.fill();
  }
  ctx.restore();
}

function drawBud(ctx, x, y, rot, scale, open) {
  const s = scale * (0.45 + 0.55 * easeOut(clamp01(open)));
  if (open <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.5, 12, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#6d8154";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -3.2, 3.6, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#e8b7b3";
  ctx.fill();
  ctx.restore();
}

function drawSeal(ctx, p) {
  if (p <= 0) return;
  const pop = clamp01(p * 1.35);
  const s = 1.42 - 0.42 * easeOut(pop);
  const x = 188;
  const y = 628;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.13);
  ctx.scale(s, s * (1 + (1 - pop) * 0.12));
  ctx.globalAlpha = clamp01(p * 2.4);
  ctx.fillStyle = "#a8322c";
  ctx.fillRect(-27, -27, 54, 54);
  ctx.strokeStyle = "rgba(243,236,223,0.9)";
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-19, -19, 38, 38);
  ctx.globalCompositeOperation = "destination-out";
  for (let k = 0; k < 5; k++) {
    ctx.save();
    ctx.rotate((k / 5) * Math.PI * 2 - Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 8, 4.2, 6.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (p > 0.35) {
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = "#8d2c28";
    [[214, 602], [168, 596], [206, 662]].forEach(([dx, dy], i) => {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.1 + hash(40 + i) * 1.3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

function drawInscription(ctx, p) {
  if (p <= 0) return;
  if (typeof document !== "undefined" && !document.fonts.check("500 28px 'Atelier Song'")) return;
  ctx.save();
  ctx.globalAlpha = easeOut(clamp01(p));
  ctx.fillStyle = "#2a241c";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "500 28px 'Atelier Song'";
  "月梅".split("").forEach((ch, i) => ctx.fillText(ch, 108, 548 + i * 36));
  ctx.font = "500 15px 'Atelier Song'";
  ctx.fillStyle = "#5a5146";
  "共笔".split("").forEach((ch, i) => ctx.fillText(ch, 142, 560 + i * 24));
  ctx.restore();
}

function drawNib(ctx, s, alpha) {
  if (!s || alpha <= 0) return;
  const ang = Math.atan2(s.ty, s.tx);
  ctx.save();
  ctx.translate(s.x + s.tx * 14, s.y + s.ty * 14);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#8d5b34";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.lineTo(-26, 1.5);
  ctx.stroke();
  ctx.strokeStyle = "#c6a15a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-2, 0);
  ctx.stroke();
  ctx.fillStyle = "#1c1612";
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.quadraticCurveTo(3, -5, -2, -3.2);
  ctx.lineTo(-2, 3.2);
  ctx.quadraticCurveTo(3, 5, 16, 0);
  ctx.fill();
  ctx.restore();
}

function drawReticle(ctx, x, y, t, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t * 0.45);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#b08a45";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
    ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
  }
  ctx.stroke();
  ctx.restore();
}

function drawFibers(ctx) {
  ctx.save();
  for (let i = 0; i < 90; i++) {
    const x = hash(i * 3.1) * 1200;
    const y = hash(i * 5.7) * 760;
    const len = 8 + hash(i * 2.2) * 28;
    const ang = hash(i * 9.3) * Math.PI;
    ctx.strokeStyle = `rgba(92, 68, 40, ${0.025 + hash(i) * 0.035})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  for (let i = 0; i < 36; i++) {
    ctx.fillStyle = `rgba(80, 60, 40, ${0.03 + hash(i + 20) * 0.04})`;
    ctx.beginPath();
    ctx.arc(hash(i * 4.4) * 1200, hash(i * 8.1) * 760, 0.6 + hash(i + 4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function layoutPaper(w, h) {
  const maxW = Math.min(w - 48, 860);
  const maxH = Math.min(h - 28, 560);
  let pw = maxW;
  let ph = pw * (760 / 1200);
  if (ph > maxH) {
    ph = maxH;
    pw = ph * (1200 / 760);
  }
  return { x: (w - pw) / 2, y: (h - ph) / 2 + 4, w: pw, h: ph };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function flowerTint(i) {
  return ["#f6d5d0", "#f3cdc8", "#f7dbd4", "#f0c6c2", "#f8e0da"][i % 5];
}

function drawMarks(ctx, t) {
  const inkP = easeInOut(seg(t, T.ink));
  const readP = easeInOut(seg(t, T.read));
  const guideP = easeInOut(seg(t, T.guide));
  const colorP = seg(t, T.color);
  const forkP = easeInOut(seg(t, T.fork));
  const moonP = easeOut(clamp01(colorP / 0.42));
  const washP = easeOut(clamp01(colorP / 0.62));

  drawWash(ctx, 300, 210, 460, 320, washP, "rgba(62,78,112,0.34)", "rgba(62,78,112,0.12)");
  drawWash(ctx, 360, 260, 280, 200, Math.max(0, washP - 0.15), "rgba(92,104,128,0.16)", "rgba(92,104,128,0.05)");
  drawWash(ctx, SCENE.blush.x, SCENE.blush.y, 240, 170, Math.max(0, washP - 0.08), "rgba(196,140,136,0.26)", "rgba(196,140,136,0.08)");

  if (guideP > 0) {
    const moonGuideA = (1 - moonP) * Math.min(1, guideP * 1.4);
    if (moonGuideA > 0.02) {
      ctx.save();
      ctx.globalAlpha = moonGuideA;
      ctx.strokeStyle = "#9a7340";
      ctx.lineWidth = 1.05;
      ctx.setLineDash([2, 6]);
      ctx.beginPath();
      ctx.arc(MOON.x, MOON.y, MOON.r + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, guideP / 0.35));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(MOON.x - 7, MOON.y);
      ctx.lineTo(MOON.x + 7, MOON.y);
      ctx.moveTo(MOON.x, MOON.y - 7);
      ctx.lineTo(MOON.x, MOON.y + 7);
      ctx.stroke();
      ctx.restore();
    }

    SCENE.flowers.forEach((f, i) => {
      const appear = clamp01((guideP - 0.28 - i * 0.08) / 0.18);
      const open = easeOut(clamp01((colorP - f.delay / (T.color[1] - T.color[0])) / 0.22));
      const a = appear * (1 - open);
      if (a <= 0.02) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "#9a7340";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 5.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(f.x, f.y, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = "#9a7340";
      ctx.fill();
      ctx.restore();
    });

    strokeGuide(ctx, SCENE.forkGuide, clamp01((guideP - 0.55) / 0.45), 0.9 * (1 - forkP));
  }

  drawMoon(ctx, moonP);

  const head = strokeBrush(ctx, SCENE.mainInk, inkP, (u) => {
    const body = 22 * Math.pow(1 - u, 0.78) + 2;
    const lift = u > 0.9 ? 1 - (u - 0.9) / 0.1 : 1;
    return body * (0.32 + 0.68 * lift);
  }, INK, 3);

  const forkHead = strokeBrush(ctx, SCENE.forkInk, forkP, (u) => {
    const body = 10.5 * Math.pow(1 - u, 0.75) + 1.5;
    const lift = u > 0.88 ? 1 - (u - 0.88) / 0.12 : 1;
    return body * (0.45 + 0.55 * lift);
  }, INK, 11);

  const twigStart = T.twig[0];
  const twigA = strokeBrush(
    ctx,
    SCENE.twigA,
    easeInOut(clamp01((t - twigStart) / 0.42)),
    (u) => (4.2 * (1 - u) + 1.1) * (u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1),
    INK,
    15
  );
  const twigB = strokeBrush(
    ctx,
    SCENE.twigB,
    easeInOut(clamp01((t - twigStart - 0.28) / 0.42)),
    (u) => (3.6 * (1 - u) + 1) * (u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1),
    INK,
    16
  );

  SCENE.buds.forEach((b) => {
    const open = easeOut(clamp01((t - T.color[0] - b.delay) / 0.7));
    drawBud(ctx, b.x, b.y, b.rot, b.scale, open);
  });
  const forkBudOpen = clamp01((forkP - SCENE.forkBud.hostU) / 0.2);
  drawBud(ctx, SCENE.forkBud.x, SCENE.forkBud.y, SCENE.forkBud.rot, SCENE.forkBud.scale, forkBudOpen);

  SCENE.flowers.forEach((f, i) => {
    const open = clamp01((t - T.color[0] - f.delay) / 0.78);
    drawBlossom(ctx, f.x, f.y, f.rot, f.radius, open, flowerTint(i));
    const pulse = clamp01((t - T.color[0] - f.delay) / 0.55);
    if (pulse > 0 && pulse < 1) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, f.y, 6 + pulse * 34, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(176, 138, 72, ${(1 - pulse) * 0.75})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  });

  SCENE.forkFlowers.forEach((f, i) => {
    const open = clamp01((forkP - f.hostU) / 0.24);
    drawBlossom(ctx, f.x, f.y, f.rot, f.radius, open, flowerTint(i + 2));
  });

  if (t > T.seal[0]) {
    const fall = t - T.seal[0];
    [SCENE.flowers[1], SCENE.flowers[3]].forEach((f, i) => {
      if (!f) return;
      const u = clamp01((fall - i * 0.45) / 2.4);
      if (u <= 0) return;
      ctx.save();
      ctx.translate(f.x - u * (36 + i * 14), f.y + u * (78 + i * 26) + Math.sin(u * 7 + i) * 7);
      ctx.rotate(f.rot + u * 2.4);
      ctx.globalAlpha = Math.min(1, u * 3) * 0.92;
      ctx.fillStyle = i === 0 ? "#f0c9c4" : "#e7b4b0";
      petalPath(ctx, 11);
      ctx.fill();
      ctx.restore();
    });
  }

  drawSeal(ctx, seg(t, [T.seal[0], T.seal[0] + 0.7]));
  drawInscription(ctx, seg(t, [T.seal[0] + 0.12, T.seal[0] + 0.85]));

  let cursor = null;
  if (t >= T.ink[0] && t < T.read[0]) {
    cursor = { kind: "nib", s: head, a: inkP > 0.01 && t < T.ink[1] - 0.05 ? 1 : 1 - seg(t, [T.ink[1] - 0.18, T.ink[1]]) };
  } else if (t >= T.read[0] && t < T.guide[0]) {
    const u = 1 - readP;
    const i = Math.round(u * (SCENE.mainInk.length - 1));
    const s = SCENE.mainInk[i];
    cursor = { kind: "ai", x: s.x + s.nx * 28, y: s.y + s.ny * 28, a: 1 };
    ctx.save();
    for (let k = 1; k <= 7; k++) {
      const j = Math.min(SCENE.mainInk.length - 1, i + k * 4);
      const p = SCENE.mainInk[j];
      ctx.globalAlpha = (1 - k / 8) * 0.55;
      ctx.fillStyle = "#c6a15a";
      ctx.beginPath();
      ctx.arc(p.x + p.nx * 28, p.y + p.ny * 28, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (t >= T.guide[0] && t < T.color[0]) {
    const g = guideP;
    let x;
    let y;
    if (g < 0.3) {
      const u = g / 0.3;
      const from = SCENE.mainInk[0];
      x = from.x + (MOON.x - from.x) * easeInOut(u);
      y = from.y + (MOON.y - from.y) * easeInOut(u);
    } else if (g < 0.72) {
      const u = (g - 0.3) / 0.42;
      const idx = u * (SCENE.flowers.length - 1);
      const a = SCENE.flowers[Math.floor(idx)];
      const b = SCENE.flowers[Math.min(SCENE.flowers.length - 1, Math.floor(idx) + 1)];
      const f = idx - Math.floor(idx);
      x = a.x + (b.x - a.x) * f;
      y = a.y + (b.y - a.y) * f;
    } else {
      const u = (g - 0.72) / 0.28;
      const i = Math.round(u * (SCENE.forkGuide.length - 1));
      const s = SCENE.forkGuide[Math.min(SCENE.forkGuide.length - 1, i)];
      x = s.x;
      y = s.y;
    }
    cursor = { kind: "ai", x, y, a: 1 };
  } else if (t >= T.color[0] && t < T.fork[0]) {
    const local = t - T.color[0];
    let target = SCENE.flowers[0];
    for (const f of SCENE.flowers) {
      if (local + 0.05 >= f.delay) target = f;
    }
    cursor = { kind: "ai", x: target.x, y: target.y, a: 1 - seg(t, [T.fork[0] - 0.35, T.fork[0]]) };
  } else if (t >= T.fork[0] && t < T.seal[0]) {
    const s = twigB && t >= twigStart + 0.28 ? twigB : twigA && t >= twigStart ? twigA : forkHead;
    cursor = { kind: "nib", s, a: t < T.twig[1] ? 1 : 1 - seg(t, [T.twig[1], T.seal[0]]) };
  }

  if (cursor?.kind === "nib") drawNib(ctx, cursor.s, cursor.a);
  if (cursor?.kind === "ai") drawReticle(ctx, cursor.x, cursor.y, t, cursor.a);

  return { inkP, readP };
}

function makeGrain() {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 160;
  const g = c.getContext("2d");
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 214 + Math.random() * 41;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 28 + Math.random() * 40;
  }
  g.putImageData(img, 0, 0);
  return c;
}

export default function Atelier() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const kickerRef = useRef(null);
  const lineRef = useRef(null);
  const captionRef = useRef(null);
  const barRef = useRef(null);
  const buttonRef = useRef(null);
  const toggleRef = useRef(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const marks = document.createElement("canvas");
    const mctx = marks.getContext("2d");
    const grain = makeGrain();

    const params = new URLSearchParams(window.location.search);
    const freeze = params.has("t") ? Number(params.get("t")) : null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const state = {
      w: 1,
      h: 1,
      dpr: 1,
      playing: freeze == null && !reduce,
      elapsed: freeze != null ? freeze : reduce ? 13.3 : 0,
      last: performance.now(),
      lineKey: "落墨",
    };

    if (reduce && buttonRef.current) buttonRef.current.hidden = true;

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = Math.max(1, rect.width);
      state.h = Math.max(1, rect.height);
      state.dpr = dpr;
      canvas.width = Math.round(state.w * dpr);
      canvas.height = Math.round(state.h * dpr);
    }

    function frame(now) {
      const dt = (now - state.last) / 1000;
      state.last = now;
      if (state.playing && dt > 0 && dt < 0.1) {
        state.elapsed += dt;
        if (state.elapsed >= LOOP) state.elapsed -= LOOP;
      }
      const t = state.elapsed;

      const paper = layoutPaper(state.w, state.h);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      ctx.clearRect(0, 0, state.w, state.h);

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = Math.min(42, state.w * 0.04);
      ctx.shadowOffsetY = 18;
      ctx.fillStyle = PAPER;
      roundRect(ctx, paper.x, paper.y, paper.w, paper.h, 1.5);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(paper.x, paper.y);
      ctx.scale(paper.w / 1200, paper.h / 760);
      ctx.beginPath();
      ctx.rect(0, 0, 1200, 760);
      ctx.clip();
      drawFibers(ctx);
      const top = ctx.createLinearGradient(0, 0, 0, 28);
      top.addColorStop(0, "rgba(90,60,30,0.05)");
      top.addColorStop(1, "rgba(90,60,30,0)");
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, 1200, 28);
      ctx.restore();

      const pw = Math.max(1, Math.round(paper.w * state.dpr));
      const ph = Math.max(1, Math.round(paper.h * state.dpr));
      if (marks.width !== pw || marks.height !== ph) {
        marks.width = pw;
        marks.height = ph;
      }
      mctx.setTransform(pw / 1200, 0, 0, ph / 760, 0, 0);
      mctx.clearRect(0, 0, 1200, 760);
      drawMarks(mctx, t);

      ctx.save();
      ctx.globalAlpha = contentAlpha(t);
      ctx.drawImage(marks, paper.x, paper.y, paper.w, paper.h);
      ctx.restore();

      ctx.save();
      roundRect(ctx, paper.x, paper.y, paper.w, paper.h, 1.5);
      ctx.clip();
      ctx.globalAlpha = 0.22;
      ctx.globalCompositeOperation = "multiply";
      const tile = 180;
      for (let y = paper.y; y < paper.y + paper.h; y += tile) {
        for (let x = paper.x; x < paper.x + paper.w; x += tile) {
          ctx.drawImage(grain, x, y, tile, tile);
        }
      }
      ctx.restore();

      const active = LINES.find((l) => t >= l.t0 && t < l.t1);
      const key = active ? active.k : "";
      if (key !== state.lineKey) {
        state.lineKey = key;
        if (captionRef.current) captionRef.current.style.opacity = active ? "1" : "0";
        if (kickerRef.current) kickerRef.current.textContent = active ? active.k : "";
        if (lineRef.current) lineRef.current.textContent = active ? active.s : "";
      }
      if (barRef.current) barRef.current.style.width = `${(t / LOOP) * 100}%`;

      raf = requestAnimationFrame(frame);
    }

    let raf = 0;
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();
    raf = requestAnimationFrame(frame);

    const toggle = () => {
      if (reduce || freeze != null) return;
      state.playing = !state.playing;
      const btn = buttonRef.current;
      if (!btn) return;
      btn.textContent = state.playing ? "暂停" : "继续";
      btn.setAttribute("aria-pressed", state.playing ? "false" : "true");
    };
    toggleRef.current = toggle;

    const onKey = (e) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    };
    const onClick = () => toggle();
    canvas.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={styles.atelier} translate="no">
      <header className={styles.header}>
        <div>
          <div className={styles.mark}>Atelier</div>
          <div className={styles.piece}>
            月梅<span>辅助绘画</span>
          </div>
        </div>
        <button
          ref={buttonRef}
          type="button"
          className={styles.pause}
          aria-pressed="false"
          onClick={() => toggleRef.current()}
        >
          暂停
        </button>
      </header>

      <div className={styles.stage} ref={wrapRef}>
        <canvas
          ref={canvasRef}
          aria-label="月梅。人先画下一枝梅，辅助标出月亮和花，再由人补上分枝。"
        />
      </div>

      <footer className={styles.footer}>
        <div className={styles.caption} ref={captionRef}>
          <div className={styles.kicker} ref={kickerRef}>落墨</div>
          <div className={styles.line} ref={lineRef} aria-live="polite">
            一笔，从纸边进入
          </div>
        </div>
        <div className={styles.track} aria-hidden="true">
          <span ref={barRef} />
        </div>
      </footer>
    </div>
  );
}
