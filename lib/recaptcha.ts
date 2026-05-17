/**
 * Verifies a Google reCAPTCHA v2 token.
 * Documentation: https://developers.google.com/recaptcha/docs/verify
 */
export async function verifyRecaptchaToken(token: string | undefined): Promise<{
  success: boolean;
  error?: string;
  errorCodes?: string[];
  hostname?: string;
  challengeTs?: string;
}> {
  if (!token) {
    return { success: false, error: "Missing reCAPTCHA token." };
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.error("RECAPTCHA_SECRET_KEY is not defined in environment variables.");
    return { success: false, error: "Server configuration error (missing secret key)." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const result = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      body: formData,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const outcome = (await result.json()) as {
      success?: boolean;
      hostname?: string;
      challenge_ts?: string;
      "error-codes"?: string[];
    };

    if (outcome.success) {
      return {
        success: true,
        hostname: outcome.hostname,
        challengeTs: outcome.challenge_ts,
      };
    } else {
      const errorCodes = Array.isArray(outcome["error-codes"]) ? outcome["error-codes"] : [];
      console.warn("reCAPTCHA verification failed:", {
        errorCodes,
        hostname: outcome.hostname,
        challengeTs: outcome.challenge_ts,
      });
      return {
        success: false,
        error: "Invalid or expired reCAPTCHA token.",
        errorCodes,
        hostname: outcome.hostname,
        challengeTs: outcome.challenge_ts,
      };
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return { success: false, error: "Failed to verify reCAPTCHA." };
  }
}
