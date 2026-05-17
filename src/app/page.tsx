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
  Mail,
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
import { saveLeadCapture, emailReport } from "@/lib/leadActions";
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
  const isEmailCapture = step === totalQuestions + 2;
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // Warn on malformed email but still let them through
      toast({
        variant: "destructive",
        title: "Invalid Email Format",
        description: "The email format appears invalid, but you can still view your report.",
      });
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
      email: email || undefined,
      newsletterOptIn,
      score: Math.round(scorePercentage),
      scoreLabel: getScoreInterpretation().text,
      sector: sector || undefined,
      companySize: companySize || undefined,
      worstCategory: worstCategoryName || undefined,
    }).catch((err) => console.error('[leadCapture] Failed silently:', err));

    // Always proceed to the report
    setStep(totalQuestions + 3);
  };
  
  const handleRestart = () => {
    setStep(0);
    setAnswers({});
    setRecommendations(null);
    setEmail("");
    setNewsletterOptIn(false);
    setSector('');
    setCompanySize('');
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
              className="font-bold text-lg w-full sm:w-auto"
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
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <h2 className="text-3xl font-headline transition-opacity duration-500 ease-in-out">
            {loadingMessages[loadingMsgIndex]}
          </h2>
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
            <CardTitle className="text-3xl font-headline">
              Your Report is Ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email Address (Optional but Recommended)</Label>
              {/* POPIA consent — shown above the input */}
              <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                Enter your email to receive a follow-up from the Tanosec team.
                By submitting, you consent to Tanosec Cybersecurity processing your information
                in accordance with our{' '}
                <a
                  href="https://tanosec.co.za/privacy-policy-2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary hover:text-primary/80"
                >
                  Privacy Policy
                </a>{' '}
                (POPIA compliant). Your data will not be sold or shared with third parties.
              </CardDescription>
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
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  setNewsletterOptIn(checked as boolean)
                }
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
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleShowReport}
              >
                Continue Without Email
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground justify-center">
            <p>We respect your privacy and will not share your data with third parties.</p>
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

      const handleEmailReport = async () => {
        toast({
          title: "Sending...",
          description: "Requesting your report email.",
        });
        await emailReport({
          email,
          score: Math.round(scorePercentage),
          scoreLabel: interpretation.text,
          sector: sector || 'Not specified',
          companySize: companySize || 'Not specified',
          risks: recommendations.risks,
          strengths: recommendations.strengths,
          recommendations: recommendations.recommendations,
        }).catch((err) => console.error('[emailReport] Failed silently:', err));
        
        toast({
          title: "Report requested!",
          description: `We'll email your results to ${email} shortly.`,
        });
      };

      return (
        <div className="w-full max-w-5xl space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <Logo size="small" />
                <h1 className="text-3xl font-headline">Your Security Report</h1>
              </div>
            <div className="flex gap-2">
              {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                <Button variant="outline" onClick={handleEmailReport}>
                  <Mail className="mr-2 h-4 w-4" />
                  Email My Report
                </Button>
              )}
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
              <CardTitle>
                {worstCategoryName 
                  ? `Your biggest gap is ${worstCategoryName} — let's fix it.`
                  : `Ready to take the next step?`}
              </CardTitle>
              <CardDescription>
                {worstCategoryName
                  ? `Our experts have seen this pattern before. A focused ${worstCategoryName} review with Tanosec typically takes one session and gives you a clear remediation roadmap.`
                  : `Our experts can help you implement these recommendations and secure your business.`}
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
    <div role="main" className="flex min-h-svh w-full flex-col items-center justify-start md:justify-center p-4 md:p-8 pb-[calc(env(safe-area-inset-bottom)+7rem)] md:pb-24 font-body">
      {renderContent()}
    </div>
  );
}
