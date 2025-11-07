import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  toEmail: string;
  formTitle: string;
  formSlug: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toEmail, formTitle, formSlug, inviterName }: InvitationRequest = await req.json();

    const formUrl = `${Deno.env.get("SUPABASE_URL")?.replace('supabase.co', 'lovable.app')}/f/${formSlug}`;
    
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Form Builder <onboarding@resend.dev>",
        to: [toEmail],
        subject: `הוזמנת לערוך טופס: ${formTitle}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6;">הזמנה לעריכת טופס</h1>
            <p>שלום,</p>
            <p><strong>${inviterName}</strong> הזמין אותך לערוך את הטופס "<strong>${formTitle}</strong>".</p>
            <p>כעורך/ת של הטופס, תוכל/י:</p>
            <ul>
              <li>לערוך שאלות ולשנות את עיצוב הטופס</li>
              <li>לצפות בתשובות שהתקבלו</li>
              <li>לפתוח או לסגור את הטופס</li>
              <li>למחוק תשובות</li>
            </ul>
            <div style="margin: 30px 0;">
              <a href="${formUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                פתח טופס לעריכה
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              קישור לטופס: <a href="${formUrl}">${formUrl}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #888; font-size: 12px;">
              אם לא ביקשת הזמנה זו, תוכל/י להתעלם ממייל זה.
            </p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Resend API error: ${errorText}`);
    }

    const data = await emailResponse.json();
    console.log("Invitation email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
