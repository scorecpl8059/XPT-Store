"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  WsCard,
  WsCardContent,
  WsCardHeader,
  WsCardTitle,
} from "@/components/ui/cyber-card";
import { WsButton } from "@/components/ui/cyber-button";
import { WsInput, WsLabel } from "@/components/ui/cyber-input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { api } from "@/lib/api";
import { CheckCircle, Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) return;
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      setSubmitted(true);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-bold text-ws-text mb-6">{t("contactUs")}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-ws-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ws-text">Email</p>
                  <p className="text-sm text-ws-text-muted">support@xpt-tech.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-ws-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ws-text">Phone</p>
                  <p className="text-sm text-ws-text-muted">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-ws-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-ws-text">Address</p>
                  <p className="text-sm text-ws-text-muted">
                    123 Tech Drive<br />
                    Portland, OR 97201<br />
                    United States
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="md:col-span-2">
              {submitted ? (
                <WsCard>
                  <WsCardContent className="flex flex-col items-center py-12">
                    <CheckCircle className="h-12 w-12 text-ws-green mb-3" />
                    <h2 className="text-lg font-bold text-ws-text mb-1">Message Sent</h2>
                    <p className="text-sm text-ws-text-muted">
                      Thank you for reaching out. We&apos;ll respond within 24 hours.
                    </p>
                  </WsCardContent>
                </WsCard>
              ) : (
                <WsCard>
                  <WsCardContent className="space-y-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <WsLabel>Name</WsLabel>
                        <WsInput
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <WsLabel>Email</WsLabel>
                        <WsInput
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <WsLabel>Subject</WsLabel>
                      <WsInput
                        value={form.subject}
                        onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                      />
                    </div>
                    <div>
                      <WsLabel>Message</WsLabel>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                        rows={5}
                        className="flex w-full rounded-md border border-ws-border bg-white px-3 py-2 text-sm text-ws-text shadow-sm placeholder:text-ws-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ws-blue"
                      />
                    </div>
                    <WsButton
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={submitting || !form.name || !form.email || !form.subject || !form.message}
                    >
                      {submitting ? "Sending..." : tc("submit")}
                    </WsButton>
                  </WsCardContent>
                </WsCard>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
