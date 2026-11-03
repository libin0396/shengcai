import {useLayoutEffect} from 'react';
import {ArrowLeft,ArrowUpRight,Info} from '@phosphor-icons/react';
import {isScysDestination,scysExitPath} from '../scys-exit.js';
import SiteHeader from './SiteHeader.jsx';
import './source-exit-gate.css';

// Rewrite href itself, not just click events: opening in a new tab, keyboard
// activation, and copying a link all pass through the same local page.
export function SourceExitGate(){
 useLayoutEffect(()=>{
  const rewrite=element=>{
   if(!(element instanceof HTMLAnchorElement)||element.hasAttribute('data-scys-exit-allow'))return;
   const path=scysExitPath(element.getAttribute('href'),document.baseURI);
   if(path)element.setAttribute('href',path);
  };
  const scan=node=>{
   if(!(node instanceof Element))return;
   if(node.matches('a[href]'))rewrite(node);
   node.querySelectorAll('a[href]').forEach(rewrite);
  };
  const observer=new MutationObserver(records=>records.forEach(record=>{
   if(record.type==='attributes')rewrite(record.target);
   else record.addedNodes.forEach(scan);
  }));
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['href']});
  document.querySelectorAll('a[href]').forEach(rewrite);
  return()=>observer.disconnect();
 },[]);
 return null;
}

export function SourceAccessPage({app}){
 const requested=new URLSearchParams(window.location.search).get('url')||'';
 const target=isScysDestination(requested)?new URL(requested).href:null;
 const campaign=app.campaign;
 return <div className="source-page"><SiteHeader app={app}/><main className="source-main">
  <a className="source-back" href="/"><ArrowLeft size={15}/>返回发现</a>
  <section className="source-panel"><div className="source-copy"><span className="source-kicker">AI 实战 · 从了解开始</span><h1>先看看，<br/>再决定下一步。</h1><p>想系统了解 AI 实战？可以先看看生财有术的三天体验营。活动时间和参与方式，以体验营入口说明为准。</p><a className="source-camp-link" href="/join/ai-camp">了解三天体验营<ArrowUpRight size={16}/></a></div>
   <div className="source-qr">{campaign?.posterUrl&&<a className="source-poster" href="/join/ai-camp" aria-label="查看三天体验营完整海报和扫码入口"><img src={campaign.posterUrl} alt="AI 成万事三天体验营完整海报，包含原推广二维码"/></a>}<strong>了解三天体验营</strong><span>点击海报查看大图与扫码入口</span>{campaign?.scheduleLabel&&<small>{campaign.scheduleLabel}</small>}</div>
  </section>
  <div className="source-continue"><Info size={17}/><div><strong>{target?'也可以继续查看生财原页面':'无法识别原页面地址'}</strong><p>{target?'原页面可能需要登录或相应的访问权限。':'请返回站内内容，重新选择要查看的原文。'}</p></div>{target&&<a data-scys-exit-allow="true" href={target} target="_blank" rel="noreferrer">继续访问生财<ArrowUpRight size={15}/></a>}</div>
 </main></div>;
}
