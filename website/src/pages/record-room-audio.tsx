import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, Square, Play, Pause, CheckCircle2, AlertCircle, Volume2, Headphones, Brain, Clock, FileAudio } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const isRecordingSupported = !!navigator.mediaDevices
    && typeof navigator.mediaDevices.getUserMedia === "function"
    && typeof window.MediaRecorder === "function";

type RoomParams = {
    id: string;
}

export function RecordRoomAudio() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const animationRef = useRef<number | null>(null);

    const params = useParams<RoomParams>();

    // Limpar recursos ao desmontar
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // Monitorar nível de áudio
    const monitorAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average);

        animationRef.current = requestAnimationFrame(monitorAudioLevel);
    };

    function stopRecording() {
        setIsRecording(false);

        if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
            mediaRecorder.current.stop();
        }

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }

    async function uploadAudio(audio: Blob) {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", audio, 'audio.webm');

            const response = await fetch(`http://localhost:3333/rooms/${params.id}/audio`, {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            console.log("Áudio enviado com sucesso:", result);

            setUploadSuccess(true);
            toast.success("Áudio processado com sucesso! A IA já pode responder perguntas sobre este conteúdo.");
        } catch (error) {
            console.error("Erro ao enviar áudio:", error);
            toast.error("Erro ao processar o áudio. Tente novamente.");
        } finally {
            setIsUploading(false);
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
            setAudioBlob(null);
            setUploadSuccess(false);
            chunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44_100,
                }
            });

            // Configurar monitoramento de áudio
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            monitorAudioLevel();

            mediaRecorder.current = new MediaRecorder(stream, {
                mimeType: "audio/webm",
                audioBitsPerSecond: 64_000,
            });

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setShowConfirmation(true);
                stream.getTracks().forEach(track => track.stop());
            };

            // Timer da gravação
            intervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            mediaRecorder.current.start();
            toast.success("Gravação iniciada! Fale claramente para melhor reconhecimento.");

        } catch (error) {
            toast.error("Erro ao acessar microfone. Verifique as permissões.");
            console.error("Error accessing microphone:", error);
            setIsRecording(false);
        }
    }

    const playAudio = () => {
        if (audioBlob) {
            if (audioRef.current) {
                audioRef.current.pause();
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current = new Audio(audioUrl);

            audioRef.current.onended = () => {
                setIsPlaying(false);
            };

            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const confirmUpload = async () => {
        if (audioBlob) {
            setShowConfirmation(false);
            await uploadAudio(audioBlob);
        }
    };

    const cancelUpload = () => {
        setShowConfirmation(false);
        toast.info("Upload cancelado. Você pode regravar ou tentar novamente.");
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setUploadSuccess(false);
        setRecordingTime(0);
        setIsPlaying(false);
        setShowConfirmation(false);
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };

    if (!params.id) {
        return <Navigate replace to="/" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="outline"
                        className="mb-6 text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-300"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Voltar para a Sala
                    </Button>

                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">🎙️ Gravar Áudio para a Sala</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Grave um áudio sobre o conteúdo da sala para que a IA possa responder perguntas contextualizadas
                        </p>
                    </div>
                </div>

                {/* Instruções da IA */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-8 border border-purple-200">
                    <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">🤖 Dicas para melhor compreensão da IA</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                                <div className="flex items-start space-x-2">
                                    <Volume2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>Fale claramente:</strong> Articule bem as palavras e mantenha um ritmo moderado</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <Headphones className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>Ambiente silencioso:</strong> Grave em local com pouco ruído de fundo</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <Clock className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>Seja específico:</strong> Mencione conceitos, definições e exemplos importantes</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <FileAudio className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <span><strong>Estruture o conteúdo:</strong> Organize as informações de forma lógica</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Recording Interface */}
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    {!isRecordingSupported && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center space-x-3">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                                <div>
                                    <p className="text-red-800 font-medium">Gravação não suportada</p>
                                    <p className="text-red-600 text-sm">Este navegador não suporta gravação de áudio. Tente usar Chrome, Firefox ou Edge.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recording Controls */}
                    <div className="text-center mb-8">
                        {!isRecording && !audioBlob && (
                            <div>
                                <Button
                                    onClick={startRecording}
                                    disabled={!isRecordingSupported}
                                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                                >
                                    <Mic className="w-6 h-6 mr-3" />
                                    Iniciar Gravação
                                </Button>
                                <p className="text-gray-500 text-sm mt-3">Clique para começar a gravar seu áudio</p>
                            </div>
                        )}

                        {isRecording && (
                            <div className="space-y-6">
                                {/* Recording Indicator */}
                                <div className="flex items-center justify-center space-x-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-red-600 font-medium text-lg">GRAVANDO</span>
                                    </div>
                                    <div className="text-gray-600 font-mono text-xl">
                                        {formatTime(recordingTime)}
                                    </div>
                                </div>

                                {/* Audio Level Indicator */}
                                <div className="flex items-center justify-center space-x-4">
                                    <Volume2 className="w-5 h-5 text-gray-400" />
                                    <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-100"
                                            style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-500 w-12">{Math.round(audioLevel)}%</span>
                                </div>

                                <Button
                                    onClick={stopRecording}
                                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-8 py-3 shadow-lg"
                                >
                                    <Square className="w-5 h-5 mr-2" />
                                    Parar Gravação
                                </Button>
                            </div>
                        )}

                        {/* Audio Preview */}
                        {audioBlob && !uploadSuccess && (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                    <div className="flex items-center justify-center space-x-4 mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        <div>
                                            <p className="text-green-800 font-medium text-lg">Gravação Concluída!</p>
                                            <p className="text-green-600 text-sm">
                                                Áudio gravado com sucesso • {formatTime(recordingTime)} • {(audioBlob.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>

                                    {/* Audio Controls */}
                                    <div className="flex items-center justify-center space-x-4 mb-6">
                                        {!isPlaying ? (
                                            <Button
                                                onClick={playAudio}
                                                variant="outline"
                                                className="text-green-600 border-green-300 hover:bg-green-50"
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Reproduzir
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={stopAudio}
                                                variant="outline"
                                                className="text-green-600 border-green-300 hover:bg-green-50"
                                            >
                                                <Pause className="w-4 h-4 mr-2" />
                                                Parar
                                            </Button>
                                        )}

                                        <Button
                                            onClick={resetRecording}
                                            variant="outline"
                                            className="text-gray-600 hover:text-red-600 hover:border-red-300"
                                            disabled={isUploading}
                                        >
                                            Gravar Novamente
                                        </Button>
                                    </div>

                                    {/* Confirmation Section */}
                                    {showConfirmation && (
                                        <div className="border-t border-green-200 pt-6">
                                            <div className="text-center mb-4">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                                    🎯 Confirmar envio do áudio?
                                                </h4>
                                                <p className="text-gray-600 text-sm">
                                                    O áudio será processado pela IA para responder perguntas sobre o conteúdo.
                                                    Certifique-se de que a gravação está clara e completa.
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-center space-x-4">
                                                <Button
                                                    onClick={resetRecording}
                                                    variant="outline"
                                                    className="text-gray-600 hover:text-red-600 hover:border-red-300"
                                                    disabled={isUploading}
                                                >
                                                    ❌ Cancelar
                                                </Button>
                                                <Button
                                                    onClick={confirmUpload}
                                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
                                                    disabled={isUploading}
                                                >
                                                    ✅ Confirmar e Enviar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Upload Status */}
                        {isUploading && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                                <div className="flex items-center justify-center space-x-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    <div>
                                        <p className="text-blue-800 font-medium">Processando áudio...</p>
                                        <p className="text-blue-600 text-sm">A IA está analisando o conteúdo para responder perguntas</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {uploadSuccess && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col items-center mt-6">
                                <div className="flex items-center justify-center space-x-3">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    <div>
                                        <p className="text-emerald-800 font-medium">🎉 Áudio processado com sucesso!</p>
                                        <p className="text-emerald-600 text-sm">A IA agora pode responder perguntas sobre este conteúdo</p>

                                    </div>
                                </div>
                                <div
                                    className="mt-5 bg-red-50 border border-red-200 rounded-lg p-3 text-zinc-600 hover:bg-red-100 hover:border-red-300 cursor-pointer w-max "
                                    onClick={resetRecording}
                                >
                                    Gravar novo áudio
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tips Section */}
                    {!audioBlob && !isRecording && (
                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <h4 className="font-semibold text-gray-800 mb-3 text-center">💡 Dicas para uma boa gravação:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold">1.</span>
                                    <span>Teste o microfone antes de começar</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold">2.</span>
                                    <span>Mantenha distância adequada do microfone</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold">3.</span>
                                    <span>Evite interrupções durante a gravação</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <span className="text-blue-500 font-bold">4.</span>
                                    <span>Organize o conteúdo mentalmente antes</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
