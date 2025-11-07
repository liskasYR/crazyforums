import { useState } from "react";
import { Form, FormResponse } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface FormPreviewProps {
  form: Form;
  onFormUpdate?: (form: Form) => void;
}

const FormPreview = ({ form, onFormUpdate }: FormPreviewProps) => {
  const { style } = form;
  const textColor = (style as any).text_color || style.textColor || '#000000';
  const primaryColor = (style as any).primary_color || style.primaryColor || '#3b82f6';
  const backgroundType = (style as any).background_type || style.backgroundType || 'solid';
  const backgroundColor = (style as any).background_color || style.backgroundColor || '#ffffff';
  const gradientStart = (style as any).gradient_start || style.gradientStart || '#3b82f6';
  const gradientEnd = (style as any).gradient_end || style.gradientEnd || '#8b5cf6';
  const gradientDirection = (style as any).gradient_direction || style.gradientDirection || 'to bottom';
  const backgroundImage = (style as any).background_image || style.backgroundImage || '';
  const borderRadius = (style as any).border_radius || style.borderRadius || '8px';
  const spacing = style.spacing || '1.5rem';
  const successMessage = (style as any).success_message || style.successMessage || 'הטופס נשלח בהצלחה!';
  const closedMessage = (style as any).closed_message || style.closedMessage || 'הטופס סגור';
  const submitButtonText = (style as any).submit_button_text || 'שלח טופס';
  const validationMessage = (style as any).validation_message || 'יש לענות על כל השאלות המסומנות כחובה (*)';

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user starts answering
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all required questions are answered
    const unansweredRequired = form.questions.filter(q => {
      if (!q.required) return false;
      
      const answer = answers[q.id];
      
      // Check if answer is empty, undefined, or null
      if (answer === undefined || answer === null || answer === '') return true;
      
      // For checkboxes, check if any option is selected
      if (q.type === 'checkbox' && (!answer || Object.keys(answer).length === 0)) return true;
      
      return false;
    });

    if (unansweredRequired.length > 0) {
      // Mark all unanswered required questions with errors
      const newErrors: Record<string, boolean> = {};
      unansweredRequired.forEach(q => {
        newErrors[q.id] = true;
      });
      setErrors(newErrors);
      
      toast({
        title: "לא ניתן לשלוח טופס",
        description: validationMessage,
        variant: "destructive",
      });
      
      // Scroll to first error
      const firstErrorElement = document.getElementById(`question-${unansweredRequired[0].id}`);
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }

    // Form is valid - save response
    const newResponse: FormResponse = {
      id: `response-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      answers: answers
    };
    
    // Save response to form
    if (onFormUpdate) {
      const updatedForm = {
        ...form,
        responses: [...(form.responses || []), newResponse]
      };
      onFormUpdate(updatedForm);
    }
    
    toast({
      title: "הטופס נשלח בהצלחה!",
      description: "תודה על מילוי הטופס.",
    });
    
    // Show success message
    setIsSubmitted(true);
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      color: textColor,
      minHeight: '100vh',
      padding: '1.5rem',
      transition: 'background-color 0.3s ease, color 0.3s ease, background 0.3s ease'
    };

    // Gradient background
    if (backgroundType === 'gradient') {
      return {
        ...baseStyle,
        background: `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`,
        backgroundAttachment: 'fixed',
      };
    }

    // Image background
    if (backgroundType === 'image' && backgroundImage) {
      return {
        ...baseStyle,
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      };
    }

    // Solid color background (default)
    return {
      ...baseStyle,
      backgroundColor,
    };
  };

  return (
    <div style={getBackgroundStyle()}>
      <div className="max-w-2xl mx-auto">
        {form.status === 'closed' ? (
          <Card 
            className="p-12 text-center shadow-xl"
            style={{
              borderRadius: style.borderRadius,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: primaryColor, transition: 'color 0.3s ease' }}>
              {closedMessage}
            </h2>
                <p className="text-muted-foreground">
                  אנא המתן לפתיחת הטופס בפעם הבאה
                </p>
              </div>
            </div>
          </Card>
        ) : isSubmitted ? (
          <Card 
            className="p-12 text-center shadow-xl"
            style={{
              borderRadius: style.borderRadius,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold" style={{ color: primaryColor, transition: 'color 0.3s ease' }}>
                  {successMessage}
                </h2>
                <p className="text-muted-foreground">
                  תודה על מילוי הטופס
                </p>
              </div>
              <Button
                onClick={() => {
                  setIsSubmitted(false);
                  setAnswers({});
                }}
                style={{ 
                  backgroundColor: primaryColor,
                  borderRadius: borderRadius,
                  transition: 'all 0.3s ease'
                }}
              >
                מלא טופס נוסף
              </Button>
            </div>
          </Card>
        ) : (
        <form onSubmit={handleSubmit}>
          <Card 
            className="p-8 space-y-6 shadow-xl"
            style={{
              borderRadius: style.borderRadius,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
          >
          <div className="space-y-2" dir="auto">
            <h1 
              className="text-3xl font-bold"
              style={{ color: primaryColor, transition: 'color 0.3s ease' }}
            >
              {form.title || 'כותרת הטופס'}
            </h1>
            {form.description && (
              <p className="text-muted-foreground">
                {form.description}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {form.questions.map((question, index) => (
              <div 
                key={question.id}
                id={`question-${question.id}`}
                className="space-y-3"
                style={{ marginBottom: spacing }}
                dir="auto"
              >
                <Label className="text-base font-medium">
                  {index + 1}. {question.title}
                  {question.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                {errors[question.id] && (
                  <p className="text-sm text-destructive font-medium">
                    שדה זה הינו חובה
                  </p>
                )}

                {question.type === 'text' && (
                  <Input 
                    placeholder="תשובתך..." 
                    dir="auto"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    style={{ borderRadius: borderRadius }}
                    className={errors[question.id] ? 'border-destructive border-2' : ''}
                  />
                )}

                {question.type === 'number' && (
                  <Input 
                    type="number" 
                    placeholder="הזן מספר..." 
                    dir="auto"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    style={{ borderRadius: borderRadius }}
                    className={errors[question.id] ? 'border-destructive border-2' : ''}
                  />
                )}

                {question.type === 'textarea' && (
                  <Textarea 
                    placeholder="תשובתך..." 
                    rows={4}
                    dir="auto"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    style={{ borderRadius: borderRadius }}
                    className={errors[question.id] ? 'border-destructive border-2' : ''}
                  />
                )}

                {question.type === 'multiple-choice' && (
                  <RadioGroup 
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className={errors[question.id] ? 'border-2 border-destructive rounded-md p-3' : ''}
                  >
                    {question.options?.map((option) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label 
                          htmlFor={option.id} 
                          className="cursor-pointer font-normal"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {question.type === 'checkbox' && (
                  <div className={`space-y-3 ${errors[question.id] ? 'border-2 border-destructive rounded-md p-3' : ''}`}>
                    {question.options?.map((option) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={option.id}
                          checked={answers[question.id]?.[option.id] || false}
                          onCheckedChange={(checked) => {
                            const currentAnswers = answers[question.id] || {};
                            handleAnswerChange(question.id, {
                              ...currentAnswers,
                              [option.id]: checked
                            });
                          }}
                        />
                        <Label 
                          htmlFor={option.id} 
                          className="cursor-pointer font-normal"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {form.questions.length > 0 && (
            <Button 
              type="submit"
              className="w-full"
              style={{ 
                backgroundColor: primaryColor,
                borderRadius: borderRadius,
                transition: 'all 0.3s ease'
              }}
            >
              {submitButtonText}
            </Button>
          )}
          </Card>
        </form>
        )}
      </div>
    </div>
  );
};

export default FormPreview;
