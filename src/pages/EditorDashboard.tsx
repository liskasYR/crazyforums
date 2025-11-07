import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, Edit, Trash2, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditorDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadForms();
    }
  }, [user]);

  const loadForms = async () => {
    try {
      // Get forms where user is creator
      const { data: ownedForms, error: ownedError } = await supabase
        .from("forms")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });

      if (ownedError) throw ownedError;

      // Get forms where user is an editor
      const { data: editorRelations, error: editorError } = await supabase
        .from("form_editors")
        .select("form_id")
        .eq("user_id", user?.id);

      if (editorError) throw editorError;

      const editorFormIds = editorRelations?.map(r => r.form_id) || [];
      
      let sharedForms = [];
      if (editorFormIds.length > 0) {
        const { data: sharedFormsData, error: sharedError } = await supabase
          .from("forms")
          .select("*")
          .in("id", editorFormIds)
          .order("created_at", { ascending: false });

        if (sharedError) throw sharedError;
        sharedForms = sharedFormsData || [];
      }

      // Combine and deduplicate forms
      const allForms = [...(ownedForms || []), ...sharedForms];
      const uniqueForms = Array.from(
        new Map(allForms.map(form => [form.id, form])).values()
      );

      setForms(uniqueForms);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון טפסים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewForm = async () => {
    try {
      const slug = await supabase.rpc("generate_unique_slug", { base_text: "new-form" });

      const { data: newForm, error: formError } = await supabase
        .from("forms")
        .insert({
          title: "טופס חדש",
          description: "תיאור הטופס",
          slug: slug.data,
          created_by: user?.id,
        })
        .select()
        .single();

      if (formError) throw formError;

      const { error: styleError } = await supabase
        .from("form_styles")
        .insert({
          form_id: newForm.id,
        });

      if (styleError) throw styleError;

      navigate(`/editor/${newForm.id}`);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור טופס",
        variant: "destructive",
      });
    }
  };

  const deleteForm = async (formId: string) => {
    try {
      const { error } = await supabase
        .from("forms")
        .delete()
        .eq("id", formId);

      if (error) throw error;

      setForms((prev) => prev.filter((f) => f.id !== formId));
      toast({
        title: "הטופס נמחק",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק טופס",
        variant: "destructive",
      });
    }
  };

  const sendInvitation = async () => {
    if (!inviteEmail || !selectedFormId) return;

    setInviting(true);
    try {
      // Get form details
      const form = forms.find((f) => f.id === selectedFormId);

      // Call edge function to send email
      const { error } = await supabase.functions.invoke("send-editor-invitation", {
        body: {
          toEmail: inviteEmail,
          formTitle: form.title,
          formSlug: form.slug,
          inviterName: user?.email || "משתמש",
        },
      });

      if (error) throw error;

      toast({
        title: "ההזמנה נשלחה!",
        description: `הזמנה נשלחה ל-${inviteEmail}`,
      });

      setInviteEmail("");
      setSelectedFormId("");
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח הזמנה",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const copyFormLink = (slug: string) => {
    const link = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "הקישור הועתק!",
      description: "קישור הטופס הועתק ללוח",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">הטפסים שלי</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={createNewForm}>
              <Plus className="w-4 h-4 ml-2" />
              טופס חדש
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">אין לך טפסים עדיין</p>
            <Button onClick={createNewForm}>
              <Plus className="w-4 h-4 ml-2" />
              צור טופס ראשון
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <CardTitle>{form.title}</CardTitle>
                  <CardDescription>{form.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/editor/${form.id}`)}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      ערוך
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyFormLink(form.slug)}
                    >
                      <ExternalLink className="w-4 h-4 ml-1" />
                      העתק קישור
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFormId(form.id)}
                        >
                          <Share2 className="w-4 h-4 ml-1" />
                          שתף
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>שתף גישה לעריכה</DialogTitle>
                          <DialogDescription>
                            הזן כתובת אימייל של עורך נוסף
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="invite-email">אימייל</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="editor@example.com"
                            />
                          </div>
                          <Button
                            onClick={sendInvitation}
                            disabled={inviting || !inviteEmail}
                            className="w-full"
                          >
                            {inviting ? "שולח..." : "שלח הזמנה"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {form.created_by === user?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4 ml-1" />
                            מחק
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                            <AlertDialogDescription>
                              פעולה זו תמחק את הטופס לצמיתות
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteForm(form.id)}>
                              מחק
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
