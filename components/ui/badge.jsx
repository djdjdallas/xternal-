import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-neutral-900 text-white",
    success: "bg-green-100 text-green-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-neutral-300 text-neutral-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
