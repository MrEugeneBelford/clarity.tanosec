import Image from "next/image";
import { cn } from "@/lib/utils";

const Logo = ({
  className,
  size = "normal",
}: {
  className?: string;
  size?: "normal" | "small";
}) => {
  const sizeClasses = size === "normal" ? { width: 128, height: 128 } : { width: 40, height: 40 };

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
