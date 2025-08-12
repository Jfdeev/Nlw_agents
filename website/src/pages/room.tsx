import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft, 
  Plus, 
  MessageCircleQuestion, 
  MessageSquare, 
  Calendar, 
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  Ear
} from "lucide-react";
import { toast } from "sonner";
import { useParams } from "react-router-dom";


type Room = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

type Question = {
  id: string;
  roomId: string;
  question: string;
  answer: string;
  createdAt: string;
};

type CreateQuestionResponse = {
  questionId: string;
};

export function Room() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const params = useParams();

  const roomId = params.id;

  // Query para buscar dados da sala
  const {
    data: room,
    isLoading: isRoomLoading,
    isError: isRoomError
  } = useQuery<Room>({
    queryKey: ["get-room", roomId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${roomId}`);
      if (!res.ok) throw new Error("Erro ao buscar sala");
      return res.json();
    }
  });

  // Query para buscar perguntas da sala
  const {
    data: questions,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError
  } = useQuery<Question[]>({
    queryKey: ["get-questions", roomId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3333/rooms/${roomId}/questions`);
      if (!res.ok) throw new Error("Erro ao buscar perguntas");
      return res.json();
    }
  });

  // Mutation para criar pergunta
  const createQuestionMutation = useMutation<CreateQuestionResponse, Error, { question: string; answer?: string }>({
    mutationFn: async (payload: { question: string; answer?: string }) => {
      const res = await fetch("http://localhost:3333/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          question: payload.question,
          answer: payload.answer || ""
        })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Falha ao criar pergunta: ${res.status} ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Pergunta criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["get-questions", roomId] });
      setIsDialogOpen(false);
      setQuestionText("");
      setAnswerText("");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar pergunta");
    }
  });

  const handleCreateQuestion = async () => {
    if (!questionText.trim()) {
      toast.error("Pergunta é obrigatória");
      return;
    }

    await createQuestionMutation.mutateAsync({ 
      question: questionText.trim(), 
      answer: answerText.trim() || undefined 
    });
  };

  const handleBackClick = () => {
    // Em um app real, isso navegaria para a página anterior
    window.history.back();
  };

  if (isRoomLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (isRoomError || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sala não encontrada</h2>
          <p className="text-gray-600 mb-6">A sala que você está procurando não existe ou foi removida.</p>
          <Button onClick={handleBackClick} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">

          <Button 
            variant="outline" 
            className="mb-6 text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-300"
            onClick={handleBackClick}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar às salas
          </Button>

          <Button 
            variant="outline" 
            className="mb-6 text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-300"
            onClick={() => setIsDialogOpen(true)}
          >
            <Ear className="w-4 h-4 mr-2" />
            Gravar Audio
          </Button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.name}</h1>
                  <p className="text-gray-600 leading-relaxed">{room.description}</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    Criada em{" "}
                    {new Date(room.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Question Section */}
        <div className="mb-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Fazer uma Pergunta
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl mx-auto bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 relative">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white flex items-center">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                      <MessageCircleQuestion className="w-4 h-4 text-white" />
                    </div>
                    Nova Pergunta
                  </DialogTitle>
                  <DialogDescription className="text-green-100 mt-2">
                    Adicione sua pergunta e opcionalmente uma resposta para compartilhar conhecimento
                  </DialogDescription>
                </DialogHeader>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </DialogClose>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-gray-700 font-medium flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Pergunta 
                  </Label>
                  <textarea
                    id="question"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Digite sua pergunta aqui..."
                    rows={3}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-green-500/20 rounded-lg px-4 py-3 resize-none transition-all duration-200 outline-none text-gray-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer" className="text-gray-700 font-medium flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Resposta (opcional)
                  </Label>
                  <textarea
                    id="answer"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Se você já tem uma resposta, compartilhe aqui..."
                    rows={4}
                    className="w-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-green-500/20 rounded-lg px-4 py-3 resize-none transition-all duration-200 outline-none text-gray-600"
                  />
                </div>

                <DialogFooter className="flex gap-3 pt-4">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 text-gray-600 hover:text-blue-600 py-3 rounded-lg transition-all duration-200"
                    >
                      Cancelar
                    </Button>
                  </DialogClose>

                  <Button
                    onClick={handleCreateQuestion}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    disabled={createQuestionMutation.isPending}
                  >
                    {createQuestionMutation.isPending ? (
                      <>Criando...</>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Pergunta
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Questions Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Perguntas da Sala</h2>
            <div className="flex items-center text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm">
              <MessageSquare className="w-5 h-5 mr-2" />
              <span className="font-medium">{questions?.length ?? 0} perguntas</span>
            </div>
          </div>

          {/* Loading State */}
          {isQuestionsLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando perguntas...</p>
            </div>
          )}

          {/* Error State */}
          {isQuestionsError && (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Erro ao carregar perguntas.</p>
            </div>
          )}

          {/* Questions List */}
          {questions && questions.length > 0 && (
            <div className="space-y-6">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-gray-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircleQuestion className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pergunta</h3>
                        <p className="text-gray-700 leading-relaxed">{question.question}</p>
                      </div>
                      
                      {question.answer && question.answer.trim() && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-md font-semibold text-blue-600 mb-2">Resposta da IA <BrainCircuit className="inline w-5 h-5 text-blue-600 mr-1" /> </h4>
                          <p className="text-gray-700">{question.answer}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-500 pt-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {new Date(question.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {questions && questions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircleQuestion className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma pergunta ainda</h3>
              <p className="text-gray-600 mb-6">Seja o primeiro a fazer uma pergunta nesta sala!</p>
              <Button 
                onClick={() => setIsDialogOpen(true)} 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-2 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Fazer Primeira Pergunta
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}