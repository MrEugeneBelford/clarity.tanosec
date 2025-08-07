import { cn } from "@/lib/utils";
import { ShieldCheck } from 'lucide-react';

const Logo = ({
  className,
  size = "normal",
}: {
  className?: string;
  size?: "normal" | "small";
}) => {
  const sizeClasses = size === "normal" ? "h-24 w-24" : "h-10 w-10";
  const iconSize = size === "normal" ? 96 : 40;

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-primary", sizeClasses, className)}>
      <ShieldCheck className="text-primary-foreground" style={{ width: iconSize * 0.6, height: iconSize * 0.6 }} />
    </div>
  );
};

export default Logo;
