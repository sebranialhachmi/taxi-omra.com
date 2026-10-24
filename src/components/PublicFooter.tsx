import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SITE } from "@/lib/site-info";
import { useContactInfo } from "@/lib/contact-info";

export function PublicFooter() {
  const { locale } = useI18n();
  const { phone, whatsapp, telHref, waHref, commercialRegistration, transportLicense } = useContactInfo();
  const ar = locale === "ar";
  const l = (p: string) => `/${locale}${p}`;
  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="container-tight py-16 grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4 space-y-4">
          <Link to={l("")} className="flex items-center gap-3">
            <img
              src={SITE.logo}
              alt={SITE.brand[locale]}
              className="h-11 w-auto object-contain bg-primary-foreground/95 rounded-md p-1.5"
              width={120}
              height={66}
            />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl">{SITE.brand[locale]}</span>
              <span className="text-[11px] tracking-[0.02em] text-primary-foreground/70" dir="rtl">تاكسي من مطار جدة إلى مكة المكرمة</span>
            </div>
          </Link>
          <p className="text-sm text-primary-foreground/70 max-w-sm leading-relaxed">
            {ar
              ? "خدمة نقل فاخرة تصل بك في الوقت المحدد، بأناقة وثقة — نقل مطار، سفر أعمال، ورحلات خاصة."
              : "A refined chauffeur experience — airport transfers, business travel, and private journeys, delivered with discretion and precision."}
          </p>
          <div className="flex gap-2">
            <a
              href={waHref()}
              target="_blank"
              rel="noopener"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-primary hover:bg-gold-soft transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> {ar ? "احجز الآن" : "Book now"}
            </a>
            <a
              href={telHref}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-primary-foreground/20 px-4 text-sm text-primary-foreground hover:border-gold hover:text-gold transition-colors"
            >
              <Phone className="h-4 w-4" /> {phone}
            </a>
          </div>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-xs uppercase tracking-[0.22em] text-gold mb-4">{ar ? "الخدمات" : "Services"}</h3>
          <ul className="space-y-2.5 text-sm text-primary-foreground/70">
            <li><Link to={l("/p/airport-transfer")} className="hover:text-gold transition">{ar ? "نقل المطار" : "Airport"}</Link></li>
            <li><Link to={l("/p/hotel-transfer")} className="hover:text-gold transition">{ar ? "الفنادق" : "Hotels"}</Link></li>
            <li><Link to={l("/p/corporate")} className="hover:text-gold transition">{ar ? "الشركات" : "Corporate"}</Link></li>
            <li><Link to={l("/fleet")} className="hover:text-gold transition">{ar ? "الأسطول" : "Fleet"}</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h3 className="text-xs uppercase tracking-[0.22em] text-gold mb-4">{ar ? "الشركة" : "Company"}</h3>
          <ul className="space-y-2.5 text-sm text-primary-foreground/70">
            <li><Link to={l("/about")} className="hover:text-gold transition">{ar ? "من نحن" : "About"}</Link></li>
            <li><Link to={l("/blog")} className="hover:text-gold transition">{ar ? "المدونة" : "Journal"}</Link></li>
            <li><Link to={l("/guide/taxi-fares")} className="hover:text-gold transition">{ar ? "دليل الأسعار" : "Fare guide"}</Link></li>
            <li><Link to={l("/taxi-jeddah")} className="hover:text-gold transition">{ar ? "تاكسي جدة" : "Taxi Jeddah"}</Link></li>
            <li><Link to={l("/jeddah-airport-taxi")} className="hover:text-gold transition">{ar ? "تاكسي المطار" : "Airport Taxi"}</Link></li>
            <li><Link to={l("/taxi-makkah")} className="hover:text-gold transition">{ar ? "تاكسي مكة" : "Taxi Makkah"}</Link></li>
            <li><Link to={l("/taxi-madinah")} className="hover:text-gold transition">{ar ? "تاكسي المدينة" : "Taxi Madinah"}</Link></li>
            <li><Link to={l("/taxi-taif")} className="hover:text-gold transition">{ar ? "تاكسي الطائف" : "Taxi Taif"}</Link></li>

          </ul>
        </div>

        <div className="md:col-span-4">
          <h3 className="text-xs uppercase tracking-[0.22em] text-gold mb-4">{ar ? "تواصل" : "Contact"}</h3>
          <ul className="space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-start gap-3"><Phone className="h-4 w-4 mt-0.5 text-gold shrink-0" /><a href={telHref} className="hover:text-gold transition">{phone}</a></li>
            <li className="flex items-start gap-3"><MessageCircle className="h-4 w-4 mt-0.5 text-gold shrink-0" /><a href={waHref()} target="_blank" rel="noopener" className="hover:text-gold transition">WhatsApp — +{whatsapp}</a></li>
            <li className="flex items-start gap-3"><Mail className="h-4 w-4 mt-0.5 text-gold shrink-0" /><a href={`mailto:${SITE.email}`} className="hover:text-gold transition">{SITE.email}</a></li>
            <li className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-gold shrink-0" />{SITE.address[locale]}</li>
            <li className="flex items-start gap-3"><Clock className="h-4 w-4 mt-0.5 text-gold shrink-0" />{SITE.hours[locale]}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container-tight py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-foreground/50">
          <span>© {new Date().getFullYear()} {SITE.brand[locale]}. {ar ? "جميع الحقوق محفوظة." : "All rights reserved."} {ar ? "الرقم الضريبي:" : "VAT No."} {SITE.vatNumber}{commercialRegistration ? ` · ${ar ? "السجل التجاري:" : "CR:"} ${commercialRegistration}` : ""}{transportLicense ? ` · ${ar ? "ترخيص النقل:" : "Transport license:"} ${transportLicense}` : ""}</span>
          <div className="flex items-center gap-4 flex-wrap">
            <Link to={l("/privacy")} className="hover:text-gold transition">{ar ? "الخصوصية" : "Privacy"}</Link>
            <Link to={l("/terms")} className="hover:text-gold transition">{ar ? "الشروط" : "Terms"}</Link>
            <Link to={l("/refund")} className="hover:text-gold transition">{ar ? "الاسترداد" : "Refund"}</Link>
            <Link to={l("/cancellation")} className="hover:text-gold transition">{ar ? "الإلغاء" : "Cancellation"}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
