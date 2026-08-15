import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KaliganAI — Hire AI Employees for Sales & Support" },
      {
        name: "description",
        content:
          "Meet Maya, Dexter and the KaliganAI team — AI employees that chat with visitors, qualify leads and take voice calls for your business.",
      },
      { property: "og:title", content: "KaliganAI — Hire AI Employees" },
      {
        property: "og:description",
        content:
          "AI employees that chat with visitors, qualify leads and take voice calls for your business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type EmpId = "maya" | "dexter" | "milli" | "penn" | "vizzy";

const AV_TINT: Record<EmpId, string> = {
  maya: "#FDE9F2",
  dexter: "#F1ECFE",
  milli: "#E8F1FE",
  penn: "#E3FBF6",
  vizzy: "#FFF1DE",
};

const EMPLOYEES: { id: EmpId; name: string; role: string; soon?: boolean }[] = [
  { id: "maya", name: "Maya", role: "Sales" },
  { id: "dexter", name: "Dexter", role: "Local Services" },
  { id: "milli", name: "Milli", role: "Marketing Agency", soon: true },
  { id: "penn", name: "Penn", role: "Creative Copywriter", soon: true },
  { id: "vizzy", name: "Vizzy", role: "Executive Assistant", soon: true },
];

const SCRIPTS: Record<string, { role: string; active: string; greeting: string }> = {
  maya: {
    role: "Sales",
    active: "Sales & Growth",
    greeting:
      "Hi! I'm Maya, your Sales Assistant. I help turn website visitors into qualified leads. Want to see how I score leads or try a voice call?",
  },
  dexter: {
    role: "Local Services",
    active: "Bookings & Support",
    greeting:
      "Hey, I'm Dexter — I help local service businesses manage bookings and customer questions. Full interactive demo for me is warming up, but feel free to look around!",
  },
};

const SUGGESTED = ["How does lead capture work?", "Can we make voice calls?"];

function Avatar({ id, className = "avatar" }: { id: EmpId; className?: string }) {
  return (
    <div className={className}>
      <div className="avatar-inner" style={{ background: AV_TINT[id] }}>
        <img src={`/avatars/${id}.png`} alt={id} />
      </div>
    </div>
  );
}

function timeNow() {
  const d = new Date();
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m} ${d.getHours() >= 12 ? "PM" : "AM"}`;
}

function getReply(id: string, text: string) {
  const lower = text.toLowerCase();
  if (id === "maya") {
    if (lower.includes("replace") || lower.includes("oversized") || lower.includes("shirt")) {
      return "Yes, sir. We do offer replacements for eligible purchases. If the T-shirt is unused and within our replacement period, I can help you with the next steps. I can also assist you with the replacement process over a quick call.";
    }
    if (lower.includes("call") || lower.includes("voice")) {
      return "Of course — tap the Call button above whenever you're ready, and I'll walk you through it live.";
    }
    if (lower.includes("lead") || lower.includes("capture")) {
      return "I qualify every visitor who chats in, score their intent, and hand off the hot ones straight to your sales team — no manual sorting needed.";
    }
    return "Got it — thanks for sharing that. Let me know if you'd like me to look into it further, or we can jump on a quick voice call.";
  }
  return "Thanks for the message — this part of Dexter's flow is still being wired up, but the sales flow with Maya is fully live!";
}

type Msg = { who: EmpId; side: "ai" | "user"; text: string; time: string };
type CallStage = "idle" | "incoming" | "declined" | "connecting" | "live";

function Index() {
  const [booting, setBooting] = useState(true);
  const [bootHide, setBootHide] = useState(false);
  const [selected, setSelected] = useState<EmpId | null>("maya");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [callStage, setCallStage] = useState<CallStage>("idle");
  const [transcriptReady, setTranscriptReady] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    const a = setTimeout(() => setBootHide(true), 1500);
    const b = setTimeout(() => setBooting(false), 2060);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, typing, connecting]);

  const greet = (id: EmpId, withConnect: boolean) => {
    const script = SCRIPTS[id];
    if (!script) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMessages([]);
    setTyping(false);
    setConnecting(withConnect);
    later(
      () => {
        setConnecting(false);
        setTyping(true);
        later(() => {
          setTyping(false);
          setMessages([
            { who: id, side: "ai", text: script.greeting, time: timeNow() },
          ]);
        }, 1500);
      },
      withConnect ? 1100 : 400,
    );
  };

  useEffect(() => {
    if (selected) greet(selected, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectEmployee = (id: EmpId) => {
    if (selected === id || !SCRIPTS[id]) return;
    setSelected(id);
    greet(id, true);
  };

  const send = (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text || !selected) return;
    const id = selected;
    setMessages((m) => [...m, { who: id, side: "user", text, time: timeNow() }]);
    setDraft("");
    later(() => {
      setTyping(true);
      later(() => {
        setTyping(false);
        setMessages((m) => [
          ...m,
          { who: id, side: "ai", text: getReply(id, text), time: timeNow() },
        ]);
      }, 2000);
    }, 500);
  };

  const acceptCall = () => {
    setCallStage("connecting");
    later(() => {
      setCallStage("live");
      setTranscriptReady(false);
      later(() => setTranscriptReady(true), 1400);
    }, 1900);
  };

  const declineCall = () => {
    setCallStage("declined");
    later(() => setCallStage("idle"), 1800);
  };

  const endCall = () => {
    setCallStage("idle");
    setTranscriptReady(false);
  };

  const s = selected ? SCRIPTS[selected] : null;
  const blurred = callStage === "connecting" || callStage === "live";

  return (
    <>
      {booting && (
        <div className={`kg-boot${bootHide ? " hide" : ""}`}>
          <div className="boot-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2 15 9l7 1-5.2 5 1.3 7-6.1-3.4L5.9 22l1.3-7L2 10l7-1 3-7z" />
            </svg>
          </div>
          <div className="boot-text">Loading AI employees…</div>
        </div>
      )}

      <main className="kg">
        <div className="app-frame">
          <div className="browser-bar">
            <div className="traffic-lights">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="address-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              maya-website.com
            </div>
            <div className="browser-bar-spacer" />
          </div>

          <div className={`dashboard${blurred ? " blurred" : ""}`}>
            <div className="sidebar">
              <div className="sidebar-title">AI EMPLOYEES</div>
              {EMPLOYEES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className={`employee-card${e.soon ? " disabled" : ""}${
                    selected === e.id ? " selected" : ""
                  }`}
                  onClick={() => !e.soon && selectEmployee(e.id)}
                >
                  <Avatar id={e.id} />
                  <div className="emp-meta">
                    <div className="emp-name">
                      {e.name}
                      {e.soon && <span className="soon-badge">SOON</span>}
                    </div>
                    <div className="emp-role">{e.role}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="main-panel">
              <div className="chat-card">
                {!selected || !s ? (
                  <div className="empty-state">
                    <div className="bubbles">
                      <svg
                        width="60"
                        height="46"
                        viewBox="0 0 60 46"
                        fill="none"
                        style={{ left: 0, top: 6 }}
                      >
                        <rect width="60" height="40" rx="14" fill="#D9DCE8" />
                      </svg>
                      <svg
                        width="40"
                        height="34"
                        viewBox="0 0 40 34"
                        fill="none"
                        style={{ left: 44, top: 22 }}
                      >
                        <rect width="40" height="28" rx="12" fill="#E8EAF2" />
                      </svg>
                    </div>
                    <h3>Select an AI employee</h3>
                    <p>to start conversation</p>
                  </div>
                ) : (
                  <>
                    <div className="chat-header">
                      <div className="chat-header-top">
                        <Avatar id={selected} className="chat-header-avatar" />
                        <div>
                          <div className="chat-header-name">
                            {selected.charAt(0).toUpperCase() + selected.slice(1)}
                          </div>
                          <div className="chat-header-status">
                            <span className="status-dot" />
                            <span>Online</span>
                          </div>
                        </div>
                        <div className="chat-header-right">
                          <div className="role-pill">
                            <span>Scan</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="chat-subbar">
                      <span className="status-dot" />
                      <span className="active-label">Active:</span>
                      <span className="active-value">{s.active}</span>
                      <div className="chat-subbar-right">
                        <button
                          className="call-btn"
                          onClick={() => selected === "maya" && setCallStage("incoming")}
                        >
                          Call
                        </button>
                        <button className="reset-btn" onClick={() => greet(selected, false)}>
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="chat-messages" ref={scroller}>
                      {connecting && (
                        <div className="load-row">
                          <div className="spinner small" />
                          <span>
                            Connecting to{" "}
                            {selected.charAt(0).toUpperCase() + selected.slice(1)}…
                          </span>
                        </div>
                      )}
                      {messages.map((m, i) => (
                        <div key={i} className={`msg-row ${m.side === "ai" ? "maya" : "user"}`}>
                          {m.side === "ai" && (
                            <div className="msg-sender">
                              {m.who.charAt(0).toUpperCase() + m.who.slice(1)}
                            </div>
                          )}
                          <div className="bubble">
                            {m.text}
                            {m.side === "user" && <div className="msg-time">{m.time}</div>}
                          </div>
                        </div>
                      ))}
                      {typing && (
                        <div className="typing-row">
                          <Avatar id={selected} className="msg-avatar" />
                          <div className="typing-dots">
                            <span />
                            <span />
                            <span />
                          </div>
                        </div>
                      )}
                    </div>

                    {messages.length <= 1 && !typing && !connecting && (
                      <div className="suggested">
                        <div className="suggested-title">SUGGESTED QUESTIONS</div>
                        {SUGGESTED.map((q) => (
                          <button key={q} className="suggested-btn" onClick={() => send(q)}>
                            {q}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="chat-input-bar">
                      <div className="input-wrap">
                        <input
                          type="text"
                          value={draft}
                          placeholder="Type a message..."
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && send()}
                        />
                      </div>
                      <button className="send-btn" onClick={() => send()} disabled={!draft.trim()}>
                        Send
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className={`kg-call-layer${callStage !== "idle" ? " active" : ""}`}>
        <div className="stack">
          {callStage === "incoming" && (
            <div className="incoming-card">
              <Avatar id="maya" className="msg-avatar" />
              <div className="incoming-center">
                <div className="incoming-name">Maya</div>
                <div className="incoming-role">Sales</div>
                <div className="incoming-number">+91 98765 43210</div>
              </div>
              <div className="incoming-actions">
                <button className="circle-btn accept" onClick={acceptCall} aria-label="Accept call">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" />
                  </svg>
                </button>
                <button
                  className="circle-btn decline"
                  onClick={declineCall}
                  aria-label="Decline call"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {callStage === "declined" && <div className="toast">Call declined</div>}

          {callStage === "connecting" && (
            <div className="connecting-loader">
              <div className="spinner" />
              <span>Connecting to Maya…</span>
            </div>
          )}

          {callStage === "live" && (
            <>
              <div className="active-pill">
                <div className="pill-avatar">
                  <Avatar id="maya" className="msg-avatar" />
                  <div className="pulse-ring" />
                </div>
                <div className="pill-text">
                  <span className="pill-name">Maya</span>
                  <span className="pill-sub">+91 98765 43210</span>
                </div>
                <div className="pill-status">
                  <span className="dot-blink" />
                  Connected
                </div>
                <button className="pill-end" onClick={endCall}>
                  End
                </button>
              </div>

              <div className="live-panel">
                <div className="live-panel-head">
                  <h4>Maya — Live Call</h4>
                  <div className="live-badge">
                    <span className="dot-blink" />
                    LIVE
                  </div>
                </div>
                {!transcriptReady ? (
                  <div className="panel-loading">
                    <div className="spinner small" />
                    <span>Pulling up conversation context…</span>
                  </div>
                ) : (
                  <>
                    <div className="live-transcript">
                      {[
                        "Hi sir, I understand you were looking for a replacement for the oversized T-shirt.",
                        "As per your request, we've processed the replacement. Please visit the store and show your order details to claim the replacement.",
                      ].map((t, i) => (
                        <div
                          key={i}
                          className="live-line"
                          style={{ animationDelay: `${i * 950}ms` }}
                        >
                          <div className="speaker">Maya</div>
                          <div className="text">{t}</div>
                        </div>
                      ))}
                    </div>
                    <div className="live-tags">
                      {[
                        "Customer request detected",
                        "Replacement processed",
                        "Store visit required",
                      ].map((b, i) => (
                        <span
                          key={b}
                          className={`live-tag${i < 2 ? " done" : ""}`}
                          style={{ animationDelay: `${2100 + i * 500}ms` }}
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
