#!/usr/bin/env node

/*
 * Delivery guardrails for the Poren Huang Studio site.
 * This is intentionally dependency-free so it can run before a build or review.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const site = 'https://porenhuang.com';
const failures = [];
const notices = [];
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const fail = message => failures.push(message);
const note = message => notices.push(message);
const hash = relative => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relative))).digest('hex');

function checkWorkData() {
  if (!exists('data/works.json')) return fail('缺少 data/works.json。');
  let works;
  try { works = JSON.parse(read('data/works.json')); } catch { return fail('data/works.json 不是有效 JSON。'); }
  if (!Array.isArray(works) || works.length === 0) return fail('data/works.json 必須包含至少一件作品。');
  const slugs = new Set();
  for (const [index, work] of works.entries()) {
    const label = `作品 #${index + 1}`;
    for (const field of ['id', 'slug', 'title_en', 'year', 'images']) {
      if (!work[field] || (Array.isArray(work[field]) && work[field].length === 0)) fail(`${label} 缺少 ${field}。`);
    }
    if (slugs.has(work.slug)) fail(`${label} 的 slug「${work.slug}」重複。`);
    slugs.add(work.slug);
    for (const image of work.images || []) {
      if (!image.filename || !exists(image.filename)) fail(`${label} 的圖片不存在：${image.filename || '(未填寫)'}`);
      if (!(image.alt_zh || image.alt_en)) fail(`${label} 的圖片缺少如實的 alt 文字：${image.filename || '(未填寫)'}`);
    }
  }
  return works;
}

function checkGeneratedFiles(works) {
  if (!works) return;
  for (const work of works) {
    const relative = `works/${work.slug}.html`;
    if (!exists(relative)) { fail(`尚未產生 ${relative}；請先執行 npm run build。`); continue; }
    const html = read(relative);
    if (!html.includes(`<link rel="canonical" href="${site}/works/${work.slug}">`)) fail(`${relative} 缺少正確 canonical。`);
    if (!html.includes('application/ld+json')) fail(`${relative} 缺少 JSON-LD。`);
    if (!html.includes('hreflang="zh-Hant"') || !html.includes('hreflang="en"')) fail(`${relative} 缺少雙語 hreflang。`);
  }
  if (!exists('works/index.html') || !exists('works.html')) fail('作品總覽尚未產生；請先執行 npm run build。');
  if (!exists('sitemap.xml')) fail('缺少 sitemap.xml；請先執行 npm run build。');
  else for (const work of works) if (!read('sitemap.xml').includes(`${site}/works/${work.slug}`)) fail(`sitemap.xml 缺少作品：${work.slug}。`);
}

function checkStaticPages() {
  const pages = ['index.html', 'about.html', 'works.html', 'exhibitions.html', 'press.html', 'series.html'];
  for (const relative of pages) {
    if (!exists(relative)) { fail(`缺少主要頁面：${relative}。`); continue; }
    const html = read(relative);
    if (!/<html[^>]+lang=["']zh-Hant["']/i.test(html)) fail(`${relative} 的 html lang 必須為 zh-Hant。`);
    if (!/<link rel=["']canonical["'] href=["']https:\/\/porenhuang\.com/i.test(html)) fail(`${relative} 缺少 canonical。`);
    if (!html.includes('hreflang="zh-Hant"') || !html.includes('hreflang="en"') || !html.includes('hreflang="x-default"')) fail(`${relative} 缺少完整 hreflang。`);
    const imagesWithoutAlt = [...html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)].length;
    if (imagesWithoutAlt) fail(`${relative} 有 ${imagesWithoutAlt} 個 img 缺少 alt 屬性。`);
  }
}

function checkTestSync() {
  if (path.basename(root) === 'test-sync') return;
  if (!exists('test-sync')) { note('找不到 test-sync；測試站尚未建立或未同步。'); return; }
  const essentials = ['index.html', 'about.html', 'works.html', 'exhibitions.html', 'press.html', 'series.html', 'assets/style.css', 'assets/site.js', 'data/works.json', 'SITE-RULES.md', 'package.json', 'scripts/preflight-check.js'];
  const stale = essentials.filter(relative => exists(relative) && (!exists(path.join('test-sync', relative)) || hash(relative) !== hash(path.join('test-sync', relative))));
  if (stale.length) note(`測試站與主網站不一致：${stale.join('、')}。請在確認主網站版本後同步測試站。`);
}

function checkGitState() {
  try {
    const output = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
    if (output) note(`目前有未提交變更（不會由本檢查自動加入或發布）：\n${output}`);
  } catch { note('無法讀取 Git 狀態。'); }
}

const works = checkWorkData();
checkGeneratedFiles(works);
checkStaticPages();
checkTestSync();
checkGitState();

console.log('\nPoren Huang Studio｜交付前自檢');
if (notices.length) console.log(`\n注意事項：\n${notices.map(item => `- ${item}`).join('\n')}`);
if (failures.length) {
  console.error(`\n未通過：\n${failures.map(item => `- ${item}`).join('\n')}`);
  process.exitCode = 1;
} else console.log('\n通過：資料、主要頁面、SEO 基本標記與產出檔案均符合檢查。');
