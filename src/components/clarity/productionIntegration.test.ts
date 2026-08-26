import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
const appSource=readFileSync(new URL('./ClarityV2App.tsx',import.meta.url),'utf8');
const pageSource=readFileSync(new URL('../../app/page.tsx',import.meta.url),'utf8');
describe('Phase 4 production integration',()=>{
 it('renders the v2 application from the production page',()=>{expect(pageSource).toContain('ClarityV2App');expect(pageSource).not.toContain('<ClarityApp');});
 it('calls the server-side v2 processor action',()=>{expect(appSource).toContain('processAssessmentAction(answers)');});
 it('does not call legacy recommendations or calculate a client score',()=>{expect(appSource).not.toContain('getRecommendations');expect(appSource).not.toMatch(/scorePercentage|calculateLegacyScore/);});
 it('clears the incompatible v1 draft key',()=>{expect(appSource).toContain('sessionStorage.removeItem(V1_DRAFT_KEY)');});
});
