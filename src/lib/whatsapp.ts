/**
 * WhatsApp utility — Meta WhatsApp Cloud API (official, no third-party).
 *
 * Required env vars:
 *   WHATSAPP_PHONE_NUMBER_ID  — Phone Number ID from Meta Business (not the phone number itself)
 *   WHATSAPP_ACCESS_TOKEN     — Permanent System User token from Meta Business Suite
 *   WHATSAPP_API_VERSION      — e.g. "v19.0" (optional, defaults to v19.0)
 *
 * If any required var is missing, sending is silently skipped so the portal
 * keeps working before WhatsApp is configured.
 *
 * Setup guide:
 *   1. Go to developers.facebook.com → My Apps → Create App → Business
 *   2. Add "WhatsApp" product to your app
 *   3. WhatsApp → Getting Started → note your Phone Number ID + temporary token
 *   4. For permanent token: Business Settings → System Users → Add → generate token
 *      with whatsapp_business_messaging permission
 *   5. To use your own number (not the test number):
 *      WhatsApp → Phone Numbers → Add phone number → verify via OTP
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
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';

    if (!phoneNumberId || !accessToken) {
        console.warn('[WhatsApp] Meta Cloud API env vars not set — skipping WhatsApp delivery.');
        return { sent: 0, failed: 0, skipped: true };
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
        const normalised = normalisePhone(phone);
        if (!normalised) { failed++; continue; }

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: normalised,
                    type: 'text',
                    text: { body: message },
                }),
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

// Normalise to E.164 format without the '+' (Meta API expects digits only, e.g. 919876543210)
function normalisePhone(raw: string): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (/^91[6-9]\d{9}$/.test(digits)) return digits;           // 91XXXXXXXXXX
    if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;     // 10-digit Indian
    if (/^\d{10,15}$/.test(digits)) return digits;              // other intl numbers
    return null;
}
