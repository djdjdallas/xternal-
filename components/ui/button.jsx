import { cn } from "@/lib/utils";

export function Button({ className, variant = "default", size = "default", ...props }) {
  const variants = {
    default: "bg-neutral-900 text-white hover:bg-neutral-800",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-neutral-300 bg-white hover:bg-neutral-50",
    ghost: "hover:bg-neutral-100",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-12 px-6",
    icon: "h-10 w-10",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
