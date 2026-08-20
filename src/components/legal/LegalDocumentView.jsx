
export function LegalDocumentView({ document: doc }) {
  return (
    <article>
      <h1 className="text-display">{doc.title}</h1>

      <p className="mt-3 text-caption text-ink-soft">
        Version <span className="num">{doc.version}</span>
        {doc.effectiveFrom ? (
          <>
            {" · in effect from "}
            <span className="num">{doc.effectiveFrom}</span>
          </>
        ) : null}
      </p>

      {doc.status === "draft" ? (
        <p className="mt-4 rounded border border-danger bg-danger-wash px-4 py-3 text-small text-ink">
          <strong className="font-medium text-danger">This is a draft.</strong> It
          has not been through legal review and it is not final. Sections marked
          in curly brackets are still to be filled in.
        </p>
      ) : null}

      {doc.summary ? (
        <p className="mt-6 rounded bg-teal-wash px-4 py-4 text-body text-ink">
          {doc.summary}
        </p>
      ) : null}

      <div className="mt-8 space-y-8">
        {(doc.sections ?? []).map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-heading">{section.heading}</h2>
            <div className="mt-2 space-y-3">
              {(section.body ?? []).map((paragraph, index) => (
                <p key={index} className="text-body text-ink-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
