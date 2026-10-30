"use client";
import React, { useState } from "react";
import { MapPin, Mail, Send } from "lucide-react";
import SectionTitle from "./ui/SectionTitle";

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

  const inputClass =
    "w-full bg-white/[0.03] border border-white/10 px-4 py-3 text-white font-rajdhani text-base placeholder:text-slate-600 focus:outline-none focus:border-white/40 transition-colors";
  const errorClass = "border-red-500/60 focus:border-red-500/80";

  return (
    <section id="contact" className="py-24 bg-black relative overflow-hidden border-t border-white/10">
      {success && (
        <div className="fixed top-6 left-6 z-[100] max-w-sm border border-white/20 bg-black/90 backdrop-blur-sm px-5 py-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <p className="font-rajdhani text-white text-base tracking-wide">
            Your message is sent to the DCITC team
          </p>
        </div>
      )}

      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <SectionTitle title="Get In Touch" subtitle="Reach out to the DCITC team" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              {contacts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4 p-4 border border-white/10 bg-white/[0.02]">
                  <div className="w-10 h-10 flex items-center justify-center border border-white/20 text-slate-300 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-orbitron text-xs tracking-widest text-slate-500 uppercase mb-1">
                      {label}
                    </p>
                    <p className="font-rajdhani text-white text-base tracking-wide break-all">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClass} ${nameError ? errorClass : ""}`}
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-400 font-rajdhani tracking-wide">
                      {nameError}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    name="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} ${emailError ? errorClass : ""}`}
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-400 font-rajdhani tracking-wide">
                      {emailError}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <textarea
                  name="message"
                  placeholder="Your Message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputClass} resize-none ${messageError ? errorClass : ""}`}
                />
                {messageError && (
                  <p className="mt-1 text-sm text-red-400 font-rajdhani tracking-wide">
                    {messageError}
                  </p>
                )}
              </div>
              {formError && (
                <p className="text-sm text-red-400 font-rajdhani tracking-wide">{formError}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="px-6 py-3 bg-white text-black font-orbitron font-bold tracking-wider hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2 -skew-x-10 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="skew-x-10 flex items-center gap-2">
                  {pending ? "SENDING…" : "SEND MESSAGE"}
                  <Send className="w-4 h-4" />
                </span>
              </button>
            </form>
          </div>

          <div className="w-full border border-white/10 overflow-hidden bg-white/[0.02]">
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
          </div>
        </div>
      </div>

      <div className="absolute top-1/4 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />
    </section>
  );
};

export default GetInTouch;