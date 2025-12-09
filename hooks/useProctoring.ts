import { useState, useEffect, useCallback, useRef } from 'react';

interface UseProctoringProps {
  isActive: boolean;
  onViolation: (reason: string) => void;
}

export const useProctoring = ({ isActive, onViolation }: UseProctoringProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent closure staleness in event listeners
  const onViolationRef = useRef(onViolation);
  
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  // 1. Initialize Camera & Mic
  const startProctoring = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: true
      });
      setStream(mediaStream);
    } catch (err) {
      console.error("Proctoring failed to start:", err);
      setError("Camera/Microphone access denied. This is required for the exam.");
    }
  }, []);

  const stopProctoring = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // 2. Anti-Cheat Event Listeners
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onViolationRef.current("Tab switching detected");
      }
    };

    const handleBlur = () => {
      // Focus lost (user clicked outside browser or alt-tabbed)
      onViolationRef.current("Window focus lost");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolationRef.current("Copy action attempt");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolationRef.current("Paste action attempt");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      // Optional: Don't trigger a full warning for right click, just block it.
      // But user requested Strict.
      onViolationRef.current("Right-click context menu attempt");
    };

    // Attach listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("cut", handleCopy); // Treat cut same as copy
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("cut", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isActive]);

  return { stream, error, startProctoring, stopProctoring };
};
