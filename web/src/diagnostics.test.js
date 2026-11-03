import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDiagnostics} from './diagnostics.js';
test('connection diagnostic history is bounded and snapshots cannot mutate it',()=>{let time=100;const d=createDiagnostics({now:()=>time,limit:2});d.record('data','checking');time=110;d.record('data','failed');time=120;d.record('closed');const view=d.snapshot();assert.equal(view.length,2);assert.equal(view[0].afterMs,10);view[0].event='changed';assert.equal(d.snapshot()[0].event,'data');});
