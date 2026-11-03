import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureErrorMessage} from './capture.js';
test('an advertised but unusable capture API is distinguished from a cancelled prompt',()=>{assert.match(captureErrorMessage({name:'NotSupportedError'}),/desteklemiyor/);assert.match(captureErrorMessage({name:'NotAllowedError'}),/iptal/);assert.doesNotMatch(captureErrorMessage({name:'NotSupportedError'}),/bağlantı kesildi/i);});

import {requestScreenCapture} from './capture.js';
test('an unanswered native capture request times out and late tracks are stopped',async()=>{
 let resolveNative;let stopped=0;
 const request=requestScreenCapture({getDisplayMedia:()=>new Promise(resolve=>resolveNative=resolve)},{timeoutMs:10});
 await assert.rejects(request,{name:'TimeoutError'});
 resolveNative({getTracks:()=>[{stop(){stopped++;}}]});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(stopped,1);
});
test('capture is invoked synchronously and abort cleans up a late stream',async()=>{
 let called=false,resolveNative,stopped=false;
 const controller=new AbortController();
 const request=requestScreenCapture({getDisplayMedia(){called=true;return new Promise(resolve=>resolveNative=resolve);}},{signal:controller.signal});
 assert.equal(called,true);controller.abort();await assert.rejects(request,{name:'AbortError'});
 resolveNative({getTracks:()=>[{stop(){stopped=true;}}]});await new Promise(resolve=>setImmediate(resolve));assert.equal(stopped,true);
});
test('successful capture is returned without stopping its tracks',async()=>{
 let stopped=false;const stream={getTracks:()=>[{stop(){stopped=true;}}]};
 assert.equal(await requestScreenCapture({getDisplayMedia:()=>Promise.resolve(stream)}),stream);assert.equal(stopped,false);
});
