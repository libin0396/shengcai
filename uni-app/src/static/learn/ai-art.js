/* 课里「小A 画出来的图」：全部用代码画，不是 AI 生成的图片，用来示意描述越清楚、画面越接近想要的。 */
(function(root){
  'use strict';
  var CAT_ORANGE='<g><ellipse cx="100" cy="104" rx="30" ry="22" fill="#F29A4A"/><path d="M126 106q22-6 18-26" fill="none" stroke="#F29A4A" stroke-width="8" stroke-linecap="round"/>'+
    '<circle cx="100" cy="72" r="20" fill="#F29A4A"/><path d="M84 60l-2-18 14 10zM116 60l2-18-14 10z" fill="#F29A4A"/><path d="M86 56l-1-9 7 5zM114 56l1-9-7 5z" fill="#F7C9A0"/>'+
    '<path d="M92 66q2-3 4 0M104 66q2-3 4 0" fill="none" stroke="#3A2A1E" stroke-width="2.2" stroke-linecap="round"/><path d="M98 75l2 2 2-2" fill="none" stroke="#3A2A1E" stroke-width="1.8" stroke-linecap="round"/>'+
    '<path d="M90 70h-12M90 74l-11 3M110 70h12M110 74l11 3" stroke="#3A2A1E" stroke-width="1" stroke-linecap="round"/><path d="M88 96q4 6 0 12M100 94v14M112 96q-4 6 0 12" stroke="#D9772C" stroke-width="3" stroke-linecap="round" fill="none"/></g>';
  var WINDOW='<rect x="20" y="10" width="160" height="96" rx="6" fill="#F5E6CF"/><rect x="28" y="16" width="144" height="84" rx="3" fill="SKY"/><path d="M100 16v84M28 58h144" stroke="#F5E6CF" stroke-width="5"/>'+
    '<rect x="12" y="104" width="176" height="12" rx="3" fill="#C98B5A"/><rect x="0" y="116" width="200" height="24" fill="#E8D6BF"/>';
  var ART={
    cat0:'<svg class="art" viewBox="0 0 200 140" role="img" aria-label="一只很普通的灰猫"><rect width="200" height="140" fill="#E9EBEF"/>'+
      '<ellipse cx="100" cy="102" rx="28" ry="22" fill="#9AA0AC"/><circle cx="100" cy="70" r="20" fill="#9AA0AC"/><path d="M84 58l-2-18 14 10zM116 58l2-18-14 10z" fill="#9AA0AC"/>'+
      '<circle cx="93" cy="68" r="2.4" fill="#161A23"/><circle cx="107" cy="68" r="2.4" fill="#161A23"/></svg>',
    cat1:'<svg class="art" viewBox="0 0 200 140" role="img" aria-label="一只橘猫趴在洒满阳光的窗台上，水彩风格">'+WINDOW.replace('SKY','#BFE3F7')+
      '<circle cx="150" cy="36" r="13" fill="#FFD66B"/><path d="M150 14v6M150 52v6M128 36h6M166 36h6" stroke="#FFD66B" stroke-width="3" stroke-linecap="round"/>'+
      '<path d="M40 104q4-26 14-34q4 20 0 34z" fill="#6DAA6A"/><rect x="36" y="92" width="22" height="14" rx="3" fill="#D9774A"/>'+
      '<path d="M60 30l40 74H20z" fill="#FFF3C4" opacity=".45"/>'+CAT_ORANGE+'</svg>',
    cat2:'<svg class="art" viewBox="0 0 200 140" role="img" aria-label="同一只橘猫，窗外换成了下雪天">'+WINDOW.replace('SKY','#9FB3C8')+
      '<path d="M28 88q36-10 72 0t72 0v12H28z" fill="#F4F7FB"/>'+
      '<g fill="#fff"><circle cx="44" cy="30" r="2.6"/><circle cx="70" cy="48" r="2"/><circle cx="58" cy="72" r="2.4"/><circle cx="128" cy="26" r="2.4"/><circle cx="152" cy="50" r="2.8"/><circle cx="138" cy="76" r="2"/><circle cx="164" cy="30" r="2"/><circle cx="86" cy="26" r="2.2"/></g>'+
      '<rect x="12" y="100" width="176" height="6" rx="3" fill="#fff"/>'+
      '<path d="M40 104q4-26 14-34q4 20 0 34z" fill="#6DAA6A"/><rect x="36" y="92" width="22" height="14" rx="3" fill="#D9774A"/>'+CAT_ORANGE+'</svg>',
    board:'<svg class="art" viewBox="0 0 200 150" role="img" aria-label="四格分镜：起床、刷牙、吃早饭、背书包出门">'+
      '<rect width="200" height="150" fill="#fff"/>'+
      [[6,6,'1 起床'],[102,6,'2 刷牙'],[6,78,'3 吃早饭'],[102,78,'4 出门']].map(function(p){return '<rect x="'+p[0]+'" y="'+p[1]+'" width="92" height="66" rx="6" fill="#F3F4F6" stroke="#E6E8EC"/><text x="'+(p[0]+6)+'" y="'+(p[1]+14)+'" font-size="10" font-weight="700" fill="#5F6675">'+p[2]+'</text>'}).join('')+
      '<rect x="20" y="44" width="64" height="18" rx="4" fill="#BFD0F5"/><circle cx="34" cy="40" r="8" fill="#F1C7A3"/><path d="M60 30l4-4M66 34l5-2" stroke="#FFC83D" stroke-width="3" stroke-linecap="round"/>'+
      '<circle cx="140" cy="44" r="10" fill="#F1C7A3"/><rect x="150" y="42" width="16" height="4" rx="2" fill="#2B44E6"/><circle cx="170" cy="36" r="3" fill="#fff" stroke="#BFD0F5"/><circle cx="176" cy="30" r="2" fill="#fff" stroke="#BFD0F5"/>'+
      '<ellipse cx="52" cy="128" rx="26" ry="6" fill="#E6E8EC"/><circle cx="44" cy="122" r="6" fill="#FFC83D"/><rect x="56" y="114" width="12" height="12" rx="3" fill="#fff" stroke="#BFD0F5"/>'+
      '<rect x="118" y="100" width="22" height="40" rx="3" fill="#C98B5A"/><circle cx="160" cy="108" r="8" fill="#F1C7A3"/><rect x="152" y="116" width="16" height="22" rx="4" fill="#2B44E6"/><rect x="166" y="118" width="10" height="14" rx="3" fill="#FFC83D"/></svg>',
    trip:'<svg class="art" viewBox="0 0 200 150" role="img" aria-label="一张周末两日游的行程卡">'+
      '<rect width="200" height="150" rx="10" fill="#fff"/><rect width="200" height="34" rx="10" fill="#2B44E6"/><rect y="24" width="200" height="10" fill="#2B44E6"/>'+
      '<text x="12" y="22" font-size="13" font-weight="800" fill="#fff">周末两日游 · 一家四口</text>'+
      '<text x="12" y="54" font-size="11" font-weight="800" fill="#2B44E6">周六</text>'+
      '<text x="46" y="54" font-size="10.5" fill="#161A23">上午 植物园（平路多，好推车）</text>'+
      '<text x="46" y="70" font-size="10.5" fill="#161A23">下午 回酒店歇脚</text>'+
      '<text x="12" y="94" font-size="11" font-weight="800" fill="#2B44E6">周日</text>'+
      '<text x="46" y="94" font-size="10.5" fill="#161A23">上午 古镇慢慢逛</text>'+
      '<text x="46" y="110" font-size="10.5" fill="#161A23">中午 吃完午饭返程</text>'+
      '<rect x="12" y="122" width="176" height="18" rx="6" fill="#FFF4D1"/><text x="20" y="135" font-size="10" font-weight="700" fill="#161A23">已核对：植物园周一闭馆，周六开放</text></svg>',
    fridge:'<svg class="art" viewBox="0 0 200 140" role="img" aria-label="冰箱里有鸡蛋、西红柿、青菜和半块豆腐">'+
      '<rect width="200" height="140" rx="10" fill="#EEF3F8"/><rect x="10" y="10" width="180" height="120" rx="8" fill="#fff" stroke="#D5DCE5"/>'+
      '<path d="M10 70h180" stroke="#D5DCE5" stroke-width="3"/>'+
      '<g><ellipse cx="40" cy="58" rx="9" ry="11" fill="#F6E7D2"/><ellipse cx="60" cy="58" rx="9" ry="11" fill="#F6E7D2"/><ellipse cx="80" cy="58" rx="9" ry="11" fill="#F6E7D2"/></g>'+
      '<g><circle cx="130" cy="56" r="13" fill="#E5533D"/><path d="M126 44l4 4 4-4" stroke="#3E8E4A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="160" cy="58" r="11" fill="#E5533D"/></g>'+
      '<path d="M30 118q10-30 30-34q-4 26-30 34z" fill="#5BA65A"/><path d="M50 118q14-26 34-26q-8 22-34 26z" fill="#6DBA68"/>'+
      '<rect x="120" y="92" width="44" height="26" rx="4" fill="#FBF6EA" stroke="#E8DCC0"/></svg>'
  };
  root.AIArt=ART;
})(typeof window!=='undefined'?window:globalThis);
