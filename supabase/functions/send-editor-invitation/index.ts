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

    // יוצרים קישור לטופס
    const formUrl = `${Deno.env.get("SUPABASE_URL")?.replace(
      "supabase.co",
      "lovable.app"
    )}/f/${formSlug}`;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // שליחת מייל ממותג Deta AI
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Deta AI <noreply@deta.ai>",
        to: [toEmail],
        subject: `הוזמנת לערוך טופס ב-Deta AI: ${formTitle}`,
        html: `
          <div dir="rtl" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0d0d0f; color: #f3f4f6; padding: 24px; border-radius: 12px;">
            <h1 style="color: #8b5cf6; text-align: center;">✨ הזמנה מ-Deta AI ✨</h1>
            <p style="font-size: 16px;">שלום,</p>
            <p><strong>${inviterName}</strong> הזמין אותך לערוך את הטופס "<strong>${formTitle}</strong>" באמצעות מערכת Deta AI.</p>
            <p>כעורך/ת של הטופס תוכל/י:</p>
            <ul style="line-height: 1.7;">
              <li>לערוך ולשנות את מבנה הטופס</li>
              <li>לצפות בתשובות ולנתח נתונים</li>
              <li>לשתף עם משתמשים אחרים</li>
              <li>לנהל את הגדרות הגישה והעיצוב</li>
            </ul>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${formUrl}"
                style="background: linear-gradient(90deg, #7c3aed, #3b82f6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                פתח טופס ב-Deta AI
              </a>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">קישור ישיר: <a href="${formUrl}" style="color: #8b5cf6;">${formUrl}</a></p>
            <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
            <div style="text-align: center; font-size: 12px; color: #71717a;">
              <p>מערכת Deta AI – עוזרת חכמה לניהול טפסים, שיתופים ויצירה משותפת.</p>
              <p>אם לא ביקשת הזמנה זו, תוכל/י להתעלם מהמייל.</p>
            </div>
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
