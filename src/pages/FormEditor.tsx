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
import { ArrowLeft, Save, Eye, EyeOff, Lock, Unlock, MessageSquare, Plus, ExternalLink, Copy, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionEditor from "@/components/QuestionEditor";
import CustomizationPanel from "@/components/CustomizationPanel";
import AIAssistant from "@/components/AIAssistant";

export default function FormEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      loadForm();
    }
  }, [user, id]);

  const loadForm = async () => {
    try {
      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

      if (formError) throw formError;

      const { data: styleData } = await supabase
        .from("form_styles")
        .select("*")
        .eq("form_id", id)
        .single();

      const { data: questionsData } = await supabase
        .from("questions")
        .select(`*, question_options (*)`)
        .eq("form_id", id)
        .order("position");

      const { data: responsesData } = await supabase
        .from("form_responses")
        .select("*")
        .eq("form_id", id)
        .order("submitted_at", { ascending: false });

      setForm({ ...formData, style: styleData || {} });
      setQuestions(questionsData || []);
      setResponses(responsesData || []);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון טופס",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail || !form) return;
    setInviting(true);
    try {
      const { error } = await supabase.functions.invoke("send-editor-invitation", {
        body: {
          toEmail: inviteEmail,
          formTitle: form.title,
          formSlug: form.slug,
          inviterName: user?.email || "משתמש",
        },
      });
      if (error) throw error;
      toast({ title: "ההזמנה נשלחה!", description: `הוזמנה ל-${inviteEmail}` });
      setInviteEmail("");
    } catch {
      toast({ title: "שגיאה", description: "לא ניתן לשלוח הזמנה", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  // --- שאר פונקציות נשארות כמו קודם: saveForm, toggleStatus, addQuestion, updateQuestion, deleteQuestion, deleteResponse, copyFormLink ---

  if (authLoading || loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
      <AIAssistant onImageGenerated={(imgUrl) => setForm({...form, style: {...form.style, backgroundType: 'image', backgroundImage: imgUrl}})} />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate("/editor")}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          <div className="flex gap-2">

            {/* כפתור העתק קישור */}
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`)}>
              <Copy className="w-4 h-4 ml-2" />
              העתק קישור
            </Button>

            {/* כפתור פתח טופס */}
            <Button variant="outline" onClick={() => window.open(`/f/${form.slug}`, "_blank")}>
              <ExternalLink className="w-4 h-4 ml-2" />
              פתח טופס
            </Button>

            {/* כפתור סטטוס */}
            <Button variant="outline" onClick={() => toggleStatus()} disabled={saving}>
              {form.status === "open" ? <Lock className="w-4 h-4 ml-2" /> : <Unlock className="w-4 h-4 ml-2" />}
              {form.status === "open" ? "סגור טופס" : "פתח טופס"}
            </Button>

            {/* כפתור תגובות */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 ml-2" />
                  תגובות ({responses.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>תגובות לטופס</DialogTitle>
                  <DialogDescription>
                    סה"כ {responses.length} תגובות
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {responses.map((response) => (
                    <Card key={response.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-muted-foreground">{new Date(response.submitted_at).toLocaleString("he-IL")}</p>
                        <Button variant="destructive" size="sm" onClick={() => deleteResponse(response.id)}>מחק</Button>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(response.answers).map(([qId, answer]: [string, any]) => {
                          const question = questions.find((q) => q.id === qId);
                          if (!question) return null;
                          return (
                            <div key={qId}>
                              <p className="font-medium">{question.title}</p>
                              <p className="text-muted-foreground">{answer}</p>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))}
                  {responses.length === 0 && <p className="text-center text-muted-foreground py-8">אין תגובות עדיין</p>}
                </div>
              </DialogContent>
            </Dialog>

            {/* כפתור שליחה של הזמנה לעריכה */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-800">
                  <Share2 className="w-4 h-4 ml-2" />
                  הזמן עורך
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>הזמן עורך נוסף</DialogTitle>
                  <DialogDescription>הזן כתובת אימייל של עורך נוסף לטופס זה</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invite-email">אימייל</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="editor@example.com"
                    />
                  </div>
                  <Button
                    onClick={sendInvitation}
                    disabled={inviting || !inviteEmail}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {inviting ? "שולח..." : "שלח הזמנה"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* כפתור שמירה */}
            <Button onClick={saveForm} disabled={saving}>
              <Save className="w-4 h-4 ml-2" />
              {saving ? "שומר..." : "שמור"}
            </Button>

          </div>
        </div>

        {/* שאר החלקים של Tabs, QuestionEditor, CustomizationPanel נשארים כמו שהיו */}
      </div>
    </div>
  );
}
