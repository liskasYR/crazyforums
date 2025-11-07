import { Question, QuestionType } from "@/types/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

const QuestionEditor = ({ question, onUpdate, onDelete }: QuestionEditorProps) => {
  const handleTypeChange = (type: QuestionType) => {
    const updatedQuestion = { ...question, type };
    
    if (type === 'multiple-choice' || type === 'checkbox') {
      if (!updatedQuestion.options || updatedQuestion.options.length === 0) {
        updatedQuestion.options = [
          { id: `opt-1-${Date.now()}`, label: 'אפשרות 1' },
          { id: `opt-2-${Date.now()}`, label: 'אפשרות 2' },
        ];
      }
    }
    
    onUpdate(updatedQuestion);
  };

  const addOption = () => {
    const options = question.options || [];
    const newOption = {
      id: `opt-${options.length + 1}-${Date.now()}`,
      label: `אפשרות ${options.length + 1}`,
    };
    onUpdate({ ...question, options: [...options, newOption] });
  };

  const updateOption = (optionId: string, label: string) => {
    const options = question.options || [];
    const updatedOptions = options.map(opt => 
      opt.id === optionId ? { ...opt, label } : opt
    );
    onUpdate({ ...question, options: updatedOptions });
  };

  const deleteOption = (optionId: string) => {
    const options = question.options || [];
    const updatedOptions = options.filter(opt => opt.id !== optionId);
    onUpdate({ ...question, options: updatedOptions });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-2 cursor-move">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label>כותרת השאלה</Label>
            <Input
              value={question.title}
              onChange={(e) => onUpdate({ ...question, title: e.target.value })}
              placeholder="הזן שאלה..."
              dir="auto"
            />
          </div>

          <div className="space-y-2">
            <Label>סוג השאלה</Label>
            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">תשובה קצרה</SelectItem>
                <SelectItem value="textarea">תשובה ארוכה</SelectItem>
                <SelectItem value="multiple-choice">בחירה מרובה</SelectItem>
                <SelectItem value="checkbox">תיבות סימון</SelectItem>
                <SelectItem value="number">שדה מספר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(question.type === 'multiple-choice' || question.type === 'checkbox') && (
            <div className="space-y-3">
              <Label>אפשרויות</Label>
              {question.options?.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.label}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder="הזן אפשרות..."
                    dir="auto"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteOption(option.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                הוסף אפשרות
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id={`required-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) => 
                onUpdate({ ...question, required: checked as boolean })
              }
            />
            <Label htmlFor={`required-${question.id}`} className="cursor-pointer">
              שאלה חובה
            </Label>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>
    </Card>
  );
};

export default QuestionEditor;
