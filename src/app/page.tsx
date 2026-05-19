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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { questions, questionCategories } from "@/lib/questions";
import { getRecommendations } from "@/lib/actions";
import { saveLeadCapture } from "@/lib/leadActions";
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

const FALLBACK_RECOMMENDATIONS: GenerateSecurityRecommendationsOutput = {
  risks: [
    "No formal incident response plan — you won't know what to do when (not if) a breach happens",
    "Employee security awareness is likely your biggest unmanaged risk",
    "Unpatched systems and weak passwords remain the #1 entry point for attackers targeting SA SMEs",
  ],
  strengths: [
    "You've taken the first step by completing this assessment — most businesses never do",
    "Awareness of your security posture is the foundation of improvement",
  ],
  recommendations: [
    {
      recommendation: "Enable Multi-Factor Authentication on all email accounts and critical systems immediately. This single step blocks over 90% of credential-based attacks.",
      priority: "high",
    },
    {
      recommendation: "Ensure all business data is backed up daily to an offsite or cloud location, and test restoring a backup at least quarterly.",
      priority: "high",
    },
    {
      recommendation: "Run a staff awareness session covering phishing, SIM swap fraud, and SARS/SAPO impersonation scams — the most common vectors targeting South African businesses.",
      priority: "high",
    },
    {
      recommendation: "Appoint a nominated POPIA Information Officer and document what personal data your business holds and why.",
      priority: "medium",
    },
    {
      recommendation: "Book a free consultation with Tanosec to get a prioritised remediation roadmap specific to your business.",
      priority: "medium",
    },
  ],
};

async function getRecommendationsWithRetry(
  payload: Parameters<typeof getRecommendations>[0]
): Promise<GenerateSecurityRecommendationsOutput> {
  try {
    return await getRecommendations(payload);
  } catch (error) {
    console.log('First attempt failed, retrying...', error);
    try {
      return await getRecommendations(payload);
    } catch (retryError) {
      console.error('Both attempts failed:', retryError);
      throw retryError;
    }
  }
}

