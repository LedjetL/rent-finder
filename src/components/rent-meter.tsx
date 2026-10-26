import type { RentVerdict } from "@/lib/rent-index";
import { formatMoney } from "@/lib/domain";
import type { Lang, T } from "@/lib/i18n";

/**
 * A range indicator, not a chart.
 *
 * The job is one value against a reference distribution, so the form is a bullet:
 * a faint full-range track, a solid interquartile band for "normal", a median tick,
 * and one prominent marker for the reader. No axes, no grid — anything more turns a
 * glanceable answer into homework.
 *
 * Status is never carried by colour alone: the verdict is stated in words above,
 * the marker is labelled "Ti / You", and the direction is written out. That matters
 * for colourblind readers and it matters more on a screenshot.
 */
export function RentMeter({
  v,
  lang,
  t,
}: {
  v: RentVerdict;
  lang: Lang;
  t: T;
}) {
  // Scale to include the reader even when they sit outside the whiskers — clamping
  // the marker to the end of the track would quietly understate how far out they are.
  //
  // Then pad the domain by 8% at each end. Without it, whoever is the highest or
  // lowest value lands exactly on 0% or 100%, and their marker and its label hang
  // off the edge of the track — which is precisely the "you are wildly overpaying"
  // case people screenshot.
  const rawLo = Math.min(v.low, v.yours);
  const rawHi = Math.max(v.high, v.yours);
  const pad = Math.max(1, (rawHi - rawLo) * 0.08);
  const lo = rawLo - pad;
  const hi = rawHi + pad;
  const span = Math.max(1, hi - lo);
  const pct = (value: number) => ((value - lo) / span) * 100;

  const over = v.delta > 0.05;
  const under = v.delta < -0.05;
  const markerColor = over ? "var(--accent)" : under ? "var(--trust)" : "var(--ink)";

  return (
    <figure className="m-0">
      {/* marker label sits above so it never collides with the scale below */}
      <div className="relative h-6">
        <div
          className="absolute -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ left: `${pct(v.yours)}%`, color: markerColor }}
        >
          {t("checkYouLabel")}
        </div>
      </div>

      <div className="relative h-[26px]">
        {/* full range */}
        <div className="absolute inset-x-0 top-[9px] h-2 bg-sunk" />

        {/* the middle half of the market — "normal" */}
        <div
          className="absolute top-[9px] h-2 bg-rule-soft"
          style={{ left: `${pct(v.p25)}%`, width: `${pct(v.p75) - pct(v.p25)}%` }}
        />

        {/* median tick */}
        <div
          className="absolute top-[3px] h-[20px] w-[2px] -translate-x-1/2 bg-ink"
          style={{ left: `${pct(v.median)}%` }}
        />

        {/* the reader — a 2px surface ring keeps it legible where it overlaps the band */}
        <div
          className="absolute top-[4px] h-[18px] w-[18px] -translate-x-1/2 rounded-full"
          style={{
            left: `${pct(v.yours)}%`,
            background: markerColor,
            boxShadow: "0 0 0 3px var(--plaster)",
          }}
        />
      </div>

      <div className="relative mt-1.5 h-9 text-[11px]">
        {/* End labels quote the real extremes, not the padded domain. */}
        <span className="figure absolute left-0 text-ink-mute">
          {formatMoney(rawLo, "EUR", lang)}
        </span>
        <span
          className="absolute -translate-x-1/2 text-center"
          style={{ left: `${pct(v.median)}%` }}
        >
          <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-mute">
            {t("checkMedianLabel")}
          </span>
          <span className="figure block text-ink">{formatMoney(v.median, "EUR", lang)}</span>
        </span>
        <span className="figure absolute right-0 text-ink-mute">
          {formatMoney(rawHi, "EUR", lang)}
        </span>
      </div>
    </figure>
  );
}
