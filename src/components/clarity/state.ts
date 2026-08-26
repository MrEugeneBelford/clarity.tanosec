export type ClarityScreen = 'landing'|'questions'|'processing'|'email'|'preview'|'results';
export interface ClarityFlowState { screen: ClarityScreen; questionIndex: number }
export type ClarityFlowAction =
  | { type:'START' }
  | { type:'NEXT_QUESTION'; totalQuestions:number }
  | { type:'PREVIOUS_QUESTION' }
  | { type:'PROCESS' }
  | { type:'SHOW_EMAIL' }
  | { type:'SHOW_PREVIEW' }
  | { type:'SHOW_RESULTS' }
  | { type:'RESTART' };

export const initialClarityFlowState: ClarityFlowState = { screen:'landing', questionIndex:0 };

export function clarityFlowReducer(state:ClarityFlowState,action:ClarityFlowAction):ClarityFlowState {
  switch(action.type){
    case 'START': return {screen:'questions',questionIndex:0};
    case 'NEXT_QUESTION': return state.screen==='questions' && state.questionIndex<action.totalQuestions-1 ? {...state,questionIndex:state.questionIndex+1} : state;
    case 'PREVIOUS_QUESTION': return state.screen==='questions' && state.questionIndex>0 ? {...state,questionIndex:state.questionIndex-1} : state;
    case 'PROCESS': return {screen:'processing',questionIndex:state.questionIndex};
    case 'SHOW_EMAIL': return {screen:'email',questionIndex:state.questionIndex};
    case 'SHOW_PREVIEW': return {screen:'preview',questionIndex:state.questionIndex};
    case 'SHOW_RESULTS': return {screen:'results',questionIndex:state.questionIndex};
    case 'RESTART': return initialClarityFlowState;
    default: return state;
  }
}
