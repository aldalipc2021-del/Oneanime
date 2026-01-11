import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get access token using service account for FCM v1 API
async function getAccessToken(): Promise<string | null> {
  const serviceAccountEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");

  if (!serviceAccountEmail || !privateKey) {
    console.log("test-notification: Service account not configured (FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
    return null;
  }

  try {
    const pemContents = privateKey
      .replace(/\\n/g, "\n")
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s/g, "");

    const binaryKey = decode(pemContents);

    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const jwtPayload = {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: getNumericDate(0),
      exp: getNumericDate(3600), // 1 hour
    };
    const jwtHeader = { alg: "RS256", typ: "JWT" };

    const jwt = await create(jwtHeader, jwtPayload, cryptoKey);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.log("test-notification: Failed to get access token from Google OAuth", tokenData);
      return null;
    }
    
    return tokenData.access_token;
  } catch (error) {
    console.error("test-notification: getAccessToken failed", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const jwtToken = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(jwtToken);

    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { token, title, body } = await req.json();
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    
    const hasV1Credentials = !!Deno.env.get("FIREBASE_CLIENT_EMAIL") && !!Deno.env.get("FIREBASE_PRIVATE_KEY");

    console.log("test-notification: request received", {
      user_id: userData.user.id,
      token_len: typeof token === "string" ? token.length : null,
      has_project_id: !!projectId,
      has_v1_credentials: hasV1Credentials,
    });

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "No FCM token provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (token.length > 500) {
      return new Response(
        JSON.stringify({ error: "Invalid FCM token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use FCM HTTP v1 API (Legacy API was deprecated by Google)
    if (!hasV1Credentials) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Firebase V1 API credentials not configured",
          details: "Please add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY secrets from your Firebase service account."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "FIREBASE_PROJECT_ID not configured"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to authenticate with Firebase. Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const v1Message = {
      message: {
        token,
        notification: {
          title: title || "Test-Benachrichtigung",
          body: body || "Dies ist eine Test-Benachrichtigung von OneAnime!",
        },
        webpush: {
          notification: {
            icon: "/logo-192.png",
          },
        },
      },
    };

    console.log("test-notification: sending via FCM v1 API");

    const v1Response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(v1Message),
      },
    );

    const v1Result = await v1Response.json();
    
    console.log("test-notification: FCM v1 response", {
      status: v1Response.status,
      ok: v1Response.ok,
    });

    if (v1Response.ok) {
      return new Response(
        JSON.stringify({ success: true, message: "Notification sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Handle specific FCM errors
    const fcmError = v1Result?.error?.message || v1Result?.error?.status || "Unknown FCM error";
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "FCM delivery failed",
        details: fcmError
      }),
      { status: v1Response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("test-notification: unhandled error", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
