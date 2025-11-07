import { FormStyle } from "@/types/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomizationPanelProps {
  style: any;
  onStyleChange: (style: any) => void;
}

const CustomizationPanel = ({ style, onStyleChange }: CustomizationPanelProps) => {
  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5" />
        <h3 className="font-semibold">עיצוב הטופס</h3>
      </div>

      <Tabs 
        value={style.background_type || style.backgroundType} 
        onValueChange={(value) => onStyleChange({ ...style, background_type: value as 'solid' | 'gradient' | 'image' })}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="solid">צבע אחיד</TabsTrigger>
          <TabsTrigger value="gradient">מעבר צבעים</TabsTrigger>
          <TabsTrigger value="image">תמונת רקע</TabsTrigger>
        </TabsList>

        <TabsContent value="solid" className="space-y-4">
          <div className="space-y-2">
            <Label>צבע רקע</Label>
            <Input
              type="color"
              value={style.background_color || style.backgroundColor || '#ffffff'}
              onChange={(e) => onStyleChange({ ...style, background_color: e.target.value, background_type: 'solid' })}
              className="h-10 cursor-pointer"
            />
          </div>
        </TabsContent>

        <TabsContent value="gradient" className="space-y-4">
          <div className="space-y-2">
            <Label>צבע התחלה</Label>
            <Input
              type="color"
              value={style.gradient_start || style.gradientStart || '#3b82f6'}
              onChange={(e) => onStyleChange({ ...style, gradient_start: e.target.value, background_type: 'gradient' })}
              className="h-10 cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <Label>צבע סיום</Label>
            <Input
              type="color"
              value={style.gradient_end || style.gradientEnd || '#8b5cf6'}
              onChange={(e) => onStyleChange({ ...style, gradient_end: e.target.value, background_type: 'gradient' })}
              className="h-10 cursor-pointer"
            />
          </div>
          <div className="space-y-2">
            <Label>כיוון המעבר</Label>
            <Select 
              value={style.gradient_direction || style.gradientDirection || 'to bottom'} 
              onValueChange={(value) => onStyleChange({ ...style, gradient_direction: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to bottom">למטה</SelectItem>
                <SelectItem value="to top">למעלה</SelectItem>
                <SelectItem value="to right">ימינה</SelectItem>
                <SelectItem value="to left">שמאלה</SelectItem>
                <SelectItem value="to bottom right">אלכסון ימינה למטה</SelectItem>
                <SelectItem value="to bottom left">אלכסון שמאלה למטה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <div className="space-y-2">
            <Label>כתובת תמונה (URL)</Label>
            <Input
              type="url"
              value={style.background_image || style.backgroundImage || ''}
              onChange={(e) => onStyleChange({ ...style, background_image: e.target.value, background_type: e.target.value ? 'image' : 'solid' })}
              placeholder="https://example.com/image.jpg"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              הדבק קישור לתמונה מהאינטרנט
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>הודעת הצלחה</Label>
          <Input
            value={style.success_message || style.successMessage || ''}
            onChange={(e) => onStyleChange({ ...style, success_message: e.target.value })}
            placeholder="הטופס נשלח בהצלחה!"
            dir="auto"
          />
          <p className="text-xs text-muted-foreground">
            ההודעה שתוצג למשתמש לאחר שליחת הטופס
          </p>
        </div>

        <div className="space-y-2">
          <Label>הודעת טופס סגור</Label>
          <Input
            value={style.closed_message || style.closedMessage || ''}
            onChange={(e) => onStyleChange({ ...style, closed_message: e.target.value })}
            placeholder="הטופס סגור"
            dir="auto"
          />
          <p className="text-xs text-muted-foreground">
            ההודעה שתוצג כאשר הטופס סגור
          </p>
        </div>

        <div className="space-y-2">
          <Label>צבע טקסט</Label>
          <Input
            type="color"
            value={style.text_color || style.textColor || '#000000'}
            onChange={(e) => onStyleChange({ ...style, text_color: e.target.value })}
            className="h-10 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label>צבע ראשי</Label>
          <Input
            type="color"
            value={style.primary_color || style.primaryColor || '#3b82f6'}
            onChange={(e) => onStyleChange({ ...style, primary_color: e.target.value })}
            className="h-10 cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label>עיגול פינות</Label>
          <Select 
            value={style.border_radius || style.borderRadius || 'medium'} 
            onValueChange={(value) => onStyleChange({ ...style, border_radius: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0px">ללא</SelectItem>
              <SelectItem value="4px">קטן</SelectItem>
              <SelectItem value="8px">בינוני</SelectItem>
              <SelectItem value="12px">גדול</SelectItem>
              <SelectItem value="16px">מאוד גדול</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>ריווח בין שאלות</Label>
          <Select 
            value={style.spacing || 'normal'} 
            onValueChange={(value) => onStyleChange({ ...style, spacing: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1rem">קטן</SelectItem>
              <SelectItem value="1.5rem">בינוני</SelectItem>
              <SelectItem value="2rem">גדול</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
};

export default CustomizationPanel;
