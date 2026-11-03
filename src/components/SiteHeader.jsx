import {useState} from 'react';
import {ArrowUpRight,WechatLogo} from '@phosphor-icons/react';
import ContactDialog from './ContactDialog.jsx';

export default function SiteHeader({app,active='',theme='light'}){
 const [showContact,setShowContact]=useState(false);
 const links=[['home','/','发现'],['fde','/topics/fde','FDE 专题'],['ai-cases','/topics/ai-cases','AI 实战案例'],['events','/events','线下活动'],['saved','/workspace','我的收藏']];
 return <header className={`ap-header ${theme==='dark'?'ap-header-dark':''}`}><div className="ap-header-inner"><a className="ap-brand" href="/" aria-label="AI 实战情报站 AINPE"><span className="ap-brand-mark" aria-hidden="true"><ArrowUpRight size={24} weight="bold"/></span><span className="ap-brand-type"><strong>AI 实战情报站</strong><span>AINPE<span className="ap-brand-dot">.</span></span></span></a><nav className="ap-nav" aria-label="主导航">{links.map(([key,href,label])=><a key={key} href={href} aria-current={active===key?'page':undefined}>{label}{key==='saved'&&app.savedCount>0&&<span>{app.savedCount}</span>}</a>)}</nav>{app.contact?.wechatId&&app.contact?.qrUrl&&<button className="ap-contact" onClick={()=>setShowContact(true)}><WechatLogo size={17}/><span>联系站长</span></button>}</div>{showContact&&<ContactDialog contact={app.contact} onClose={()=>setShowContact(false)}/>}</header>;
}
