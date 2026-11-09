import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { unsubscribeNewsletter } from "@/api";
import { Button } from "@/components/ui/Button";
import { useTitle } from "@/lib/useTitle";

export default function NewsletterUnsubscribePage() {
  useTitle("Newsletter preferences");
  const token = useRef(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [status, setStatus] = useState("ready");
  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }, []);
  async function unsubscribe() {
    setStatus("saving");
    try { await unsubscribeNewsletter(token.current); setStatus("done"); }
    catch { setStatus("error"); }
  }
  return <div className="zoe-container py-12">
    <h1 className="text-title">{status === "done" ? "You’re unsubscribed." : "Newsletter preferences"}</h1>
    {status === "done" ? <p className="mt-4 text-body text-ink-muted">Your Zoeverse newsletter subscription has been cancelled.</p> : <>
      <p className="mt-4 text-body text-ink-muted">Choose below to stop receiving Zoeverse newsletters.</p>
      {token.current ? <Button className="mt-8 w-full" type="button" disabled={status === "saving"} onClick={unsubscribe}>
        {status === "saving" ? "Updating your preference…" : "Unsubscribe from newsletters"}
      </Button> : <p className="mt-4 text-body text-ink-muted">Open the unsubscribe link in a Zoeverse newsletter to update your preference.</p>}
      {status === "error" && <p role="alert" className="mt-4 text-small text-danger">We couldn’t update your preference. Please check your connection and try again.</p>}
    </>}
    <Link to="/" className="mt-8 inline-block text-teal-ink underline">Back to Zoeverse</Link>
  </div>;
}