export default function ClarityByTanosecPage() {
  const [step, setStep] = useState(0); // 0=start, 1-n=questions, n+1=loading, n+2=email, n+3=results
  const [answers, setAnswers] = useState<Answers>({});
  const [email, setEmail] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [sector, setSector] = useState<string>('');
  const [companySize, setCompanySize] = useState<string>('');
  const [recommendations, setRecommendations] =
    useState<GenerateSecurityRecommendationsOutput | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [isPreviewResults, setIsPreviewResults] = useState(false);

  // Restore answers from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('clarity_answers_draft');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
      }
    } catch {}
  }, []);

  // Save answers to sessionStorage whenever they change
  useEffect(() => {
    try {
      if (Object.keys(answers).length > 0) {
        sessionStorage.setItem('clarity_answers_draft', JSON.stringify(answers));
      }
    } catch {}
  }, [answers]);

  const router = useRouter();

  const { toast } = useToast();
  const totalQuestions = questions.length;
  const isStart = step === 0;
  const isAssessment = step > 0 && step <= totalQuestions;
  const isLoading = step === totalQuestions + 1;
  const isEmailCapture = step === totalQuestions + 2 && !isPreviewResults;
  const isResults = step === totalQuestions + 3;
  const currentQuestionIndex = step - 1;

  const loadingMessages = [
    "Analysing your responses...",
    "Identifying your risk profile...",
    "Consulting the SA threat landscape...",
    "Crafting your recommendations...",
    "Almost there...",
  ];

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex(i => (i + 1) % loadingMessages.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isLoading]);

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

  const handleShowReport = async () => {
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({
          variant: "destructive",
          title: "Invalid Email Format",
          description: "The email format appears invalid.",
        });
        return;
      }

      const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      const getScoreInterpretation = () => {
        if (scorePercentage < 25) return { text: "Critical Risk" };
        if (scorePercentage < 50) return { text: "High Risk" };
        if (scorePercentage < 70) return { text: "Moderate Risk" };
        if (scorePercentage < 85) return { text: "Low Risk" };
        return { text: "Strong Posture" };
      };

      const worstCategory = Object.entries(categoryScores)
        .filter(([, s]) => s.count > 0)
        .sort(([, a], [, b]) => (a.score / a.maxScore) - (b.score / b.maxScore))[0];
      const worstCategoryName = worstCategory ? questionCategories[worstCategory[0]].name : undefined;

      saveLeadCapture({
        email: email,
        newsletterOptIn,
        score: Math.round(scorePercentage),
        scoreLabel: getScoreInterpretation().text,
        sector: sector || undefined,
        companySize: companySize || undefined,
        worstCategory: worstCategoryName || undefined,
      }).catch((err) => console.error('[leadCapture] Failed silently:', err));

      setStep(totalQuestions + 3); // Go straight to full results
    } else {
      setIsPreviewResults(true); // Proceed to preview/gate results page
    }
  };
  
  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setRecommendations(null);
    setEmail("");
    setNewsletterOptIn(false);
    setSector('');
    setCompanySize('');
    setIsPreviewResults(false);
    sessionStorage.removeItem('clarity_answers_draft');
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
      const currentOptions = (() => {
        if (sector && q.industryOptions && q.industryOptions[sector]) {
          return q.industryOptions[sector];
        }
        return q.options;
      })();

      const maxOptionScore = Math.max(...currentOptions.map((opt) => opt.score));
      maxScore += maxOptionScore;
      categoryScores[q.category].maxScore += maxOptionScore;
      categoryScores[q.category].count += 1;

      const selectedAnswerText = answers[q.id];
      if (selectedAnswerText) {
        const selectedOption = currentOptions.find(
          (opt) => opt.text === selectedAnswerText
        );
        if (selectedOption) {
          score += selectedOption.score;
          categoryScores[q.category].score += selectedOption.score;
        }
      }
    });
    return { score, maxScore, categoryScores };
  }, [answers, sector]);

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

      const overallScorePercent = maxScore > 0 ? (score / maxScore) * 100 : 0;

      // Shape categoryScores to match the AI input schema (add percentage field)
      const enrichedCategoryScores = Object.fromEntries(
        Object.entries(categoryScores).map(([catId, s]) => [
          catId,
          { score: s.score, maxScore: s.maxScore, percentage: s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0 },
        ])
      );

      getRecommendationsWithRetry({
        assessmentResponses,
        overallScorePercent,
        categoryScores: enrichedCategoryScores,
        ...(sector ? { sector } : {}),
        ...(companySize ? { companySize } : {}),
      })
        .then((result) => {
          setRecommendations(result);
          setStep(totalQuestions + 2);
        })
        .catch((error) => {
          console.error("Failed to get recommendations:", error);
          console.error("Error details:", {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : null,
            assessmentResponseCount: Object.keys(answers).length
          });
          toast({
            variant: "destructive",
            title: "AI recommendations unavailable",
            description: "Showing a fallback report so you can continue.",
          });
          setRecommendations(FALLBACK_RECOMMENDATIONS);
          setStep(totalQuestions + 2);
        });
    }
  }, [isLoading, answers, totalQuestions, toast, score, maxScore, categoryScores, sector, companySize]);

  const renderContent = () => {
    if (isStart) {
      return (
        <Card className="w-full max-w-2xl text-center shadow-2xl animate-fade-in border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Logo />
            </div>
            <CardTitle className="text-4xl md:text-5xl font-headline font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Clarity by Tanosec
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Think Like a Hacker, Secure Like a Pro. Assess your posture and get actionable steps to improve your defences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Context-gathering inputs — optional, not scored */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="sector-select">What industry are you in?</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger id="sector-select" className="w-full">
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Legal & Compliance">Legal &amp; Compliance</SelectItem>
                    <SelectItem value="Healthcare & Medical">Healthcare &amp; Medical</SelectItem>
                    <SelectItem value="Finance & Accounting">Finance &amp; Accounting</SelectItem>
                    <SelectItem value="Retail & E-commerce">Retail &amp; E-commerce</SelectItem>
                    <SelectItem value="Construction & Engineering">Construction &amp; Engineering</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                    <SelectItem value="Hospitality & Tourism">Hospitality &amp; Tourism</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size-select">How many people work at your business?</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger id="size-select" className="w-full">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1–5 employees">1–5 employees</SelectItem>
                    <SelectItem value="6–20 employees">6–20 employees</SelectItem>
                    <SelectItem value="21–50 employees">21–50 employees</SelectItem>
                    <SelectItem value="51–200 employees">51–200 employees</SelectItem>
                    <SelectItem value="200+ employees">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="lg"
              className="font-bold text-lg w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setStep(1)}
            >
              Start Assessment
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground justify-center">
            <p>Takes approximately 2 minutes to complete. Industry &amp; size fields are optional.</p>
          </CardFooter>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-8 py-12 animate-fade-in">
          <div className="relative flex items-center justify-center h-24 w-24">
            <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
            <Shield className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-headline transition-opacity duration-500 ease-in-out text-foreground">
            {loadingMessages[loadingMsgIndex]}
          </h2>
        </div>
      );
    }
    
    if (isEmailCapture) {
      return (
        <Card className="w-full max-w-lg text-center shadow-2xl animate-fade-in border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">
                Get Your Full Security Report
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground pt-2">
                Enter your email and a Tanosec cybersecurity expert will send you a personalised follow-up based on your results. We typically respond within one business day.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-left">
                <Label htmlFor="email" className="text-muted-foreground">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/50 focus-visible:ring-primary h-12 text-lg"
                />
              </div>
              <div className="flex items-center space-x-2 text-left">
                <Checkbox
                  id="newsletter"
                  checked={newsletterOptIn}
                  onCheckedChange={(checked) => setNewsletterOptIn(checked as boolean)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border"
                />
                <label
                  htmlFor="newsletter"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Keep me updated on South African cyber threats
                </label>
              </div>
              
              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  size="lg"
                  className="w-full font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleShowReport}
                >
                  Send Me My Results
                </Button>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  By submitting you consent to Tanosec contacting you about your security posture in accordance with our{" "}
                  <a
                    href="https://tanosec.co.za/privacy-policy-2/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </a>
                  . POPIA compliant. No spam, ever.
                </p>
              </div>
            </CardContent>
          </Card>
      );
    }


    if (isAssessment) {
      const question = questions[currentQuestionIndex];
      const category = questionCategories[question.category];
      const CategoryIcon = categoryIcons[question.category] || Shield;

      const currentOptions = (() => {
        if (sector && question.industryOptions && question.industryOptions[sector]) {
          return question.industryOptions[sector];
        }
        return question.options;
      })();

      return (
        <div className="w-full max-w-3xl space-y-8">
          <div className="flex justify-center mb-2">
            <Logo size="small" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2 text-primary">
                <CategoryIcon className="h-5 w-5" />
                <span className="font-semibold">{category.name}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Question {step} of {totalQuestions}
              </p>
            </div>
            <Progress value={(step / totalQuestions) * 100} className="h-1 bg-muted [&>div]:bg-primary transition-all duration-300" />
          </div>

          <Card className="shadow-2xl animate-fade-in border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl pt-2 leading-relaxed">
                {question.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              {currentOptions.map((option) => (
                <button
                  key={option.text}
                  onClick={() => handleSelectAnswer(question.id, option.text)}
                  className={cn(
                    "text-left w-full p-4 rounded-md border transition-all duration-200",
                    answers[question.id] === option.text
                      ? "bg-primary/10 border-primary ring-1 ring-primary text-foreground"
                      : "bg-background/50 border-border/50 hover:bg-muted/50 hover:border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <p className="font-medium text-base">{option.text}</p>
                </button>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between pt-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step <= 1}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answers[question.id]}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-24"
              >
                {step === totalQuestions ? "Finish" : "Next"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    if (isPreviewResults && recommendations) {
      const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      const getScoreInterpretation = () => {
        if (scorePercentage < 25) return { text: "Critical Risk", color: "text-destructive", border: "border-destructive", desc: "Your business is highly exposed. Immediate action required." };
        if (scorePercentage < 50) return { text: "High Risk", color: "text-orange-400", border: "border-orange-400/30", desc: "Significant gaps exist. Several urgent actions needed." };
        if (scorePercentage < 70) return { text: "Moderate Risk", color: "text-yellow-400", border: "border-yellow-400/30", desc: "A reasonable baseline, but important gaps remain." };
        if (scorePercentage < 85) return { text: "Low Risk", color: "text-green-400", border: "border-green-400/30", desc: "Good security hygiene. Focus on continuous improvement." };
        return { text: "Strong Posture", color: "text-emerald-400", border: "border-emerald-400/30", desc: "Excellent security practices. Keep it up and stay current." };
      };
      
      const interpretation = getScoreInterpretation();

      const handlePreviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast({
            variant: "destructive",
            title: "Invalid Email Address",
            description: "Please enter a valid email address to get your report.",
          });
          return;
        }

        const worstCategory = Object.entries(categoryScores)
          .filter(([, s]) => s.count > 0)
          .sort(([, a], [, b]) => (a.score / a.maxScore) - (b.score / b.maxScore))[0];
        const worstCategoryName = worstCategory ? questionCategories[worstCategory[0]].name : undefined;

        saveLeadCapture({
          email,
          newsletterOptIn,
          score: Math.round(scorePercentage),
          scoreLabel: interpretation.text,
          sector: sector || undefined,
          companySize: companySize || undefined,
          worstCategory: worstCategoryName || undefined,
        }).catch((err) => console.error('[leadCapture] Failed silently:', err));

        setIsPreviewResults(false);
        setStep(totalQuestions + 3); // Go to results
      };

      return (
        <div className="w-full max-w-2xl space-y-8 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <Logo size="small" />
            <h1 className="text-3xl font-headline font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Get Your Full Security Report
            </h1>
            <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
              A Tanosec cybersecurity expert will review your results and send you a personalised follow-up within one business day.
            </p>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardDescription className="text-muted-foreground uppercase tracking-wider text-xs font-semibold">
                Overall Security Score
              </CardDescription>
              <div className="py-4">
                <p className={cn("text-7xl font-bold", interpretation.color)}>
                  {scorePercentage.toFixed(0)}%
                </p>
              </div>
              <div className="flex justify-center">
                <Badge variant="outline" className={cn("text-lg px-4 py-1", interpretation.color, interpretation.border)}>
                  {interpretation.text}
                </Badge>
              </div>
              <p className="text-base text-muted-foreground mt-4 max-w-md mx-auto">{interpretation.desc}</p>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
                <p className="text-sm font-medium text-primary">
                  We identified {recommendations.risks.length} key risks in your assessment.
                </p>
              </div>

              {/* Locked Teaser Section */}
              <div className="relative rounded-xl border border-border/40 bg-background/20 p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center p-4">
                  <div className="p-4 bg-primary/10 rounded-full border border-primary/25 mb-3 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <Lock className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <p className="font-headline font-bold text-xl text-foreground text-center">
                    Get your full security report — enter your email below to send your results.
                  </p>
                </div>

                {/* Blurred Content Placeholder */}
                <div className="space-y-4 opacity-25 select-none pointer-events-none">
                  <div className="h-6 w-1/3 bg-muted rounded"></div>
                  <div className="h-4 w-full bg-muted rounded"></div>
                  <div className="h-4 w-5/6 bg-muted rounded"></div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="h-16 bg-muted rounded-xl"></div>
                    <div className="h-16 bg-muted rounded-xl"></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-headline font-bold text-lg text-foreground">
                  Your full report includes:
                </h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Category-by-category breakdown across 8 domains</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Your top risks identified by AI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Your security strengths</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>5–8 prioritised recommendations tailored to your business</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>A personalised consultation offer</span>
                  </li>
                </ul>
              </div>

              <form onSubmit={handlePreviewSubmit} className="space-y-4 pt-4 border-t border-border/30">
                <div className="space-y-2">
                  <Label htmlFor="preview-email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="preview-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background/50 border-border/50 focus-visible:ring-primary h-12 text-lg"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pb-2">
                  <Checkbox
                    id="preview-newsletter"
                    checked={newsletterOptIn}
                    onCheckedChange={(checked) => setNewsletterOptIn(checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-border"
                  />
                  <label
                    htmlFor="preview-newsletter"
                    className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Keep me updated on South African cyber threats
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 h-12 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
                >
                  Send Me My Results
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 text-center px-6 pb-6 pt-2 border-t border-border/20">
              <p className="text-xs leading-relaxed text-muted-foreground max-w-md mx-auto">
                By submitting you consent to Tanosec contacting you in accordance with our{" "}
                <a
                  href="https://tanosec.co.za/privacy-policy-2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </a>{" "}
                (https://tanosec.co.za/privacy-policy-2/). POPIA compliant. No spam, ever.
              </p>
              <p className="text-[10px] text-muted-foreground/80">
                support@tanosec.co.za · +27 621 234 244
              </p>
            </CardFooter>
          </Card>
        </div>
      );
    }

    if (isResults && recommendations) {
      const scorePercentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
      const getScoreInterpretation = () => {
        if (scorePercentage < 25) return { text: "Critical Risk", color: "text-destructive", desc: "Your business is highly exposed. Immediate action required." };
        if (scorePercentage < 50) return { text: "High Risk", color: "text-orange-400", desc: "Significant gaps exist. Several urgent actions needed." };
        if (scorePercentage < 70) return { text: "Moderate Risk", color: "text-yellow-400", desc: "A reasonable baseline, but important gaps remain." };
        if (scorePercentage < 85) return { text: "Low Risk", color: "text-green-400", desc: "Good security hygiene. Focus on continuous improvement." };
        return { text: "Strong Posture", color: "text-emerald-400", desc: "Excellent security practices. Keep it up and stay current." };
      };
      
      const interpretation = getScoreInterpretation();

      const prioritizedRecs = {
        high: recommendations.recommendations.filter((r) => r.priority === "high"),
        medium: recommendations.recommendations.filter((r) => r.priority === "medium"),
        low: recommendations.recommendations.filter((r) => r.priority === "low"),
      };

      const worstCategory = Object.entries(categoryScores)
        .filter(([, s]) => s.count > 0)
        .sort(([, a], [, b]) => (a.score / a.maxScore) - (b.score / b.maxScore))[0];

      const worstCategoryName = worstCategory ? questionCategories[worstCategory[0]].name : null;

      return (
        <div className="w-full max-w-5xl space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <Logo size="small" />
                <h1 className="text-3xl font-headline">Your Security Report</h1>
              </div>
            <div className="flex gap-2">
              <Button onClick={handleRestart}>Start Over</Button>
            </div>
          </div>

          <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 avoid-break">
            <Card className="lg:col-span-1 print-card border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="print-card-header pb-2">
                <CardTitle className="text-2xl print-card-title text-center">Overall Security Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center print-card-content space-y-4">
                <p className={cn("text-7xl font-bold", interpretation.color)}>
                  {scorePercentage.toFixed(0)}%
                </p>
                <Badge variant="outline" className={cn("text-lg", interpretation.color, interpretation.color.replace('text-', 'border-'))}>
                  {interpretation.text}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1">{interpretation.desc}</p>
                <p className="text-muted-foreground pt-2 print-text">
                  This score reflects your cybersecurity posture based on your answers.
                </p>
                {/* Share inside the score card */}
                <div className="pt-2 no-print">
                  <p className="text-sm text-muted-foreground mb-2">Share your Results.</p>
                  <div className="flex justify-center">
                    <ShareMyScore scorePercent={Math.round(scorePercentage)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 print-card border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
              <CardHeader className="print-card-header pb-4">
                 <CardTitle className="text-2xl flex items-center gap-2 print-card-title">
                  <TrendingUp className="text-primary" /> Domain Scores
                </CardTitle>
                <CardDescription className="print-text text-base">
                  A breakdown of your score across different security domains.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-card-content">
                {Object.entries(categoryScores).map(([catId, scores]) => {
                   if (scores.count === 0) return null;
                   const CategoryIcon = categoryIcons[catId] || Shield;
                   const catPercentage = scores.maxScore > 0 ? (scores.score / scores.maxScore) * 100 : 0;
                   return (
                      <div key={catId} className="flex items-center gap-4 rounded-xl border border-border/50 bg-background/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                         <div className="p-2 bg-primary/10 rounded-lg">
                           <CategoryIcon className="h-6 w-6 text-primary" />
                         </div>
                         <div className="flex-1">
                           <div className="flex justify-between items-baseline mb-2">
                             <p className="font-semibold text-card-foreground print-text">{questionCategories[catId].name}</p>
                             <p className="text-sm font-bold text-muted-foreground print-text">
                               {scores.score}/{scores.maxScore}
                             </p>
                           </div>
                           <Progress value={catPercentage} className="h-2 bg-muted [&>div]:bg-primary" />
                         </div>
                      </div>
                   );
                })}
              </CardContent>
            </Card>
          </div>

          
          
          <Card className="print-card page-break border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="print-card-header pb-4">
              <CardTitle className="text-3xl flex items-center gap-3 print-card-title font-headline">
                <Sparkles className="text-primary h-8 w-8" /> AI-Powered Summary
              </CardTitle>
              <CardDescription className="print-text text-base">
                Our AI has analyzed your results to highlight your key risks and strengths.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 print-card-content">
                <div className="space-y-4">
                  <h3 className="font-headline font-bold text-xl flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5"/> Top Risks</h3>
                  <div className="space-y-3">
                    {recommendations.risks.map((risk, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive-foreground">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                        <span className="print-text leading-snug">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-headline font-bold text-xl flex items-center gap-2 text-primary"><Shield className="h-5 w-5"/> Top Strengths</h3>
                   <div className="space-y-3">
                    {recommendations.strengths.map((strength, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-primary-foreground/90">
                        <Shield className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                        <span className="print-text leading-snug">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
            </CardContent>
          </Card>


          <Card className="print-card page-break border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="print-card-header pb-4">
              <CardTitle className="text-3xl flex items-center gap-3 print-card-title font-headline">
                <Target className="text-primary h-8 w-8" /> Prioritised Action Plan
              </CardTitle>
              <CardDescription className="print-text text-base">
                Actionable steps to improve your security score, prioritized for impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="print-card-content">
              <Tabs defaultValue="high" className="w-full">
                <TabsList className="grid w-full grid-cols-3 no-print print-tabs-list h-12 bg-background/50 border border-border/50">
                  <TabsTrigger value="high" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-base">High Priority</TabsTrigger>
                  <TabsTrigger value="medium" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-base">Medium Priority</TabsTrigger>
                  <TabsTrigger value="low" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-base">Low Priority</TabsTrigger>
                </TabsList>
                
                <h3 className="hidden print-recommendation-title">High Priority Recommendations</h3>
                <TabsContent value="high" className="space-y-4 pt-6 print-tabs-content">
                  {prioritizedRecs.high.length > 0 ? (
                    prioritizedRecs.high.map((rec, i) => (
                      <div key={i} className="p-5 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start gap-5 print-card hover:bg-destructive/10 transition-colors">
                        <Badge variant="destructive" className="mt-1 print-badge text-sm px-3 py-1 bg-destructive text-destructive-foreground hover:bg-destructive">HIGH</Badge>
                        <p className="flex-1 print-text text-lg leading-relaxed">{rec.recommendation}</p>
                      </div>
                    ))
                  ) : <p className="text-muted-foreground text-center py-8 text-lg bg-background/30 rounded-lg border border-border/50">No high priority recommendations. Great job!</p>}
                </TabsContent>
                
                 <h3 className="hidden print-recommendation-title">Medium Priority Recommendations</h3>
                <TabsContent value="medium" className="space-y-4 pt-6 print-tabs-content">
                  {prioritizedRecs.medium.length > 0 ? (
                    prioritizedRecs.medium.map((rec, i) => (
                      <div key={i} className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/5 flex items-start gap-5 print-card hover:bg-orange-500/10 transition-colors">
                        <Badge className="bg-orange-500 text-white hover:bg-orange-600 border-none print-badge text-sm px-3 py-1 mt-1">MEDIUM</Badge>
                         <p className="flex-1 print-text text-lg leading-relaxed">{rec.recommendation}</p>
                      </div>
                    ))
                   ) : <p className="text-muted-foreground text-center py-8 text-lg bg-background/30 rounded-lg border border-border/50">No medium priority recommendations.</p>}
                </TabsContent>

                 <h3 className="hidden print-recommendation-title">Low Priority Recommendations</h3>
                <TabsContent value="low" className="space-y-4 pt-6 print-tabs-content">
                   {prioritizedRecs.low.length > 0 ? (
                    prioritizedRecs.low.map((rec, i) => (
                      <div key={i} className="p-5 rounded-xl border border-primary/30 bg-primary/5 flex items-start gap-5 print-card hover:bg-primary/10 transition-colors">
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 border-none print-badge text-sm px-3 py-1 mt-1">LOW</Badge>
                         <p className="flex-1 print-text text-lg leading-relaxed">{rec.recommendation}</p>
                      </div>
                    ))
                   ) : <p className="text-muted-foreground text-center py-8 text-lg bg-background/30 rounded-lg border border-border/50">No low priority recommendations.</p>}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card className="print-card page-break border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="print-card-header">
              <CardTitle className="text-2xl print-card-title font-headline">Contact Tanosec Cybersecurity</CardTitle>
              <CardDescription className="print-text">We're here to help you implement your recommendations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 print-card-content">
              <p className="print-text"><strong>Telephone:</strong> <a href="tel:+27621234244" className="hover:text-primary transition-colors">+27 621 234 244</a></p>
              <p className="print-text"><strong>Email:</strong> <a href="mailto:support@tanosec.co.za" className="hover:text-primary transition-colors">support@tanosec.co.za</a></p>
            </CardContent>
          </Card>
          </div>
          <Card className="bg-primary/10 border-primary/30 shadow-2xl no-print relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-50"></div>
            <CardHeader className="relative z-10 text-center pb-4">
              <CardTitle className="text-3xl md:text-4xl font-headline font-bold text-foreground">
                {worstCategoryName 
                  ? <span className="text-primary">{worstCategoryName}</span>
                  : `Security`} is your biggest gap.
              </CardTitle>
              <CardDescription className="text-lg text-foreground/80 max-w-2xl mx-auto pt-2">
                {worstCategoryName
                  ? `Our experts have seen this pattern before. A focused review with Tanosec typically takes one session and gives you a clear remediation roadmap.`
                  : `Our experts can help you implement these recommendations and secure your business.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 flex flex-col items-center gap-6 pt-4">
              <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
                <a href="https://calendly.com/tanosec" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg h-14 px-8 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-shadow">
                    Book a Free Consultation
                  </Button>
                </a>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-6 border-primary/50 hover:bg-primary/10 text-foreground" onClick={handleRemindMe}>
                  <CalendarClock className="mr-2 h-5 w-5" />
                  Remind me in 3 months
                </Button>
              </div>
              <p className="text-sm text-foreground/80 font-mono mt-2 flex flex-wrap items-center justify-center gap-4">
                <span>Or reach us directly:</span>
                <a href="tel:+27621234244" className="text-primary hover:underline font-bold transition-all hover:scale-105">+27 621 234 244</a>
                <span className="text-muted-foreground/40">•</span>
                <a href="mailto:support@tanosec.co.za" className="text-primary hover:underline font-bold transition-all hover:scale-105">support@tanosec.co.za</a>
              </p>
            </CardContent>
          </Card>

        </div>
      );
    }
    return null;
  };

  return (
    <div role="main" className="flex min-h-svh w-full flex-col items-center justify-start md:justify-center p-4 md:p-8 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:pb-24 font-body bg-dot-pattern">
      {renderContent()}
    </div>
  );
}
