import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Square, Upload, Loader } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const isRecordingSupported = !!navigator.mediaDevices 
&& typeof navigator.mediaDevices.getUserMedia === "function" 
&& typeof window.MediaRecorder === "function";

type CreateRoomResponse = {
    room: {
        id: string;
        name: string;
        description: string;
        createdAt: string;
    };
    chunk: {
        id: string;
        transcriptionLength: number;
    };
};

export function CreateRoomFromAudio() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const navigate = useNavigate();

    function stopRecording() {
        setIsRecording(false);

        if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
            mediaRecorder.current.stop();
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }
    
    async function createRoomFromAudio(audio: Blob) {
        setIsProcessing(true);
        
        try {
            const formData = new FormData();
            formData.append("file", audio, 'audio.webm');

            const response = await fetch(`http://localhost:3333/rooms/from-audio`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erro: ${response.status}`);
            }

            const result: CreateRoomResponse = await response.json();

            toast.success("Sala criada com sucesso a partir do áudio!");
            console.log("✅ Sala criada:", result);

            // Navegar para a sala criada
            navigate(`/room/${result.room.id}`);

        } catch (error) {
            console.error("❌ Erro ao criar sala:", error);
            toast.error(error instanceof Error ? error.message : "Erro ao processar áudio");
        } finally {
            setIsProcessing(false);
        }
    }

    async function startRecording() {
        if (!isRecordingSupported) {
            toast.error("Gravação de áudio não é suportada neste navegador.");
            return;
        }

        try {
            setIsRecording(true);
            setRecordingTime(0);

            const audio = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                } 
            });

            mediaRecorder.current = new MediaRecorder(audio, {
                mimeType: "audio/webm",
                audioBitsPerSecond: 64000,
            });

            const chunks: Blob[] = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setRecordedAudio(blob);
                
                // Para todos os tracks de áudio
                audio.getTracks().forEach(track => track.stop());
                
            };

            mediaRecorder.current.onstart = () => {
                
                // Timer para mostrar duração da gravação
                timerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1);
                }, 1000);
            };

            mediaRecorder.current.start();

        } catch (error) {
            console.error("❌ Erro ao iniciar gravação:", error);
            toast.error("Erro ao acessar microfone");
            setIsRecording(false);
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCreateRoom = async () => {
        if (!recordedAudio) {
            toast.error("Nenhum áudio gravado");
            return;
        }

        await createRoomFromAudio(recordedAudio);
    };

    const resetRecording = () => {
        setRecordedAudio(null);
        setRecordingTime(0);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/">
                        <Button
                            variant="outline"
                            className="mb-6 text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-300"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar ao início
                        </Button>
                    </Link>

                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Criar Sala a partir de Áudio
                        </h1>
                        <p className="text-xl text-gray-600 max-w-xl mx-auto">
                            Grave o conteúdo da sua aula e nossa IA criará automaticamente uma sala de estudos com título, descrição e contexto
                        </p>
                    </div>
                </div>

                {/* Recording Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <div className="text-center">
                        {!isRecordingSupported ? (
                            <div className="text-red-500">
                                <p className="text-lg font-medium mb-2">❌ Gravação não suportada</p>
                                <p className="text-sm">Seu navegador não suporta gravação de áudio</p>
                            </div>
                        ) : isProcessing ? (
                            <div className="py-12">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                    <Loader className="w-8 h-8 text-white animate-spin" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Processando áudio...</h3>
                                <p className="text-gray-600 mb-4">
                                    Nossa IA está transcrevendo o áudio e criando sua sala personalizada
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        ) : recordedAudio ? (
                            <div className="py-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Square className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Áudio gravado!</h3>
                                <p className="text-gray-600 mb-6">
                                    Duração: {formatTime(recordingTime)}
                                </p>
                                
                                <div className="flex gap-4 justify-center">
                                    <Button
                                        onClick={resetRecording}
                                        variant="outline"
                                        className="px-6 py-2"
                                    >
                                        Gravar novamente
                                    </Button>
                                    
                                    <Button
                                        onClick={handleCreateRoom}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-2 shadow-lg"
                                        disabled={isProcessing}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Criar Sala
                                    </Button>
                                </div>
                            </div>
                        ) : isRecording ? (
                            <div className="py-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                    <Mic className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gravando...</h3>
                                <p className="text-gray-600 mb-4">
                                    Tempo: {formatTime(recordingTime)}
                                </p>
                                
                                <Button
                                    onClick={stopRecording}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 shadow-lg"
                                >
                                    <Square className="w-4 h-4 mr-2" />
                                    Parar Gravação
                                </Button>
                            </div>
                        ) : (
                            <div className="py-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Mic className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Pronto para gravar</h3>
                                <p className="text-gray-600 mb-6">
                                    Clique no botão abaixo para começar a gravar o conteúdo da sua aula
                                </p>
                                
                                <Button
                                    onClick={startRecording}
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3 shadow-lg transform hover:scale-105 transition-all duration-300"
                                >
                                    <Mic className="w-4 h-4 mr-2" />
                                    Iniciar Gravação
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions */}
                {!isProcessing && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3">📋 Como funciona:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-blue-800">
                            <li>Grave o conteúdo da sua aula ou apresentação</li>
                            <li>Nossa IA transcreverá automaticamente o áudio</li>
                            <li>Será criada uma sala com título e descrição personalizados</li>
                            <li>O conteúdo ficará disponível para perguntas e discussões</li>
                        </ol>
                        
                        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                            <p className="text-sm text-blue-700">
                                💡 <strong>Dica:</strong> Fale de forma clara e organize bem o conteúdo para melhores resultados na criação da sala!
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
