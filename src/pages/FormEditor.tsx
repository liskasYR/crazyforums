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
import {
  ArrowLeft,
  Save,
  Lock,
  Unlock,
  MessageSquare,
  Plus,
  ExternalLink,
  Copy,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
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

  const saveForm = async () => {
    setSaving(true);
    try {
      const { error: formError } = await supabase
        .from("forms")
        .update({
          title: form.title,
          description: form.description,
          status: form.status,
        })
        .eq("id", id);
      if (formError) throw formError;

      const { error: styleError } = await supabase
        .from("form_styles")
        .upsert({
          form_id: id,
          ...form.style,
        });
      if (styleError) throw styleError;

      await supabase.from("questions").delete().eq("form_id", id);

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const { data: questionData, error: qError } = await supabase
          .from("questions")
          .insert({
            form_id: id,
            type: question.type,
            title: question.title,
            required: question.required,
            position: i,
          })
          .select()
          .single();
        if (qError) throw qError;

        if (question.options && question.options.length > 0) {
          const options = question.options.map((opt: any, idx: number) => ({
            question_id: questionData.id,
            label: opt.label,
            position: idx,
          }));
          const { error: optError } = await supabase
            .from("question_options")
            .insert(options);
          if (optError) throw optError;
        }
      }

      toast({ title: "הטופס נשמר!" });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור טופס",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const [statusSaving, setStatusSaving] = useState(false);
  const toggleStatus = async () => {
    if (!form) return;
    setStatusSaving(true);
    try {
      const newStatus = form.status === "open" ? "closed" : "open";
      const { error } = await supabase
        .from("forms")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;

      setForm((prev: any) => ({ ...prev, status: newStatus }));
      toast({ title: newStatus === "closed" ? "הטופס נסגר" : "הטופס נפתח" });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן סטטוס טופס",
        variant: "destructive",
      });
    } finally {
      setStatusSaving(false);
    }
  };

  const addQuestion = (type: string) => {
    const newQuestion = {
      id: `temp-${Date.now()}`,
      type,
      title: "שאלה חדשה",
      required: false,
      options:
        type === "multiple-choice" || type === "checkbox"
          ? [
              { id: `opt-1`, label: "אפשרות 1" },
              { id: `opt-2`, label: "אפשרות 2" },
            ]
          : undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: any) => {
    const updated = [...questions];
    updated[index] = updatedQuestion;
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const deleteResponse = async (responseId: string) => {
    try {
      const { error } = await supabase
        .from("form_responses")
        .delete()
        .eq("id", responseId);
      if (error) throw error;

      setResponses(responses.filter((r) => r.id !== responseId));
      toast({ title: "התגובה נמחקה" });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק תגובה",
        variant: "destructive",
      });
    }
  };

  const copyFormLink = () => {
    const link = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(link);
    toast({ title: "הקישור הועתק!" });
  };

  const handleImageGenerated = (imageUrl: string) => {
    setForm((prev: any) => ({
      ...prev,
      style: {
        ...prev.style,
        backgroundType: "image",
        backgroundImage: imageUrl,
      },
    }));
  };

  if (authLoading || loading || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <AIAssistant onImageGenerated={handleImageGenerated} />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/editor")}
            className="bg-black text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyFormLink}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Copy className="w-4 h-4 ml-2" />
              העתק קישור
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/f/${form.slug}`, "_blank")}
              className="bg-black text-white hover:bg-gray-800"
            >
              <ExternalLink className="w-4 h-4 ml-2" />
              פתח טופס
            </Button>
            <Button
              variant="outline"
              onClick={toggleStatus}
              disabled={statusSaving || saving}
              className="bg-black text-white hover:bg-gray-800"
            >
              {form.status === "open" ? (
                <Lock className="w-4 h-4 ml-2" />
              ) : (
                <Unlock className="w-4 h-4 ml-2" />
              )}
              {statusSaving
                ? "מעבד..."
                : form.status === "open"
                ? "סגור טופס"
                : "פתח טופס"}
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <MessageSquare className="w-4 h-4 ml-2" />
                  תגובות ({responses.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>תגובות לטופס</DialogTitle>
                  <DialogDescription>
                    סה"כ {responses.length} תגובות
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {responses.map((response) => (
                    <Card
                      key={response.id}
                      className="p-4 bg-transparent border border-gray-700 text-white"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-400">
                          {new Date(response.submitted_at).toLocaleString("he-IL")}
                        </p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteResponse(response.id)}
                        >
                          מחק
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(response.answers).map(
                          ([qId, answer]: [string, any]) => {
                            const question = questions.find((q) => q.id === qId);
                            if (!question) return null;

                            let displayValue = answer;
                            if (
                              question.type === "multiple-choice" &&
                              question.question_options
                            ) {
                              const option =
                                question.question_options.find(
                                  (opt: any) => opt.id === answer
                                );
                              displayValue = option?.label || answer;
                            } else if (
                              question.type === "checkbox" &&
                              Array.isArray(answer) &&
                              question.question_options
                            ) {
                              displayValue = answer
                                .map((optId: string) => {
                                  const option =
                                    question.question_options.find(
                                      (opt: any) => opt.id === optId
                                    );
                                  return option?.label || optId;
                                })
                                .join(", ");
                            } else if (Array.isArray(answer)) {
                              displayValue = answer.join(", ");
                            }

                            return (
                              <div key={qId}>
                                <p className="font-medium">{question.title}</p>
                                <p className="text-gray-400">{displayValue}</p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </Card>
                  ))}
                  {responses.length === 0 && (
                    <p className="text-center text-gray-400 py-8">
                      אין תגובות עדיין
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={saveForm}
              disabled={saving}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Save className="w-4 h-4 ml-2" />
              {saving ? "שומר..." : "שמור"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="edit" dir="rtl">
          <TabsList className="grid w-full grid-cols-2 bg-transparent border border-gray-700">
            <TabsTrigger value="edit">עריכה</TabsTrigger>
            <TabsTrigger value="design">עיצוב</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <Card className="p-6 bg-transparent border border-gray-700 text-white">
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

            {questions.map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                onUpdate={(q) => updateQuestion(index, q)}
                onDelete={() => deleteQuestion(index)}
              />
            ))}

            <Card className="p-6 bg-transparent border border-gray-700 text-white">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => addQuestion("text")}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  טקסט קצר
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuestion("textarea")}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  טקסט ארוך
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuestion("number")}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  מספר
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuestion("multiple-choice")}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  בחירה
                </Button>
                <Button
                  variant="outline"
                  onClick={() => addQuestion("checkbox")}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  תיבות סימון
                </Button>
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
