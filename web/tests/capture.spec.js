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
