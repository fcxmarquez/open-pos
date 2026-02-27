import { cn } from "@/lib/utils";

interface SearchBarProps {
  children: React.ReactNode;
  animated?: boolean;
  className?: string;
}

export function SearchBar({ children, animated, className }: SearchBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border-[1.5px] border-foreground bg-white px-4",
        animated && "animate-pulse-ring",
        className
      )}
    >
      {children}
    </div>
  );
}
