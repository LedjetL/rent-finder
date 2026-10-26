import Link from "next/link";
import { getT } from "@/lib/i18n";
import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const { t } = await getT();
  const next = typeof sp.next === "string" ? sp.next : "/";
  const failed = sp.error !== undefined;

  const field = "field !py-[11px] text-[15px]";
  const label = "field-label";

  return (
    <div className="mx-auto max-w-sm pt-16">
      <h1 className="display m-0 text-[32px]">{t("loginTitle")}</h1>

      {failed && (
        <p className="m-0 mt-4 border-l-2 border-ink bg-sunk px-3 py-2 text-[13px]">
          {t("authError")}
        </p>
      )}

      <form action={login} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label className={label} htmlFor="email">{t("email")}</label>
          <input
            id="email" name="email" type="email" required autoComplete="email"
            className={field} defaultValue="demo@rentfinder.al"
          />
        </div>
        <div>
          <label className={label} htmlFor="password">{t("password")}</label>
          <input
            id="password" name="password" type="password" required
            autoComplete="current-password" className={field} defaultValue="password123"
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
        >
          {t("submitLogin")}
        </button>
      </form>

      <p className="mt-4 text-[14px] text-ink-mute">
        {t("noAccount")}{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`}>{t("submitRegister")}</Link>
      </p>

      <p className="mt-6 border-t border-rule pt-3 text-[12px] text-ink-mute">
        Demo: <span className="figure">demo@rentfinder.al</span> /{" "}
        <span className="figure">password123</span>
      </p>
    </div>
  );
}
