"use client";
import { useState } from "react";

type Field = { name: string; type: string; label?: string; placeholder?: string; required?: boolean; options?: string[]; width?: string };

export default function LeadForm({ fields, button, name }: { fields?: Field[]; button?: string; name?: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const list: Field[] = fields?.length ? fields : [
    { name: "name", type: "text", placeholder: "Name", required: true },
    { name: "email", type: "email", placeholder: "Official Email", required: true },
    { name: "phone", type: "tel", placeholder: "Contact Number" },
    { name: "message", type: "textarea", placeholder: "Message" },
  ];
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/lead/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ form: name, page: location.pathname, ...data }) });
      if (!r.ok) throw new Error();
      setState("done");
      location.href = "/thank-you/";
    } catch { setState("error"); }
  }
  return (
    <form className="lead-form" onSubmit={submit}>
      {list.map((f) => {
        if (f.type === "html" || f.type === "hidden" || f.type === "step") return null;
        const id = `f-${name || "form"}-${f.name}`.replace(/\W+/g, "-");
        const label = f.label || f.placeholder || f.name;
        const common = { id, name: f.label || f.placeholder || f.name, required: f.required, placeholder: f.placeholder || undefined };
        const w = f.width && f.width !== "100" ? { width: `calc(${f.width}% - 10px)` } : undefined;
        return (
          <div className={`ff ff-${f.type}`} key={f.name} style={w}>
            {f.label ? <label htmlFor={id}>{f.label}</label> : <label htmlFor={id} className="sr-only">{label}</label>}
            {f.type === "textarea" ? <textarea {...common} rows={4} /> :
              f.type === "select" ? <select {...common}>{f.options?.map((o) => <option key={o}>{o}</option>)}</select> :
              f.type === "radio" || f.type === "checkbox" ? (
                <div className="choices">{(f.options?.length ? f.options : [label]).map((o) => (
                  <label key={o}><input type={f.type} name={common.name} value={o} required={f.type === "radio" ? f.required : undefined} /> {o}</label>
                ))}</div>
              ) : f.type === "acceptance" ? <label><input type="checkbox" name={common.name} required={f.required} /> {label}</label> :
              <input type={["email", "tel", "number", "url", "date"].includes(f.type) ? f.type : "text"} {...common} />}
          </div>
        );
      })}
      <div className="ff ff-submit"><button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : button || "Send"}</button></div>
      {state === "error" && <p className="form-error">Sorry, that didn&apos;t go through. Please email <a href="mailto:sales@neoffice.ai">sales@neoffice.ai</a>.</p>}
    </form>
  );
}
