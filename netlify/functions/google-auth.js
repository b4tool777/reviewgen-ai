import { google } from "googleapis";

export async function handler() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    "https://www.googleapis.com/auth/business.manage",
    "openid",
    "email",
    "profile",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  return {
    statusCode: 302,
    headers: {
      Location: authUrl,
    },
  };
}