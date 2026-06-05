"use client";

import { useState } from "react";
import { Send, AlertCircle, CheckCircle } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    
    // Simulate API contact post
    setTimeout(() => {
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl">
          Get in <span className="text-gradient">Touch</span>
        </h1>
        <p className="mt-4 text-zinc-400">
          Have issues with proxy settings, feature requests, or business inquiries? Drop us a line.
        </p>
      </div>

      {status === "success" && (
        <div className="glass-panel border-green-500/20 bg-green-500/5 p-4 rounded-xl flex items-center space-x-3 mb-8">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-400">Message sent successfully! We will get back to you shortly.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl space-y-6">
        <div>
          <label className="text-xs text-zinc-400 mb-2 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm"
            required
            disabled={status === "sending"}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-2 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm"
            required
            disabled={status === "sending"}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-2 block">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full glass-input text-white rounded-xl px-4 py-3.5 text-sm"
            required
            disabled={status === "sending"}
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full gradient-btn text-white font-semibold rounded-xl py-4 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span>{status === "sending" ? "Sending..." : "Send Message"}</span>
        </button>
      </form>
    </div>
  );
}
