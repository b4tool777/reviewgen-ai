import { OAuth2Client } from "google-auth-library";

export async function handler(event) {
  try {
    const code = event.queryStringParameters?.code;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing authorization code",
        }),
      };
    }

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const response = await client.getToken(code);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        hasAccessToken: !!response.tokens.access_token,
        hasRefreshToken: !!response.tokens.refresh_token,
        expiry: response.tokens.expiry_date,
      }),
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