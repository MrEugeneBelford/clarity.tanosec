import {describe,expect,it} from 'vitest';
import {QUESTIONS} from '../../lib/v2/schema';
import {answerIsComplete,currentPath,parseV2Draft,progressFor,updateAnswer} from './v2Flow';
describe('v2 production flow helpers',()=>{
 it('adds and removes conditional backup and AI questions',()=>{expect(currentPath({backups:'none',ai_usage:'none'}).map(q=>q.id)).not.toContain('restore_test');expect(currentPath({backups:'full',ai_usage:'regular'}).map(q=>q.id)).toEqual(expect.arrayContaining(['restore_test','ai_data_rules','ai_human_review']));});
 it('calculates progress from the applicable path',()=>{expect(progressFor(0,20)).toBe(5);expect(progressFor(19,20)).toBe(100);});
 it('handles multiple answers and exclusive none',()=>{const question=QUESTIONS.find(q=>q.id==='critical_systems')!;let answers=updateAnswer({},question,'email');answers=updateAnswer(answers,question,'cloud_files');expect(answers.critical_systems).toEqual(['email','cloud_files']);answers=updateAnswer(answers,question,'none');expect(answers.critical_systems).toEqual(['none']);expect(answerIsComplete(question,answers)).toBe(true);});
 it('prunes conditional answers when their trigger changes',()=>{const ai=QUESTIONS.find(q=>q.id==='ai_usage')!;const result=updateAnswer({ai_usage:'regular',ai_data_rules:'none',ai_human_review:'rarely'},ai,'none');expect(result).toEqual({ai_usage:'none'});});
 it('rejects incompatible legacy-shaped drafts',()=>{expect(parseV2Draft('{"q1":"Yes","score":99}')).toEqual({});});
});
