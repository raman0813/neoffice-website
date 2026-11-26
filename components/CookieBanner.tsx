"use client";
import { useEffect, useState } from "react";

// Records the visitor's choice (accept/decline) so analytics only load after consent.
export default function CookieBanner({ title, text }: { title: string; text: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => { try { if (!localStorage.getItem("cookie-consent")) setShow(true); } catch { setShow(true); } }, []);
  const choose = (v: "accepted" | "declined") => {
    try { localStorage.setItem("cookie-consent", v); } catch {}
    window.dispatchEvent(new CustomEvent("cookie-consent", { detail: v }));
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="cookie" role="dialog" aria-label="Cookie consent">
      <h4>{title}</h4>
      <p dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") }} />
      <div className="cookie-btns">
        <button onClick={() => choose("accepted")}>Accept</button>
        <button className="ghost" onClick={() => choose("declined")}>Decline</button>
        <a href="/privacy-policy/">Read More</a>
      </div>
    </div>
  );
}
