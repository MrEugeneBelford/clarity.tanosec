import questionsData from "./questions-manifest.json";

type QuestionCategory = {
  name: string;
  weight: number;
};

type AnswerOption = {
  text: string;
  score: number;
};

type Question = {
  id: string;
  category: keyof typeof questionCategories;
  text: string;
  options: AnswerOption[];
  industryOptions?: Partial<Record<string, AnswerOption[]>>;
};

export const questionCategories: Record<string, QuestionCategory> = {
  network:    { name: "Network Security",                weight: 0.15 },
  access:     { name: "Access Control & Authentication",  weight: 0.20 },
  data:       { name: "Data Protection & Backup",         weight: 0.15 },
  endpoint:   { name: "Endpoint Security",                weight: 0.15 },
  training:   { name: "Security Awareness & Training",    weight: 0.15 },
  incident:   { name: "Incident Response & Recovery",     weight: 0.10 },
  compliance:    { name: "Compliance & Risk",                weight: 0.05 },
  ai_governance: { name: "AI Governance & Risk",             weight: 0.05 },
};

export const questions = questionsData as Question[];