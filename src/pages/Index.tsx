import { useState, useEffect } from "react";
import { Form } from "@/types/form";
import FormBuilder from "@/components/FormBuilder";
import FormPreview from "@/components/FormPreview";
import FormsList from "@/components/FormsList";

type ViewMode = 'list' | 'edit' | 'preview';

const Index = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [currentFormId, setCurrentFormId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showPreview, setShowPreview] = useState(false);

  const currentForm = forms.find(f => f.id === currentFormId);

  // Load forms from localStorage
  useEffect(() => {
    const savedForms = localStorage.getItem('discord-forms');
    if (savedForms) {
      try {
        const parsedForms = JSON.parse(savedForms);
        setForms(parsedForms);
      } catch (error) {
        console.error('Failed to load saved forms:', error);
      }
    }
  }, []);

  // Save forms to localStorage whenever they change
  useEffect(() => {
    if (forms.length > 0) {
      localStorage.setItem('discord-forms', JSON.stringify(forms));
    }
  }, [forms]);

  const createNewForm = () => {
    const newForm: Form = {
      id: `form-${Date.now()}`,
      title: '',
      description: '',
      questions: [],
      status: 'open',
      responses: [],
      style: {
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        primaryColor: '#3b82f6',
        borderRadius: '8px',
        spacing: '1.5rem',
        backgroundType: 'solid',
        gradientStart: '#3b82f6',
        gradientEnd: '#8b5cf6',
        gradientDirection: 'to bottom',
        backgroundImage: '',
        successMessage: 'הטופס נשלח בהצלחה!',
        closedMessage: 'הטופס סגור. אנא המתן לפתיחה בפעם הבאה',
      },
    };
    setForms([...forms, newForm]);
    setCurrentFormId(newForm.id);
    setViewMode('edit');
  };

  const updateForm = (updatedForm: Form) => {
    setForms(forms.map(f => f.id === updatedForm.id ? updatedForm : f));
  };

  const deleteForm = (formId: string) => {
    setForms(forms.filter(f => f.id !== formId));
    if (currentFormId === formId) {
      setCurrentFormId(null);
      setViewMode('list');
    }
  };

  const editForm = (formId: string) => {
    setCurrentFormId(formId);
    setViewMode('edit');
    setShowPreview(false);
  };

  const previewForm = (formId: string) => {
    setCurrentFormId(formId);
    setViewMode('preview');
  };

  const backToList = () => {
    setViewMode('list');
    setCurrentFormId(null);
    setShowPreview(false);
  };

  // List view
  if (viewMode === 'list') {
    return (
      <FormsList
        forms={forms}
        onCreateNew={createNewForm}
        onEdit={editForm}
        onDelete={deleteForm}
        onPreview={previewForm}
      />
    );
  }

  // Preview view
  if (viewMode === 'preview' && currentForm) {
    return (
      <div className="min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={backToList}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:opacity-90 transition-opacity"
          >
            חזור לרשימה
          </button>
        </div>
          <FormPreview form={currentForm} onFormUpdate={updateForm} />
      </div>
    );
  }

  // Edit view with preview toggle
  if (viewMode === 'edit' && currentForm) {
    if (showPreview) {
      return (
        <div className="min-h-screen">
          <div className="fixed top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:opacity-90 transition-opacity"
            >
              חזור לעריכה
            </button>
            <button
              onClick={backToList}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg shadow-lg hover:opacity-90 transition-opacity"
            >
              חזור לרשימה
            </button>
          </div>
          <FormPreview form={currentForm} onFormUpdate={updateForm} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-6">
            <button
              onClick={backToList}
              className="text-primary hover:underline flex items-center gap-2"
            >
              ← חזור לרשימת הטפסים
            </button>
          </div>
          <FormBuilder
            form={currentForm}
            onFormChange={updateForm}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview(!showPreview)}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
