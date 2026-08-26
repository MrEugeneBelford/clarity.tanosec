import { applicableQuestions,questionById,type AnswerMap,type QuestionDefinition } from '../../lib/v2/schema';
export const V1_DRAFT_KEY='clarity_answers_draft';
export const V2_DRAFT_KEY='clarity_v2_answers_draft';
export function currentPath(answers:AnswerMap):readonly QuestionDefinition[]{return applicableQuestions(answers);}
export function answerIsComplete(question:QuestionDefinition,answers:AnswerMap):boolean{const value=answers[question.id];return question.multiple?Array.isArray(value)&&value.length>0:typeof value==='string';}
export function pruneAnswers(answers:AnswerMap):AnswerMap{const applicable=new Set(applicableQuestions(answers).map(q=>q.id));return Object.fromEntries(Object.entries(answers).filter(([id,value])=>questionById.has(id)&&applicable.has(id)&&(typeof value==='string'||Array.isArray(value))));}
export function updateAnswer(answers:AnswerMap,question:QuestionDefinition,optionId:string,checked=true):AnswerMap{if(!question.multiple)return pruneAnswers({...answers,[question.id]:optionId});const current=Array.isArray(answers[question.id])?[...answers[question.id] as readonly string[]]:[];let next:string[];if(optionId==='none'&&checked)next=['none'];else{next=current.filter(id=>id!=='none'&&id!==optionId);if(checked)next.push(optionId);}return pruneAnswers({...answers,[question.id]:next});}
export function progressFor(index:number,pathLength:number):number{return pathLength?Math.round(((index+1)/pathLength)*100):0;}
export function parseV2Draft(value:string|null):AnswerMap{if(!value)return {};try{const parsed:unknown=JSON.parse(value);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')return {};return pruneAnswers(parsed as AnswerMap);}catch{return {};}}
