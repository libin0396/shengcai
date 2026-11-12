#!/usr/bin/env python3
"""给「跟着做」生成手机用的轻量图片。

教程原图（实操截图、生成图）很多是 1～6 MB 的 PNG/JPEG，手机上一步要等很久。
这个脚本把「跟着做」用到的大图另存一份：长边不超过 1200 像素的 JPEG，放在
uni-app/src/static/learn/media/zuo/，并把「原图 → 轻量图」的对照表写进 zuo-data.js 的 LITE。
原图不动，图文教程页照旧用原图。教程或剧本换了图片以后，重新运行一次：

    python3 scripts/build-zuo-media.py
"""
import json, pathlib, re, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
LEARN = ROOT / 'uni-app/src/static/learn'
OUT = LEARN / 'media/zuo'
LIMIT = 250 * 1024   # 小于这个大小的图直接用原图
SIDE = 1200

def media_paths():
    # 用 node 读出 zuo-data.js 和 guides-data.js 里「跟着做」会用到的所有图片路径
    js = r"""
const vm=require('vm'),fs=require('fs');const c={window:{}};
for(const f of ['guides-data.js','zuo-data.js'])vm.runInNewContext(fs.readFileSync(process.argv[1]+'/'+f,'utf8'),c);
const Z=c.window.AINPE_ZUO,G=c.window.AINPE_GUIDES.concat(Z.EXTRA||[]);const out=new Set();
const add=p=>{if(typeof p==='string'&&/^media\/.+\.(png|jpe?g)$/i.test(p))out.add(p)};
const walk=v=>{if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);else add(v)};
for(const id of Z.ORDER){const g=G.find(x=>x.id===id);walk(g.steps);walk(g.exampleMedia||[]);walk(Z.SCRIPTS[id])}
console.log(JSON.stringify([...out].sort()));
"""
    res = subprocess.run(['node', '-e', js, str(LEARN)], capture_output=True, text=True, check=True)
    return json.loads(res.stdout)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lite = {}
    for rel in media_paths():
        src = LEARN / rel
        if not src.exists():
            sys.exit('missing image: ' + rel)
        if src.stat().st_size <= LIMIT:
            continue
        name = rel[len('media/'):].replace('/', '-').rsplit('.', 1)[0] + '.jpg'
        dst = OUT / name
        im = Image.open(src).convert('RGB')
        im.thumbnail((SIDE, SIDE), Image.LANCZOS)
        im.save(dst, 'JPEG', quality=80, optimize=True, progressive=True)
        lite[rel] = 'media/zuo/' + name
        print('%-52s %6d KB -> %4d KB' % (rel, src.stat().st_size // 1024, dst.stat().st_size // 1024))
    data = LEARN / 'zuo-data.js'
    text = data.read_text(encoding='utf-8')
    block = json.dumps(lite, ensure_ascii=False, indent=2, sort_keys=True)
    block = '\n'.join(('  ' + l if i else l) for i, l in enumerate(block.splitlines()))
    new, n = re.subn(r'/\*LITE\*/.*?/\*LITE\*/', '/*LITE*/' + block.replace('\\', '\\\\') + '/*LITE*/', text, flags=re.S)
    if n != 1:
        sys.exit('zuo-data.js 里找不到 /*LITE*/ 标记')
    data.write_text(new, encoding='utf-8')
    print('LITE: %d images' % len(lite))

if __name__ == '__main__':
    main()
