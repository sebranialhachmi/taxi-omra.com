import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase recovery link puts tokens in URL hash; the client auto-parses them
    // and fires a PASSWORD_RECOVERY event. We just wait for a session to exist.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(locale === "ar" ? "كلمة المرور قصيرة جداً (6 أحرف على الأقل)" : "Password too short (min 6)");
      return;
    }
    if (password !== confirm) {
      toast.error(locale === "ar" ? "كلمتا المرور غير متطابقتين" : "Passwords don't match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success(locale === "ar" ? "تم تحديث كلمة المرور" : "Password updated");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary p-2 shadow">
            <img src={SITE.logo} alt={SITE.brand.en} className="max-h-full max-w-full object-contain" />
          </div>
          <CardTitle className="text-2xl mt-2">
            {locale === "ar" ? "إعادة تعيين كلمة المرور" : "Reset password"}
          </CardTitle>
          <CardDescription>
            {ready
              ? locale === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter your new password"
              : locale === "ar" ? "جارٍ التحقق من الرابط..." : "Verifying reset link..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ready ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{locale === "ar" ? "كلمة المرور الجديدة" : "New password"}</Label>
                <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{locale === "ar" ? "تأكيد كلمة المرور" : "Confirm password"}</Label>
                <Input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button className="w-full" disabled={loading}>
                {locale === "ar" ? "تحديث كلمة المرور" : "Update password"}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {locale === "ar"
                ? "إذا لم يفتح النموذج، افتح الرابط من بريدك مباشرة."
                : "If the form doesn't appear, open the link from your email directly."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
