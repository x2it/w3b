#!/usr/bin/env node
/**
 * check_node_syntax.js  —  对仓库所有可执行 JS 跑 node --check 语法检查
 *
 * 覆盖范围：
 *   - assets/js/*.js
 *   - scripts/*.js（含自身）
 * 跳过：第三方库（node_modules、vendor 目录、min.js）
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = process.env.GITHUB_WORKSPACE
          || path.resolve(__dirname, '..');

const SCAN_DIRS = [
  path.join(REPO, 'assets', 'js'),
  path.join(REPO, 'scripts')
];

function collectFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (/^(node_modules|vendor|\.git)$/.test(f.name)) continue;
      out.push(...collectFiles(fp));
    } else if (f.isFile() && /\.js$/i.test(f.name)) {
      if (/\.min\.js$/i.test(f.name)) continue; // 跳过压缩文件
      out.push(fp);
    }
  }
  return out;
}

const files = [];
for (const d of SCAN_DIRS) files.push(...collectFiles(d));
console.log('待检查 JS 文件数：' + files.length);

let bad = 0;
for (const fp of files) {
  try {
    execSync('node --check ' + JSON.stringify(fp), { stdio: 'pipe' });
    console.log('[ OK ] ' + path.relative(REPO, fp));
  } catch (e) {
    bad++;
    console.error('[FAIL] ' + path.relative(REPO, fp));
    const out = (e.stderr ? String(e.stderr) : String(e.message)).trim();
    console.error('       ' + out.split('\n').join('\n       '));
  }
}

if (bad === 0) { console.log('\n✓ node --check 全部通过'); process.exit(0); }
console.error(`\n✗ 语法检查失败：${bad} 个文件`); process.exit(1);
