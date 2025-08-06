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
  network: { name: "Network Security", weight: 0.25 },
  access: { name: "Access Control", weight: 0.25 },
  data: { name: "Data Protection", weight: 0.2 },
  incident: { name: "Incident Response", weight: 0.15 },
  training: { name: "Employee Training", weight: 0.15 },
};

export const questions: Question[] = [
  {
    id: "q1",
    category: "network",
    text: "Do you have a firewall installed and configured to protect your network?",
    options: [
      { text: "Yes, fully configured and regularly updated", score: 10 },
      { text: "Yes, but configuration is uncertain or outdated", score: 5 },
      { text: "No, or I don't know", score: 0 },
    ],
  },
  {
    id: "q2",
    category: "network",
    text: "Is your business Wi-Fi network secured and separate from any guest network?",
    options: [
      { text: "Yes, with WPA3/WPA2 encryption and a separate guest network", score: 10 },
      { text: "It's secured, but we don't have a separate guest network", score: 5 },
      { text: "No, it's an open network or uses weak security (WEP)", score: 0 },
    ],
  },
  {
    id: "q3",
    category: "access",
    text: "How do you manage passwords for critical systems?",
    options: [
      { text: "Using a dedicated password manager with strong, unique passwords and Multi-Factor Authentication (MFA)", score: 10 },
      { text: "We enforce strong password policies, but don't use a manager or MFA", score: 5 },
      { text: "Passwords are simple, reused, or written down", score: 0 },
    ],
  },
  {
    id: "q4",
    category: "access",
    text: "Do you enforce the principle of least privilege for employee access to data and systems?",
    options: [
      { text: "Yes, access is strictly role-based and reviewed regularly", score: 10 },
      { text: "Partially, some roles have more access than necessary", score: 4 },
      { text: "No, many users have broad access to company data", score: 0 },
    ],
  },
  {
    id: "q5",
    category: "data",
    text: "How do you back up your critical business data?",
    options: [
      { text: "Automated, encrypted backups to a secure, off-site or cloud location, tested regularly", score: 10 },
      { text: "Manual or infrequent backups to a local drive", score: 4 },
      { text: "We do not have a regular backup process", score: 0 },
    ],
  },
  {
    id: "q6",
    category: "data",
    text: "Is sensitive customer or company data encrypted both at rest (on servers/laptops) and in transit (over the internet)?",
    options: [
      { text: "Yes, we use full-disk encryption and SSL/TLS for all data transmission", score: 10 },
      { text: "Only some of our sensitive data is encrypted", score: 5 },
      { text: "No, or I don't know", score: 0 },
    ],
  },
  {
    id: "q7",
    category: "incident",
    text: "Do you have a documented incident response plan in case of a data breach or cyberattack?",
    options: [
      { text: "Yes, we have a clear, documented plan that is regularly tested", score: 10 },
      { text: "We have an informal plan but it's not documented or tested", score: 3 },
      { text: "No plan exists", score: 0 },
    ],
  },
  {
    id: "q8",
    category: "training",
    text: "Do your employees receive regular cybersecurity awareness training?",
    options: [
      { text: "Yes, ongoing training and phishing simulations are conducted at least annually", score: 10 },
      { text: "We provided some training during onboarding", score: 4 },
      { text: "No, employees do not receive any formal cybersecurity training", score: 0 },
    ],
  },
];
