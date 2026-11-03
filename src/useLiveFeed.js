import {useCallback,useEffect,useRef,useState} from 'react';
import {SYNC_STALE_MINUTES} from './sync-schedule.js';

const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
export function isValidFeed(value){
 return value?.version===1&&validTime(value.updatedAt)&&validTime(value.fetchedAt)
  &&Array.isArray(value.events)&&value.events.every(e=>typeof e.id==='string'&&typeof e.name==='string'&&Number.isFinite(Number(e.startTime)))
  &&Array.isArray(value.articles)&&value.articles.every(a=>typeof a.id==='string'&&typeof a.title==='string'&&Number.isFinite(Number(a.publishedAt)))
  &&Array.isArray(value.hotArticleIds)&&value.hotArticleIds.every(id=>typeof id==='string')
  &&Array.isArray(value.trendingTopics)&&value.trendingTopics.every(t=>typeof t.id==='string'&&typeof t.label==='string')
  &&Array.isArray(value.comments)&&value.topicGuides&&typeof value.topicGuides==='object'
  &&value.sync&&['ok','partial','error'].includes(value.sync.status)
  &&(value.sync.lastSuccessAt==null||validTime(value.sync.lastSuccessAt));
}
export function syncTimeLabel(value){
 if(!value||!validTime(value))return '尚未完成同步';
 return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));
}
export default function useLiveFeed(fallback){
 const [feed,setFeed]=useState(fallback);const [refreshing,setRefreshing]=useState(false);const [offline,setOffline]=useState(false);const [checkedAt,setCheckedAt]=useState(0);
 const request=useRef(null);const mounted=useRef(false);
 const refresh=useCallback(async(showLoading=false)=>{
  if(request.current)return;
  const controller=new AbortController();request.current=controller;if(showLoading)setRefreshing(true);
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
   const response=await fetch('/api/feed',{cache:'no-store',credentials:'same-origin',signal:controller.signal});
   if(!response.ok)throw new Error('feed_unavailable');
   const next=await response.json();if(!isValidFeed(next))throw new Error('feed_invalid');
   if(mounted.current&&request.current===controller&&!controller.signal.aborted){setFeed(previous=>previous.fetchedAt===next.fetchedAt&&JSON.stringify(previous.sync)===JSON.stringify(next.sync)?previous:next);setOffline(false);setCheckedAt(Date.now());}
  }catch{
   if(mounted.current&&request.current===controller){setOffline(true);setCheckedAt(Date.now());}
  }finally{clearTimeout(timer);if(request.current===controller){request.current=null;if(mounted.current)setRefreshing(false);}}
 },[]);
 useEffect(()=>{
  mounted.current=true;void refresh();
  const resume=()=>{if(document.visibilityState==='visible')void refresh();};
  const timer=setInterval(resume,60000);document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);
  return()=>{mounted.current=false;clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);request.current?.abort();request.current=null;};
 },[refresh]);
 const lastSuccessAt=feed.sync?.lastSuccessAt;
 const delayed=Boolean(lastSuccessAt&&Date.now()-Date.parse(lastSuccessAt)>SYNC_STALE_MINUTES*60000);
 const status=offline?'offline':feed.sync?.status==='error'?'error':feed.sync?.status==='partial'?'partial':delayed?'stale':lastSuccessAt?'ok':'waiting';
 const statusText=refreshing?'正在读取最新内容':status==='offline'?'暂时离线，显示已保存内容':status==='error'?'同步暂未完成，保留上次内容':status==='partial'?'部分来源待更新':status==='stale'?'更新延迟，显示上次内容':status==='waiting'?'等待首次自动同步':'每天自动同步';
 return {feed,refresh:()=>refresh(true),refreshing,offline,checkedAt,lastSuccessAt,lastSuccessLabel:syncTimeLabel(lastSuccessAt),status,statusText};
}
