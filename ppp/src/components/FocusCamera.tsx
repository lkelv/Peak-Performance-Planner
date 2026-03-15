import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import './FocusCamera.css';

interface FocusCameraProps {
    onDistractionChange?: (isDistracted: boolean) => void;
}

const DETECTION_INTERVAL_MS = 4000; // Run detection every ~4 seconds (3-5s range)

const FocusCamera: React.FC<FocusCameraProps> = ({ onDistractionChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const objectDetectorRef = useRef<ObjectDetector | null>(null);
    const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isDistractedRef = useRef<boolean>(false);
    const lastDistractedState = useRef<boolean>(false);
    const drawFrameRef = useRef<number | null>(null);

    const [status, setStatus] = useState("Initializing AI...");
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Load only the object detector (lighter than face landmarker + object detector)
    useEffect(() => {
        let isMounted = true;

        const initModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                objectDetectorRef.current = await ObjectDetector.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
                    },
                    scoreThreshold: 0.4,
                    runningMode: "IMAGE", // Use IMAGE mode for snapshot-based detection
                });

                if (isMounted) setStatus("AI Ready. Start camera to enable focus tracking.");
            } catch (error) {
                console.error("Error loading model:", error);
                if (isMounted) setStatus("Error loading AI model.");
            }
        };

        initModel();

        return () => {
            isMounted = false;
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (drawFrameRef.current) cancelAnimationFrame(drawFrameRef.current);
        };
    }, []);

    // Snapshot-based detection: captures a frame and runs detection on it
    const runDetection = useCallback(() => {
        if (!objectDetectorRef.current || !videoRef.current || videoRef.current.readyState < 2) return;

        try {
            const result = objectDetectorRef.current.detect(videoRef.current);
            const onPhone = result.detections.some(
                (d) => d.categories[0]?.categoryName === "cell phone"
            );

            const currentDistraction = onPhone;

            if (currentDistraction !== lastDistractedState.current) {
                lastDistractedState.current = currentDistraction;
                isDistractedRef.current = currentDistraction;
                if (onDistractionChange) onDistractionChange(currentDistraction);
            }
        } catch (err) {
            console.error("Detection error:", err);
        }
    }, [onDistractionChange]);

    // Lightweight canvas draw loop for the visual overlay (no detection here)
    const drawLoop = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || videoRef.current.readyState < 2) {
            drawFrameRef.current = requestAnimationFrame(drawLoop);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        if (isDistractedRef.current) {
            if (Math.floor(Date.now() / 400) % 2 === 0) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.font = "bold 45px Arial";
                ctx.textAlign = "center";
                ctx.fillText("PHONE DETECTED!", canvas.width / 2, canvas.height / 2);
            }
        } else {
            // Green border indicator for "focused"
            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        }

        drawFrameRef.current = requestAnimationFrame(drawLoop);
    }, []);

    const startCamera = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 480, height: 360 },
            });

            const video = videoRef.current;
            video.srcObject = stream;
            video.play();

            video.onloadeddata = () => {
                const canvas = canvasRef.current!;
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                setIsCameraActive(true);
                setStatus("Focus tracking active");

                // Start the interval-based detection (every 4 seconds)
                detectionIntervalRef.current = setInterval(runDetection, DETECTION_INTERVAL_MS);
                // Also run once immediately
                runDetection();

                // Start the lightweight visual draw loop
                drawLoop();
            };
        } catch (err) {
            setStatus("Camera access denied.");
        }
    };

    const stopCamera = () => {
        if (detectionIntervalRef.current) {
            clearInterval(detectionIntervalRef.current);
            detectionIntervalRef.current = null;
        }
        if (drawFrameRef.current) {
            cancelAnimationFrame(drawFrameRef.current);
            drawFrameRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        isDistractedRef.current = false;
        lastDistractedState.current = false;
        if (onDistractionChange) onDistractionChange(false);
        setStatus("Camera stopped.");
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
            if (drawFrameRef.current) cancelAnimationFrame(drawFrameRef.current);
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div className="focus-container">
            <div className="video-wrapper">
                <video ref={videoRef} className="webcam-video" autoPlay playsInline muted style={{ display: 'none' }} />
                <canvas ref={canvasRef} className="output-canvas" style={{ position: 'relative', zIndex: 1 }} />
            </div>

            <div className="camera-controls">
                {!isCameraActive ? (
                    <button className="camera-btn" onClick={startCamera}>
                        📷 Start Focus Camera
                    </button>
                ) : (
                    <button className="camera-btn camera-btn-stop" onClick={stopCamera}>
                        ⏹ Stop Camera
                    </button>
                )}
            </div>
            <div className="status-text">Status: {status}</div>
        </div>
    );
};

export default FocusCamera;
