export async function handler(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Google Auth function is working!"
    }),
  };
}