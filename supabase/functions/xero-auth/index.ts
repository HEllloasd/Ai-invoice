import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const CLIENT_ID = Deno.env.get("XERO_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET");
    const REDIRECT_URI = Deno.env.get("XERO_REDIRECT_URI");

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      return new Response(
        JSON.stringify({ error: "Missing Xero configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Initiate Xero OAuth flow
    if (path.endsWith("/connect") || req.method === "POST") {
      // Get the return URL from the request (either query param or Origin header)
      let returnUrl = url.searchParams.get("return_url");
      if (!returnUrl) {
        const origin = req.headers.get("Origin") || "http://localhost:5173";
        returnUrl = origin;
      }

      // Encode return URL in state parameter
      const stateData = {
        id: crypto.randomUUID(),
        returnUrl: returnUrl
      };
      const state = btoa(JSON.stringify(stateData));

      const authUrl = new URL("https://login.xero.com/identity/connect/authorize");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
      authUrl.searchParams.set(
        "scope",
        "accounting.transactions accounting.contacts offline_access openid profile email"
      );
      authUrl.searchParams.set("state", state);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Handle OAuth callback from Xero
    if (path.endsWith("/callback")) {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Missing authorization code" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Exchange code for access token
      const tokenRes = await fetch("https://identity.xero.com/connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenRes.ok) {
        const error = await tokenRes.text();
        return new Response(
          JSON.stringify({ error: "Failed to exchange token", details: error }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const tokens = await tokenRes.json();

      // Get tenant/organization info
      const connectionsRes = await fetch(
        "https://api.xero.com/connections",
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const connections = await connectionsRes.json();
      const tenantId = connections[0]?.tenantId || null;

      // Store tokens in Supabase database
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error: insertError } = await supabase.from("xero_tokens").insert({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          tenant_id: tenantId,
          token_type: tokens.token_type,
        });

        if (insertError) {
          console.error("Error storing tokens:", insertError);
        }
      }

      // Redirect back to app with success
      // Decode the return URL from state parameter
      let appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
      const state = url.searchParams.get("state");

      if (state) {
        try {
          const stateData = JSON.parse(atob(state));
          if (stateData.returnUrl) {
            appUrl = stateData.returnUrl;
          }
        } catch (e) {
          // If parsing fails, use default
          console.error("Failed to parse state:", e);
        }
      }

      return Response.redirect(`${appUrl}/upload?xero=connected`, 302);
    }

    return new Response(
      JSON.stringify({ error: "Invalid endpoint" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});