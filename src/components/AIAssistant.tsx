import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface AIAssistantProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export default function AIAssistant({ onImageGenerated }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: userMessage }],
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let textBuffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;

        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantMessage,
                };
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לקבל תגובה מה-AI",
        variant: "destructive",
      });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!input.trim()) return;

    setIsGeneratingImage(true);
    const imagePrompt = input;
    setInput("");

    setMessages(prev => [...prev, { role: "user", content: `צור תמונה: ${imagePrompt}` }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "generate_image",
            messages: [{ role: "user", content: imagePrompt }],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate image");
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "הנה התמונה שיצרתי:", imageUrl: data.imageUrl },
      ]);

      toast({
        title: "התמונה נוצרה!",
        description: "ניתן להוסיף אותה לטופס",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור תמונה",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    streamChat(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertImage = (imageUrl: string) => {
    if (onImageGenerated) {
      onImageGenerated(imageUrl);
      toast({
        title: "התמונה נוספה!",
        description: "התמונה נוספה לטופס",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-6 left-6 rounded-full w-14 h-14 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            עוזר AI לעיצוב טפסים
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">ברוך הבא לעוזר ה-AI!</p>
                <p className="text-sm">אני יכול לעזור לך:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• לעצב טופס מותאם אישית</li>
                  <li>• לענות על שאלות</li>
                  <li>• ליצור תמונות לטופס</li>
                  <li>• לתת הצעות לשיפור</li>
                </ul>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`p-3 max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  {msg.imageUrl && (
                    <div className="mt-3 space-y-2">
                      <img
                        src={msg.imageUrl}
                        alt="Generated"
                        className="rounded-lg max-w-full"
                      />
                      {onImageGenerated && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => insertImage(msg.imageUrl!)}
                          className="w-full"
                        >
                          הוסף לטופס
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="p-3 bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="שאל שאלה או בקש עזרה..."
            disabled={isLoading || isGeneratingImage}
            className="flex-1"
          />
          <Button
            onClick={generateImage}
            disabled={isLoading || isGeneratingImage || !input.trim()}
            variant="outline"
            size="icon"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || isGeneratingImage || !input.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
