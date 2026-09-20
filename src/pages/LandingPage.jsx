import { FacilitySearch } from "@/components/search/FacilitySearch";
import { useTitle } from "@/lib/useTitle";

export default function LandingPage() {
  useTitle("Share your experience");

  return <>
    <section className="home-hero wide-container">
      <div className="hero-copy">
        <p className="eyebrow"><span className="status-dot" /> PATIENT VOICES · LAGOS</p>
        <h1>Your truth<br />Keeps the next<br /><em>person alive</em></h1>
        <p className="hero-intro">Been to a hospital or clinic in Lagos? Share what the care was really like. Help the next person know what to expect.</p>
        <a className="hero-cta" href="#find-facility">Share my experience <span aria-hidden="true">↗</span></a>
        <p className="hero-reassurance"><span aria-hidden="true">✓</span> Choose to appear anonymously before you submit.</p>
      </div>
      <CareIllustration />
    </section>
    <section id="find-facility" className="search-section wide-container" aria-labelledby="search-heading">
      <div className="search-intro"><p className="eyebrow">LET’S START WITH YOUR VISIT</p><h2 id="search-heading">Where did you <br />receive care?</h2><p>Find the hospital or clinic you visited, then select it to start your review.</p><span className="search-arrow" aria-hidden="true">↳</span></div>
      <div className="search-panel"><FacilitySearch /></div>
    </section>
    <section id="how-it-works" className="how-section wide-container" aria-labelledby="how-heading">
      <div className="section-heading"><p className="eyebrow">A LITTLE OF YOUR TIME. A LOT OF DIFFERENCE.</p><h2 id="how-heading">Your voice has a place here.</h2><p>A good visit, a difficult one, or somewhere in between. We want to hear it.</p></div>
      <div className="steps-grid">{[
        ["01", "Find your facility", "Search by hospital name or area. Check the location so your experience reaches the right place."],
        ["02", "Tell us how it went", "Answer guided questions about your visit, from the waiting time to how the staff treated you."],
        ["03", "Choose how you appear", "Review your answers and choose your name display, including Anonymous, before sending."],
      ].map(([number, title, body]) => <article className="how-step" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
    </section>
    <section className="voice-section"><div className="wide-container voice-inner"><div className="voice-symbol" aria-hidden="true">“</div><div><p className="eyebrow">FOR THE PERSON CHOOSING CARE NEXT</p><h2>The things you noticed<br />could make all the difference.</h2><p>Was someone there to listen? Were the costs explained? Did you leave knowing what comes next? These everyday details help people make more informed choices.</p><a href="#find-facility" className="text-link">Help someone with your experience <span aria-hidden="true">↗</span></a></div></div></section>
    <section className="faq-section wide-container" aria-labelledby="faq-heading"><div><p className="eyebrow">BEFORE YOU BEGIN</p><h2 id="faq-heading">A little reassurance.</h2></div><div className="faq-list">{[
      ["Will my name be shown?", "You decide before submitting: your full name, first name with last initial, or Anonymous. We still ask for your name to start the review; choosing Anonymous controls how it appears publicly."],
      ["Do I have to leave a positive review?", "No. Share your honest experience, whether it was positive, negative, or mixed. Focus on what happened during your visit and avoid sharing someone else’s personal details."],
      ["What happens after I submit?", "The Zoeverse team checks reviews before they appear on the site. Your review will not be published immediately."],
      ["What if my hospital isn’t listed?", "Use the option below the search to suggest a facility and continue through the guided process."],
    ].map(([q, a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>
  </>;
}

function CareIllustration() {
  return <div className="care-scene" aria-hidden="true"><div className="scene-orbit" /><span className="scene-caption">CARE CONNECTS US.</span>
    <svg viewBox="0 0 460 360" className="care-building" fill="none"><path d="M40 300H420" stroke="#bfd4c7" strokeWidth="2" /><path d="M105 300V146L230 80L355 146V300" fill="#f9f6eb" /><path d="M230 80L355 146V300H230V80Z" fill="#e1e9df" /><path d="M90 146L230 69L370 146" stroke="#153f3b" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" /><rect x="188" y="210" width="84" height="90" rx="42" fill="#153f3b" /><path d="M230 224V300" stroke="#90b7a3" strokeWidth="2" /><path d="M217 133H243M230 120V146" stroke="#d97051" strokeWidth="12" strokeLinecap="round" />{[130,292].map(x => <g key={x}><rect x={x} y="178" width="36" height="45" rx="8" fill="#aacabc" /><path d={`M${x+18} 178V223M${x} 200H${x+36}`} stroke="#f9f6eb" strokeWidth="3" /></g>)}<path d="M66 299V238M393 299V225" stroke="#153f3b" strokeWidth="5" /><ellipse cx="66" cy="218" rx="24" ry="39" fill="#779e81" /><ellipse cx="393" cy="207" rx="26" ry="44" fill="#779e81" /><path d="M207 300L176 350H294L252 300" fill="#e9cdb8" /><circle cx="126" cy="269" r="12" fill="#d97051" /><path d="M107 300C107 277 145 277 145 300" fill="#d97051" /><circle cx="328" cy="269" r="12" fill="#153f3b" /><path d="M309 300C309 277 347 277 347 300" fill="#153f3b" /></svg>
    <div className="scene-note note-one"><span>♡</span> Better care starts<br />with being heard.</div><div className="scene-note note-two"><i /> Your experience matters.</div><div className="scene-stamp">REAL VOICES.<br /><strong>Better choices.</strong></div>
  </div>;
}
