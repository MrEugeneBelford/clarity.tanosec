import { describe,expect,it } from 'vitest';
import { clarityFlowReducer,initialClarityFlowState } from './state';
describe('clarity flow reducer',()=>{
  it('moves through semantic screens',()=>{ let state=clarityFlowReducer(initialClarityFlowState,{type:'START'}); expect(state.screen).toBe('questions'); state=clarityFlowReducer(state,{type:'PROCESS'}); expect(state.screen).toBe('processing'); state=clarityFlowReducer(state,{type:'SHOW_EMAIL'}); expect(state.screen).toBe('email'); state=clarityFlowReducer(state,{type:'SHOW_PREVIEW'}); expect(state.screen).toBe('preview'); state=clarityFlowReducer(state,{type:'SHOW_RESULTS'}); expect(state.screen).toBe('results'); });
  it('bounds next and previous navigation',()=>{ let state=clarityFlowReducer(initialClarityFlowState,{type:'START'}); state=clarityFlowReducer(state,{type:'PREVIOUS_QUESTION'}); expect(state.questionIndex).toBe(0); state=clarityFlowReducer(state,{type:'NEXT_QUESTION',totalQuestions:2}); state=clarityFlowReducer(state,{type:'NEXT_QUESTION',totalQuestions:2}); expect(state.questionIndex).toBe(1); });
  it('restarts from every screen',()=>{ expect(clarityFlowReducer({screen:'results',questionIndex:26},{type:'RESTART'})).toEqual(initialClarityFlowState); });
});
