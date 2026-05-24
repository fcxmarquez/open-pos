import { Store } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { STORE_NAME } from "@/lib/constants/store";
import { SubmitButton } from "@/components/pos/login/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAuthBypassEnabled } from "@/lib/auth/bypass";
import { getDefaultRouteForRole } from "@/lib/auth/roles";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Tu cuenta no tiene acceso a este sistema. Contacta al administrador.",
  OAuthAccountNotLinked:
    "Este correo ya esta asociado a otro metodo de inicio de sesion.",
  Configuration: "Error de configuracion del servidor. Contacta al administrador.",
  CredentialsSignin: "Credenciales incorrectas. Intenta de nuevo.",
  Default: "Ocurrio un error al iniciar sesion. Intenta de nuevo.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) {
    redirect(getDefaultRouteForRole(session.user?.role));
  }

  const params = await searchParams;
  const errorCode = params.error;
  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default)
    : null;

  const isTestingMode = isAuthBypassEnabled();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">{STORE_NAME}</CardTitle>
          <CardDescription>Inicia sesion para acceder al punto de venta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {isTestingMode ? (
            <form
              action={async (formData: FormData) => {
                "use server";
                try {
                  await signIn("credentials", {
                    username: formData.get("username"),
                    password: formData.get("password"),
                    redirectTo: "/",
                  });
                } catch (error) {
                  if (error instanceof AuthError) {
                    redirect(`/login?error=${error.type}`);
                  }
                  throw error;
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <Label htmlFor="username">Usuario</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  placeholder="usuario"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
              <SubmitButton className="w-full">Iniciar sesion</SubmitButton>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <SubmitButton variant="outline" size="lg" className="w-full gap-3">
                <GoogleIcon />
                Continuar con Google
              </SubmitButton>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
