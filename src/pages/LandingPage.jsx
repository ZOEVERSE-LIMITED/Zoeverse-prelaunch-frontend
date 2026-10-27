import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { capturePatientJourney, patientReturnUrl } from "@/lib/patientJourney";
import { FacilitySearch } from "@/components/search/FacilitySearch";
import { useTitle } from "@/lib/useTitle";

export default function LandingPage() {
  useTitle("Share your experience");
  const [params] = useSearchParams();
  useEffect(() => { capturePatientJourney(params.toString()); }, [params]);

  return <>
    <section className="review-cinema-hero">
      <div className="home-hero wide-container"><div className="hero-copy">
        <p className="eyebrow">REAL PEOPLE. REAL PERSPECTIVE.</p>
        <h1>Your experience.<br /><span>A clearer choice.</span></h1>
        <p className="hero-intro">The things you noticed can help the next person know what to expect. Share your hospital or clinic experience, in your own words.</p>
        <a className="hero-cta" href="#find-facility">Share my experience <span aria-hidden="true">↗</span></a>
        <p className="hero-reassurance">You choose how your name appears before sending.</p>
      </div></div>
    </section>
    {params.get('returnTo') && <div className="portal-handoff wide-container"><div><strong>You’re in the right place.</strong><p>Confirm the facility below to continue from the patient portal.</p></div><a href={patientReturnUrl()}>Back to finding care ↗</a></div>}
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
