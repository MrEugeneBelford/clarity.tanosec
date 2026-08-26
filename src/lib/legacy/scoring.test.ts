import {describe,expect,it} from 'vitest';
import {questions} from '../questions';
import {calculateLegacyScore} from './scoring';
describe('legacy v1 scoring isolation',()=>{
  it('preserves zero score for unanswered assessment',()=>{const result=calculateLegacyScore({});expect(result.score).toBe(0);expect(result.maxScore).toBeGreaterThan(0);});
  it('preserves the manifest maximum for strongest answers',()=>{const answers=Object.fromEntries(questions.map(question=>[question.id,[...question.options].sort((a,b)=>b.score-a.score)[0].text]));const result=calculateLegacyScore(answers);expect(result.score).toBe(result.maxScore);});
  it('does not call or depend on the v2 processor',()=>{expect(calculateLegacyScore.toString()).not.toContain('processAssessment');});
});
