import type { Site } from "@/lib/content";
import LeadForm from "./LeadForm";

export function PreFooter({ site }: { site: Site }) {
  return (
    <>
      <section className="pre-form">
        <div className="pf-inner">
          <h2>Interested in our Solutions</h2>
          <p>Please fill the form below &amp; we will get in touch with you soon.</p>
          <LeadForm name="Interested in our Solutions" button="Send" />
          <p className="consent">NeOffice uses the information you provide to contact you about our products and services. See our <a href="/privacy-policy/">privacy policy</a>.</p>
        </div>
      </section>
      <section className="pre-cta">
        <div className="pc-inner">
          <img src="/wp-content/uploads/2022/08/WhatsApp-Image-2022-08-19-at-5.02.54-PM.jpeg" alt="NeOffice app on phone and laptop" loading="lazy" />
          <div>
            <h4>Get the technology to power your workplace now</h4>
            <div className="pc-btns">
              <a className="btn-red" href={site.calendlyUrl} target="_blank" rel="noopener">Schedule a Free Consultation Meeting</a>
              <a className="btn-line" href={site.demoUrl}>Try For Free</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Footer({ site }: { site: Site }) {
  return (
    <footer className="site-footer">
      <div className="ft">
        <div className="ft-brand">
          <a href="/"><img src="/wp-content/uploads/2022/01/logo-1024x252.png" alt="neoffice logo" width={150} height={37} /></a>
          <div className="iso"><img src="/wp-content/uploads/2022/01/ISO-27001-1024x1024.webp" alt="ISO 27001" width={56} height={56} /><span>{site.isoText}</span></div>
          <div className="apps">
            <a href={site.apps.android} target="_blank" rel="noopener"><i className="fab fa-google-play" /> Google Play</a>
            <a href={site.apps.ios} target="_blank" rel="noopener"><i className="fab fa-apple" /> App Store</a>
          </div>
        </div>
        {site.footer.map((col) => (
          <div className="ft-col" key={col.title}>
            <h5>{col.title}</h5>
            <ul>{col.links.map((l) => <li key={l.label}><a href={l.href}>{l.label}</a></li>)}</ul>
          </div>
        ))}
        <div className="ft-col ft-contact">
          <h5>Contact Us</h5>
          <p>{site.company}</p>
          {site.phones.map((p) => <p key={p}><a href={`tel:${p.replace(/\s/g, "")}`}><i className="fas fa-phone-alt" /> {p}</a></p>)}
          <p><a href={`mailto:${site.email}`}><i className="fas fa-envelope" /> {site.email}</a></p>
          <p><a href={site.mapUrl} target="_blank" rel="noopener"><i className="fas fa-map-marker-alt" /> {site.address}</a></p>
          <div className="social">{site.social.map((s) => <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener"><i className={s.icon} /></a>)}</div>
        </div>
      </div>
      <div className="copy">© {new Date().getFullYear()} NeOffice. All Rights Reserved. A product of {site.company}.</div>
    </footer>
  );
}
