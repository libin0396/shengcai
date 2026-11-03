import {ArrowUpRight} from '@phosphor-icons/react';
import siteConfig from '../site-config.json';
import './camp-footer.css';

export default function CampFooter(){
 return <aside className="camp-footer" aria-label="AI 实践体验营">
  <div className="camp-footer-inner">
   <a className="camp-footer-poster" href="/join/ai-camp" aria-label="查看三天体验营完整海报"><img src={siteConfig.campaign.posterUrl} alt="AI 成万事三天体验营完整海报，包含原推广二维码"/></a>
   <div className="camp-footer-copy"><span>下一步 · 动手试试</span><h2>把看到的方法，变成自己的实践。</h2><p>了解生财有术 AI 成万事 · 3 天体验营，具体安排以活动入口为准。</p></div>
   <a href="/join/ai-camp">了解三天体验营<ArrowUpRight size={16}/></a>
  </div>
 </aside>;
}
