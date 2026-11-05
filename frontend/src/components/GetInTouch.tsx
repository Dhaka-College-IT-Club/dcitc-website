"use client";
import React, { useEffect, useState } from "react";
import { MapPin, Mail, Send, X } from "lucide-react";
import SectionTitle from "./ui/SectionTitle";
import Button from "./ui/Button";
import Card from "./ui/Card";

const CONFIRMATION_MS = 6000;

const GetInTouch: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [messageError, setMessageError] = useState("");

  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // The confirmation clears itself so it cannot sit over the page forever.
  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(false), CONFIRMATION_MS);
    return () => window.clearTimeout(timer);
  }, [success]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let valid = true;
    if (!name.trim()) { setNameError("This field is required"); valid = false; } else setNameError("");
    if (!email.trim()) { setEmailError("This field is required"); valid = false; }
    else if (!validateEmail(email.trim())) { setEmailError("Please enter a valid email address"); valid = false; }
    else setEmailError("");
    if (!message.trim()) { setMessageError("This field is required"); valid = false; } else setMessageError("");

    if (!valid) return;

    setPending(true);
    setFormError("");
    setSuccess(false);
    try {
      const { apiFetch } = await import("@/lib/api");
      await apiFetch("/contact", { method: "POST", body: { name, email, message } });
      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      const e2 = err as { message?: string; fields?: Record<string, string> };
      setFormError(e2?.message || "Failed to send message");
      if (e2?.fields) {
        if (e2.fields.name) setNameError(e2.fields.name);
        if (e2.fields.email) setEmailError(e2.fields.email);
        if (e2.fields.message) setMessageError(e2.fields.message);
      }
    } finally {
      setPending(false);
    }
  };

  const contacts = [
    { icon: MapPin, label: "Address", value: "Dhaka College, Dhaka, Bangladesh" },
    { icon: Mail, label: "Email", value: "dhakacollegeitclubofficial@gmail.com" },
  ];

  const inputClass = "dc-input";

  return (
    <section
      id="contact"
      className="section-seam relative scroll-mt-20 overflow-hidden bg-bg py-16 md:py-24"
    >
      {success && (
        <div
          role="status"
          className="fixed left-6 top-6 z-[100] flex max-w-sm items-start gap-3 border border-accent/40 bg-surface px-5 py-4 shadow-elev-2"
        >
          <p className="type-body-sm text-text">
            Your message is sent to the DCITC team
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            aria-label="Dismiss confirmation"
            className="-mr-1 -mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center text-subtle transition-colors hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div
        aria-hidden="true"
        className="tech-grid pointer-events-none absolute inset-0 opacity-[0.04]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
        <SectionTitle
          eyebrow="Contact"
          title="Get In Touch"
          subtitle="Reach out to the DCITC team"
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              {contacts.map(({ icon: Icon, label, value }) => (
                <Card
                  key={label}
                  padding="p-4"
                  className="flex items-start gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-strong text-accent">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="type-overline mb-1 text-faint">{label}</p>
                    <p className="type-body break-all text-text">{value}</p>
                  </div>
                </Card>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    aria-label="Your name"
                    aria-invalid={nameError ? true : undefined}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClass} `}
                  />
                  {nameError && (
                    <p className="mt-1 type-caption mt-1.5 text-danger">
                      {nameError}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="email"
                    placeholder="Your Email"
                    aria-label="Your email"
                    aria-invalid={emailError ? true : undefined}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} `}
                  />
                  {emailError && (
                    <p className="mt-1 type-caption mt-1.5 text-danger">
                      {emailError}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <textarea
                  name="message"
                  placeholder="Your Message"
                  aria-label="Your message"
                  aria-invalid={messageError ? true : undefined}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputClass} resize-none `}
                />
                {messageError && (
                  <p className="mt-1 type-caption mt-1.5 text-danger">
                    {messageError}
                  </p>
                )}
              </div>
              {formError && (
                <p className="type-caption mt-1.5 text-danger">{formError}</p>
              )}
              <Button type="submit" loading={pending} className="gap-2">
                Send message
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          </div>

          <Card padding="" className="w-full overflow-hidden">
            <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[520px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6441.9394693764025!2d90.38087734965688!3d23.734180404014626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8c8e1ea9fd1%3A0xa6e274882fdbce53!2sDhaka%20College!5e0!3m2!1sen!2sbd!4v1793377737693!5m2!1sen!2sbd"
                width="600"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 w-full h-full"
                title="DCITC Location - Dhaka College"
              />
            </div>
          </Card>
        </div>
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/4 h-32 w-32 rounded-full bg-accent-soft blur-3xl" />
    </section>
  );
};

export default GetInTouch;