"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LockKeyhole, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-brand-inner">
          <div className="logo-lockup light">
            <span className="logo-symbol">
              <Zap size={22} strokeWidth={2.5} />
            </span>
            <span>
              <strong>South Current</strong>
              <small>OPERATIONS</small>
            </span>
          </div>
          <div className="login-copy">
            <p className="eyebrow light-text">FIELD TO OFFICE, CONNECTED</p>
            <h1>Keep every job moving and every hour accounted for.</h1>
            <p>
              One workspace for customers, crews, schedules, job progress, and
              approved time.
            </p>
          </div>
          <p className="login-foot">South Current Electric Inc. · Rosenort, Manitoba</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="mobile-login-logo">
            <span className="logo-symbol">
              <Zap size={20} />
            </span>
            <strong>South Current Ops</strong>
          </div>
          <div className="login-icon">
            <LockKeyhole size={24} />
          </div>
          <p className="eyebrow">SECURE TEAM ACCESS</p>
          <h2>Welcome back</h2>
          <p className="muted">Sign in with your South Current work account.</p>
          <label>
            Work email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button full-button" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </section>
    </main>
  );
}
