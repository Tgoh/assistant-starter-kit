---
name: register-audit
description: Re-check that the facts on every entity are still true, that rules about the world carry a source, and that nothing spent is still standing. Use when the row wakes.
---

# Register audit

Re-checking that what's written down is still true.

## What it's for

Every other routine either adds to the register or acts on it. None of them ask
whether the existing entries are still accurate. Facts recorded once and never
rechecked are how a system like this fails in its second year: confidently,
and with no visible symptom until something is relied on and turns out stale.

## Steps

1. Walk every `subjects/*/*/README.md` top to bottom.
2. For each fact, ask **how we would know if it had changed**, and whether that
   signal would actually reach us. Premiums rise silently. Policies lapse when
   a card expires. Providers get acquired.
3. Spot-check the ones where being wrong is expensive: insurance, anything on
   direct debit, anything where someone else holds the second factor.
4. **A rule about the world with no source is flagged**, and one with a source
   is re-checked against it.
5. **A negative with no search behind it is flagged.** "None" is a claim about
   the world; "not found in X, searched D Mon YY" is a fact.
6. **Anything spent moves to history**: a fact past its own end date, a "not
   yet" that has since happened.
7. When a fact changes, the old text goes into that entity's `history.md` as a
   dated *Was* with the *Changed* beside it, and the README is corrected.
   Re-derive the affected rows from the corrected facts.
8. **A last-done anchor still blank after a full quarter is a decision not to
   track it**: get the date or delete the row.

## What good looks like

Something turns out to be wrong. Three audits in a row finding nothing means
it is being done too gently, or too often.
