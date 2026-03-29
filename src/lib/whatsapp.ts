/**
 * WhatsApp utility using Twilio API.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID   — Your Twilio Account SID
 *   TWILIO_AUTH_TOKEN    — Your Twilio Auth Token
 *   TWILIO_WHATSAPP_FROM — Sender number, e.g. "whatsapp:+14155238886"
 *
 * If any of these are missing the send is silently skipped so the portal
 * keeps working even before WhatsApp is configured.
 */

interface WhatsAppResult {
    sent: number;
    failed: number;
    skipped: boolean;
}

export async function sendWhatsAppToMany(
    phones: string[],
    message: string
): Promise<WhatsAppResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    // Gracefully skip if Twilio isn't configured yet
    if (!accountSid || !authToken || !from) {
        console.warn('[WhatsApp] Twilio env vars not set — skipping WhatsApp delivery.');
        return { sent: 0, failed: 0, skipped: true };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
        // Normalise Indian numbers: strip spaces/dashes, ensure +91 prefix
        const normalised = normalisePhone(phone);
        if (!normalised) { failed++; continue; }

        try {
            const body = new URLSearchParams({
                From: from,
                To: `whatsapp:${normalised}`,
                Body: message,
            });

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            });

            if (res.ok) {
                sent++;
            } else {
                const err = await res.json().catch(() => ({}));
                console.error(`[WhatsApp] Failed for ${normalised}:`, err);
                failed++;
            }
        } catch (e) {
            console.error(`[WhatsApp] Error for ${normalised}:`, e);
            failed++;
        }
    }

    return { sent, failed, skipped: false };
}

function normalisePhone(raw: string): string | null {
    if (!raw) return null;
    // Remove all non-digit characters except leading +
    const digits = raw.replace(/[^\d+]/g, '');
    // Already has country code
    if (digits.startsWith('+')) return digits;
    // Indian 10-digit mobile
    if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
    // With 91 prefix (no +)
    if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
    return null;
}
