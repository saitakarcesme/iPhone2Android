export const TTL=5*60*1000;
export function makeSession(now=Date.now()){return {id:crypto.randomUUID(),key:crypto.randomUUID(),expires:now+TTL};}
export function sessionUrl(session,base){const u=new URL(base);u.hash=new URLSearchParams({join:session.id,key:session.key,expires:String(session.expires)}).toString();return u.href;}
export function parseSession(hash,now=Date.now()){const p=new URLSearchParams(hash.replace(/^#/,''));const id=p.get('join'),key=p.get('key'),expires=Number(p.get('expires'));const uuid=/^[a-f0-9-]{36}$/;if(!uuid.test(id||'')||!uuid.test(key||'')||!Number.isSafeInteger(expires)||expires<=now||expires>now+TTL+10000)return null;return {id,key,expires};}
export function validHello(data,session,now=Date.now()){return Boolean(data&&data.type==='hello'&&data.key===session.key&&now<session.expires);}
export async function verificationCode(key){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key));return String(new DataView(bytes).getUint32(0)%1000000).padStart(6,'0');}
