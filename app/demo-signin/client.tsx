"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export function DemoSignInClient() {
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    signIn("credentials", {
      username: "demo",
      password: "demo",
      redirect: false,
    }).then((result) => {
      if (result?.ok) {
        router.replace("/ventas");
      } else {
        setError(true);
      }
    });
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
