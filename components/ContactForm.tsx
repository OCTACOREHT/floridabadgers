"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL_STATE: ContactFormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ?? "";

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const onChange =
    (field: keyof ContactFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (recaptchaSiteKey && !recaptchaToken) {
      setErrorMessage("Please complete the reCAPTCHA verification.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          recaptchaToken: recaptchaToken ?? undefined,
        }),
      });

      const result = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setErrorMessage(result.error ?? "Unable to send your message right now. Please try again.");
        return;
      }

      setSuccessMessage(result.message ?? "Your message was delivered successfully. We will get back to you shortly.");
      setForm(INITIAL_STATE);
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } catch {
      setErrorMessage("Unable to send your message right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid sm:grid-cols-2 gap-4" onSubmit={onSubmit}>
      <div className="sm:col-span-1">
        <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={onChange("name")}
          className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
          placeholder="Your full name"
        />
      </div>

      <div className="sm:col-span-1">
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={onChange("email")}
          className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
          placeholder="you@example.com"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="subject" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          value={form.subject}
          onChange={onChange("subject")}
          className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500"
          placeholder="How can we help?"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          value={form.message}
          onChange={onChange("message")}
          className="w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-500 resize-y"
          placeholder="Write your message..."
        />
      </div>

      {successMessage && (
        <p className="sm:col-span-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-200 px-4 py-3" role="status">
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className="sm:col-span-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 px-4 py-3" role="alert">
          {errorMessage}
        </p>
      )}

      {recaptchaSiteKey ? (
        <div className="sm:col-span-2">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            onChange={(token) => setRecaptchaToken(token)}
            onExpired={() => setRecaptchaToken(null)}
            onErrored={() => setRecaptchaToken(null)}
          />
        </div>
      ) : null}

      <div className="sm:col-span-2 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-[#1e3a5f] text-white font-bold uppercase tracking-wider px-7 py-3.5 hover:bg-[#374151] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Message"} <ArrowRight size={15} />
        </button>
      </div>
    </form>
  );
}
