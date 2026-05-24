"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { DEMO_CREDENTIALS } from "@/lib/demo";

export function DemoSignInClient() {
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function autoSignIn() {
      try {
        const result = await signIn("credentials", {
          username: DEMO_CREDENTIALS.username,
          password: DEMO_CREDENTIALS.password,
          redirect: false,
        });
        if (result?.ok) {
          router.replace("/ventas");
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    }
    autoSignIn();
  }, [router]);

  if (error) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <p className="text-sm text-destructive">
          Error al cargar la vista previa. Verifica la configuración del servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <span className="text-sm text-muted-foreground">Cargando vista previa...</span>
    </div>
  );
}
