import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PublicForm() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    loadForm();
  }, [slug]);

  const loadForm = async () => {
    try {
      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("*")
        .eq("slug", slug)
        .single();

      if (formError) throw formError;

      const { data: styleData } = await supabase
        .from("form_styles")
        .select("*")
        .eq("form_id", formData.id)
        .single();

      const { data: questionsData } = await supabase
        .from("questions")
        .select(`
          *,
          question_options (*)
        `)
        .eq("form_id", formData.id)
        .order("position");

      setForm({
        ...formData,
        style: styleData || {},
        questions: questionsData || [],
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את הטופס",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = form.questions
      .filter((q: any) => q.required && !answers[q.id])
      .map((q: any) => q.title);

    if (missingFields.length > 0) {
      toast({
        title: "שדות חובה חסרים",
        description: `אנא מלא את השדות: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("form_responses")
        .insert({
          form_id: form.id,
          answers: answers,
        });

      if (error) throw error;

      setIsSubmitted(true);
      setAnswers({});
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את הטופס",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const getBackgroundStyle = () => {
    if (!form?.style) return {};

    const style: any = {
      backgroundColor: form.style.background_color,
      color: form.style.text_color,
    };

    if (form.style.background_type === "gradient" && form.style.gradient_start && form.style.gradient_end) {
      const direction = form.style.gradient_direction || "to right";
      style.background = `linear-gradient(${direction}, ${form.style.gradient_start}, ${form.style.gradient_end})`;
    } else if (form.style.background_type === "image" && form.style.background_image) {
      style.backgroundImage = `url(${form.style.background_image})`;
      style.backgroundSize = "cover";
      style.backgroundPosition = "center";
    }

    return style;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>טוען...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>הטופס לא נמצא</p>
      </div>
    );
  }

  if (form.status === "closed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={getBackgroundStyle()}>
        <Card className="w-full max-w-2xl p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">טופס סגור</h2>
          <p className="text-muted-foreground">
            {form.style.closed_message || "הטופס סגור כרגע. אנא נסה שוב מאוחר יותר."}
          </p>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={getBackgroundStyle()}>
        <Card className="w-full max-w-2xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold mb-2">תודה!</h2>
          <p className="text-muted-foreground mb-6">
            {form.style.success_message || "תודה רבה! הטופס נשלח בהצלחה."}
          </p>
          <Button onClick={() => {
            setIsSubmitted(false);
            setAnswers({});
          }}>
            מלא טופס נוסף
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 py-12" style={getBackgroundStyle()}>
      <Card className="max-w-2xl mx-auto p-6" style={{
        backgroundColor: `${form.style.background_color}cc`,
        color: form.style.text_color,
      }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-muted-foreground">{form.description}</p>
            )}
          </div>

          {form.questions.map((question: any) => (
            <div key={question.id} className="space-y-2">
              <Label>
                {question.title}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {question.type === "text" && (
                <Input
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.required}
                />
              )}

              {question.type === "textarea" && (
                <Textarea
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.required}
                  rows={4}
                />
              )}

              {question.type === "number" && (
                <Input
                  type="number"
                  value={answers[question.id] || ""}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  required={question.required}
                />
              )}

              {question.type === "multiple-choice" && (
                <RadioGroup
                  value={answers[question.id] || ""}
                  onValueChange={(value) => handleAnswerChange(question.id, value)}
                  required={question.required}
                >
                  {question.question_options?.map((option: any) => (
                    <div key={option.id} className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "checkbox" && (
                <div className="space-y-2">
                  {question.question_options?.map((option: any) => (
                    <div key={option.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={option.id}
                        checked={answers[question.id]?.includes(option.id)}
                        onCheckedChange={(checked) => {
                          const current = answers[question.id] || [];
                          const updated = checked
                            ? [...current, option.id]
                            : current.filter((id: string) => id !== option.id);
                          handleAnswerChange(question.id, updated);
                        }}
                      />
                      <Label htmlFor={option.id} className="font-normal cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
            style={{
              backgroundColor: form.style.primary_color,
              color: "#ffffff",
            }}
          >
            {submitting ? "שולח..." : "שלח טופס"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
