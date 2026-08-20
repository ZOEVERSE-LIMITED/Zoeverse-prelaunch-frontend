import { useEffect, useState } from "react";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { getLegalDocument } from "@/api";
import { useTitle } from "@/lib/useTitle";

const TITLES = { privacy: "Privacy", terms: "Terms" };


export default function LegalPage({ slug }) {
  useTitle(TITLES[slug] ?? "Legal");

  const [doc, setDoc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    setDoc(null);
    setFailed(false);

    getLegalDocument(slug, controller.signal)
      .then((result) => {
        if (live) setDoc(result);
      })
      .catch(() => {
        if (live) setFailed(true);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [slug]);

  return (
    <div className="zoe-container py-10">
      {failed ? (
        <>
          <h1 className="text-title">We could not load this page</h1>
          <p className="mt-3 text-body text-ink-muted">
            Check your connection and reload. We would rather show you nothing
            than show you a version that might not be the current one.
          </p>
        </>
      ) : doc ? (
        <LegalDocumentView document={doc} />
      ) : (
        <p className="text-body text-ink-soft">Loading…</p>
      )}
    </div>
  );
}
