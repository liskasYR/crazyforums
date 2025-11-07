import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/editor");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) navigate("/editor");
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/editor` },
      });
      if (error) throw error;
      toast({
        title: "נרשמת בהצלחה!",
        description: "כעת תוכל להתחבר עם הפרטים שהזנת.",
      });
      await handleSignIn(e);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({ title: "התחברת בהצלחה!" });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 animate-background">
      <style>{`
        @keyframes rgbGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes bounceOnce {
          0% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
          60% { transform: translateY(4px); }
          100% { transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 10px rgba(128,0,255,0.4); }
          50% { box-shadow: 0 0 20px rgba(128,0,255,0.8); }
          100% { box-shadow: 0 0 10px rgba(128,0,255,0.4); }
        }
        .animate-background {
          animation: rgbGradient 20s ease infinite;
          background-size: 400% 400%;
        }
        .rgb-text {
          background: linear-gradient(270deg, #6e00ff, #000000, #ff00ff, #000000);
          background-size: 600% 600%;
          animation: rgbGradient 8s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bounce-once {
          animation: bounceOnce 0.6s ease;
        }
        .animated-card {
          animation: pulseGlow 3s ease-in-out infinite;
        }
        .animated-input {
          transition: all 0.3s ease;
        }
        .animated-input:focus {
          transform: scale(1.02);
          box-shadow: 0 0 10px rgba(128,0,255,0.6);
        }
        .animated-button {
          transition: all 0.3s ease;
        }
        .animated-button:hover {
          transform: scale(1.03);
          box-shadow: 0 0 12px rgba(128,0,255,0.7);
        }
      `}</style>

      <Card className="w-full max-w-md border border-purple-500 animated-card bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold rgb-text">בונה אתרים</CardTitle>
          <p className="text-sm text-gray-400">התחבר או הירשם כדי להתחיל</p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="signin" dir="rtl" className="text-white">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700 rounded-md mb-4">
              <TabsTrigger
                value="signin"
                className="text-purple-300 data-[state=active]:bg-purple-600 transition-all"
                onClick={(e) => {
                  e.currentTarget.classList.add("bounce-once");
                  setTimeout(() => e.currentTarget.classList.remove("bounce-once"), 600);
                }}
              >
                התחברות
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="text-purple-300 data-[state=active]:bg-purple-600 transition-all"
                onClick={(e) => {
                  e.currentTarget.classList.add("bounce-once");
                  setTimeout(() => e.currentTarget.classList.remove("bounce-once"), 600);
                }}
              >
                הרשמה
              </TabsTrigger>
            </TabsList>

            {/* טופס התחברות */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-300">
                    אימייל
                  </Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="bg-gray-800 text-white border-purple-500 animated-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-300">
                    סיסמה
                  </Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="bg-gray-800 text-white border-purple-500 animated-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 animated-button"
                  disabled={loading}
                >
                  {loading ? "מתחבר..." : "התחבר"}
                </Button>
              </form>
            </TabsContent>

            {/* טופס הרשמה */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-300">
                    אימייל
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="bg-gray-800 text-white border-purple-500 animated-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-300">
                    סיסמה
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className="bg-gray-800 text-white border-purple-500 animated-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 animated-button"
                  disabled={loading}
                >
                  {loading ? "נרשם..." : "הירשם"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
