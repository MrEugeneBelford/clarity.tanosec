import { cn } from "@/lib/utils";

const Logo = ({
  className,
  size = "normal",
}: {
  className?: string;
  size?: "normal" | "small";
}) => {
  const sizeClasses = size === "normal" ? "h-16 w-16" : "h-10 w-10";

  return (
    <div className={cn(sizeClasses, className)}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clarity Logo"
      >
        <circle cx="50" cy="50" r="50" fill="hsl(var(--primary))" />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill="hsl(var(--primary-foreground))"
          className="font-headline"
          style={{ fontSize: '32px', fontWeight: 'bold' }}
        >
          Clarity
        </text>
      </svg>
    </div>
  );
};

export default Logo;
