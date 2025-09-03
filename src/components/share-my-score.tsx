"use client";

import React from "react";
import { Twitter, Linkedin, Facebook, MessageCircle, Mail } from "lucide-react";

type ShareMyScoreProps = {
  scorePercent: number; // 0-100
};

const ShareMyScore: React.FC<ShareMyScoreProps> = ({ scorePercent }) => {
  const text = `I just tested my company’s cybersecurity posture with Tanosec Clarity and scored ${scorePercent}/100. What’s your company’s score? Try it here 👉 https://clarity.tanosec.co.za/`;
  const encodedText = encodeURIComponent(text);

  const links = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://clarity.tanosec.co.za/")}&summary=${encodedText}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://clarity.tanosec.co.za/")}&quote=${encodedText}`,
    email: `mailto:?subject=${encodeURIComponent("Check out my Tanosec Clarity Score")}&body=${encodedText}`,
  };

  const baseBtn =
    "inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm transition-colors hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary";

  return (
    <section aria-labelledby="share-score-title" className="no-print">
      <h2 id="share-score-title" className="sr-only">
        Share my score
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <a
          href={links.twitter}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on X"
          className={`${baseBtn}`}
          title="Share on X"
        >
          <Twitter className="h-4 w-4" />
          <span className="sr-only">Share on X</span>
        </a>
        <a
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on LinkedIn"
          className={`${baseBtn}`}
          title="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
          <span className="sr-only">Share on LinkedIn</span>
        </a>
        <a
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
          className={`${baseBtn}`}
          title="Share on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="sr-only">Share on WhatsApp</span>
        </a>
        <a
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
          className={`${baseBtn}`}
          title="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
          <span className="sr-only">Share on Facebook</span>
        </a>
        <a
          href={links.email}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share via Email"
          className={`${baseBtn}`}
          title="Share via Email"
        >
          <Mail className="h-4 w-4" />
          <span className="sr-only">Share via Email</span>
        </a>
      </div>
    </section>
  );
};

export default ShareMyScore;
