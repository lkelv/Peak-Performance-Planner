import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, ObjectDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import './FocusCamera.css';

interface FocusCameraProps {
    // We pass this callback so the camera can tell the parent (App/Home) to pause the mountain
    onDistractionChange?: (isDistracted: boolean) => void;
}

const FocusCamera: React.FC<FocusCameraProps> = ({ onDistractionChange }) => {
    const webcamRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);

    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const objectDetectorRef = useRef<ObjectDetector | null>(null);
    const requestRef = useRef<number>();
    
    // Timer Variables
    const startTimeRef = useRef<number | null>(null);
    const totalFocusedTimeRef = useRef<number>(0);
    const lastDistractedState = useRef<boolean>(false);

    const [status, setStatus] = useState("Initializing AI...");
    const [isCameraActive, setIsCameraActive] = useState(false);

    useEffect(() => {
        let isMounted = true;
        hiddenVideoRef.current = document.createElement('video');

        const initModels = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );

                faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task` },
                    runningMode: "VIDEO"
                });

                objectDetectorRef.current = await ObjectDetector.createFromOptions(vision, {
                    baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite` },
                    scoreThreshold: 0.4,
                    runningMode: "VIDEO"
                });

                if (isMounted) setStatus("AI Ready.");
            } catch (error) {
                console.error("Error loading models:", error);
                if (isMounted) setStatus("Error loading AI models.");
            }
        };

        initModels();

        return () => {
            isMounted = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (hiddenVideoRef.current && hiddenVideoRef.current.srcObject) {
                const stream = hiddenVideoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const secs = (totalSeconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const predict = () => {
        if (!faceLandmarkerRef.current || !objectDetectorRef.current || !hiddenVideoRef.current || hiddenVideoRef.current.readyState < 2 || !canvasRef.current) {
            requestRef.current = requestAnimationFrame(predict);
            return;
        }

        const hiddenVideo = hiddenVideoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d")!;
        const timestamp = performance.now();

        const faceRes = faceLandmarkerRef.current.detectForVideo(hiddenVideo, timestamp);
        const objRes = objectDetectorRef.current.detectForVideo(hiddenVideo, timestamp);

        const isPresent = faceRes.faceLandmarks && faceRes.faceLandmarks.length > 0;
        const onPhone = objRes.detections.some(d => d.categories[0].categoryName === "cell phone");
        const isDistracted = onPhone || !isPresent;

        // ONLY trigger state change when the distraction state actually flips (prevents infinite re-renders)
        if (isDistracted !== lastDistractedState.current) {
            lastDistractedState.current = isDistracted;
            if (onDistractionChange) onDistractionChange(isDistracted);
        }

        ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);

        if (isDistracted) {
            if (Math.floor(Date.now() / 200) % 2 === 0) {
                ctx.fillStyle = "rgba(255, 0, 0, 0.85)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = "white";
                ctx.font = "bold 45px Arial";
                ctx.textAlign = "center";
                ctx.fillText("GET BACK TO WORK!", canvas.width / 2, canvas.height / 2);
            }
        } else {
            if (startTimeRef.current) {
                totalFocusedTimeRef.current = Date.now() - startTimeRef.current;
            }

            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(10, 10, 220, 50);
            ctx.fillStyle = "#00FF00";
            ctx.font = "bold 30px monospace";
            ctx.textAlign = "left";
            ctx.fillText(`FOCUS: ${formatTime(totalFocusedTimeRef.current)}`, 20, 45);
        }

        requestRef.current = requestAnimationFrame(predict);
    };

    const startCamera = async () => {
        if (!hiddenVideoRef.current || !canvasRef.current || !webcamRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            hiddenVideoRef.current.srcObject = stream;
            hiddenVideoRef.current.play();

            const canvasStream = canvasRef.current.captureStream(30);
            webcamRef.current.srcObject = canvasStream;
            webcamRef.current.play();

            hiddenVideoRef.current.onloadeddata = () => {
                canvasRef.current!.width = hiddenVideoRef.current!.videoWidth;
                canvasRef.current!.height = hiddenVideoRef.current!.videoHeight;
                startTimeRef.current = Date.now();
                setIsCameraActive(true);
                predict();
            };
        } catch (err) {
            setStatus("Camera access denied.");
        }
    };

    const enterPiP = async () => {
        if (webcamRef.current && document.pictureInPictureElement !== webcamRef.current) {
            await webcamRef.current.requestPictureInPicture();
        }
    };

    return (
        <div className="focus-container">
            <div className="video-wrapper">
                <video ref={webcamRef} className="webcam-video" autoPlay playsInline muted></video>
                <canvas ref={canvasRef} className="output-canvas"></canvas>
            </div>
            
            <div className="camera-controls">
                {!isCameraActive ? (
                    <button className="camera-btn" onClick={startCamera}>Start Camera</button>
                ) : (
                    <button className="camera-btn" onClick={enterPiP}>Enter Picture-in-Picture</button>
                )}
            </div>
            <div className="status-text">Status: {status}</div>
        </div>
    );
};

export default FocusCamera;