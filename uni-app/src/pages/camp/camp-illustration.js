// 原创插画：三级台阶 = 3 天；左边的人带着问号上台阶，中间的带教老师伸手拉，右上的人举旗出成果；旁边飘着 AI 助手
function campIllo(w){
 function person(x,f,o){var s='',sy=f-112;
  // 腿和鞋
  s+='<rect x="'+(x-16)+'" y="'+(f-56)+'" width="13" height="54" rx="6" fill="'+o.pants+'"/><rect x="'+(x+3)+'" y="'+(f-56)+'" width="13" height="54" rx="6" fill="'+o.pants+'"/>';
  s+='<ellipse cx="'+(x-11)+'" cy="'+(f-2)+'" rx="11" ry="5" fill="#13241B"/><ellipse cx="'+(x+11)+'" cy="'+(f-2)+'" rx="11" ry="5" fill="#13241B"/>';
  if(o.longHair)s+='<rect x="'+(x-24)+'" y="'+(f-150)+'" width="48" height="44" rx="18" fill="'+o.hair+'"/>';
  // 手臂（身体后面那只先画）
  o.arms.forEach(function(a){s+='<polyline points="'+a.join(' ')+'" fill="none" stroke="'+o.shirt+'" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>';var h=a.slice(-2);s+='<circle cx="'+h[0]+'" cy="'+h[1]+'" r="7" fill="'+o.skin+'"/>'});
  s+='<rect x="'+(x-28)+'" y="'+(f-124)+'" width="56" height="74" rx="22" fill="'+o.shirt+'"/>';
  if(o.badge)s+='<path d="M'+(x-10)+' '+(f-122)+' L'+x+' '+(f-96)+' L'+(x+10)+' '+(f-122)+'" stroke="#FFC94D" stroke-width="3" fill="none"/><rect x="'+(x-8)+'" y="'+(f-98)+'" width="16" height="20" rx="3" fill="#FFC94D"/>';
  s+='<rect x="'+(x-7)+'" y="'+(f-132)+'" width="14" height="12" fill="'+o.skin+'"/>';
  s+='<circle cx="'+x+'" cy="'+(f-150)+'" r="23" fill="'+o.skin+'"/>';
  s+='<path d="M'+(x-24)+' '+(f-148)+' a24 24 0 0 1 48 0 q-6 -9 -18 -10 q-6 8 -30 10z" fill="'+o.hair+'"/>';
  var d=o.face||0;s+='<circle cx="'+(x-8+d)+'" cy="'+(f-150)+'" r="2.6" fill="#13241B"/><circle cx="'+(x+8+d)+'" cy="'+(f-150)+'" r="2.6" fill="#13241B"/>';
  s+=o.smile?'<path d="M'+(x-6+d)+' '+(f-141)+' q6 6 12 0" stroke="#13241B" stroke-width="2.4" fill="none" stroke-linecap="round"/>':'<path d="M'+(x-4+d)+' '+(f-140)+' h8" stroke="#13241B" stroke-width="2.4" stroke-linecap="round"/>';
  return s}
 var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -70 646 530" width="'+w+'" height="'+(w*530/646)+'" font-family="sans-serif">';
 // 台阶
 [[20,360,'第 1 天','看机会',''],[222,280,'第 2 天','学路径','有人带 · AI 答疑'],[424,200,'第 3 天','出成果','亲手做出第一个成果']].forEach(function(t){var h=460-t[1];
  s+='<rect x="'+t[0]+'" y="'+t[1]+'" width="200" height="'+h+'" rx="16" fill="rgba(255,255,255,.08)"/><rect x="'+t[0]+'" y="'+t[1]+'" width="200" height="8" rx="4" fill="#FFC94D" opacity=".75"/>';
  s+='<text x="'+(t[0]+100)+'" y="'+(t[1]+48)+'" text-anchor="middle" font-size="22" font-weight="800" fill="#FFC94D">'+t[2]+'</text><text x="'+(t[0]+100)+'" y="'+(t[1]+84)+'" text-anchor="middle" font-size="28" font-weight="900" fill="#fff">'+t[3]+'</text>'+(t[4]?'<text x="'+(t[0]+100)+'" y="'+(t[1]+120)+'" text-anchor="middle" font-size="18" font-weight="700" fill="#9FD8B5">'+t[4]+'</text>':'')});
 // 问号气泡
 s+='<g transform="translate(40,150)"><rect width="56" height="46" rx="16" fill="#fff"/><path d="M14 44 l-4 14 l16 -12z" fill="#fff"/><text x="28" y="34" text-anchor="middle" font-size="30" font-weight="900" fill="#EE5A24">?</text></g>';
 // 人物 1：上台阶的新人
 s+=person(118,360,{skin:'#F3C9A4',hair:'#2B1A12',shirt:'#9FD8B5',pants:'#E8DFC9',longHair:true,face:3,arms:[[96,250,90,290,96,318],[140,250,172,246,204,226]]});
 // 人物 2：带教老师，伸手拉一把，另一手拿平板
 s+=person(322,280,{skin:'#E2AE85',hair:'#3A2416',shirt:'#EE5A24',pants:'#DCD3BE',badge:true,smile:true,face:-3,arms:[[300,170,262,198,214,222],[344,170,360,206,342,214]]});
 s+='<rect x="326" y="194" width="38" height="28" rx="5" fill="#13241B"/><rect x="330" y="198" width="30" height="20" rx="3" fill="#9FD8B5"/>';
 // AI 助手
 s+='<g transform="translate(396,96)"><line x1="26" y1="0" x2="26" y2="-14" stroke="#9FD8B5" stroke-width="3"/><circle cx="26" cy="-16" r="5" fill="#FFC94D"/><rect width="52" height="44" rx="14" fill="#9FD8B5"/><rect x="8" y="10" width="36" height="22" rx="10" fill="#0B2E20"/><circle cx="19" cy="21" r="4" fill="#9FD8B5"/><circle cx="33" cy="21" r="4" fill="#9FD8B5"/><text x="26" y="66" text-anchor="middle" font-size="15" font-weight="900" fill="#9FD8B5">AI 助手</text></g>';
 s+='<path d="M392 132 q-22 14 -30 40" stroke="#9FD8B5" stroke-width="2.5" stroke-dasharray="4 5" fill="none"/>';
 // 人物 3：举旗
 s+='<line x1="574" y1="-62" x2="574" y2="56" stroke="#F7F3EA" stroke-width="5" stroke-linecap="round"/><path d="M576 -60 L640 -46 L576 -30z" fill="#EE5A24"/>';
 s+=person(526,200,{skin:'#F0BE96',hair:'#1F140E',shirt:'#FFC94D',pants:'#E8DFC9',smile:true,face:2,arms:[[504,90,490,116,498,140],[548,90,566,64,574,40]]});
 // 彩带
 [[470,-30,'#FFC94D',20],[612,10,'#9FD8B5',-30],[452,40,'#EE5A24',40],[630,80,'#FFC94D',15],[500,-58,'#9FD8B5',-20]].forEach(function(c){s+='<rect x="'+c[0]+'" y="'+c[1]+'" width="14" height="6" rx="2" fill="'+c[2]+'" transform="rotate('+c[3]+' '+c[0]+' '+c[1]+')"/>'});
 [[250,40],[160,100],[610,150]].forEach(function(p){s+='<path d="M'+p[0]+' '+(p[1]-10)+' L'+(p[0]+3)+' '+(p[1]-3)+' L'+(p[0]+10)+' '+p[1]+' L'+(p[0]+3)+' '+(p[1]+3)+' L'+p[0]+' '+(p[1]+10)+' L'+(p[0]-3)+' '+(p[1]+3)+' L'+(p[0]-10)+' '+p[1]+' L'+(p[0]-3)+' '+(p[1]-3)+'z" fill="#FFC94D" opacity=".8"/>'});
 return s+'</svg>'}

export {campIllo};
