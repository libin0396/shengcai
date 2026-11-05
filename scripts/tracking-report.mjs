import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';

// Local administrator report only; no public endpoint exposes event records.
const [filename,rawDays='30']=process.argv.slice(2);
const days=Number(rawDays);
if(!filename||!path.isAbsolute(filename)||!Number.isInteger(days)||days<1||days>90){
  console.error('usage: node tracking-report.mjs /absolute/path/ainpe-tracking.sqlite [days:1-90]');process.exitCode=2;
}else{
  let db;
  try{
    db=new DatabaseSync(filename,{readOnly:true});
    const since=Date.now()-days*86400000;
    const row=db.prepare(`WITH
      starts AS (SELECT device_hash,game,MIN(created_at) AS at FROM events WHERE event='sim_start' AND game IS NOT NULL AND created_at>=? GROUP BY device_hash,game),
      finishers AS (SELECT s.device_hash,s.game,MIN(e.created_at) AS at FROM starts s JOIN events e ON e.event='sim_finish' AND e.device_hash=s.device_hash AND e.game=s.game AND e.created_at>=s.at GROUP BY s.device_hash,s.game),
      newcomers AS (SELECT device_hash,MIN(created_at) AS at FROM events WHERE event='site_view' AND played=0 AND created_at>=? GROUP BY device_hash)
      SELECT (SELECT COUNT(*) FROM starts) AS starts,
        (SELECT COUNT(*) FROM finishers) AS finished,
        (SELECT COUNT(*) FROM finishers f WHERE EXISTS(SELECT 1 FROM events e WHERE e.device_hash=f.device_hash AND e.event='camp_join_click' AND e.created_at>=f.at)) AS finished_clicked,
        (SELECT COUNT(*) FROM newcomers) AS newcomer_views,
        (SELECT COUNT(*) FROM newcomers n WHERE EXISTS(SELECT 1 FROM events e WHERE e.device_hash=n.device_hash AND e.event='camp_join_click' AND e.played=0 AND e.created_at>=n.at)) AS newcomer_clicked`).get(since,since);
    const columns=db.prepare('PRAGMA table_info(events)').all();
    const hasTarget=columns.some(c=>c.name==='target');
    const targetCounts=Object.fromEntries(['camp','join','source','event'].map(target=>[target,{clicks:0,anonymous_browsers:0}]));
    if(hasTarget){
      for(const item of db.prepare("SELECT target,COUNT(*) AS clicks,COUNT(DISTINCT device_hash) AS browsers FROM events WHERE event='outbound_click' AND created_at>=? AND target IN ('camp','join','source','event') GROUP BY target").all(since)){
        targetCounts[item.target]={clicks:Number(item.clicks),anonymous_browsers:Number(item.browsers)};
      }
    }
    const copies=db.prepare("SELECT COUNT(*) AS copies,COUNT(DISTINCT device_hash) AS browsers FROM events WHERE event='contact_copy' AND created_at>=?").get(since);
    const personaEvents=Object.fromEntries(['persona_unlock','poster_save'].map(event=>[event,{normal:{events:0,anonymous_browsers:0},hidden:{events:0,anonymous_browsers:0}}]));
    if(columns.some(c=>c.name==='hidden')){
      for(const item of db.prepare("SELECT event,hidden,COUNT(*) AS events,COUNT(DISTINCT device_hash) AS browsers FROM events WHERE event IN ('persona_unlock','poster_save') AND hidden IN (0,1) AND created_at>=? GROUP BY event,hidden").all(since)){
        personaEvents[item.event][item.hidden===1?'hidden':'normal']={events:Number(item.events),anonymous_browsers:Number(item.browsers)};
      }
    }
    const ratio=(n,d)=>({numerator:Number(n),denominator:Number(d),percent:d?Math.round(Number(n)/Number(d)*1000)/10:null});
    console.log(JSON.stringify({days,unit:'browser_project_or_browser',note:'Based on a pseudonymous browser identifier; approximate event cohorts, not verified people, registrations or revenue. Tracking omissions and device resets affect results. Poster saves count explicit download actions only, not long presses, successful saves or shares.',simulation_completion:ratio(row.finished,row.starts),click_after_completion:ratio(row.finished_clicked,row.finished),newcomer_direct_click:ratio(row.newcomer_clicked,row.newcomer_views),outbound_clicks:targetCounts,contact_copies:{copies:Number(copies.copies),anonymous_browsers:Number(copies.browsers)},persona_events:personaEvents},null,2));
  }catch{console.error('Unable to read tracking database.');process.exitCode=1;}
  finally{db?.close();}
}
