"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Shield,
  Lock,
  Database,
  AlertTriangle,
  Users,
  Loader2,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Laptop,
  TrendingUp,
  Target,
  FileText,
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

import { questions, questionCategories } from "@/lib/questions";
import { getRecommendations } from "@/lib/actions";
import type { GenerateSecurityRecommendationsOutput } from "@/ai/flows/generate-security-recommendations";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

export default function CyberGuardSMEPage() {
  const [step, setStep] = useState(0); // 0=start, 1-n=questions, n+1=loading, n+2=email, n+3=results
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");
  const [recommendations, setRecommendations] =
    useState<GenerateSecurityRecommendationsOutput>([]);

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
    // Basic email validation
    if (email && email.includes("@")) {
      setStep(totalQuestions + 3);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter a valid email address to view your report.",
      });
    }
  };
  
  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setRecommendations([]);
    setEmail("");
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
              Welcome to CyberGuard SME
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Your AI-powered cybersecurity partner. Take our quick assessment to
              receive personalized recommendations and strengthen your security
              posture.
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
              Enter your email address below to view your personalized cybersecurity report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2 text-left">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-base"
                />
              </div>
            <Button
              size="lg"
              className="w-full font-bold text-lg"
              onClick={handleShowReport}
              disabled={!email}
            >
              Get My Report
            </Button>
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

    if (isResults) {
      const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      const getScoreInterpretation = () => {
        if (scorePercentage < 40) return { text: "High Risk", color: "text-destructive" };
        if (scorePercentage < 75) return { text: "Moderate Risk", color: "text-yellow-400" };
        return { text: "Low Risk", color: "text-green-400" };
      };
      
      const interpretation = getScoreInterpretation();

      const prioritizedRecs = {
        high: recommendations.filter((r) => r.priority === "high"),
        medium: recommendations.filter((r) => r.priority === "medium"),
        low: recommendations.filter((r) => r.priority === "low"),
      };

      return (
        <div className="w-full max-w-5xl space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-2">
               <Logo size="small" />
               <h1 className="text-3xl font-headline">Your Security Report</h1>
             </div>
            <div className="flex gap-2 no-print">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2" /> Print Report
              </Button>
              <Button
                onClick={handleRestart}
              >
                Start Over
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <Card className="print-card">
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
                <TabsList className="grid w-full grid-cols-3 no-print">
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
          
          <Card className="bg-gradient-to-r from-primary/20 to-accent/20 no-print">
            <CardHeader>
              <CardTitle>Ready to take the next step?</CardTitle>
              <CardDescription>
                Our experts can help you implement these recommendations and secure your business.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <a href="https://calendly.com/tanosec" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Book a Free Consultation
                </Button>
              </a>
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

    