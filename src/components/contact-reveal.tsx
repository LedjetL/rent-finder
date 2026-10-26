"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { revealContact } from "@/app/actions/contact";

/**
 * Deliberately a two-step interaction. Hiding the number behind a click is what
 * makes the contact event countable, and it also stops the whole listing corpus
 * being scraped for phone numbers by anyone with curl.
 */
export function ContactReveal({
  listingId,
  signedIn,
  labels,
}: {
  listingId: string;
  signedIn: boolean;
  labels: {
    show: string;
    whatsapp: string;
    login: string;
    note: string;
    loading: string;
  };
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ phone: string; waUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=/listings/${listingId}`}
        className="block min-h-12 w-full bg-cobalt px-[18px] py-[15px] text-center text-[16px] font-semibold text-on-cobalt no-underline hover:bg-cobalt-deep"
      >
        {labels.login}
      </Link>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={result.waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block min-h-12 w-full bg-trust px-[18px] py-[15px] text-center text-[16px] font-semibold text-paper no-underline hover:opacity-90"
        >
          {labels.whatsapp}
        </a>
        <a
          href={`tel:${result.phone}`}
          className="figure block w-full border border-rule px-4 py-2.5 text-center text-[14px] text-ink no-underline"
        >
          {result.phone}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await revealContact(listingId);
            if (r.ok) setResult({ phone: r.phone, waUrl: r.waUrl });
            else setError(r.reason);
          })
        }
        className="min-h-12 w-full cursor-pointer border-0 bg-cobalt px-[18px] py-[15px] text-[16px] font-semibold text-on-cobalt hover:bg-cobalt-deep disabled:opacity-60"
      >
        {pending ? labels.loading : labels.show}
      </button>
      <p className="m-0 text-[12px] leading-snug text-ink-mute">{labels.note}</p>
      {error && <p className="m-0 text-[12px] text-ink-mid">{error}</p>}
    </div>
  );
}
