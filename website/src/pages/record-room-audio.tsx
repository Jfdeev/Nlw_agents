import { Button } from "@/components/ui/button";
import { ArrowLeft, Ear } from "lucide-react";
import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";


const isRecordingSupported = !!navigator.mediaDevices 
&& typeof navigator.mediaDevices.getUserMedia === "function" 
&& typeof window.MediaRecorder === "function";

type RoomParams = {
    id: string;
}

export function RecordRoomAudio() {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);

    const params = useParams<RoomParams>();

    function stopRecording() {
        setIsRecording(false);

        if(mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
            mediaRecorder.current.stop();
        }

    }
    
    async function uploadAudio(audio: Blob) {
        const formData = new FormData();

        formData.append("file", audio, 'audio.webm')
        

        const response = await fetch(`http://localhost:3333/rooms/${params.id}/audio`, {
            method: "POST",
            body: formData,
        })

        const result = await response.json();

        console.log("Áudio enviado com sucesso:", result);
    }

    async function startRecording() {
        if (!isRecordingSupported) {
            alert("Gravação de áudio não é suportada neste navegador.");
            return;
        }    
        setIsRecording(true);


        const audio = await navigator.mediaDevices.getUserMedia({ audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44_100,
            } 
        });

        mediaRecorder.current = new MediaRecorder(audio, {
            mimeType: "audio/webm",
            audioBitsPerSecond: 64_000,
        })

        mediaRecorder.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                uploadAudio(event.data);
            }
        }

        mediaRecorder.current.onstart = () => {
            console.log("Gravação iniciada");
        }

        mediaRecorder.current.onstop = () => {
            console.log("Gravação parada");
        }

        mediaRecorder.current.start();
    }

    if (!params.id) {
        return <Navigate replace to="/" />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    className="mb-6 text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-300"
                    onClick={() => {
                        window.history.back();
                    }}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para a Sala
                </Button>
            </div>

            <div className="flex items-center justify-center">
                {isRecording ? (
                    <Button
                        onClick={stopRecording}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700"
                    >
                        Parar Gravação
                    </Button>
                ) : (
                    <Button
                        onClick={startRecording}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white  hover:from-blue-600 hover:to-blue-700"
                    >
                        Iniciar Gravação
                    </Button>
                )}
            </div>
        </div>
    )
}
