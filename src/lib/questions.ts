type QuestionCategory = {
  name: string;
  weight: number;
};

type Question = {
  id: string;
  category: keyof typeof questionCategories;
  text: string;
  options: {
    text: string;
    score: number;
  }[];
};

export const questionCategories: Record<string, QuestionCategory> = {
  network: { name: "Network Security", weight: 0.2 },
  access: { name: "Access Control & Authentication", weight: 0.2 },
  data: { name: "Data Protection & Backup", weight: 0.15 },
  endpoint: { name: "Endpoint Security", weight: 0.15 },
  training: { name: "Security Awareness & Training", weight: 0.15 },
  incident: { name: "Incident Response & Recovery", weight: 0.1 },
  compliance: { name: "Compliance & Risk", weight: 0.05 },
};

export const questions: Question[] = [
  // Network Security
  {
    id: "q1",
    category: "network",
    text: "Do you use a firewall to protect your business internet connection?",
    options: [
      { text: "Yes, actively managed and configured", score: 10 },
      { text: "Yes, but it's the basic one from my ISP", score: 5 },
      { text: "No, or I don't know", score: 0 },
    ],
  },
  {
    id: "q2",
    category: "network",
    text: "Is your Wi-Fi network secured with a strong password and hidden SSID?",
    options: [
      { text: "Yes, both are implemented", score: 10 },
      { text: "Only using a strong password", score: 6 },
      { text: "No, password is weak or network is open", score: 0 },
    ],
  },
    {
    id: "q3",
    category: "network",
    text: "Are guest devices kept on a separate Wi-Fi network from business systems?",
    options: [
      { text: "Yes, we have a dedicated guest network", score: 10 },
      { text: "No, all devices use the same network", score: 0 },
      { text: "We don't allow guest devices", score: 10 },
    ],
  },
  // Access Control & Authentication
  {
    id: "q4",
    category: "access",
    text: "Do your employees use Multi-Factor Authentication (MFA) to access systems or email?",
    options: [
      { text: "Yes, MFA is mandatory for all critical systems and email", score: 10 },
      { text: "It's optional or used for some systems only", score: 4 },
      { text: "No, we do not use MFA", score: 0 },
    ],
  },
  {
    id: "q5",
    category: "access",
    text: "Are user accounts removed or updated promptly when staff leave or change roles?",
    options: [
      { text: "Yes, within 24 hours of a change", score: 10 },
      { text: "It can take a few days or is sometimes missed", score: 3 },
      { text: "This process is not formally managed", score: 0 },
    ],
  },
  {
    id: "q6",
    category: "access",
    text: "Do you enforce strong password policies across all systems?",
    options: [
      { text: "Yes, we enforce length, complexity, and rotation", score: 10 },
      { text: "We have a policy but it is not strictly enforced", score: 5 },
      { text: "No formal password policy exists", score: 0 },
    ],
  },
  // Data Protection & Backup
  {
    id: "q7",
    category: "data",
    text: "Is your important data backed up regularly, and are backups tested?",
    options: [
      { text: "Yes, automated daily backups that are tested quarterly", score: 10 },
      { text: "Backups are infrequent or never tested", score: 3 },
      { text: "We do not back up our data", score: 0 },
    ],
  },
  {
    id: "q8",
    category: "data",
    text: "Do you store or send sensitive data in encrypted form (e.g. client files)?",
    options: [
      { text: "Yes, all sensitive data is encrypted at rest and in transit", score: 10 },
      { text: "Some sensitive data is encrypted, but not all", score: 5 },
      { text: "No, we do not use encryption", score: 0 },
    ],
  },
  {
    id: "q15",
    category: "data",
    text: "Do you have a data protection policy that staff are aware of?",
    options: [
      { text: "Yes, we have a clear policy that is regularly reviewed", score: 10 },
      { text: "We have a policy, but it may be outdated or not well-known", score: 5 },
      { text: "No, we do not have a formal policy", score: 0 },
    ],
  },
  // Endpoint Security
  {
    id: "q9",
    category: "endpoint",
    text: "Do all your computers and devices run up-to-date antivirus or EDR software?",
    options: [
      { text: "Yes, all endpoints are protected and centrally managed", score: 10 },
      { text: "Most devices are protected, but it's not managed", score: 5 },
      { text: "No, or protection is expired/out-of-date", score: 0 },
    ],
  },
  {
    id: "q10",
    category: "endpoint",
    text: "Are your systems regularly updated with security patches (Windows, software)?",
    options: [
      { text: "Yes, we use an automated patch management system", score: 10 },
      { text: "Updates are installed manually and can be delayed", score: 4 },
      { text: "Updates are rarely or never installed", score: 0 },
    ],
  },
  {
    id: "q16",
    category: "endpoint",
    text: "Can you track or remotely wipe a lost or stolen laptop or phone?",
    options: [
      { text: "Yes, we have Mobile Device Management (MDM) in place", score: 10 },
      { text: "We can track some devices but cannot wipe them", score: 3 },
      { text: "No, we have no remote capabilities", score: 0 },
    ],
  },
  // Security Awareness & Training
   {
    id: "q11",
    category: "training",
    text: "Have your employees received basic cybersecurity training in the last 12 months?",
    options: [
      { text: "Yes, all staff have completed recent training", score: 10 },
      { text: "Training was provided, but not recently or to everyone", score: 4 },
      { text: "No training is provided", score: 0 },
    ],
  },
  {
    id: "q12",
    category: "training",
    text: "Do you conduct phishing simulations or test staff awareness regularly?",
    options: [
      { text: "Yes, we run tests at least quarterly", score: 10 },
      { text: "We have done it once or twice", score: 5 },
      { text: "No, we have never tested staff awareness", score: 0 },
    ],
  },
  {
    id: "q17",
    category: "training",
    text: "Are staff encouraged to report suspicious emails or activity?",
    options: [
      { text: "Yes, we have a clear process and a positive reporting culture", score: 10 },
      { text: "Staff can report issues, but there's no formal process", score: 5 },
      { text: "No, reporting is not actively encouraged", score: 0 },
    ],
  },
  // Incident Response & Recovery
  {
    id: "q13",
    category: "incident",
    text: "Do you have a cyber incident response plan or know who to call during a breach?",
    options: [
      { text: "Yes, we have a documented and tested plan", score: 10 },
      { text: "We have an idea of what to do, but it's not formal", score: 4 },
      { text: "No, we don't have a plan", score: 0 },
    ],
  },
  {
    id: "q18",
    category: "incident",
    text: "Are your systems monitored for unusual or unauthorized activity?",
    options: [
      { text: "Yes, we have active monitoring and alerting in place", score: 10 },
      { text: "We rely on basic system logs only", score: 4 },
      { text: "No, we do not monitor our systems", score: 0 },
    ],
  },
  {
    id: "q14",
    category: "incident",
    text: "Do you have cyber insurance that covers data breaches and ransomware?",
    options: [
      { text: "Yes, we have a comprehensive cyber insurance policy", score: 10 },
      { text: "We have some liability insurance but are unsure if it covers cyber incidents", score: 3 },
      { text: "No, we do not have cyber insurance", score: 0 },
    ],
  },
  // Compliance & Risk
  {
    id: "q19",
    category: "compliance",
    text: "Are you aware of any legal obligations (e.g., POPIA) regarding data protection?",
    options: [
      { text: "Yes, and we have taken steps to comply", score: 10 },
      { text: "We are aware but haven't taken specific action", score: 4 },
      { text: "No, we are not aware of our obligations", score: 0 },
    ],
  },
  {
    id: "q20",
    category: "compliance",
    text: "Have you performed a cyber risk assessment in the last 12 months?",
    options: [
      { text: "Yes, and we have a plan to address the identified risks", score: 10 },
      { text: "Yes, but we haven't acted on the findings", score: 5 },
      { text: "No, we have not performed a risk assessment", score: 0 },
    ],
  },
];

    