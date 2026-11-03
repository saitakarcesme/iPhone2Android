import {test, expect} from '@playwright/test';
import {randomUUID} from 'node:crypto';
for(const name of ['NotSupportedError','NotAllowedError']) {
 test(`capture ${name} is reported before any network connection`, async({page})=>{
  await page.addInitScript(name=>{
   window.signalAttempts=0;
   const WS=window.WebSocket;
   window.WebSocket=class extends WS{constructor(...args){if(String(args[0]).includes('peerjs'))window.signalAttempts++;super(...args);}};
   Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{value:async()=>{throw new DOMException('Capture rejected',name);},configurable:true});
  },name);
  await page.goto('/#'+new URLSearchParams({join:randomUUID(),key:randomUUID(),expires:String(Date.now()+300000)}));
  await page.locator('#join').click();
  await expect(page.locator('#join')).toBeEnabled();
  await expect(page.locator('#connection-details')).toContainText(name);
  expect(await page.evaluate(()=>window.signalAttempts)).toBe(0);
  await expect(page.locator('#sender-title')).not.toHaveText('Tablet bağlandı');
 });
}
test('a hung share popup recovers the button and retry reloads the native request',async({page})=>{
 await page.addInitScript(()=>{
  sessionStorage.testLoads=String(Number(sessionStorage.testLoads||0)+1);
  Object.defineProperty(navigator.mediaDevices,'getDisplayMedia',{value:()=>new Promise(()=>{}),configurable:true});
 });
 await page.clock.install();
 await page.goto('/#'+new URLSearchParams({join:randomUUID(),key:randomUUID(),expires:String(Date.now()+300000)}));
 await page.locator('#join').click();await expect(page.locator('#join')).toBeDisabled();
 await page.clock.runFor(30001);
 await expect(page.locator('#join')).toBeEnabled();await expect(page.locator('#join')).toHaveText('Yenile ve tekrar dene');
 await expect(page.locator('#sender-status')).toContainText('yanıt vermedi');
 const before=await page.evaluate(()=>Number(sessionStorage.testLoads));
 await page.locator('#join').click();await expect.poll(()=>page.evaluate(()=>Number(sessionStorage.testLoads))).toBe(before+1);
 await expect(page.locator('#join')).toBeEnabled();
});
