/**
 * Verifies a Google reCAPTCHA v2 token.
 * Documentation: https://developers.google.com/recaptcha/docs/verify
 */
export async function verifyRecaptchaToken(token: string | undefined): Promise<{
  success: boolean;
  error?: string;
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

    const outcome = await result.json();

    if (outcome.success) {
      return { success: true };
    } else {
      console.warn("reCAPTCHA verification failed:", outcome["error-codes"]);
      return { success: false, error: "Invalid or expired reCAPTCHA token." };
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return { success: false, error: "Failed to verify reCAPTCHA." };
  }
}
