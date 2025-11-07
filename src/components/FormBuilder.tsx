import { useState, useEffect } from "react";
import { Form, Question, QuestionType } from "@/types/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import QuestionEditor from "./QuestionEditor";
import CustomizationPanel from "./CustomizationPanel";
import { Plus, Save, Eye, EyeOff, Lock, Unlock, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FormBuilderProps {
  form: Form;
  onFormChange: (form: Form) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
}

const FormBuilder = ({ form, onFormChange, showPreview, onTogglePreview }: FormBuilderProps) => {
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      type,
      title: '',
      required: false,
      options: type === 'multiple-choice' || type === 'checkbox' 
        ? [
            { id: `opt-1-${Date.now()}`, label: 'אפשרות 1' },
            { id: `opt-2-${Date.now()}`, label: 'אפשרות 2' },
          ]
        : undefined,
    };
    onFormChange({ ...form, questions: [...form.questions, newQuestion] });
  };

  const updateQuestion = (index: number, question: Question) => {
    const updatedQuestions = [...form.questions];
    updatedQuestions[index] = question;
    onFormChange({ ...form, questions: updatedQuestions });
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = form.questions.filter((_, i) => i !== index);
    onFormChange({ ...form, questions: updatedQuestions });
  };

  const saveForm = () => {
    localStorage.setItem('discord-form', JSON.stringify(form));
    toast({
      title: "הטופס נשמר בהצלחה!",
      description: "הטופס שלך נשמר במכשיר שלך.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">עורך טפסים</h2>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                תגובות ({form.responses?.length || 0})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>תגובות ותשובות</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {(!form.responses || form.responses.length === 0) ? (
                  <p className="text-center text-muted-foreground py-8">
                    אין תגובות עדיין
                  </p>
                ) : (
                  form.responses.map((response) => (
                    <Card key={response.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm text-muted-foreground">
                          {new Date(response.submittedAt).toLocaleString('he-IL')}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedResponses = form.responses.filter(r => r.id !== response.id);
                            onFormChange({ ...form, responses: updatedResponses });
                            toast({
                              title: "התגובה נמחקה",
                              description: "התגובה הוסרה בהצלחה",
                            });
                          }}
                        >
                          מחק
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {form.questions.map((question) => {
                          const answer = response.answers[question.id];
                          if (!answer && answer !== 0) return null;
                          
                          return (
                            <div key={question.id} className="border-b pb-2">
                              <p className="font-medium text-sm mb-1">{question.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {question.type === 'checkbox' 
                                  ? Object.entries(answer)
                                      .filter(([_, checked]) => checked)
                                      .map(([optId]) => {
                                        const opt = question.options?.find(o => o.id === optId);
                                        return opt?.label;
                                      })
                                      .join(', ')
                                  : question.type === 'multiple-choice'
                                    ? question.options?.find(o => o.id === answer)?.label
                                    : answer}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant={form.status === 'closed' ? 'destructive' : 'outline'}
            onClick={() => onFormChange({ ...form, status: form.status === 'open' ? 'closed' : 'open' })}
          >
            {form.status === 'closed' ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                טופס סגור
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                טופס פתוח
              </>
            )}
          </Button>
          <Button onClick={onTogglePreview} variant="outline">
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? 'הסתר תצוגה מקדימה' : 'הצג תצוגה מקדימה'}
          </Button>
          <Button onClick={saveForm}>
            <Save className="w-4 h-4 mr-2" />
            שמור טופס
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>כותרת הטופס</Label>
            <Input
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              placeholder="הזן כותרת..."
              dir="auto"
            />
          </div>

          <div className="space-y-2">
            <Label>תיאור הטופס</Label>
            <Textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              placeholder="הזן תיאור..."
              rows={3}
              dir="auto"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">שאלות</h3>
        {form.questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            onUpdate={(q) => updateQuestion(index, q)}
            onDelete={() => deleteQuestion(index)}
          />
        ))}
      </div>

      <Card className="p-4">
        <div className="space-y-2">
          <h4 className="font-medium mb-3">הוסף שאלה</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => addQuestion('text')}
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              תשובה קצרה
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addQuestion('textarea')}
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              תשובה ארוכה
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addQuestion('multiple-choice')}
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              בחירה מרובה
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addQuestion('checkbox')}
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              תיבות סימון
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => addQuestion('number')}
              className="justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              שדה מספר
            </Button>
          </div>
        </div>
      </Card>

      <CustomizationPanel
        style={form.style}
        onStyleChange={(style) => onFormChange({ ...form, style })}
      />
    </div>
  );
};

export default FormBuilder;
