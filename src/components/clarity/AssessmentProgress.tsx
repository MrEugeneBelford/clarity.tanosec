import { Progress } from '@/components/ui/progress';
export function AssessmentProgress({current,total}:{current:number;total:number}){ return <Progress aria-label={`Question ${current} of ${total}`} value={(current/total)*100} className="h-1 bg-muted [&>div]:bg-primary transition-all duration-300"/>; }
