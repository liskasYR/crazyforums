import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Copy, Send, Loader2, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomizationPanel from "@/components/CustomizationPanel";

export default function FormEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) loadForm();
  }, [user, id]);

  const loadForm = async () => {
    try {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setForm(data);
    } catch {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון טופס",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("forms")
        .update({ title: form.title, description: form.description })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "הטופס נשמר!" });
    } catch {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור טופס",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyFormLink = () => {
    const link = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(link);
    toast({ title: "הקישור הועתק!" });
  };

  if (authLoading || loading || !form)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 animate-background">
        <p>טוען...</p>
      </div>
    );

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 animate-background p-6">
      <style>{`
        @keyframes rgbGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-background {
          animation: rgbGradient 20s ease infinite;
          background-size: 400% 400%;
        }
      `}</style>

      <AIAssistant onImageGenerated={() => {}} />

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/editor")}
            className="bg-black text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 ml-2" /> חזרה
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyFormLink}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Copy className="w-4 h-4 ml-2" /> העתק קישור
            </Button>
            <Button
              onClick={saveForm}
              disabled={saving}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Save className="w-4 h-4 ml-2" /> {saving ? "שומר..." : "שמור"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="edit" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">עריכה</TabsTrigger>
            <TabsTrigger value="design">עיצוב</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <Card className="p-6 bg-gray-900/70 border border-purple-500 text-white">
              <div className="space-y-4">
                <div>
                  <Label>כותרת הטופס</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="bg-gray-800 text-white"
                  />
                </div>
                <div>
                  <Label>תיאור</Label>
                  <Textarea
                    value={form.description || ""}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className="bg-gray-800 text-white"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="design">
            <CustomizationPanel
              style={form.style}
              onStyleChange={(newStyle) =>
                setForm({
                  ...form,
                  style: { ...form.style, ...newStyle },
                })
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ================== רכיב ה-AIAssistant המלא ================== */
function AIAssistant({ onImageGenerated }: { onImageGenerated: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.reply || "לא התקבלה תשובה מהבינה.");
      if (data.imageGenerated) onImageGenerated();
    } catch {
      setResponse("שגיאה בשליחת ההודעה.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 w-80 bg-gray-900/80 border border-purple-500 rounded-2xl shadow-xl p-4 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        עוזר בינה מלאכותית
      </h3>
      <div className="space-y-3">
        <Textarea
          placeholder="שאל את הבינה..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="bg-gray-800 text-white"
        />
        <Button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> שולח...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> שלח
            </>
          )}
        </Button>
        {response && (
          <Card className="p-3 bg-gray-800/70 text-sm text-white border border-purple-400">
            {response}
          </Card>
        )}
      </div>
    </div>
  );
}
