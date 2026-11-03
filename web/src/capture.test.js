import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureErrorMessage} from './capture.js';
test('an advertised but unusable capture API is distinguished from a cancelled prompt',()=>{assert.match(captureErrorMessage({name:'NotSupportedError'}),/desteklemiyor/);assert.match(captureErrorMessage({name:'NotAllowedError'}),/iptal/);assert.doesNotMatch(captureErrorMessage({name:'NotSupportedError'}),/bağlantı kesildi/i);});
