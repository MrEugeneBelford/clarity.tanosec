import { cn } from "@/lib/utils";

const Logo = ({
  className,
  size = "normal",
}: {
  className?: string;
  size?: "normal" | "small";
}) => {
  const sizeClasses = size === "normal" ? "h-32 w-32" : "h-10 w-10";
  const textSize = size === "normal" ? "text-2xl font-bold tracking-wider" : "text-xs font-bold";

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-primary", sizeClasses, className)}>
      <span className={cn("text-primary-foreground", textSize)}>CLARITY</span>
    </div>
  );
};

export default Logo;
