"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface SubmitButtonProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline-solid" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function SubmitButton({
  children,
  variant = "default",
  size = "default",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
    >
      {pending ? (
        <>
          <Spinner className="mr-2" />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
