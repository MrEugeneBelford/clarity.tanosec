import Link from "next/link";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 md:py-6 z-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Copyright © {new Date().getFullYear()} Tanosec Cybersecurity. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link 
              href="https://tanosec.co.za/privacy-policy-2/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="https://tanosec.co.za/terms-of-use/" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link 
              href="https://www.tanosec.co.za" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanosec Website
            </Link>
            <Link 
              href="https://tanosec.co.za/contact-tanosec/" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
