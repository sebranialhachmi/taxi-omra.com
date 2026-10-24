import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Languages } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { t, locale, setLocale } = useI18n();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(locale === "ar" ? "تم إرسال رابط إعادة التعيين إلى بريدك" : "Reset link sent to your email");
    setTab("signin");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    await refresh();
    toast.success(locale === "ar" ? "تم تسجيل الدخول" : "Signed in");
    navigate({ to: "/admin/dashboard" });
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <div className="absolute top-4 end-4">
        <Button variant="ghost" size="sm" onClick={() => setLocale(locale === "ar" ? "en" : "ar")}>
          <Languages className="h-4 w-4 me-1" /> {t("toggle_lang")}
        </Button>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary p-2 shadow">
            <img src={SITE.logo} alt={SITE.brand.en} className="max-h-full max-w-full object-contain" />
          </div>
          <CardTitle className="text-2xl mt-2">{t("brand")}</CardTitle>
          <CardDescription>{t("auth_subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="signin">{t("signin")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>{t("email")}</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("password")}</Label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" disabled={loading}>{t("signin")}</Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  onClick={() => setTab("forgot")}
                >
                  {locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </button>
              </form>
            </TabsContent>
            <TabsContent value="forgot">
              <form onSubmit={handleForgot} className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور."
                    : "Enter your email and we'll send you a link to reset your password."}
                </p>
                <div className="space-y-2">
                  <Label>{t("email")}</Label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <Button className="w-full" disabled={loading}>
                  {locale === "ar" ? "إرسال الرابط" : "Send reset link"}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                  onClick={() => setTab("signin")}
                >
                  {locale === "ar" ? "العودة لتسجيل الدخول" : "Back to sign in"}
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
