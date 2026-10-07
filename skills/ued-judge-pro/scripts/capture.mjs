#!/usr/bin/env node
// UEDJudge 评论员截图脚本：整页总览 + 1440×900 视口切片。
// 用法：node capture.mjs <url 或 file:///绝对路径> <输出目录> <前缀，如 shot-3>
// 可选环境变量：PLAYWRIGHT_PATH=<playwright 包的绝对路径>（本机未全局安装时使用）
// 输出：<前缀>-0.png（整页总览）、<前缀>-1.png … <前缀>-n.png（从上到下的视口切片），并在 stdout 打印 JSON 清单。

import { mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';

const [, , target, outDirArg, prefix] = process.argv;
if (!target || !outDirArg || !prefix) {
  console.error('用法：node capture.mjs <url> <输出目录> <前缀>');
  process.exit(1);
}

// 固定参数：所有轮次一致，不要改动
const VIEWPORT = { width: 1440, height: 900 };
const SLICE_HEIGHT = 900; // 每张切片与视口同高
const OVERLAP = 100; // 相邻切片重叠，避免把一行内容切断
const MAX_SLICES = 6; // 超出时只截前 6 张并在清单中提示

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  const candidates = [process.env.PLAYWRIGHT_PATH, 'playwright'].filter(Boolean);
  for (const id of candidates) {
    try {
      return require(id);
    } catch {
      // 尝试下一个候选
    }
  }
  console.error('未找到 playwright。请先安装（npm i -D playwright 或 npx playwright install chromium），或设置 PLAYWRIGHT_PATH。');
  process.exit(2);
}

const { chromium } = await loadPlaywright();
const outDir = resolve(outDirArg);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await page.goto(target, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(300);

  const pageHeight = await page.evaluate(() =>
    Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)
  );

  const files = [];
  const overview = join(outDir, `${prefix}-0.png`);
  await page.screenshot({ path: overview, fullPage: true });
  files.push({ role: 'overview', path: overview });

  // 计算切片起点：步长 = 切片高 - 重叠；最后一张贴底
  const step = SLICE_HEIGHT - OVERLAP;
  const starts = [];
  for (let y = 0; y + SLICE_HEIGHT < pageHeight; y += step) starts.push(y);
  starts.push(Math.max(0, pageHeight - SLICE_HEIGHT));
  const unique = [...new Set(starts)];
  const truncated = unique.length > MAX_SLICES;

  for (const [i, y] of unique.slice(0, MAX_SLICES).entries()) {
    const file = join(outDir, `${prefix}-${i + 1}.png`);
    await page.screenshot({
      path: file,
      fullPage: true,
      clip: { x: 0, y, width: VIEWPORT.width, height: Math.min(SLICE_HEIGHT, pageHeight - y) },
    });
    files.push({ role: 'slice', top: y, path: file });
  }

  console.log(JSON.stringify({ target, viewport: VIEWPORT, pageHeight, truncated, files }, null, 2));
} finally {
  await browser.close();
}
