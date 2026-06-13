"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";

const TOPICS = [
  { value: "sales", label: "Sales & demos" },
  { value: "help", label: "Help & support" },
  { value: "feedback", label: "Feedback / idea" },
  { value: "other", label: "Something else" },
];

type Status = "idle" | "sending" | "sent" | "error";

const fieldCls =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-mute-soft focus:outline-none focus:ring-2 focus:ring-accent-soft-hover focus:border-accent transition-all duration-150";
const labelCls =
  "block font-mono-ui text-[11px] uppercase tracking-[0.18em] text-mute mb-2";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "sales",
    message: "",
    company: "", // honeypot — kept empty by humans
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setError("Network error — check your connection and try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-paper-elevated p-8 shadow-soft">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Check className="h-5 w-5" />
        </div>
        <h3 className="mt-5 font-display text-2xl text-ink tracking-[-0.01em]">
          Message sent.
        </h3>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          Thanks, {form.name.split(" ")[0] || "there"} — it landed in our inbox.
          A real person will reply, usually within a few hours (Mon–Fri).
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-line bg-paper-elevated p-7 md:p-8 shadow-soft"
      noValidate
    >
      {/* Honeypot — visually hidden, off-screen, not announced. */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={form.company}
          onChange={(e) => update("company", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Maya Chen"
            className={fieldCls}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@studio.com"
            className={fieldCls}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="topic" className={labelCls}>
          What&rsquo;s this about?
        </label>
        <select
          id="topic"
          value={form.topic}
          onChange={(e) => update("topic", e.target.value)}
          className={`${fieldCls} appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a8781' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          }}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label htmlFor="message" className={labelCls}>
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Tell us what you're working on, what you need, or what's on your mind."
          className={`${fieldCls} resize-y min-h-[120px]`}
        />
      </div>

      {error && (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-accent group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === "sending" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send message
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </>
          )}
        </button>
        <span className="font-mono-ui text-[11px] text-mute-soft">
          Goes straight to a human.
        </span>
      </div>
    </form>
  );
}
