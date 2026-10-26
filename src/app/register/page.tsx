import Link from "next/link";
import { getT } from "@/lib/i18n";
import { register } from "@/app/actions/auth";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { lang, t } = await getT();
  const next = typeof sp.next === "string" ? sp.next : "/";
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const field = "field !py-[11px] text-[15px]";
  const label = "field-label";

  return (
    <div className="mx-auto max-w-sm pt-16">
      <h1 className="display m-0 text-[32px]">{t("registerTitle")}</h1>

      {error && (
        <p className="m-0 mt-4 border-l-2 border-ink bg-sunk px-3 py-2 text-[13px]">
          {error === "taken" ? t("emailTaken") : t("required")}
        </p>
      )}

      <form action={register} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className={label} htmlFor="name">{t("name")}</label>
          <input id="name" name="name" required className={field} autoComplete="name" />
        </div>
        <div>
          <label className={label} htmlFor="phone">{t("phone")}</label>
          <input
            id="phone" name="phone" required className={field}
            autoComplete="tel" placeholder="069 123 4567" inputMode="tel"
          />
          <p className="mt-1 text-[11px] text-ink-mute">
            {lang === "sq"
              ? "Numri nuk shfaqet publikisht. Përdoret vetëm për të kontaktuar."
              : "Your number is never shown publicly. It is only used for contact."}
          </p>
        </div>
        <div>
          <label className={label} htmlFor="email">{t("email")}</label>
          <input id="email" name="email" type="email" required className={field} autoComplete="email" />
        </div>
        <div>
          <label className={label} htmlFor="password">{t("password")}</label>
          <input
            id="password" name="password" type="password" required minLength={8}
            className={field} autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
        >
          {t("submitRegister")}
        </button>
      </form>

      <p className="mt-4 text-[14px] text-ink-mute">
        {t("haveAccount")}{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`}>{t("submitLogin")}</Link>
      </p>
    </div>
  );
}
