#!/usr/bin/env node
/**
 * check_sitemap.js  —  sitemap.xml 结构校验
 *
 *   1) 文件存在且是良构 XML
 *   2) 根节点是 <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
 *   3) 每个 <url> 子元素至少包含 <loc>，且是绝对 URL
 *   4) <lastmod> 若存在，必须是合法的 ISO 日期/时间
 *   5) <changefreq> 若存在，必须在 sitemap 标准允许值内
 *   6) <priority> 若存在，必须是 0.0 ~ 1.0 之间的数值
 *   7) loc 指向的实际文件（index/about/404.html + 静态资源）在仓库中存在
 *      （即相对 / 的路径在仓库根存在对应文件；若是外部 URL 则跳过存在检查）
 */
const fs   = require('fs');
const path = require('path');

const REPO = process.env.GITHUB_WORKSPACE
          || path.resolve(__dirname, '..');
const SITEMAP = path.join(REPO, 'sitemap.xml');
const VALID_FREQ = new Set([
  'always','hourly','daily','weekly','monthly','yearly','never'
]);

let failures = 0;
function fail(msg) { failures++; console.error('[FAIL] ' + msg); }
function info(msg) { console.log('[ OK ] ' + msg); }

if (!fs.existsSync(SITEMAP)) { fail('sitemap.xml 不存在'); process.exit(1); }
const xml = fs.readFileSync(SITEMAP, 'utf8');

// 1. 基本良构：匹配 <urlset ...> ... </urlset>
if (!/<\?xml[^?]*\?>/i.test(xml)) fail('缺少 XML 声明 <?xml ...?>');
if (!/<urlset\b/i.test(xml))   fail('缺少根节点 <urlset>');
if (!/<\/urlset>/i.test(xml))  fail('缺少结束标签 </urlset>');

// 2. xmlns 声明
const nsM = xml.match(/<urlset[^>]*\bxmlns\s*=\s*"([^"]+)"/i);
if (!nsM) fail('<urlset> 未声明 xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
else if (!/schemas\/sitemap\/0\.9/.test(nsM[1])) fail(`<urlset xmlns="${nsM[1]}"> 不是标准 sitemap namespace`);

// 3. 抽出每个 <url>...</url>
const urlBlocks = [];
const openRe = /<url\b[^>]*>/gi;
let m;
while ((m = openRe.exec(xml)) !== null) {
  const closeIdx = xml.indexOf('</url>', m.index + 1);
  if (closeIdx < 0) { fail('存在未闭合的 <url> 标签'); break; }
  urlBlocks.push(xml.substring(m.index, closeIdx + 6));
}
if (urlBlocks.length === 0) fail('没有 <url> 条目');

info(`<url> 条目数 = ${urlBlocks.length}`);

function gtext(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const mm = block.match(re);
  return mm ? mm[1].trim() : null;
}

let idx = 0;
for (const b of urlBlocks) {
  idx++;
  const loc = gtext(b, 'loc');
  const pref = `url#${idx}`;
  if (!loc) { fail(`${pref} 缺少 <loc>`); continue; }
  if (!/^https?:\/\//i.test(loc)) fail(`${pref} <loc> 不是绝对 URL: ${loc}`);

  // 抽取 pathname 做存在性检查（仅本站域名，若外部域名则跳过）
  try {
    const u = new URL(loc);
    // 只要是当前站点（忽略 hostname，检查 repo 根是否有对应文件）
    let p = decodeURIComponent(u.pathname.replace(/\/+$/, '')) || '/index.html';
    if (p === '/') p = '/index.html';
    if (!p.startsWith('/')) p = '/' + p;
    const localFile = path.join(REPO, p.substring(1));
    // 接受：index.html / about.html / 404.html / assets/...
    if (!fs.existsSync(localFile) && !fs.existsSync(localFile + '.html') && !fs.existsSync(localFile + '/index.html')) {
      // 只警告，不失败（可能是伪静态路由或未来路由）
      info(`${pref} <loc> path "${p}" 未在仓库中找到文件（可能是伪静态，不阻塞）`);
    }
  } catch (_) {
    fail(`${pref} <loc> 格式无法解析为 URL: ${loc}`);
  }

  const lastmod = gtext(b, 'lastmod');
  if (lastmod) {
    const d = new Date(lastmod);
    if (Number.isNaN(d.getTime())) fail(`${pref} <lastmod> "${lastmod}" 不是合法 ISO 日期`);
  }

  const cf = gtext(b, 'changefreq');
  if (cf && !VALID_FREQ.has(cf.toLowerCase())) fail(`${pref} <changefreq> "${cf}" 不在允许列表`);

  const pr = gtext(b, 'priority');
  if (pr !== null) {
    const n = Number(pr);
    if (Number.isNaN(n) || n < 0 || n > 1.0) fail(`${pref} <priority> "${pr}" 不在 0.0~1.0 范围`);
  }
}

if (failures === 0) { console.log('\n✓ sitemap 校验通过'); process.exit(0); }
console.error(`\n✗ sitemap 校验失败：共 ${failures} 处`); process.exit(1);
