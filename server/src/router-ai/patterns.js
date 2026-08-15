// Ported from the original Python rules.py pattern libraries, tuned during
// evaluation against the hackathon's labeled sample set. See
// hackerrank-orchestrate-submission/code/rules.py for the reference version
// and hackerrank-orchestrate-submission/code/README.md for the design
// rationale behind each category.

export const RISK_PATTERNS = [
  /\botp\b/i, /one[- ]time password/i, /verification code/i, /login code/i,
  /\d+[- ]?digit/i, /security code/i, /security alert/i, /support alert/i,
  /(account|profile|access|card|number)s? (will be |may be |could be |is |gets? )?(temporarily )?(blocked|suspended|deactivat|locked|frozen)/i,
  /reactivat/i, /verify (your|now|immediately|account|identity)/i,
  /confirm (your|password|otp|account|identity|details)/i,
  /pay (a |the |small )?(clearance|reactivat|penalty|processing|reattempt) (fee|amount)/i,
  /click (this|the|below) link/i, /scan (this|the) qr/i, /pay .* immediately/i,
  /keep (your )?(account|access) active/i, /expire[sd]? (today|soon|shortly)/i,
  /limited time.*(verify|confirm|pay)/i, /suspicious (activity|login)/i,
  /your (parcel|package|delivery) (is|has) (on hold|failed|pending)/i,
  /update your (payment|billing) (details|information)/i,
  /reply with the.*(code|otp)/i,
];

export const INJECTION_PATTERNS = [
  /ignore (previous|prior|all) instructions/i, /disregard (previous|prior|all)/i,
  /mark this (message |as )?(as )?(notify|urgent|important|safe)/i,
  /classify this as/i, /you must (notify|mark|treat)/i, /system prompt/i,
  /as an ai/i, /this is not spam/i, /do not (mute|flag|filter) this/i,
  /override (the )?(filter|router|rules)/i, /important:? do not ignore this message/i,
];

export const URGENCY_PATTERNS = [
  /\burgent\b/i, /\basap\b/i, /immediately/i, /right now/i, /\bnow\b/i,
  /in \d+ ?min/i, /within \d+ ?(min|hour)/i, /by \d{1,2}(:\d{2})?\s?(am|pm)?/i,
  /deadline/i, /reply (now|asap|immediately)/i, /need (this|your|an) (answer|response|reply)/i,
  /can you (call|confirm|respond|come|join)/i, /please confirm/i,
  /waiting for (your|a) (reply|response)/i, /emergency/i, /before \d{1,2}/i,
  /\beod\b/i, /end of day/i, /last[- ]minute/i, /escalation/i, /alert threshold/i,
  /quick help/i, /consent (form|note)/i, /\bcircular\b/i, /submit by/i, /last date/i,
];

export const FORWARD_GREETING_PATTERNS = [
  /forward this to/i, /send (this|to) \d+ (people|contacts|friends)/i,
  /good morning/i, /good night/i, /happy (diwali|new year|holi|eid|birthday|anniversary)/i,
  /do not ignore.{0,20}(luck|blessing)/i, /share (with|to) (all|everyone)/i,
];

export const PROMOTION_PATTERNS = [
  /\bsale\b/i, /\boffer\b/i, /discount/i, /% off/i, /flat \d+%/i, /buy now/i,
  /limited (period|time) offer/i, /shop now/i, /exclusive deal/i, /cashback/i,
];

export const ORDER_PATTERNS = [
  /order/i, /deliver/i, /shipped/i, /packed/i, /appointment/i, /booking/i,
  /reservation/i, /invoice/i, /payment received/i, /payment due/i,
  /prescription/i, /claim/i,
];

export function anyMatch(patterns, text) {
  return patterns.some((p) => p.test(text));
}

export function countMatches(patterns, text) {
  return patterns.reduce((n, p) => n + (p.test(text) ? 1 : 0), 0);
}
