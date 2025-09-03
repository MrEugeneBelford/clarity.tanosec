"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Database,
  AlertTriangle,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Laptop,
  TrendingUp,
  Target,
  FileText,
  CalendarClock,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/logo";
import ShareMyScore from "@/components/share-my-score";
import { Checkbox } from "@/components/ui/checkbox";

import { questions, questionCategories } from "@/lib/questions";
import { getRecommendations } from "@/lib/actions";
import type { GenerateSecurityRecommendationsOutput } from "@/ai/flows/generate-security-recommendations";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { add } from "date-fns";

type Answers = Record<string, string>;

const categoryIcons: Record<string, React.ElementType> = {
  network: Shield,
  access: Lock,
  data: Database,
  incident: AlertTriangle,
  training: Users,
  endpoint: Laptop,
  compliance: Target,
};

export default function ClarityByTanosecPage() {
  const [step, setStep] = useState(0); // 0=start, 1-n=questions, n+1=loading, n+2=email, n+3=results
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [recommendations, setRecommendations] =
    useState<GenerateSecurityRecommendationsOutput | null>(null);
  // Legacy report/print mode removed
  const router = useRouter();

  const { toast } = useToast();
  const totalQuestions = questions.length;
  const isStart = step === 0;
  const isAssessment = step > 0 && step <= totalQuestions;
  const isLoading = step === totalQuestions + 1;
  const isEmailCapture = step === totalQuestions + 2;
  const isResults = step === totalQuestions + 3;
  const currentQuestionIndex = step - 1;

  const handleSelectAnswer = (questionId: string, answerText: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerText }));
  };

  const handleNext = () => {
    if (step < totalQuestions) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = useCallback(() => {
    setStep(totalQuestions + 1);
  }, [totalQuestions]);

  const handleShowReport = () => {
    // Email is optional but recommended
    if (email && email.includes("@")) {
      // Logic for newsletter opt-in would be handled here
      // For example, sending the email and opt-in status to a server
      console.log(`Email: ${email}, Newsletter: ${newsletterOptIn}`);
    } else if (email && !email.includes("@")) {
      // Show warning for invalid email but still proceed
      toast({
        variant: "destructive",
        title: "Invalid Email Format",
        description: "The email format appears invalid, but you can still view your report.",
      });
    }
    
    // Always proceed to the report
    setStep(totalQuestions + 3);
  };
  
  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setRecommendations(null);
    setEmail("");
    setNewsletterOptIn(false);
  };
  
  const handleRemindMe = () => {
    const reassessmentDate = add(new Date(), { months: 3 });

    const formatDateForICS = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${formatDateForICS(reassessmentDate)}`,
        `DTEND:${formatDateForICS(reassessmentDate)}`,
        'SUMMARY:Clarity Cybersecurity Recheck',
        'DESCRIPTION:Time to retake your Clarity assessment and see your cybersecurity progress.',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reassessment-reminder.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
        title: "Reminder Set!",
        description: "An event has been added to your calendar to reassess in 3 months.",
    });
};


  const { score, maxScore, categoryScores } = useMemo(() => {
    let score = 0;
    let maxScore = 0;
    const categoryScores: Record<
      string,
      { score: number; maxScore: number; count: number }
    > = {};

    Object.keys(questionCategories).forEach((catId) => {
      categoryScores[catId] = { score: 0, maxScore: 0, count: 0 };
    });

    questions.forEach((q) => {
      const maxOptionScore = Math.max(...q.options.map((opt) => opt.score));
      maxScore += maxOptionScore;
      categoryScores[q.category].maxScore += maxOptionScore;
      categoryScores[q.category].count += 1;

      const selectedAnswerText = answers[q.id];
      if (selectedAnswerText) {
        const selectedOption = q.options.find(
          (opt) => opt.text === selectedAnswerText
        );
        if (selectedOption) {
          score += selectedOption.score;
          categoryScores[q.category].score += selectedOption.score;
        }
      }
    });
    return { score, maxScore, categoryScores };
  }, [answers]);

  useEffect(() => {
    if (isLoading) {
      const assessmentResponses = Object.entries(answers).reduce(
        (acc, [key, value]) => {
          const question = questions.find((q) => q.id === key);
          if (question) {
            acc[question.text] = value;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      getRecommendations({ assessmentResponses })
        .then((result) => {
          setRecommendations(result);
          setStep(totalQuestions + 2);
        })
        .catch((error) => {
          console.error("Failed to get recommendations:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not generate recommendations. Please try again.",
          });
          handleRestart();
        });
    }
  }, [isLoading, answers, totalQuestions, toast]);

  const renderContent = () => {
    if (isStart) {
      return (
        <Card className="w-full max-w-2xl text-center shadow-2xl animate-fade-in">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-4xl font-headline">
              Welcome to Clarity by Tanosec
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              AI-powered cybersecurity insights for your business. Assess your current posture in minutes and receive clear, actionable steps to improve your defences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="lg"
              className="font-bold text-lg"
              onClick={() => setStep(1)}
            >
              Start Assessment
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground justify-center">
            <p>Takes approximately 5 minutes to complete.</p>
          </CardFooter>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <h2 className="text-3xl font-headline">Analyzing your responses...</h2>
          <p className="text-muted-foreground">
            Our AI is crafting personalized recommendations just for you.
          </p>
        </div>
      );
    }
    
    if (isEmailCapture) {
      return (
        <Card className="w-full max-w-lg text-center shadow-2xl animate-fade-in">
          <CardHeader>
            <div className="mx-auto mb-4 text-primary">
              <FileText size={48} />
            </div>
            <CardTitle className="text-3xl font-headline">
              Your Report is Ready!
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground pt-2">
              Enter your email address below to view your personalized cybersecurity report. <strong>Email is optional but recommended</strong> for receiving your report and future updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2 text-left">
                <Label htmlFor="email">Email Address (Optional but Recommended)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-base"
                />
              </div>
               <div className="flex items-center space-x-2 text-left">
                  <Checkbox 
                    id="newsletter" 
                    checked={newsletterOptIn}
                    onCheckedChange={(checked: boolean | "indeterminate") => setNewsletterOptIn(checked as boolean)}
                  />
                  <Label htmlFor="newsletter" className="text-sm font-normal text-muted-foreground cursor-pointer">
                    Yes, I'd like to receive the Clarity Cyber Pulse newsletter — updates, alerts, and practical cybersecurity advice every quarter.
                  </Label>
              </div>
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full font-bold text-lg"
                onClick={handleShowReport}
              >
                Get My Report
              </Button>
              {!email && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleShowReport}
                >
                  Continue Without Email
                </Button>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground justify-center">
            <p>We respect your privacy and will not share your email.</p>
          </CardFooter>
        </Card>
      );
    }


    if (isAssessment) {
      const question = questions[currentQuestionIndex];
      const category = questionCategories[question.category];
      const CategoryIcon = categoryIcons[question.category] || Shield;

      return (
        <div className="w-full max-w-3xl space-y-8">
          <div className="flex justify-center mb-2">
            <Logo size="small" />
          </div>
          <div className="space-y-4">
            <Progress value={(step / totalQuestions) * 100} className="h-2 transition-all duration-300" />
            <p className="text-center text-sm text-muted-foreground">
              Question {step} of {totalQuestions}
            </p>
          </div>

          <Card className="shadow-2xl animate-fade-in-up">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <CategoryIcon className="h-5 w-5" />
                <span className="font-semibold">{category.name}</span>
              </div>
              <CardTitle className="text-2xl md:text-3xl pt-4">
                {question.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              {question.options.map((option) => (
                <Card
                  key={option.text}
                  onClick={() => handleSelectAnswer(question.id, option.text)}
                  className={cn(
                    "cursor-pointer p-4 text-center transition-all duration-200 hover:bg-card/80 hover:shadow-md",
                    answers[question.id] === option.text
                      ? "bg-primary/20 border-primary ring-2 ring-primary"
                      : "bg-card"
                  )}
                >
                  <p className="font-medium">{option.text}</p>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step <= 1}
              >
                <ChevronLeft /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answers[question.id]}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                {step === totalQuestions ? "Get My Results" : "Next"}
                <ChevronRight />
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    if (isResults && recommendations) {
      const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      const getScoreInterpretation = () => {
        if (scorePercentage < 40) return { text: "High Risk", color: "text-destructive" };
        if (scorePercentage < 75) return { text: "Moderate Risk", color: "text-yellow-400" };
        return { text: "Low Risk", color: "text-green-400" };
      };
      
      const interpretation = getScoreInterpretation();

      const prioritizedRecs = {
        high: recommendations.recommendations.filter((r) => r.priority === "high"),
        medium: recommendations.recommendations.filter((r) => r.priority === "medium"),
        low: recommendations.recommendations.filter((r) => r.priority === "low"),
      };

      const storeReportPayload = () => {
        try {
          const payload = {
            score,
            maxScore,
            categoryScores,
            recommendations,
            generatedAt: new Date().toISOString(),
          };
          localStorage.setItem("clarity_full_report_payload", JSON.stringify(payload));
        } catch {}
      };

      const handleDownloadFullReportPDF = () => {
        storeReportPayload();
        window.open("/full-report?action=pdf", "_blank", "noopener,noreferrer");
      };

      return (
        <div className="w-full max-w-5xl space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <Logo size="small" />
                <h1 className="text-3xl font-headline">Your Security Report</h1>
              </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadFullReportPDF}>
                <FileText className="mr-2" /> Download PDF
              </Button>
              <Button onClick={handleRestart}>Start Over</Button>
            </div>
          </div>

          <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 avoid-break">
            <Card className="lg:col-span-1 print-card">
              <CardHeader className="print-card-header">
                <CardTitle className="text-2xl print-card-title">Overall Security Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center print-card-content space-y-4">
                <p className={cn("text-7xl font-bold", interpretation.color)}>
                  {scorePercentage.toFixed(0)}%
                </p>
                <Badge variant="outline" className={cn("text-lg", interpretation.color, interpretation.color.replace('text-', 'border-'))}>
                  {interpretation.text}
                </Badge>
                <p className="text-muted-foreground pt-2 print-text">
                  This score reflects your cybersecurity posture based on your answers.
                </p>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 print-card">
              <CardHeader className="print-card-header">
                 <CardTitle className="text-2xl flex items-center gap-2 print-card-title">
                  <TrendingUp /> Domain Scores
                </CardTitle>
                <CardDescription className="print-text">
                  A breakdown of your score across different security domains.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-card-content">
                {Object.entries(categoryScores).map(([catId, scores]) => {
                   if (scores.count === 0) return null;
                   const CategoryIcon = categoryIcons[catId] || Shield;
                   const catPercentage = scores.maxScore > 0 ? (scores.score / scores.maxScore) * 100 : 0;
                   return (
                      <div key={catId} className="flex items-center gap-4 rounded-lg border p-3">
                         <CategoryIcon className="h-8 w-8 text-muted-foreground" />
                         <div className="flex-1">
                           <div className="flex justify-between items-baseline">
                             <p className="font-semibold text-card-foreground print-text">{questionCategories[catId].name}</p>
                             <p className="text-sm font-bold text-muted-foreground print-text">
                               {scores.score}/{scores.maxScore}
                             </p>
                           </div>
                           <Progress value={catPercentage} className="h-2 mt-1" />
                         </div>
                      </div>
                   );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Share score buttons */}
          <div className="flex justify-center no-print">
            <ShareMyScore scorePercent={Math.round(scorePercentage)} />
          </div>
          
          <Card className="print-card page-break">
            <CardHeader className="print-card-header">
              <CardTitle className="text-2xl flex items-center gap-2 print-card-title">
                <Sparkles className="text-primary" /> AI-Powered Summary
              </CardTitle>
              <CardDescription className="print-text">
                Our AI has analyzed your results to highlight your key risks and strengths.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 print-card-content">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><ThumbsDown className="text-destructive"/> Top Risks</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {recommendations.risks.map((risk, i) => <li key={i} className="print-text">{risk}</li>)}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><ThumbsUp className="text-green-500"/> Top Strengths</h3>
                   <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {recommendations.strengths.map((strength, i) => <li key={i} className="print-text">{strength}</li>)}
                  </ul>
                </div>
            </CardContent>
          </Card>


          <Card className="print-card page-break">
            <CardHeader className="print-card-header">
              <CardTitle className="text-2xl flex items-center gap-2 print-card-title">
                <Sparkles className="text-primary" /> AI-Powered Recommendations
              </CardTitle>
              <CardDescription className="print-text">
                Actionable steps to improve your security score, prioritized for impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="print-card-content">
              <Tabs defaultValue="high" className="w-full">
                <TabsList className="grid w-full grid-cols-3 no-print print-tabs-list">
                  <TabsTrigger value="high">High Priority</TabsTrigger>
                  <TabsTrigger value="medium">Medium Priority</TabsTrigger>
                  <TabsTrigger value="low">Low Priority</TabsTrigger>
                </TabsList>
                
                <h3 className="hidden print-recommendation-title">High Priority Recommendations</h3>
                <TabsContent value="high" className="space-y-4 pt-4 print-tabs-content">
                  {prioritizedRecs.high.length > 0 ? (
                    prioritizedRecs.high.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card flex items-start gap-4 print-card">
                        <Badge variant="destructive" className="mt-1 print-badge">High</Badge>
                        <p className="flex-1 print-text">{rec.recommendation}</p>
                      </div>
                    ))
                  ) : <p className="text-muted-foreground text-center py-4">No high priority recommendations. Great job!</p>}
                </TabsContent>
                
                 <h3 className="hidden print-recommendation-title">Medium Priority Recommendations</h3>
                <TabsContent value="medium" className="space-y-4 pt-4 print-tabs-content">
                  {prioritizedRecs.medium.length > 0 ? (
                    prioritizedRecs.medium.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card flex items-start gap-4 print-card">
                        <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 print-badge">Medium</Badge>
                         <p className="flex-1 print-text">{rec.recommendation}</p>
                      </div>
                    ))
                   ) : <p className="text-muted-foreground text-center py-4">No medium priority recommendations.</p>}
                </TabsContent>

                 <h3 className="hidden print-recommendation-title">Low Priority Recommendations</h3>
                <TabsContent value="low" className="space-y-4 pt-4 print-tabs-content">
                   {prioritizedRecs.low.length > 0 ? (
                    prioritizedRecs.low.map((rec, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card flex items-start gap-4 print-card">
                        <Badge variant="secondary" className="print-badge">Low</Badge>
                         <p className="flex-1 print-text">{rec.recommendation}</p>
                      </div>
                    ))
                   ) : <p className="text-muted-foreground text-center py-4">No low priority recommendations.</p>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card className="print-card page-break">
            <CardHeader className="print-card-header">
              <CardTitle className="text-2xl print-card-title">Contact Tanosec Cybersecurity</CardTitle>
              <CardDescription className="print-text">We're here to help you implement your recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 print-card-content">
              <p className="print-text"><strong>Telephone:</strong> +27 68 629 5030</p>
              <p className="print-text"><strong>Email:</strong> clarity@tanosec.co.za</p>
            </CardContent>
          </Card>
          </div>
          <Card className="bg-gradient-to-r from-primary/20 to-accent/20 no-print">
            <CardHeader>
              <CardTitle>Ready to take the next step?</CardTitle>
              <CardDescription>
                Our experts can help you implement these recommendations and secure your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <a href="https://calendly.com/tanosec" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Book a Free Consultation
                </Button>
              </a>
               <Button size="lg" variant="outline" onClick={handleRemindMe}>
                  <CalendarClock className="mr-2" />
                  Remind me to reassess in 3 months
                </Button>
            </CardContent>
          </Card>

        </div>
      );
    }
    return null;
  };

  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center p-4 md:p-8 font-body">
      {renderContent()}
    </main>
  );
}
