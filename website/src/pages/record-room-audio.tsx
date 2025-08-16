import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";


const isRecordingSupported = !!navigator.mediaDevices 
&& typeof navigator.mediaDevices.getUserMedia === "function" 
&& typeof window.MediaRecorder === "function";

export function RecordRoomAudio() {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);

    function stopRecording() {
        setIsRecording(false);

        if(mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
            mediaRecorder.current.stop();
        }
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
                console.log("Gravação concluída:", event.data);
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

    return (
        <div className="h-screen flex items-center justify-center bg-blue-50">
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
    )
}
