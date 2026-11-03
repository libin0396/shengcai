import {ArrowRight,ArrowUpRight,Quotes,UsersThree} from '@phosphor-icons/react';
import './fde-opportunity-brief.css';

export default function FdeOpportunityBrief({app,editorial}){
 const {observation,cases}=editorial;
 const event=app.fdeEvent;
 return <section id="fde-opportunities" className="fob-section" aria-labelledby="fob-heading">
  <div className="fob-market"><p className="fob-eyebrow"><Quotes size={17} weight="fill"/>一条值得关注的判断</p><h2 id="fob-heading">“{observation.quote}”</h2><a className="fob-attribution" href={observation.sourceUrl} target="_blank" rel="noreferrer">{observation.author} · {observation.date}<ArrowUpRight size={13}/></a><p className="fob-context">{observation.context}</p><a className="fob-all" href="/topics/fde">把机会看具体，进入 FDE 专题<ArrowRight size={15}/></a><div className="fob-audience"><div className="fob-audience-heading"><UsersThree size={24} weight="duotone"/><div><h3>带着项目和问题，来认识同行。</h3><p>聊获客、转化与交付，也聊彼此能协作的业务场景。</p></div></div><div className="fob-audience-links"><a href="/topics/fde"><span>准备入场</span><strong>看案例，找切口</strong><ArrowUpRight size={17}/></a>{event?<button onClick={()=>app.onOpen(event,'event')}><span>正在做</span><strong>了解现场，带着卡点来聊</strong><ArrowUpRight size={17}/></button>:<a href="/events"><span>正在做</span><strong>看看近期同行交流</strong><ArrowUpRight size={17}/></a>}</div></div></div>
  <div className="fob-cases"><div className="fob-case-heading"><h3>现在，从哪里切入？</h3><span>三个真实场景</span></div>{cases.map((c,i)=><a key={c.id} href={c.sourceUrl} target="_blank" rel="noreferrer" className="fob-case"><span className="fob-index">0{i+1}</span><div><span className="fob-case-label">{c.label}</span><h4>{c.title}</h4><p>{c.summary}</p><small>{c.author} · 实战原帖</small></div><ArrowUpRight size={17}/></a>)}</div>

 </section>;
}
