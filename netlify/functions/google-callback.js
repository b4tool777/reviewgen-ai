import { google } from "googleapis";

export async function handler(event) {
  try {
    console.log("google object:", google);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        googleType: typeof google,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
      }),
    };
  }
}