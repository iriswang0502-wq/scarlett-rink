// Sends the daily "do your drills" notification. Runs hourly from GitHub Actions.
import webpush from 'web-push';
const PROJECT='scarlett-rink', API_KEY='AIzaSyAoqkneklJjqcARhYzKdESZyoNak0X4nMA';
const VAPID_PUBLIC='BDSGYlOgb1h82xWG7RcZQarhwAn_3pfZw5LNit3Zg9OELSXGj6FfwNcibcTg_Ff1wz-KtBVYHzo-JRG4WvgSKeM';
const codes=(process.env.FAMILY_CODES||'').split(/[,\s]+/).filter(Boolean);
const FORCE=!!process.env.FORCE;
if(!process.env.VAPID_PRIVATE_KEY){console.log('VAPID_PRIVATE_KEY secret is missing');process.exit(0);}
if(!codes.length){console.log('FAMILY_CODES secret is empty');process.exit(0);}
webpush.setVapidDetails('https://github.com/iriswang0502-wq/scarlett-rink',VAPID_PUBLIC,process.env.VAPID_PRIVATE_KEY);

const pad=n=>String(n).padStart(2,'0');
function localParts(tz){const f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit',hour:'numeric',hour12:false});
  const p=Object.fromEntries(f.formatToParts(new Date()).map(x=>[x.type,x.value]));return {date:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour)%24};}
function isFull(S,k){const r=S.days?.[k];if(!r)return false;const ids=(S.drills||[]).map(d=>d.id);if(!ids.length)return false;const missing=ids.filter(id=>!(r.done||[]).includes(id)).length;return missing===0||(r.skip&&missing<=1);}
function addDays(k,n){const [y,m,d]=k.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d+n));return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth()+1)}-${pad(dt.getUTCDate())}`;}
function streakBefore(S,k){let n=0;k=addDays(k,-1);while(isFull(S,k)||S.days?.[k]?.frozen){n++;k=addDays(k,-1);if(n>5000)break;}return n;}

// Messages from the puck. Picked by the day of the year so it changes daily.
const M={
  fresh:[
    "Fresh ice is waiting. Your drills aren't going to do themselves.",
    "The puck is lonely. Come stickhandle it.",
    "A 1-day streak starts today. Just saying.",
    "Hockey is 90% practice and 10% also practice. Let's go."
  ],
  started:[
    (s)=>`${s}-day streak and you haven't done today's drills. I'm not mad, I'm just a puck.`,
    (s)=>`Day ${s+1} isn't going to count itself. Drills, please.`,
    (s)=>`${s} days in a row. Would be a shame if that ended tonight.`,
    (s)=>`Your streak is ${s}. Your drills today: zero. We can fix one of those.`
  ],
  big:[
    (s)=>`${s} DAYS. You're a machine. Keep the machine running.`,
    (s)=>`Legends don't skip day ${s+1}. Hint, hint.`,
    (s)=>`${s}-day streak. Even I'm impressed, and I'm a puck.`
  ],
  partial:[
    (left)=>`${left} drill${left===1?'':'s'} to go. Finish strong and I'll stop bugging you.`,
    (left)=>`So close. ${left} left. Then it counts.`,
    (left)=>`Halfway is not all the way. ${left} more.`
  ]
};
const pick=(arr,seed)=>arr[seed%arr.length];
const doy=Math.floor(Date.now()/864e5);

async function fetchRink(code){const r=await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/rinks/${encodeURIComponent(code)}?key=${API_KEY}`);
  if(r.status===404)return null;if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();return JSON.parse(d.fields.data.stringValue);}

for(const code of codes){
  let S;try{S=await fetchRink(code);}catch(e){console.log(code,'fetch failed',e.message);continue;}
  if(!S){console.log(code,'no record');continue;}
  const subs=S.push||[];if(!subs.length){console.log(code,'no devices opted in');continue;}
  const tz=S.reminder?.tz||'America/Toronto',hour=S.reminder?.hour??18;
  const {date,hour:nowH}=localParts(tz);
  if(!FORCE&&nowH!==hour){console.log(code,`not reminder hour (now ${nowH}, want ${hour} in ${tz})`);continue;}
  if(isFull(S,date)){console.log(code,'drills already done today');continue;}
  const done=(S.days?.[date]?.done||[]).length,total=(S.drills||[]).length,streak=streakBefore(S,date);
  const name=S.name||'Player';
  let body;
  if(done>0)body=pick(M.partial,doy)(total-done);
  else if(streak>=14)body=pick(M.big,doy)(streak);
  else if(streak>0)body=pick(M.started,doy)(streak);
  else body=pick(M.fresh,doy);
  const payload=JSON.stringify({title:`${name}'s Rink`,body});
  for(const s of subs){try{await webpush.sendNotification({endpoint:s.endpoint,keys:s.keys},payload,{TTL:3600});console.log(code,'sent to',s.label||'device');}
    catch(e){console.log(code,'send failed',s.label||'device',e.statusCode||e.message);}}
}
