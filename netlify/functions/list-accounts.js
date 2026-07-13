import { OAuth2Client } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler() {
  try {
    // Get the connected Google account
    const { data, error } = await supabase
    .from("google_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

    if (error || !data) {
      throw new Error("No Google account connected.");
    }

    // Create OAuth client
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Load refresh token
    client.setCredentials({
      refresh_token: data.refresh_token,
    });

    // Get a fresh access token
    const { token } = await client.getAccessToken();

    if (!token) {
      throw new Error("Failed to obtain access token.");
    }

    // Call Google Business Profile API
    const response = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    const body = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(
        {
          success: response.ok,
          googleStatus: response.status,
          googleResponse: body,
        },
        null,
        2
      ),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          success: false,
          error: err.message,
          stack: err.stack,
        },
        null,
        2
      ),
    };
  }
}