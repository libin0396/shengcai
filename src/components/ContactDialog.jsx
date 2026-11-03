import {useEffect, useRef, useState} from 'react';
import {Check, Copy, WechatLogo, X} from '@phosphor-icons/react';
import './contact-dialog.css';

export default function ContactDialog({contact,onClose}) {
 const ref=useRef(null);
 const [copyMessage,setCopyMessage]=useState('');
 useEffect(()=>{ref.current?.showModal();},[]);
 const close=()=>{ref.current?.close();onClose();};
 const copy=async()=>{
  try{await navigator.clipboard.writeText(contact.wechatId);setCopyMessage('微信号已复制');}
  catch{setCopyMessage('复制未成功，请手动复制上方微信号');}
 };
 return <dialog ref={ref} className="ap-contact-dialog" aria-labelledby="ap-contact-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
  <div className="ap-contact-card">
   <button className="ap-contact-close" onClick={close} aria-label="关闭联系方式"><X size={20}/></button>
   <div className="ap-contact-kicker"><WechatLogo size={19} weight="fill"/>联系站长</div>
   <h2 id="ap-contact-title">有问题，欢迎来聊。</h2>
   <p className="ap-contact-intro">对话题、活动或报名后的问题，可以联系我咨询。</p>
   <img className="ap-contact-qr" src={contact.qrUrl} alt="站长微信二维码，扫码添加"/>
   <p className="ap-contact-hint">微信扫码添加 · 手机可长按识别</p>
   <div className="ap-contact-copy"><span>微信号 <strong>{contact.wechatId}</strong></span><button onClick={copy}>{copyMessage==='微信号已复制'?<Check size={15}/>:<Copy size={15}/>}复制微信号</button></div>
   <p className="ap-contact-result" role="status" aria-live="polite">{copyMessage}</p>
  </div>
 </dialog>;
}
