import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  review_id: string;
  invoice_data?: any;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { review_id, invoice_data }: RequestBody = await req.json();

    if (!review_id) {
      return new Response(
        JSON.stringify({ error: "Missing review_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("final")
      .eq("review_id", review_id)
      .maybeSingle();

    if (reviewError || !review) {
      return new Response(
        JSON.stringify({ error: "Review not found", details: reviewError }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!review.final) {
      return new Response(
        JSON.stringify({ error: "No final data available for this review" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: tokens, error: tokensError } = await supabase
      .from("xero_tokens")
      .select("access_token, refresh_token, expires_at, tenant_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokensError || !tokens) {
      return new Response(
        JSON.stringify({ error: "No Xero tokens found", details: tokensError }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let accessToken = tokens.access_token;
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();

    if (now >= expiresAt) {
      const CLIENT_ID = Deno.env.get("XERO_CLIENT_ID");
      const CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET");

      if (!CLIENT_ID || !CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: "Missing Xero configuration" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const refreshRes = await fetch("https://identity.xero.com/connect/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!refreshRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to refresh token" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const newTokens = await refreshRes.json();
      accessToken = newTokens.access_token;

      await supabase.from("xero_tokens").insert({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        tenant_id: tokens.tenant_id,
        token_type: newTokens.token_type,
      });
    }

    // Use invoice_data from request if provided, otherwise use data from database
    let invoiceData;
    if (invoice_data) {
      // If invoice_data is an array, take the first element
      let rawData = Array.isArray(invoice_data) ? invoice_data[0] : invoice_data;

      // Check if the data has a xeroInvoice string that needs to be parsed
      if (rawData.xeroInvoice && typeof rawData.xeroInvoice === 'string') {
        invoiceData = JSON.parse(rawData.xeroInvoice);
        console.log("Using invoice data from request (parsed from xeroInvoice string)");
      } else {
        invoiceData = rawData;
        console.log("Using invoice data from request");
      }
    } else {
      invoiceData = review.final?.ERP || review.final;
      console.log("Using invoice data from database");
    }

    // Ensure required Xero fields are present
    if (!invoiceData.Type) {
      invoiceData = {
        ...invoiceData,
        Type: "ACCPAY",
      };
    }

    // Ensure Contact is specified
    if (!invoiceData.Contact || !invoiceData.Contact.Name) {
      // Try to get supplier name from the invoice data
      const supplierName = invoiceData.SupplierName ||
                          invoiceData.Supplier ||
                          invoiceData.VendorName ||
                          invoiceData.Vendor ||
                          "Unknown Supplier";

      invoiceData = {
        ...invoiceData,
        Contact: {
          Name: supplierName
        }
      };
    }

    // Ensure DueDate is set (default to Date if missing)
    if (!invoiceData.DueDate && invoiceData.Date) {
      invoiceData.DueDate = invoiceData.Date;
    }

    // Ensure LineAmountTypes is set
    if (!invoiceData.LineAmountTypes) {
      invoiceData.LineAmountTypes = "Exclusive";
    }

    // Ensure LineItems have required Xero fields
    if (invoiceData.LineItems && Array.isArray(invoiceData.LineItems)) {
      invoiceData.LineItems = invoiceData.LineItems.map((item: any) => ({
        ...item,
        Description: item.Description || "",
        Quantity: item.Quantity !== undefined ? item.Quantity : 1,
        UnitAmount: item.UnitAmount !== undefined ? item.UnitAmount : 0,
        AccountCode: item.AccountCode || "200",
        TaxType: item.TaxType || "NONE"
      }));
    }

    // Add Reference field if not present (use review_id)
    if (!invoiceData.Reference) {
      invoiceData.Reference = review_id;
    }

    console.log("Invoice data to send:", JSON.stringify(invoiceData, null, 2));
    console.log("Tenant ID:", tokens.tenant_id);
    console.log("Access token (first 20 chars):", accessToken?.substring(0, 20));

    // Validate that invoice has line items
    if (!invoiceData.LineItems || invoiceData.LineItems.length === 0) {
      console.warn("Warning: Invoice has no line items!");
    } else {
      console.log("Line items count:", invoiceData.LineItems.length);
      console.log("First line item:", JSON.stringify(invoiceData.LineItems[0], null, 2));
    }

    // Validate we have required data
    if (!tokens.tenant_id) {
      return new Response(
        JSON.stringify({ error: "Missing tenant_id in stored tokens" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("About to send request to Xero...");

    const xeroResponse = await fetch(
      "https://api.xero.com/api.xro/2.0/Invoices",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "xero-tenant-id": tokens.tenant_id,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ Invoices: [invoiceData] }),
      }
    );

    console.log("Received response from Xero");
    const responseText = await xeroResponse.text();
    console.log("Xero response status:", xeroResponse.status);
    console.log("Xero response headers:", Object.fromEntries(xeroResponse.headers.entries()));
    console.log("Xero response:", responseText);

    let xeroResult;
    try {
      xeroResult = JSON.parse(responseText);
    } catch (parseError) {
      // If parsing fails, it might be XML - check if the request was actually successful
      if (xeroResponse.ok && responseText.includes("<Status>OK</Status>")) {
        // Extract invoice ID from XML if possible
        const invoiceIdMatch = responseText.match(/<InvoiceID>([^<]+)<\/InvoiceID>/);
        const invoiceId = invoiceIdMatch ? invoiceIdMatch[1] : null;

        return new Response(
          JSON.stringify({
            success: true,
            message: "Invoice successfully sent to Xero",
            invoiceId: invoiceId
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Failed to parse Xero response",
          details: responseText,
          parseError: parseError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!xeroResponse.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to send to Xero",
          status: xeroResponse.status,
          details: xeroResult
        }),
        {
          status: xeroResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if invoice has errors
    if (xeroResult.Invoices && xeroResult.Invoices.length > 0) {
      const invoice = xeroResult.Invoices[0];
      if (invoice.HasErrors) {
        return new Response(
          JSON.stringify({
            error: "Xero invoice has validation errors",
            details: invoice,
            validationErrors: invoice.ValidationErrors
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, xeroResult }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Caught error in send-to-xero:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
        type: error.constructor.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});