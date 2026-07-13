import { google } from "googleapis";

export async function handler(event) {
  try {
    const code = event.queryStringParameters.code;

    if (!code) {
      return {
        statusCode: 400,
        body: "Missing authorization code.",
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "OAuth successful!",
        tokens,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}