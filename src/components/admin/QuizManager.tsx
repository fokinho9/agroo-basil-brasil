import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Pencil, GripVertical, Brain } from 'lucide-react';
import { toast } from 'sonner';

// ---- Types ----
interface Quiz {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: any;
  display_order: number;
}

interface QuizResult {
  id: string;
  quiz_id: string;
  result_label: string;
  description: string | null;
  match_rules: any;
  recommended_product_ids: string[] | null;
  recommended_category_slug: string | null;
}

// ---- Hooks ----
function useQuizzes() {
  return useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Quiz[];
    },
  });
}

function useQuizQuestions(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-questions', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      const { data, error } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('display_order');
      if (error) throw error;
      return (data || []) as QuizQuestion[];
    },
    enabled: !!quizId,
  });
}

function useQuizResults(quizId: string | null) {
  return useQuery({
    queryKey: ['quiz-results', quizId],
    queryFn: async () => {
      if (!quizId) return [];
      const { data, error } = await supabase.from('quiz_results').select('*').eq('quiz_id', quizId);
      if (error) throw error;
      return (data || []) as QuizResult[];
    },
    enabled: !!quizId,
  });
}

// ---- Component ----
export default function QuizManager() {
  const queryClient = useQueryClient();
  const { data: quizzes = [] } = useQuizzes();

  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizDialog, setQuizDialog] = useState(false);
  const [quizForm, setQuizForm] = useState({ title: '', description: '', active: true });

  // Quiz detail view
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const { data: questions = [] } = useQuizQuestions(selectedQuizId);
  const { data: results = [] } = useQuizResults(selectedQuizId);

  // Question dialog
  const [questionDialog, setQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [questionForm, setQuestionForm] = useState({ question: '', options: ['', ''] });

  // Result dialog
  const [resultDialog, setResultDialog] = useState(false);
  const [editingResult, setEditingResult] = useState<QuizResult | null>(null);
  const [resultForm, setResultForm] = useState({
    result_label: '',
    description: '',
    match_rules: '' as string,
    recommended_category_slug: '',
    recommended_product_ids: '',
  });

  // ---- Quiz CRUD ----
  const saveQuiz = useMutation({
    mutationFn: async () => {
      const payload = { title: quizForm.title, description: quizForm.description || null, active: quizForm.active };
      if (editingQuiz) {
        const { error } = await supabase.from('quizzes').update(payload).eq('id', editingQuiz.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quizzes').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      setQuizDialog(false);
      toast.success(editingQuiz ? 'Quiz atualizado!' : 'Quiz criado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuiz = useMutation({
    mutationFn: async (id: string) => {
      // Delete related questions and results first
      await supabase.from('quiz_questions').delete().eq('quiz_id', id);
      await supabase.from('quiz_results').delete().eq('quiz_id', id);
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      if (selectedQuizId) setSelectedQuizId(null);
      toast.success('Quiz excluído');
    },
  });

  const toggleQuiz = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('quizzes').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quizzes'] }),
  });

  // ---- Question CRUD ----
  const saveQuestion = useMutation({
    mutationFn: async () => {
      if (!selectedQuizId) return;
      const opts = questionForm.options.filter(o => o.trim());
      const payload = {
        quiz_id: selectedQuizId,
        question: questionForm.question,
        options: opts,
        display_order: editingQuestion ? editingQuestion.display_order : questions.length,
      };
      if (editingQuestion) {
        const { error } = await supabase.from('quiz_questions').update(payload).eq('id', editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quiz_questions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', selectedQuizId] });
      setQuestionDialog(false);
      toast.success('Pergunta salva!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', selectedQuizId] });
      toast.success('Pergunta excluída');
    },
  });

  // ---- Result CRUD ----
  const saveResult = useMutation({
    mutationFn: async () => {
      if (!selectedQuizId) return;
      let matchRules = {};
      try { matchRules = JSON.parse(resultForm.match_rules || '{}'); } catch { matchRules = {}; }
      const productIds = resultForm.recommended_product_ids
        ? resultForm.recommended_product_ids.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      const payload = {
        quiz_id: selectedQuizId,
        result_label: resultForm.result_label,
        description: resultForm.description || null,
        match_rules: matchRules,
        recommended_category_slug: resultForm.recommended_category_slug || null,
        recommended_product_ids: productIds,
      };
      if (editingResult) {
        const { error } = await supabase.from('quiz_results').update(payload).eq('id', editingResult.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quiz_results').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-results', selectedQuizId] });
      setResultDialog(false);
      toast.success('Resultado salvo!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteResult = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('quiz_results').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-results', selectedQuizId] });
      toast.success('Resultado excluído');
    },
  });

  // ---- Helpers ----
  const openNewQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({ title: '', description: '', active: true });
    setQuizDialog(true);
  };

  const openEditQuiz = (q: Quiz) => {
    setEditingQuiz(q);
    setQuizForm({ title: q.title, description: q.description || '', active: q.active });
    setQuizDialog(true);
  };

  const openNewQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({ question: '', options: ['', ''] });
    setQuestionDialog(true);
  };

  const openEditQuestion = (q: QuizQuestion) => {
    setEditingQuestion(q);
    const opts = Array.isArray(q.options) ? q.options.map(String) : ['', ''];
    setQuestionForm({ question: q.question, options: opts });
    setQuestionDialog(true);
  };

  const openNewResult = () => {
    setEditingResult(null);
    setResultForm({ result_label: '', description: '', match_rules: '{}', recommended_category_slug: '', recommended_product_ids: '' });
    setResultDialog(true);
  };

  const openEditResult = (r: QuizResult) => {
    setEditingResult(r);
    setResultForm({
      result_label: r.result_label,
      description: r.description || '',
      match_rules: JSON.stringify(r.match_rules, null, 2),
      recommended_category_slug: r.recommended_category_slug || '',
      recommended_product_ids: (r.recommended_product_ids || []).join(', '),
    });
    setResultDialog(true);
  };

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  // ---- Detail View ----
  if (selectedQuizId && selectedQuiz) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedQuizId(null)}>← Voltar</Button>
          <h3 className="font-semibold text-lg">{selectedQuiz.title}</h3>
          <Badge variant={selectedQuiz.active ? 'default' : 'outline'}>{selectedQuiz.active ? 'Ativo' : 'Inativo'}</Badge>
        </div>

        {selectedQuiz.description && <p className="text-sm text-muted-foreground">{selectedQuiz.description}</p>}

        {/* Questions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Perguntas ({questions.length})</CardTitle>
            <Button size="sm" className="gap-1" onClick={openNewQuestion}><Plus className="h-3 w-3" /> Pergunta</Button>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pergunta. Adicione perguntas ao quiz.</p>
            ) : (
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-bold text-muted-foreground mt-0.5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{q.question}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => (
                          <Badge key={oi} variant="secondary" className="text-xs">{String(opt)}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditQuestion(q)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteQuestion.mutate(q.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Resultados ({results.length})</CardTitle>
            <Button size="sm" className="gap-1" onClick={openNewResult}><Plus className="h-3 w-3" /> Resultado</Button>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado. Defina os possíveis resultados do quiz.</p>
            ) : (
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{r.result_label}</p>
                      {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.recommended_category_slug && <Badge variant="outline" className="text-xs">Categoria: {r.recommended_category_slug}</Badge>}
                        {r.recommended_product_ids?.length ? <Badge variant="outline" className="text-xs">{r.recommended_product_ids.length} produtos</Badge> : null}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditResult(r)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteResult.mutate(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Dialog */}
        <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Pergunta</Label>
                <Input value={questionForm.question} onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })} placeholder="Ex: Qual seu estilo de montaria?" className="mt-1" />
              </div>
              <div>
                <Label>Opções de Resposta</Label>
                <div className="space-y-2 mt-1">
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={e => {
                          const newOpts = [...questionForm.options];
                          newOpts[i] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOpts });
                        }}
                        placeholder={`Opção ${i + 1}`}
                      />
                      {questionForm.options.length > 2 && (
                        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => {
                          setQuestionForm({ ...questionForm, options: questionForm.options.filter((_, j) => j !== i) });
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {questionForm.options.length < 6 && (
                    <Button variant="outline" size="sm" onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, ''] })}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar Opção
                    </Button>
                  )}
                </div>
              </div>
              <Button className="w-full" onClick={() => saveQuestion.mutate()} disabled={saveQuestion.isPending}>
                {editingQuestion ? 'Salvar' : 'Criar Pergunta'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Result Dialog */}
        <Dialog open={resultDialog} onOpenChange={setResultDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingResult ? 'Editar Resultado' : 'Novo Resultado'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Resultado</Label>
                <Input value={resultForm.result_label} onChange={e => setResultForm({ ...resultForm, result_label: e.target.value })} placeholder="Ex: Cowboy Clássico" className="mt-1" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={resultForm.description} onChange={e => setResultForm({ ...resultForm, description: e.target.value })} placeholder="Descrição do perfil do resultado" className="mt-1" rows={2} />
              </div>
              <div>
                <Label>Slug da Categoria Recomendada</Label>
                <Input value={resultForm.recommended_category_slug} onChange={e => setResultForm({ ...resultForm, recommended_category_slug: e.target.value })} placeholder="Ex: botas-country" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Direciona para uma categoria específica</p>
              </div>
              <div>
                <Label>IDs de Produtos Recomendados</Label>
                <Input value={resultForm.recommended_product_ids} onChange={e => setResultForm({ ...resultForm, recommended_product_ids: e.target.value })} placeholder="id1, id2, id3" className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Separados por vírgula</p>
              </div>
              <div>
                <Label>Regras de Match (JSON)</Label>
                <Textarea
                  value={resultForm.match_rules}
                  onChange={e => setResultForm({ ...resultForm, match_rules: e.target.value })}
                  placeholder='{"0": ["Opção A"], "1": ["Opção B"]}'
                  className="mt-1 font-mono text-xs"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Chave = índice da pergunta, valor = array de opções que levam a este resultado
                </p>
              </div>
              <Button className="w-full" onClick={() => saveResult.mutate()} disabled={saveResult.isPending}>
                {editingResult ? 'Salvar' : 'Criar Resultado'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---- List View ----
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Quizzes de Recomendação</h3>
        <Button onClick={openNewQuiz} className="gap-2" size="sm">
          <Plus className="h-4 w-4" /> Novo Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Nenhum quiz criado ainda.</p>
            <p className="text-sm mt-1">Crie quizzes para recomendar produtos personalizados aos seus clientes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((q) => (
            <Card key={q.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedQuizId(q.id)}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <Brain className="h-8 w-8 text-primary/60 shrink-0" />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{q.title}</span>
                    <Badge variant={q.active ? 'default' : 'outline'} className="text-xs">
                      {q.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {q.description && <p className="text-sm text-muted-foreground line-clamp-1">{q.description}</p>}
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Switch checked={q.active} onCheckedChange={(active) => toggleQuiz.mutate({ id: q.id, active })} />
                  <Button variant="ghost" size="icon" onClick={() => openEditQuiz(q)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                    if (confirm('Excluir quiz e todas as perguntas/resultados?')) deleteQuiz.mutate(q.id);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Dialog */}
      <Dialog open={quizDialog} onOpenChange={setQuizDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingQuiz ? 'Editar Quiz' : 'Novo Quiz'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título do Quiz</Label>
              <Input value={quizForm.title} onChange={e => setQuizForm({ ...quizForm, title: e.target.value })} placeholder="Ex: Qual o estilo ideal para você?" className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={quizForm.description} onChange={e => setQuizForm({ ...quizForm, description: e.target.value })} placeholder="Descreva o quiz para o cliente" className="mt-1" rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={quizForm.active} onCheckedChange={active => setQuizForm({ ...quizForm, active })} />
              <Label>Ativo</Label>
            </div>
            <Button className="w-full" onClick={() => saveQuiz.mutate()} disabled={saveQuiz.isPending}>
              {editingQuiz ? 'Salvar' : 'Criar Quiz'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
