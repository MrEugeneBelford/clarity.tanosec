import {describe,expect,it} from 'vitest';
import {parseDraft,serialiseDraft} from './draft';
describe('v1 session draft helpers',()=>{it('round-trips valid answers',()=>{const value={q1:'Yes',q2:'No'};expect(parseDraft(serialiseDraft(value))).toEqual(value);});it('rejects malformed drafts safely',()=>{expect(parseDraft('{bad')).toEqual({});expect(parseDraft('["wrong"]')).toEqual({});});it('drops non-string values',()=>{expect(parseDraft('{"q1":"Yes","score":99}')).toEqual({q1:'Yes'});});});
