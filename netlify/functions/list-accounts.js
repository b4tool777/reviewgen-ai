import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler() {
  try {
    // Get the first connected Google account
    const { data, error } = await supabase
      .from("google_tokens")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error("No Google account connected.");
    }

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    client.setCredentials({
      refresh_token: data.refresh_token,
    });

    // Force a fresh access token
    const { token } = await client.getAccessToken();

    return {
    statusCode: 200,
    body: JSON.stringify({
        hasRefreshToken: !!data.refresh_token,
        hasAccessToken: !!token,
        accessTokenPrefix: token ? token.substring(0, 20) : null,
    }),
    };

    const response = await business.accounts.list();

    return {
      statusCode: 200,
      body: JSON.stringify(response.data, null, 2),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message,
      }),
    };
  }
}