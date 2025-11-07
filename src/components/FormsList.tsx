import { useState, useEffect } from "react";
import { Form } from "@/types/form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FormsListProps {
  forms: Form[];
  onCreateNew: () => void;
  onEdit: (formId: string) => void;
  onDelete: (formId: string) => void;
  onPreview: (formId: string) => void;
}

const FormsList = ({ forms, onCreateNew, onEdit, onDelete, onPreview }: FormsListProps) => {
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');

  // Load background color from localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('home-background-color');
    if (savedColor) {
      setBackgroundColor(savedColor);
    }
  }, []);

  // Save background color to localStorage
  const handleColorChange = (color: string) => {
    setBackgroundColor(color);
    localStorage.setItem('home-background-color', color);
  };

  // Convert hex (#rrggbb) to "H S% L%" string for CSS variable consumption
  const hexToHslTriplet = (hex: string) => {
    try {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
      const r = parseInt(c.substring(0, 2), 16) / 255;
      const g = parseInt(c.substring(2, 4), 16) / 255;
      const b = parseInt(c.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch {
      return '0 0% 100%';
    }
  };

  const backgroundVar = hexToHslTriplet(backgroundColor);

  return (
    <div className="min-h-screen bg-background" style={{ ['--background' as any]: backgroundVar }}>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">הטפסים שלי</h1>
            <p className="text-muted-foreground">נהל את כל הטפסים עבור שרת הדיסקורד שלך</p>
          </div>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="lg">
                  <Settings className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h3 className="font-semibold">הגדרות דף הבית</h3>
                  <div className="space-y-2">
                    <Label htmlFor="bg-color">צבע רקע</Label>
                    <div className="flex gap-2">
                      <Input
                        id="bg-color"
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleColorChange('#ffffff')}
                        className="flex-1"
                      >
                        לבן
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleColorChange('#000000')}
                        className="flex-1"
                      >
                        שחור
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleColorChange('#1e293b')}
                        className="flex-1"
                      >
                        כהה
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button onClick={onCreateNew} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              טופס חדש
            </Button>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">אין טפסים עדיין</h2>
              <p className="text-muted-foreground">
                צור את הטופס הראשון שלך כדי להתחיל לאסוף מידע מהצוות שלך בדיסקורד
              </p>
              <Button onClick={onCreateNew} size="lg" className="mt-4">
                <Plus className="w-5 h-5 mr-2" />
                צור טופס ראשון
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => (
              <Card key={form.id} className="p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold line-clamp-1" dir="auto">
                    {form.title || 'ללא כותרת'}
                  </h3>
                  {form.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2" dir="auto">
                      {form.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {form.questions.length} שאלות
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(form.id)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    תצוגה
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onEdit(form.id)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    עריכה
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת טופס</AlertDialogTitle>
                        <AlertDialogDescription>
                          האם אתה בטוח שברצונך למחוק את הטופס "{form.title || 'ללא כותרת'}"? 
                          פעולה זו לא ניתנת לביטול.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(form.id)}>
                          מחק
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormsList;
