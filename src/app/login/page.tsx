
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); // true for Login, false for Register
  const router = useRouter();
  const { login, register } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = isLoginMode 
        ? await login(email, password)
        : await register(email, password);

      if (result.success) {
        router.push("/dashboard"); // Redirect after successful login/registration
      } else {
        setError(result.error ? t(result.error as any) : t('loginPage.error.generic'));
      }
    } catch (err) {
      // This catch is less likely to be hit if AuthContext handles specific Firebase errors
      setError(t('loginPage.error.generic'));
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">
            {isLoginMode ? t('loginPage.titleLogin') : t('loginPage.titleRegister')}
          </CardTitle>
          <CardDescription>
            {isLoginMode ? t('loginPage.descriptionLogin') : t('loginPage.descriptionRegister')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('loginPage.emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('loginPage.passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full text-lg py-3" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
               (isLoginMode ? t('loginPage.loginButton') : t('loginPage.registerButton'))}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLoginMode ? t('loginPage.noAccount') : t('loginPage.hasAccount')}{' '}
            <Button variant="link" onClick={() => { setIsLoginMode(!isLoginMode); setError(null); }} className="p-0 h-auto">
              {isLoginMode ? t('loginPage.registerLink') : t('loginPage.loginLink')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
