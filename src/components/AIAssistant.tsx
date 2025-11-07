import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface DetaAIProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export default function DetaAI({ onImageGenerated }: DetaAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      if (!response.ok || !response.body) throw new Error("Failed to get response");

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
                newMessages[newMessages.length - 1] = { role: "assistant", content: assistantMessage };
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
      toast({ title: "שגיאה", description: "לא ניתן לקבל תגובה מה-AI", variant: "destructive" });
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
      if (!response.ok) throw new Error("Failed to generate image");
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: "הנה התמונה שיצרתי:", imageUrl: data.imageUrl }]);
      toast({ title: "התמונה נוצרה!", description: "ניתן להוסיף אותה לטופס" });
    } catch (error) {
      console.error("Error:", error);
      toast({ title: "שגיאה", description: "לא ניתן ליצור תמונה", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSend = () => { if (!input.trim() || isLoading) return; const message = input; setInput(""); streamChat(message); };
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const insertImage = (imageUrl: string) => { if (onImageGenerated) { onImageGenerated(imageUrl); toast({ title: "התמונה נוספה!", description: "התמונה נוספה לטופס" }); } };

  return (
    <>
      {/* אנימציית ספינלס גלובלית */}
      <style>{`
        @keyframes spin-infinite { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .animate-spin-infinite { animation: spin-infinite 4s linear infinite; }
      `}</style>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="fixed bottom-6 left-6">
            <Sparkles className="w-14 h-14 text-purple-400 animate-spin-infinite" />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col bg-gradient-to-br from-purple-900 to-black text-white border border-purple-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 animate-spin-infinite" />
              Deta AI
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-purple-200 py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-70 animate-spin-infinite" />
                  <p className="text-lg font-medium mb-2">ברוך הבא ל-Deta AI!</p>
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
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <Card className={`p-3 max-w-[80%] ${msg.role === "user" ? "bg-purple-600 text-white" : "bg-purple-800 text-purple-200"}`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    {msg.imageUrl && (
                      <div className="mt-3 space-y-2">
                        <img src={msg.imageUrl} alt="Generated" className="rounded-lg max-w-full" />
                        {onImageGenerated && (
                          <Button size="sm" variant="outline" onClick={() => insertImage(msg.imageUrl!)} className="w-full border-purple-400 text-purple-200 hover:bg-purple-700">
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
                  <Card className="p-3 bg-purple-800 text-purple-200">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t border-purple-700">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="שאל שאלה או בקש עזרה..."
              disabled={isLoading || isGeneratingImage}
              className="flex-1 bg-purple-900 text-white placeholder-purple-400"
            />
            <Button
              onClick={generateImage}
              disabled={isLoading || isGeneratingImage || !input.trim()}
              variant="outline"
              size="icon"
              className="border-purple-400 text-purple-300 hover:bg-purple-700"
            >
              {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading || isGeneratingImage || !input.trim()}
              size="icon"
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
