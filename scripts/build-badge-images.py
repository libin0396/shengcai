#!/usr/bin/env python3
"""把学 AI 徽章导出成 PNG，给小程序用。

网页上的徽章是 static/learn/ai-badges.js 直接画的 SVG；小程序画不了，改成从网站读这里导出的图
（data/ai-core.js 的 badgeImage() 拼地址）。改了徽章图样以后，重新运行一次：

    python3 scripts/build-badge-images.py

需要 node、rsvg-convert（librsvg；macOS：brew install librsvg，Ubuntu：apt install librsvg2-bin）和 Pillow。
输出到 uni-app/src/static/learn/img/badges/（都不要手改）：
    u1-got.png … u6-got.png          拿到的金色章
    u1-0.png、u1-1.png、u1-2.png …   没拿到时的白章，数字是外圈进度走了几段（一节课一段，第 6 单元多一段作品）
    mini-got.png、mini-off.png        「徽章 n / 6」前面的小章
"""
import io, json, pathlib, subprocess
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
LEARN = ROOT / 'uni-app/src/static/learn'
OUT = LEARN / 'img/badges'
SIZE = 288   # 小程序里最大显示 112px（学完一节课时的大徽章），约 2.5 倍图
MINI = 66

def svgs():
    # 用 node 跑一遍 ai-badges.js，拿到每张图的 SVG（颜色用浅色，和小程序页面一致）
    js = r"""
const vm=require('vm'),fs=require('fs');const c={window:{}};
for(const f of ['ai-badges.js','xue-ai-data.js'])vm.runInNewContext(fs.readFileSync(process.argv[1]+'/'+f,'utf8'),c);
const B=c.window.AINPE_BADGES,X=c.window.AINPE_XUE,S=+process.argv[2],M=+process.argv[3],out=[];
X.UNITS.forEach((u,i)=>{const total=B.steps(u,0,0).total;
  out.push([u.id+'-got.png',S,B.svg(u.id,{got:true,no:i+1,size:S,standalone:true})]);
  for(let k=0;k<total;k++)out.push([u.id+'-'+k+'.png',S,B.svg(u.id,{got:false,done:k,total,no:i+1,size:S,standalone:true})]);});
out.push(['mini-got.png',M,B.mini(true,{size:M,standalone:true})],['mini-off.png',M,B.mini(false,{size:M,standalone:true})]);
console.log(JSON.stringify(out));
"""
    res = subprocess.run(['node', '-e', js, str(LEARN), str(SIZE), str(MINI)], check=True, capture_output=True, text=True)
    return json.loads(res.stdout)

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob('*.png'):
        old.unlink()
    names = []
    for name, size, svg in svgs():
        raw = subprocess.run(['rsvg-convert', '-w', str(size), '-h', str(size), '-f', 'png'], input=svg.encode('utf-8'), check=True, capture_output=True).stdout
        # 颜色不多，转成 128 色调色板，图小三四倍，看不出差别
        img = Image.open(io.BytesIO(raw)).convert('RGBA').quantize(colors=128, method=Image.Quantize.FASTOCTREE)
        img.save(OUT / name, 'PNG', optimize=True)
        names.append(name)
    total = sum((OUT / n).stat().st_size for n in names)
    print(f'已写入 {len(names)} 张，共 {total // 1024} KB：' + '、'.join(names))

if __name__ == '__main__':
    main()
