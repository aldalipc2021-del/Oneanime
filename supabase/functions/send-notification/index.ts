import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  userId?: string;
  animeId: number;
  animeTitle: string;
  episodeNumber: number;
}

// Get access token using service account for FCM v1 API
async function getAccessToken(): Promise<string | null> {
  const serviceAccountEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");

  if (!serviceAccountEmail || !privateKey) {
    console.log("send-notification: Service account not configured");
    return null;
  }

  try {
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload_jwt = {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const encoder = new TextEncoder();
    const headerB64 = btoa(JSON.stringify(header))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const payloadB64 = btoa(JSON.stringify(payload_jwt))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

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

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      encoder.encode(`${headerB64}.${payloadB64}`),
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token || null;
  } catch (error) {
    console.error("send-notification: getAccessToken failed", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const firebaseServerKey = Deno.env.get("FIREBASE_SERVER_KEY");

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role for sending mass notifications
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const payload: NotificationPayload = await req.json();

    // Validate payload
    if (!payload.animeId || !payload.animeTitle || payload.episodeNumber === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: animeId, animeTitle, episodeNumber" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For mass notifications (no userId), require admin role
    if (!payload.userId) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin"
      });

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Admin role required for mass notifications" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // For single user notifications, ensure user can only notify themselves
      if (payload.userId !== userData.user.id) {
        const { data: isAdmin } = await supabase.rpc("has_role", {
          _user_id: userData.user.id,
          _role: "admin"
        });

        if (!isAdmin) {
          return new Response(
            JSON.stringify({ error: "Cannot send notifications to other users" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    if (!firebaseServerKey) {
      return new Response(
        JSON.stringify({ error: "Firebase not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token for FCM v1 API
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    const hasV1Credentials = !!Deno.env.get("FIREBASE_CLIENT_EMAIL") && !!Deno.env.get("FIREBASE_PRIVATE_KEY");

    if (!hasV1Credentials || !projectId) {
      return new Response(
        JSON.stringify({ 
          error: "Firebase V1 API credentials not configured",
          details: "Please add FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID secrets from your Firebase service account."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return new Response(
        JSON.stringify({
          error: "Failed to authenticate with Firebase",
          details: "Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY configuration."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all users tracking this anime who have push tokens
    let query = supabase
      .from("anime_tracking")
      .select("user_id")
      .eq("anime_id", payload.animeId)
      .in("status", ["watching", "plan_to_watch"]);

    if (payload.userId) {
      query = query.eq("user_id", payload.userId);
    }

    const { data: trackingUsers, error: trackingError } = await query;

    if (trackingError) {
      throw trackingError;
    }

    if (!trackingUsers || trackingUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = trackingUsers.map((t) => t.user_id);

    // Get push tokens for these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, push_token")
      .in("user_id", userIds)
      .not("push_token", "is", null);

    if (profilesError) {
      throw profilesError;
    }

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No push tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send notifications via FCM v1 API
    const notifications = profiles.map(async (profile) => {
      const v1Message = {
        message: {
          token: profile.push_token,
          notification: {
            title: `Neue Episode: ${payload.animeTitle}`,
            body: `Episode ${payload.episodeNumber} ist jetzt verfügbar!`,
          },
          data: {
            animeId: payload.animeId.toString(),
            episodeNumber: payload.episodeNumber.toString(),
          },
          webpush: {
            notification: {
              icon: "/logo-192.png",
            },
          },
        },
      };

      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(v1Message),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(`Failed to send notification to ${profile.user_id}:`, result);
      }

      // Record the notification
      if (response.ok) {
        await supabase.from("episode_notifications").insert({
          user_id: profile.user_id,
          anime_id: payload.animeId,
          anime_title: payload.animeTitle,
          episode_number: payload.episodeNumber,
          notified: true,
          release_date: new Date().toISOString(),
        });
      }

      return response.ok;
    });

    await Promise.all(notifications);

    return new Response(
      JSON.stringify({ success: true, notified: profiles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
