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
        aria-label="Tanosec Logo"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.1321 0.330078H89.2921C95.2121 0.330078 100.002 5.12008 100.002 11.0401V33.2001C100.002 39.1201 95.2121 43.9101 89.2921 43.9101H65.8021V66.8101C65.8021 72.7301 61.0121 77.5201 55.0921 77.5201H44.9021C38.9821 77.5201 34.1921 72.7301 34.1921 66.8101V11.0401C34.1921 5.12008 29.4021 0.330078 23.4821 0.330078H19.1321V0.330078Z"
          transform="translate(0, 11.23)"
          fill="hsl(var(--primary))"
        />
        <path
          d="M44.6932 77.5201L10.3432 99.6701L34.1932 66.8101C34.1932 72.7301 38.9832 77.5201 44.9032 77.5201H44.6932Z"
          fill="hsl(var(--accent))"
        />
      </svg>
    </div>
  );
};

export default Logo;
