import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isApiError, suggestFacility } from "@/api";
import { savePendingFacility } from "@/lib/review/pendingFacility";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, describedBy } from "@/components/ui/Field";

/**
 * ADDING A FACILITY LEADS STRAIGHT INTO REVIEWING IT.
 *
 * This screen used to end at "thanks, we will add it" — which lost the review,
 * and lost it from exactly the people whose hospital is missing from an
 * incomplete registry. They came to write something; being told to come back in
 * a few days means they never do.
 *
 * The facility still is not LISTED until an admin checks it. Not listed and not
 * reviewable are different things, and only the first was ever true.
 *
 * TWO FIELDS, DELIBERATELY. The LGA dropdown, the ownership radios and the
 * free-text note came off on purpose. This form stands between somebody and the
 * review they came to write, and each field is a chance to give up. Ownership
 * and classification get checked before listing regardless, so asking a patient
 * for them bought a guess we would have verified anyway.
 */
export function SuggestFacilityForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  /*
    Carried over from a failed search, so nobody retypes what they just typed.
    When they picked an external result, the name and address arrive filled in
    and this screen becomes a confirmation rather than a form — which is the
    point of the fallback.

    The place id rides along in state and is never shown. It is the one piece of
    provider data we are allowed to keep, and it is for the admin who approves
    the facility, not for the person filling this in.
  */
  const [name, setName] = useState(params.get("name") ?? "");
  const [area, setArea] = useState(params.get("area") ?? "");
  const placeId = params.get("placeId") ?? undefined;

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    try {
      const receipt = await suggestFacility({
        name,
        area,
        providerPlaceId: placeId,
      });
      // Keep it on this device so the review can start against it at once.
      savePendingFacility(receipt.facility);
      navigate(`/review/${encodeURIComponent(receipt.facility.id)}/start`);
      return;
    } catch (error) {
      if (isApiError(error) && error.code === "validation") {
        // Keyed by field name, so each message lands under its own input.
        setErrors(error.fieldErrors ?? {});
      } else if (isApiError(error) && error.isRetryable) {
        setFormError("We could not save that. Check your connection and try again.");
      } else {
        setFormError("We could not save that. Try again in a moment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field
        label="Facility name"
        htmlFor="name"
        hint="The name on the building or the sign, as best you remember it."
        error={errors.name}
      >
        <TextInput
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          invalid={!!errors.name}
          aria-describedby={describedBy("name", true, !!errors.name)}
          autoComplete="off"
          enterKeyHint="next"
        />
      </Field>

      {/*
        THE ONLY LOCATION SIGNAL LEFT, now that the LGA dropdown is gone. So it
        asks in plain language and takes whatever somebody has — an area, a
        street, a bus stop, a landmark, or an LGA if they think to name one. That
        is how people describe where a hospital is anyway; a dropdown made them
        translate it into an administrative unit first.
      */}
      <Field
        label="Where is it?"
        htmlFor="area"
        hint="An area, street or landmark — anything that helps us find it. E.g. “Aguda, Surulere” or “opposite Ikeja bus stop”."
        error={errors.area}
      >
        <TextInput
          id="area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          invalid={!!errors.area}
          aria-describedby={describedBy("area", true, !!errors.area)}
          autoComplete="off"
          enterKeyHint="go"
        />
      </Field>

      {formError ? (
        <p
          role="alert"
          className="rounded border border-danger bg-danger-wash px-4 py-3 text-small text-danger"
        >
          {formError}
        </p>
      ) : null}

      <p className="text-small text-ink-soft">
        The ZOEVERSE team checks every facility before it goes on the public list,
        so it will not appear in search straight away. You can review it now
        either way.
      </p>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Saving…" : "Add it and start my review"}
      </Button>
    </form>
  );
}
