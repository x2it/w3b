#!/usr/bin/env node
/**
 * check_i18n_keys.js  —  三语 key 对齐校验
 *
 * 用法：node scripts/check_i18n_keys.js [i18n-js-path]
 * 加载 assets/js/i18n.js 中的 window.I18N = { zh, zh-TW, en } 词典
 * 断言：
 *   1) 三种语言（zh / zh-TW / en）均已定义
 *   2) key 集合完全相同，报告"缺失"和"多余"的 key
 *   3) 任一 key 值不是 "" 空串（允许非字符串？不，必须字符串）
 *   4) HTML 页面中 data-i18n 引用的 key 在词典中都存在（静态扫描）
 *
 * 返回 exit code 0 = OK；1 = 有错误。
 */
const fs   = require('fs');
const path = require('path');

const REPO = process.env.GITHUB_WORKSPACE
          || path.resolve(__dirname, '..');
const I18N_PATH = process.argv[2]
               || path.join(REPO, 'assets', 'js', 'i18n.js');
const HTMLS = [
  path.join(REPO, 'index.html'),
  path.join(REPO, 'about.html'),
  path.join(REPO, '404.html')
];

let failures = 0;
function fail(msg) { failures++; console.error('[FAIL] ' + msg); }
function info(msg) { console.log('[ OK ] ' + msg); }

// ---------- Step 1: 加载 window.I18N ----------
const i18nSrc = fs.readFileSync(I18N_PATH, 'utf8');
// 模拟浏览器全局 window
const sandbox = { window: {}, navigator: { language: 'zh-CN', languages: ['zh-CN'] }, document: {} };
const vm = require('vm');
const ctx = vm.createContext(sandbox);
try {
  vm.runInContext(i18nSrc, ctx, { filename: 'i18n.js' });
} catch (e) {
  fail('i18n.js 执行异常：' + e.message);
  process.exit(1);
}
const I18N = sandbox.window.I18N;
if (!I18N) { fail('i18n.js 未定义 window.I18N'); process.exit(1); }

const LANGS = ['zh', 'zh-TW', 'en'];
for (const L of LANGS) {
  if (!I18N[L]) fail(`词典缺少语言 ${L}`);
}
if (failures) process.exit(1);
info(`加载成功：zh=${Object.keys(I18N.zh).length}  zh-TW=${Object.keys(I18N['zh-TW']).length}  en=${Object.keys(I18N.en).length} 个 key`);

// ---------- Step 2: key 集合对齐 ----------
const sets = {};
for (const L of LANGS) sets[L] = new Set(Object.keys(I18N[L]));
const allKeys = new Set([...sets['zh'], ...sets['zh-TW'], ...sets['en']]);
let keyMismatch = 0;
for (const k of allKeys) {
  const missing = LANGS.filter(L => !sets[L].has(k));
  if (missing.length) {
    keyMismatch++;
    fail(`key "${k}" 缺失语言: ${missing.join(', ')}`);
  }
}
if (keyMismatch === 0) info('三语 key 集合完全对齐');

// ---------- Step 3: 值非空 / 类型校验 ----------
let badValue = 0;
for (const k of allKeys) {
  for (const L of LANGS) {
    const v = I18N[L][k];
    if (typeof v !== 'string') { badValue++; fail(`[${L}] "${k}" 类型不是字符串: ${typeof v}`); continue; }
    if (!v.length) { badValue++; fail(`[${L}] "${k}" 值为空字符串`); }
  }
}
if (badValue === 0) info('所有翻译值均为非空字符串');

// ---------- Step 4: HTML data-i18n 引用校验 ----------
const attrRe = /data-i18n(?:-html|-content|-title|-aria)?\s*=\s*"([^"]+)"/g;
const htmlUsedKeys = new Set();
for (const hp of HTMLS) {
  if (!fs.existsSync(hp)) continue;
  const html = fs.readFileSync(hp, 'utf8');
  let m;
  while ((m = attrRe.exec(html)) !== null) htmlUsedKeys.add(m[1]);
}
let missingRef = 0;
for (const k of htmlUsedKeys) {
  for (const L of LANGS) {
    if (!sets[L].has(k)) { missingRef++; fail(`HTML 引用的 key "${k}" 在 [${L}] 词典中不存在`); break; }
  }
}
if (missingRef === 0) info(`HTML data-i18n 引用均存在（${htmlUsedKeys.size} 个引用）`);

if (failures === 0) {
  console.log('\n✓ i18n 校验通过');
  process.exit(0);
} else {
  console.error(`\n✗ i18n 校验失败：共 ${failures} 处错误`);
  process.exit(1);
}
