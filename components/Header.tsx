"use client";
import { useState } from "react";
import type { Site } from "@/lib/content";

export default function Header({ site }: { site: Site }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="hdr">
        <a href="/" className="logo"><img src="/wp-content/uploads/2022/01/logo-1024x252.png" alt="neoffice logo" width={160} height={39} /></a>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><i className={`fas ${open ? "fa-times" : "fa-bars"}`} /></button>
        <nav className={`menu${open ? " open" : ""}`} aria-label="Main">
          <ul>
            {site.nav.map((item) => (
              <li key={item.label} className={item.children ? "has-sub" : ""}>
                <a href={item.href}>{item.label}{item.children && <i className="fas fa-chevron-down caret" />}</a>
                {item.children && (
                  <ul className="sub">{item.children.map((c) => <li key={c.label}><a href={c.href}>{c.label}</a></li>)}</ul>
                )}
              </li>
            ))}
          </ul>
          <div className="hdr-btns">
            <a className="signin" href={site.signInUrl}>Sign in</a>
            <a className="book" href={site.demoUrl}>Book Demo</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
