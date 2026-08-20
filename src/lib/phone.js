/* =========================================================================
   NIGERIAN PHONE NUMBERS
   =========================================================================
   People write their number however they write it. All of these are the same
   number and all of them must work:

     0803 123 4567        the way it is said out loud
     08031234567          the way it is typed in a hurry
     +234 803 123 4567    the way it is stored in a contacts app
     234 803 123 4567     the way it comes off a pasted WhatsApp profile
     +2340803 123 4567    country code AND the trunk zero, which is wrong but
                          extremely common
     803 123 4567         the leading zero forgotten

   The API takes E.164 and nothing else. Normalising HERE, once, means no screen
   and no endpoint ever has to guess which shape it is holding.

   THIS IS FORMAT VALIDATION, NOT EXISTENCE VALIDATION. It tells you the number
   is shaped like a Nigerian mobile number. Only the SMS proves it is real and
   belongs to the person holding the phone — which is the entire point of the OTP
   step, and why nothing here should ever be treated as verification.
   ========================================================================= */

/**
 * A Nigerian mobile national significant number is 10 digits and starts with
 * 7, 8 or 9 (0701…, 0803…, 0810…, 0902…). Landlines start with 1–6 and cannot
 * receive an SMS, so they are rejected with a reason that says so rather than a
 * generic "invalid".
 */
const MOBILE_FIRST_DIGITS = new Set(["7", "8", "9"]);

/**
 * @returns {{ ok: true, e164: string, national: string, display: string }
 *          | { ok: false, reason: string }}
 */
export function normalizeNigerianPhone(input) {
  const raw = String(input ?? "").trim();
  if (raw === "") return { ok: false, reason: "Enter your phone number." };

  // Keep digits only. A leading "+" carries no information once we know the
  // number is Nigerian, and "00234" is the same prefix written differently.
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  let national = null;

  if (digits.startsWith("234")) {
    let rest = digits.slice(3);
    // "+2340803…" — country code and the trunk zero together. Wrong, common,
    // and unambiguous, so we fix it rather than reject it.
    if (rest.startsWith("0")) rest = rest.slice(1);
    if (rest.length === 10) national = rest;
  } else if (digits.startsWith("0")) {
    if (digits.length === 11) national = digits.slice(1);
  } else if (digits.length === 10) {
    national = digits;
  }

  if (national === null) {
    return {
      ok: false,
      reason:
        digits.length < 10
          ? "That number is too short. A Nigerian mobile number has 11 digits."
          : "Check the number — it should look like 0803 123 4567.",
    };
  }

  if (!MOBILE_FIRST_DIGITS.has(national[0])) {
    return {
      ok: false,
      reason: "We can only text a mobile number. Landlines will not work.",
    };
  }

  return {
    ok: true,
    e164: `+234${national}`,
    national: `0${national}`,
    display: formatNational(national),
  };
}

/** "8031234567" -> "0803 123 4567". For showing back what we understood. */
function formatNational(national) {
  return `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}

/**
 * "0803 *** 4567".
 *
 * The server returns a masked number and that is what screens display. This
 * exists for the one case the server cannot cover: echoing back what the person
 * just typed, before any request has been made.
 */
export function maskNational(national) {
  const digits = String(national ?? "").replace(/\D/g, "");
  if (digits.length < 8) return digits;
  return `${digits.slice(0, 4)} *** ${digits.slice(-4)}`;
}
