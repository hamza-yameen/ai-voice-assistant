import { useEffect, useRef, useState } from "react";
import { transformBlobToBase64 } from "@/app/utils/blobToBase64";

export function useRecordVoice() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioChunks = useRef([]);

  useEffect(() => {
    if (mediaRecorder) {
      mediaRecorder.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/mp3" });
        getResponse(audioBlob);
        audioChunks.current = [];
      };
    }
  }, [mediaRecorder]);

  const getResponse = async (audioBlob) => {
    const audioBase64 = await transformBlobToBase64(audioBlob);
    try {
      setLoading(true);
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ audio: audioBase64 }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Error getting response");
      }
    } catch (error) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator?.mediaDevices) {
      console.error("Media devices not supported");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    setIsRecording(true);
    setMediaRecorder(mediaRecorder);
    mediaRecorder.start(0);
  };

  const stopRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      mediaRecorder.stop();
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    loading,
  };
}