import { OAuth2Client } from "google-auth-library";

export async function handler() {
  try {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/business.manage",
      ],
    });

    return {
      statusCode: 302,
      headers: {
        Location: authUrl,
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack,
      }),
    };
  }
}