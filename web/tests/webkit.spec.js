import { test, expect, webkit } from '@playwright/test';
test('iPhone-like WebKit can pair with Chromium tablet', async ({browser},testInfo)=>{
  test.fail(true, 'Known issue: WebKit pairing requires a working relay or HTTPS pairing transport.');
  test.setTimeout(80000);
  const tablet=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const receiver=await tablet.newPage();
  const phoneBrowser=await webkit.launch({channel:undefined});
  const phone=await phoneBrowser.newContext({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
  const sender=await phone.newPage();
  const errors=[];
  for (const [name,page] of [['tablet',receiver],['phone',sender]]) {
    page.on('pageerror',e=>errors.push(name+': '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(name+': '+m.text());});
  }
  try{
    await receiver.goto('/');await expect(receiver.locator('#copy')).toBeEnabled({timeout:25000});await receiver.locator('#copy').click();
    const url=await receiver.evaluate(()=>navigator.clipboard.readText());
    await sender.goto(url);await sender.locator('#join').click();
    await expect(receiver.locator('#consent')).toBeVisible({timeout:50000});await receiver.locator('#accept').click();
    await expect(sender.locator('#sender-title')).toHaveText('Tablet bağlandı');
  } finally {
    await testInfo.attach('cross-browser-status',{body:JSON.stringify({errors,tablet:await receiver.locator('#status').textContent().catch(()=>''),phone:await sender.locator('#sender-status').textContent().catch(()=>'')},null,2),contentType:'application/json'});
    await tablet.close();await phoneBrowser.close();
  }
});
