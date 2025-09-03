import Image from "next/image";
import { cn } from "@/lib/utils";

const Logo = ({
  className,
  size = "normal",
}: {
  className?: string;
  size?: "normal" | "small";
}) => {
  const sizeClasses = size === "normal" ? { width: 160, height: 160 } : { width: 48, height: 48 };

  return (
    <div className={cn("relative", className)} style={{ width: sizeClasses.width, height: sizeClasses.height }}>
      <Image
        src="/icon.png"
        alt="Clarity by Tanosec Logo"
        width={sizeClasses.width}
        height={sizeClasses.height}
        className="object-contain"
      />
    </div>
  );
};

export default Logo;
