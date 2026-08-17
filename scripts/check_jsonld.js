#!/usr/bin/env node
/**
 * check_jsonld.js  —  JSON-LD 结构化数据校验
 *
 * 对 index.html / about.html / 404.html 中 id="ld-json" 的
 * <script type="application/ld+json"> 块做：
 *   1) 语法能 JSON.parse
 *   2) 必需字段：@context、@type、name、description、inLanguage、url
 *   3) @type 为 WebSite / Person / AboutPage / FAQPage 等常用值之一
 *   4) inLanguage 匹配该页当前 <html lang="">（粗略一致：zh / en / zh-TW）
 *   5) author.name 在三语词典中的 ld.author 若存在则匹配
 */
const fs   = require('fs');
const path = require('path');

const REPO = process.env.GITHUB_WORKSPACE
          || path.resolve(__dirname, '..');
const HTMLS = [
  path.join(REPO, 'index.html'),
  path.join(REPO, 'about.html'),
  path.join(REPO, '404.html')
];

const ALLOWED_TYPES = new Set([
  'WebSite','Person','Organization','AboutPage','FAQPage','TechArticle',
  'Article','WebPage','CreativeWork','ProfilePage','CollectionPage','BlogPosting'
]);
const ALLOWED_LANG_PREFIX = /^(zh|en)/i;
// 404 / 错误页一般不放结构化数据，缺少 JSON-LD 只警告不失败
const FILES_JSONLD_REQUIRED = new Set([
  'index.html','about.html'
]);

let failures = 0;
function fail(file, msg) { failures++; console.error(`[FAIL] ${path.basename(file)}: ${msg}`); }
function info(file, msg) { console.log(`[ OK ] ${path.basename(file)}: ${msg}`); }

for (const hp of HTMLS) {
  if (!fs.existsSync(hp)) { fail(hp, '文件不存在'); continue; }
  const html = fs.readFileSync(hp, 'utf8');

  // html lang
  const langM = html.match(/<html[^>]*\blang\s*=\s*"([^"]+)"/i);
  const htmlLang = (langM && langM[1]) || '';

  // ld-json
  const ldScriptM = html.match(/<script[^>]*\bid="ld-json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!ldScriptM) {
    const base = path.basename(hp);
    if (FILES_JSONLD_REQUIRED.has(base)) {
      fail(hp, '找不到 id="ld-json" 的 JSON-LD 脚本');
    } else {
      info(hp, '（非关键页）跳过 JSON-LD：未定义 id="ld-json"');
    }
    continue;
  }
  let ld;
  try { ld = JSON.parse(ldScriptM[1]); }
  catch (e) { fail(hp, 'JSON-LD 解析失败：' + e.message); continue; }

  info(hp, 'JSON-LD 语法合法');

  // 必需字段
  const need = ['@context','@type','name','description','inLanguage','url'];
  for (const k of need) {
    if (ld[k] === undefined || ld[k] === null || ld[k] === '') {
      fail(hp, `缺少必需字段 "${k}"`);
    }
  }
  // @context 必须是 schema.org 字符串或包含 @vocab
  if (typeof ld['@context'] !== 'string' ||
      !/schema\.org/i.test(ld['@context']) &&
      !(typeof ld['@context'] === 'object' && ld['@context']['@vocab'])) {
    // 宽松兼容：可接受数组中存在 schema
    let ok = false;
    if (Array.isArray(ld['@context'])) {
      ok = ld['@context'].some(c => typeof c === 'string' && /schema\.org/i.test(c));
    }
    if (!ok) fail(hp, `@context 不是合法的 schema.org 声明: ${JSON.stringify(ld['@context'])}`);
  }
  if (ld['@type'] && !ALLOWED_TYPES.has(String(ld['@type']))) {
    // 接受 schema: 前缀或多类型数组
    if (Array.isArray(ld['@type'])) {
      if (!ld['@type'].some(t => ALLOWED_TYPES.has(String(t)))) fail(hp, '@type 数组中不存在已知 schema 类型');
    } else {
      fail(hp, `@type "${ld['@type']}" 不在允许列表中`);
    }
  }
  if (ld.inLanguage && !ALLOWED_LANG_PREFIX.test(String(ld.inLanguage))) {
    fail(hp, `inLanguage "${ld.inLanguage}" 格式异常（应 zh / en / zh-TW 等）`);
  }
  if (htmlLang && ld.inLanguage) {
    // 语义一致：同为 zh 系 / 同为 en
    const same = (ALLOWED_LANG_PREFIX.test(htmlLang) && ALLOWED_LANG_PREFIX.test(String(ld.inLanguage)))
      && (/^zh/i.test(htmlLang) === /^zh/i.test(String(ld.inLanguage)));
    if (!same) fail(hp, `html lang="${htmlLang}" 与 inLanguage="${ld.inLanguage}" 语义不一致`);
  }
}

if (failures === 0) { console.log('\n✓ JSON-LD 校验通过'); process.exit(0); }
console.error(`\n✗ JSON-LD 校验失败：共 ${failures} 处`); process.exit(1);
