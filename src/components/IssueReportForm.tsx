/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Camera,
  MapPin,
  Upload,
  AlertCircle,
  RefreshCw,
  Check,
  Info,
  Mic,
  MicOff,
  Square,
  Phone,
  PhoneCall,
  Video,
  VideoOff,
  MessageSquare,
  X,
  CheckCircle,
  Trash2,
  Users,
  Radio,
  Play,
  Award,
  Shield,
  Clock,
  Volume2,
  VolumeX,
  PhoneOff,
  Compass,
} from "lucide-react";
import { IssueCategory, IssueUrgency } from "../types";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { useLiveLocation } from "../hooks/useLiveLocation";

interface IssueReportFormProps {
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  initialLocation?: { address: string; ward: string; lat: number; lng: number };
}

type ReportMode = "select" | "camera" | "audio" | "text" | "call";

// Preset mock images representing realistic public issues
const MOCK_PRESET_IMAGES = [
  {
    id: "pothole",
    name: "Pothole Road",
    url: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "water",
    name: "Burst Pipe",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "garbage",
    name: "Garbage Pile",
    url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "electricity",
    name: "Broken Lamp",
    url: "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=800&q=80",
  },
];

const OFFICIALS_LIST = [
  {
    id: "off-1",
    name: "Smt. Rajeshwari Devi",
    role: "Gram Panchayat Sarpanch (President)",
    phone: "+91 98480 12345",
    email: "sarpanch.panchayat@gov.in",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    status: "Available",
  },
  {
    id: "off-2",
    name: "Shri Mohan Rao",
    role: "Panchayat Secretary (Administrative Head)",
    phone: "+91 94401 54321",
    email: "sec.panchayat@gov.in",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    status: "In Office",
  },
  {
    id: "off-3",
    name: "Smt. Lakshmi Bai",
    role: "Health & Sanitation Inspector",
    phone: "+91 98495 11223",
    email: "health.inspector@gov.in",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
    status: "On Field Patrol",
  },
  {
    id: "off-4",
    name: "Shri Venkatesh Goud",
    role: "Water Works & Electrical Engineer",
    phone: "+91 91770 44556",
    email: "engineer.works@gov.in",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80",
    status: "Available",
  },
  {
    id: "off-5",
    name: "Shri Ramesh Kumar",
    role: "Ward 1 & 2 Civic Representative",
    phone: "+91 99630 98765",
    email: "rep.ward1@gov.in",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    status: "Meeting",
  },
];

export default function IssueReportForm({
  onSubmit,
  onCancel,
  initialLocation,
}: IssueReportFormProps) {
  const { showToast } = useToast();
  const { getLiveLocation } = useLiveLocation();
  const { language, setLanguage, t } = useLanguage();

  // Selection wizard mode state
  const [reportMode, setReportMode] = useState<ReportMode>("select");

  // Primary form data states
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<IssueCategory>(IssueCategory.OTHER);
  const [urgency, setUrgency] = useState<IssueUrgency>(IssueUrgency.MEDIUM);
  const [ward, setWard] = useState(
    initialLocation ? initialLocation.ward : "Ward 1 (Panchayat Center)",
  );
  const [address, setAddress] = useState(
    initialLocation ? initialLocation.address : "",
  );
  const [image, setImage] = useState("");
  const [video, setVideo] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Interactive Map Pin states
  const [lat, setLat] = useState<number>(
    initialLocation ? initialLocation.lat : 17.435,
  );
  const [lng, setLng] = useState<number>(
    initialLocation ? initialLocation.lng : 78.45,
  );
  const [isPinned, setIsPinned] = useState(!!initialLocation);
  const [pinPosition, setPinPosition] = useState({ x: 50, y: 50 });

  // Camera Live Hardware States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [isRecordingCameraVideo, setIsRecordingCameraVideo] = useState(false);
  const [videoRecorder, setVideoRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<any>(null);

  // Stop camera stream helper
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
    setIsRecordingCameraVideo(false);
  };

  // Start Camera handler
  const startCamera = async () => {
    try {
      setCameraPermission("prompt");
      // Stop previous stream if any
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices
        .getUserMedia({
          video: { width: 1280, height: 720, facingMode: "environment" },
          audio: true,
        })
        .catch(async () => {
          // Fallback if audio is not supported/blocked
          return await navigator.mediaDevices.getUserMedia({ video: true });
        });

      setCameraStream(stream);
      setCameraPermission("granted");

      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
        }
      }, 100);

      showToast(
        "Webcam Connected! 📸",
        "success",
        "Live video feed initialized. Point at the issue area.",
      );
    } catch (err) {
      console.error("Camera connection failed:", err);
      setCameraPermission("denied");
      showToast(
        "Camera Permission Blocked",
        "warning",
        "To record on-site proof, please grant camera permissions in your browser.",
      );
    }
  };

  // Capture still image snapshot
  const captureSnapshot = () => {
    if (liveVideoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = liveVideoRef.current.videoWidth || 640;
      canvas.height = liveVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(liveVideoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImage(dataUrl);
        setVideo(""); // clear video to prevent double content
        showToast(
          "Snapshot Captured! 📸",
          "success",
          "Evidence photo attached to your pending complaint file.",
        );
      }
    } else {
      showToast(
        "Camera feed inactive",
        "error",
        "Start the camera stream first before taking snapshots.",
      );
    }
  };

  // Record video proof start
  const startVideoRecording = () => {
    if (!cameraStream) {
      showToast(
        "Webcam is inactive",
        "error",
        "Please launch the camera feed before starting a recording.",
      );
      return;
    }
    try {
      const recorder = new MediaRecorder(cameraStream);
      videoChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setVideo(reader.result as string);
          setImage(""); // clear photo preview
          showToast(
            "Video Proof Recorded! 🎥",
            "success",
            "High-definition video evidence compiled successfully.",
          );
        };
      };

      setVideoRecorder(recorder);
      recorder.start();
      setIsRecordingCameraVideo(true);
      setRecordingSeconds(0);

      videoTimerRef.current = setInterval(() => {
        setRecordingSeconds((p) => p + 1);
      }, 1000);

      showToast(
        "Recording live proof... 🎥",
        "info",
        "Describe the situation while filming the location.",
      );
    } catch (e) {
      console.error("Video recording setup failed:", e);
      showToast(
        "Recording Unavailable",
        "error",
        "Standard video recording is restricted by your current browser profile.",
      );
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder && videoRecorder.state !== "inactive") {
      videoRecorder.stop();
    }
    setIsRecordingCameraVideo(false);
    setVideoRecorder(null);
    if (videoTimerRef.current) {
      clearInterval(videoTimerRef.current);
      videoTimerRef.current = null;
    }
  };

  // Clean up camera on mode change or unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [reportMode]);

  // Voice recording states & references
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isUsingWebSpeech, setIsUsingWebSpeech] = useState(false);
  const [tempTranscript, setTempTranscript] = useState("");
  const [speechLang, setSpeechLang] = useState("en-IN");
  const [speechSupported, setSpeechSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
    }
  }, []);

  // Stop any active recordings and clean up on component unmount
  useEffect(() => {
    return () => {
      if (microphoneStreamRef.current) {
        microphoneStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch((e) => console.error(e));
      }
    };
  }, []);

  const startRecording = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        microphoneStreamRef.current = stream;

        // Setup audio visualizer
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          try {
            const audioContext = new AudioContextClass();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateVolume = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
              }
              const average = sum / bufferLength;
              setAudioLevel(average);
              animationFrameRef.current = requestAnimationFrame(updateVolume);
            };
            updateVolume();
          } catch (audioErr) {
            console.warn("Could not setup audio visualizer:", audioErr);
          }
        }

        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = speechLang;

        let accumulatedTranscript = "";
        rec.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              accumulatedTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const currentText = (
            accumulatedTranscript + interimTranscript
          ).trim();
          setTempTranscript(currentText);
        };

        rec.onerror = (e: any) => {
          console.warn("Speech Recognition Info/Error:", e);
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            showToast(
              "Microphone Blocked",
              "warning",
              "Speech recognition failed or was blocked. Falling back to audio file upload.",
            );
          }
        };

        rec.onend = () => {
          console.log("Speech recognition ended.");
        };

        recognitionRef.current = rec;
        rec.start();
        setIsRecording(true);
        setIsUsingWebSpeech(true);
        setTempTranscript("");
        showToast(
          "Dictation Started 🎙️",
          "info",
          `Start speaking in ${speechLang === "te-IN" ? "Telugu" : speechLang === "hi-IN" ? "Hindi" : "English"}. Your words will appear in real-time.`,
        );
        return;
      } catch (err: any) {
        console.warn("Microphone access failed (benign in headless env):", err);
        showToast(
          "Microphone Error",
          "error",
          "Please allow microphone permissions in your browser settings to use voice input.",
        );
        return;
      }
    }

    // FALLBACK: Standard MediaRecorder method if SpeechRecognition is not supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast(
        "Voice Input Unsupported",
        "warning",
        "Your browser does not support microphone access.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current = stream;

      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const audioContext = new AudioContextClass();
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioContext;
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            setAudioLevel(average);
            animationFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (audioErr) {
          console.warn("Could not setup audio visualizer:", audioErr);
        }
      }

      const options = { mimeType: "audio/webm" };
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        await transcribeAudio(audioBlob, mediaRecorder.mimeType);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setIsUsingWebSpeech(false);
      showToast(
        "Microphone Active 🎙️",
        "info",
        "Describe your concern clearly. Click stop when you are done.",
      );
    } catch (err: any) {
      console.warn("Microphone access failed (benign in headless env):", err);
      showToast(
        "Microphone Error",
        "error",
        "Please allow microphone permissions in your browser settings to use voice input.",
      );
    }
  };

  const stopRecording = () => {
    // If Web Speech API is active, stop it and fetch temp transcript
    if (isUsingWebSpeech) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Error stopping SpeechRecognition (benign):", e);
        }
      }

      if (tempTranscript.trim()) {
        setDescription((prev) =>
          prev ? `${prev}\n${tempTranscript}` : tempTranscript,
        );
        showToast(
          "Voice Transcribed! ✍️",
          "success",
          "Your voice message was transcribed and added to the description.",
        );
      } else {
        showToast(
          "Transcription Empty",
          "warning",
          "We couldn't detect any words. Please speak clearly.",
        );
      }
      setTempTranscript("");
      setIsUsingWebSpeech(false);
    }

    // Stop MediaRecorder fallback if active
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch((e) => console.error(e));
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevel(0);
  };

  const transcribeAudio = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(",")[1];

        const response = await fetch("/api/ai/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64Data, mimeType }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text) {
            setDescription((prev) =>
              prev ? `${prev}\n${data.text}` : data.text,
            );
            showToast(
              "Voice Transcribed! ✍️",
              "success",
              "Your voice message was parsed and added to the description.",
            );
          } else {
            showToast(
              "Transcription Empty",
              "warning",
              "We couldn't hear any distinct words in the recording. Please speak louder or closer to your microphone.",
            );
          }
        } else {
          showToast(
            "Transcription Failed",
            "error",
            "The server-side transcribing engine returned an error.",
          );
        }
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error("Transcription error:", err);
      showToast(
        "Network Error",
        "error",
        "Could not connect to the voice transcribing service.",
      );
      setIsTranscribing(false);
    }
  };

  // Calling Feature Simulator
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callStatus, setCallStatus] = useState<"dialing" | "connected">(
    "dialing",
  );
  const callTimerRef = useRef<any>(null);

  const initiateHelplineCall = (officer: any) => {
    // Show toast
    showToast(
      `Requesting device phone call channel... 📞`,
      "info",
      `Dialing ${officer.name} at ${officer.phone}`,
    );

    // Set simulator active
    setActiveCall(officer);
    setCallSeconds(0);
    setCallStatus("dialing");

    if (callTimerRef.current) clearInterval(callTimerRef.current);

    // Simulate dialing transition
    setTimeout(() => {
      setCallStatus("connected");
      showToast(
        "Helpline Line Secured! 🟢",
        "success",
        `Connected with ${officer.name}. Simulating active audio line.`,
      );
    }, 2800);

    callTimerRef.current = setInterval(() => {
      setCallSeconds((p) => p + 1);
    }, 1000);
  };

  const terminateCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setActiveCall(null);
    setCallSeconds(0);
    showToast(
      "Call Disconnected 📞",
      "info",
      "Emergency communication line released.",
    );
  };

  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Interactive Map Pin calculations
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    setPinPosition({ x: xPct, y: yPct });
    setIsPinned(true);

    // Convert to lat/lng inside Nizamabad/Hyderabad bounding box
    const computedLat = 17.45 - (yPct / 100) * (17.45 - 17.42);
    const computedLng = 78.43 + (xPct / 100) * (78.47 - 78.43);

    setLat(computedLat);
    setLng(computedLng);

    // Resolve Ward based on quadrant clicked
    let computedWard = "";
    if (xPct < 50 && yPct < 50) {
      computedWard = "Ward 1 (Panchayat Center)";
    } else if (xPct >= 50 && yPct < 50) {
      computedWard = "Ward 2 (Market Area)";
    } else if (xPct < 50 && yPct >= 50) {
      computedWard = "Ward 3 (School District)";
    } else {
      computedWard = "Ward 4 (Bypass)";
    }

    setWard(computedWard);

    // Update address descriptive prefix
    const shortWardName = computedWard.split(" (")[0];
    setAddress(
      `Near main junction, ${shortWardName} (GPS: ${computedLat.toFixed(4)}, ${computedLng.toFixed(4)})`,
    );

    showToast(
      "GPS Coordinate Pinned! 📍",
      "success",
      `Registered location at ${computedLat.toFixed(4)}, ${computedLng.toFixed(4)} inside ${shortWardName}.`,
    );
  };

  const handleUseLiveLocation = () => {
    showToast("Requesting live location...", "info");
    getLiveLocation(
      (coords) => {
        const computedLat = coords.lat;
        const computedLng = coords.lng;
        setLat(computedLat);
        setLng(computedLng);
        setIsPinned(true);

        // Map live lat/lng to percentage bounds of simulated map
        const clampedLat = Math.min(Math.max(computedLat, 17.42), 17.45);
        const clampedLng = Math.min(Math.max(computedLng, 78.43), 78.47);
        const yPct = ((17.45 - clampedLat) / (17.45 - 17.42)) * 100;
        const xPct = ((clampedLng - 78.43) / (78.47 - 78.43)) * 100;
        setPinPosition({ x: xPct, y: yPct });

        // Resolve Ward
        let computedWard = "";
        if (xPct < 50 && yPct < 50) {
          computedWard = "Ward 1 (Panchayat Center)";
        } else if (xPct >= 50 && yPct < 50) {
          computedWard = "Ward 2 (Market Area)";
        } else if (xPct < 50 && yPct >= 50) {
          computedWard = "Ward 3 (School District)";
        } else {
          computedWard = "Ward 4 (Bypass)";
        }
        setWard(computedWard);

        const shortWardName = computedWard.split(" (")[0];
        setAddress(
          `Near main junction, ${shortWardName} (GPS: ${computedLat.toFixed(4)}, ${computedLng.toFixed(4)})`,
        );
        showToast(
          "GPS Location Acquired!",
          "success",
          `Live location synchronized at ${computedLat.toFixed(4)}, ${computedLng.toFixed(4)}.`,
        );
      },
      (error) => {
        showToast(
          "Could not retrieve live coordinates. Please pin manually on the map.",
          "error",
        );
      },
    );
  };

  // AI Categorization states
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState(false);
  const [aiActionPlan, setAiActionPlan] = useState<string[]>([]);
  const [assignedDept, setAssignedDept] = useState("Gram Panchayat Team");
  const [aiSummary, setAiSummary] = useState("");

  const handleAiCategorize = async () => {
    if (!description || description.trim().length < 10) {
      showToast(
        "Description too short",
        "warning",
        "Please write at least 10 characters so that the AI model can analyze the issue context.",
      );
      return;
    }

    setIsAiAnalyzing(true);
    setAiSuccessMessage(false);

    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (response.ok) {
        const data = await response.json();

        // Auto-populate states with AI predictions
        setTitle(data.improvedTitle || title);
        setCategory(data.category as IssueCategory);
        setUrgency(data.urgency as IssueUrgency);
        setAssignedDept(data.assignedDept || "Panchayat Wing");
        setAiActionPlan(data.actionPlan || []);
        setAiSummary(data.summary || "");
        setAiSuccessMessage(true);

        // Autofill address depending on what ward is chosen if empty
        if (!address) {
          setAddress(`Near primary block, ${ward.split(" ")[0]}`);
        }
      } else {
        console.error("AI service returned error response.");
        showToast(
          "AI Routing Bypass",
          "info",
          "Pre-analyzer idle. Standard local categories are ready.",
        );
      }
    } catch (err) {
      console.error("Failed to fetch AI categorization:", err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileData = reader.result as string;
        if (file.type.startsWith("video/")) {
          setVideo(fileData);
          setImage(""); // Clear photo if video is attached
          showToast(
            "Video Evidence Attached! 🎥",
            "success",
            "Your live video evidence has been attached to the report.",
          );
        } else {
          setImage(fileData);
          setVideo(""); // Clear video if photo is attached
          showToast(
            "Photo Evidence Attached! 📸",
            "success",
            "Your physical photo evidence has been attached to the report.",
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const selectPresetImage = (url: string) => {
    setImage(url);
    setVideo(""); // Clear video if preset photo is selected
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      showToast(
        "Description required",
        "warning",
        "Please provide a detailed description of the community issue.",
      );
      return;
    }

    onSubmit({
      title: title || "New Community Report",
      description,
      category,
      urgency,
      address: address || "Panchayat Road, Village Center",
      ward,
      lat,
      lng,
      image:
        image ||
        (video
          ? ""
          : category === IssueCategory.POTHOLE
            ? "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80"
            : category === IssueCategory.WATER_LEAKAGE
              ? "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80"
              : category === IssueCategory.STREETLIGHT_DAMAGE
                ? "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?auto=format&fit=crop&w=800&q=80"
                : category === IssueCategory.WASTE_MANAGEMENT
                  ? "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80"
                  : category === IssueCategory.INFRASTRUCTURE
                    ? "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80"
                    : "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=800&q=80"),
      video,
      isAnonymous,
      assignedDept,
      actionPlan: aiActionPlan,
    });
  };

  // ----------------------------------------------------
  // SCREEN 1: THE SELECT OPTION WIZARD
  // ----------------------------------------------------
  if (reportMode === "select") {
    return (
      <div
        id="option-selection-portal"
        className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 max-w-3xl mx-auto space-y-6"
      >
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 flex items-center gap-2 font-display">
              <Sparkles className="h-5 w-5 text-indigo-600 fill-indigo-100" />
              {t("File New Complaint")}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                "Select your preferred communication media to submit your complaint.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-xl border border-slate-200 cursor-pointer"
          >
            {t("Cancel")}
          </button>
        </div>

        {/* 3 Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Option 1: Camera */}
          <button
            type="button"
            onClick={() => {
              setReportMode("camera");
              startCamera();
            }}
            className="group p-5 bg-gradient-to-br from-rose-50/45 via-white to-white hover:from-rose-50 border border-slate-200 hover:border-rose-400 rounded-2xl text-left transition-all hover:shadow-md cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 group-hover:scale-105 transition-transform">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100/70 text-rose-800 border border-rose-200/40">
                {t("Option 1")}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {t("Camera Live Snap")}
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t(
                "Activate device webcam to capture photos or live video proof of community damages directly on the spot.",
              )}
            </p>
            <div className="mt-4 flex items-center gap-1 text-[11px] font-extrabold text-rose-700">
              <span>{t("Open On-Site Lens")}</span>
              <span className="group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </div>
          </button>

          {/* Option 2: Text */}
          <button
            type="button"
            onClick={() => setReportMode("text")}
            className="group p-5 bg-gradient-to-br from-indigo-50/45 via-white to-white hover:from-indigo-50 border border-slate-200 hover:border-indigo-400 rounded-2xl text-left transition-all hover:shadow-md cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600 group-hover:scale-105 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-800 border border-indigo-200/40">
                {t("Option 2")}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {t("Standard Text Form")}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t(
                "Submit your concern manually. Fill detailed text, pin coordinates on the map, choose presets, or file anonymously.",
              )}
            </p>
            <div className="mt-4 flex items-center gap-1 text-[11px] font-extrabold text-indigo-700">
              <span>{t("Write Manual Form")}</span>
              <span className="group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </div>
          </button>

          {/* Option 3: Call Helpline */}
          <button
            type="button"
            onClick={() => setReportMode("call")}
            className="group p-5 bg-gradient-to-br from-amber-50/45 via-white to-white hover:from-amber-50 border border-slate-200 hover:border-amber-400 rounded-2xl text-left transition-all hover:shadow-md cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600 group-hover:scale-105 transition-transform">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 border border-amber-200/40">
                {t("Option 3")}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {t("Direct Officer Call")}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {t(
                "Need immediate resolution? View direct mobile numbers of village Panchayat leaders and engineers to call them.",
              )}
            </p>
            <div className="mt-4 flex items-center gap-1 text-[11px] font-extrabold text-amber-700">
              <span>{t("View Panchayat Directory")}</span>
              <span className="group-hover:translate-x-1 transition-transform">
                &rarr;
              </span>
            </div>
          </button>
        </div>

        {/* Informational tip */}
        <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-[10px] text-slate-500 leading-normal">
          {t(
            "📌 Panchayat Digital Complaint Desk acts as an official liaison system. Complaints posted via Option 1 and 2 are published on the village civic feed for live tracking and administrative points allocation.",
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 2: LIVE CAMERA SCREEN (Option 1)
  // ----------------------------------------------------
  if (reportMode === "camera") {
    return (
      <div
        id="camera-hardware-module"
        className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 max-w-3xl mx-auto space-y-6"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                <Camera className="h-4.5 w-4.5" />
              </span>
              Camera Evidence Capture
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Take an interactive snapshot or record video proof of the public
              issue.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              setReportMode("select");
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
          >
            Back to Options
          </button>
        </div>

        {/* Live Camera View and fallbacks */}
        <div className="space-y-4">
          {cameraPermission === "granted" && cameraStream ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-350 bg-slate-950 aspect-video max-h-[320px] flex items-center justify-center group shadow-md">
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Record timer overlay */}
              {isRecordingCameraVideo && (
                <div className="absolute top-3 left-3 bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>
                    RECORDING LIVE PROOF: {formatTimer(recordingSeconds)}
                  </span>
                </div>
              )}

              {/* Status active banner */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[9px] font-mono font-bold px-2.5 py-1 rounded-md tracking-wider">
                ISO SHUTTER 1/60s • ACTIVE BROADCAST
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center shadow-inner">
                <VideoOff className="h-6 w-6" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xs font-bold text-slate-800">
                  Hardware Connection Standby
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Your browser requires permission to connect to a camera. If no
                  webcam is attached, you can safely proceed by choosing a mock
                  file upload directly below!
                </p>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Request Camera Access
              </button>
            </div>
          )}

          {/* Interactive controls */}
          {cameraPermission === "granted" && cameraStream && (
            <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <button
                type="button"
                onClick={captureSnapshot}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                Capture Photo Still
              </button>

              {!isRecordingCameraVideo ? (
                <button
                  type="button"
                  onClick={startVideoRecording}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Radio className="h-4 w-4 animate-pulse" />
                  Record Video Clip
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVideoRecording}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                >
                  <Square className="h-3.5 w-3.5 fill-white" />
                  Stop Recording (Save)
                </button>
              )}
            </div>
          )}

          {/* High compatibility file backup block */}
          <div className="border border-dashed border-slate-200 p-4 rounded-2xl bg-slate-50 space-y-2">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              High-Compatibility Media Vault Fallback
            </span>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Alternative: select custom files from device storage instantly.
              </p>
              <div className="relative">
                <button
                  type="button"
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-3 py-2 rounded-lg cursor-pointer transition-all"
                >
                  Upload File Still/Video
                </button>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Captured previews display */}
          {(image || video) && (
            <div className="border border-indigo-100 bg-indigo-50/20 p-4 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-indigo-600" />
                Evidence Loaded Successfully!
              </h4>

              <div className="flex gap-4">
                {image && (
                  <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm shrink-0">
                    <img
                      src={image}
                      className="w-full h-full object-cover"
                      alt="Snapshot"
                    />
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="absolute top-1.5 right-1.5 bg-slate-950/80 text-white p-1 rounded-md text-[9px] font-bold hover:bg-black cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {video && (
                  <div className="relative w-40 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm shrink-0">
                    <video
                      src={video}
                      className="w-full h-full object-cover"
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => setVideo("")}
                      className="absolute top-1.5 right-1.5 bg-slate-950/80 text-white p-1 rounded-md text-[9px] font-bold hover:bg-black cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}

                <div className="flex flex-col justify-center">
                  <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                    You've acquired on-site proof. Click the button on the right
                    to auto-attach this and write the description details.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit / Proceed */}
        <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
          <p className="text-[10px] text-slate-400">
            * Captured media is locked into the standard form on transition.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setReportMode("select");
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setReportMode("text");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Continue to Details Form &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 3: VOICE DICTATION MODULE (Option 2)
  // ----------------------------------------------------
  if (reportMode === "audio") {
    return (
      <div
        id="audio-dictation-module"
        className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 max-w-3xl mx-auto space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Mic className="h-4.5 w-4.5" />
              </span>
              Voice Dictation Assistant
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record your voice, and our real-time transcribing engine will
              write the complaint for you.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
              <span className="text-[10px] font-black font-mono uppercase text-slate-400">
                Language:
              </span>
              <select
                disabled={isRecording}
                value={speechLang}
                onChange={(e) => setSpeechLang(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="en-IN">English (India)</option>
                <option value="te-IN">తెలుగు (Telugu)</option>
                <option value="hi-IN">हिन्दी (Hindi)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                stopRecording();
                setReportMode("select");
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
            >
              Back to Options
            </button>
          </div>
        </div>

        {/* Dynamic Voice Recording Display */}
        <div className="space-y-5">
          <div className="border border-slate-150 p-6 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-6">
            {isRecording ? (
              <div className="space-y-4 w-full flex flex-col items-center">
                {/* Glow microphone pulse */}
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 bg-rose-500/20 rounded-full animate-ping" />
                  <div className="absolute w-14 h-14 bg-rose-500/30 rounded-full animate-pulse" />
                  <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                    <Mic className="h-5 w-5 animate-bounce" />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-rose-600 font-mono tracking-wider">
                    MICROPHONE ACTIVE & LISTENING
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Speak clearly into your device microphone.
                  </p>
                </div>

                {/* Animated visualizer lines */}
                <div className="flex items-center gap-1 justify-center h-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                    const multiplier =
                      bar % 3 === 0 ? 0.4 : bar % 2 === 0 ? 0.8 : 1.2;
                    const heightVal = Math.max(
                      3,
                      Math.min(28, (audioLevel / 20) * multiplier),
                    );
                    return (
                      <div
                        key={bar}
                        className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                        style={{ height: `${heightVal}px` }}
                      />
                    );
                  })}
                </div>

                {/* Real-time speech transcription preview */}
                {isUsingWebSpeech && (
                  <div className="w-full max-w-lg bg-white/80 backdrop-blur-xs border border-rose-100 rounded-2xl p-4 shadow-sm animate-fade-in text-left">
                    <span className="text-[9px] font-black font-mono text-rose-500 uppercase tracking-widest block mb-1">
                      Speaking Real-time Transcript Preview:
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed italic min-h-[32px]">
                      {tempTranscript ||
                        "Listening... Start speaking to see text generation..."}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={stopRecording}
                  className="bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Square className="h-3 w-3 fill-white" />
                  Stop & Transcribe
                </button>
              </div>
            ) : isTranscribing ? (
              <div className="space-y-4 py-4 flex flex-col items-center">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Converting Audio Waveform...
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    AI voice model is analyzing local dialects and context.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4 flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center shadow-inner">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Gram Panchayat Dictation Standby
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                    Describe your community concern verbally. Once done, we will
                    transcribe your speech and append it directly to the
                    description.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startRecording}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5 hover:scale-102 active:scale-98"
                >
                  <Radio className="h-4 w-4" />
                  Start Dictation
                </button>
              </div>
            )}
          </div>

          {/* Transcription Text Result Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Resulting Description Output
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Your transcript text will generate here once you click Stop. You can manually tweak or edit it here as well."
              className="w-full text-sm border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 p-3 rounded-2xl transition-all resize-none font-sans"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 pt-5 flex justify-between items-center">
          <p className="text-[10px] text-slate-400">
            * Voice text pre-fills the standard manual file before final upload.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopRecording();
                setReportMode("select");
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setReportMode("text")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer"
            >
              Proceed to Location Details &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 4: DIRECT OFFICER HELPLINE CALL (Option 3)
  // ----------------------------------------------------
  if (reportMode === "call") {
    return (
      <div
        id="helpline-directory-module"
        className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 max-w-3xl mx-auto space-y-6 relative"
      >
        {/* Calling Simulator Active overlay HUD */}
        {activeCall && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm rounded-3xl z-50 flex flex-col items-center justify-between p-8 text-white animate-fade-in">
            {/* Top Security Line indicator */}
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono tracking-widest bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>PANCHAYAT MOBILE SECURE HELPLINE</span>
            </div>

            {/* Profile Avatar calling card */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-indigo-500/10 rounded-full animate-ping" />
                <div
                  className={`absolute -inset-4 rounded-full border border-white/10 ${callStatus === "connected" ? "animate-pulse" : ""}`}
                />
                <img
                  src={activeCall.avatar}
                  alt={activeCall.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-xl"
                />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white font-display">
                  {activeCall.name}
                </h3>
                <p className="text-xs text-indigo-300 font-medium">
                  {activeCall.role}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {activeCall.phone}
                </p>
              </div>

              {/* Connected timer */}
              <div className="text-center">
                {callStatus === "dialing" ? (
                  <span className="text-xs text-amber-400 font-semibold animate-pulse font-mono tracking-widest">
                    DIALING PHONE NETWORK...
                  </span>
                ) : (
                  <div className="space-y-1">
                    <span className="text-2xl font-bold font-mono text-white">
                      {formatTimer(callSeconds)}
                    </span>
                    <p className="text-[9px] text-emerald-400 font-semibold tracking-wider uppercase">
                      CONNECTED • REAL-TIME SIMULATION
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Control Panel dials */}
            <div className="w-full max-w-sm space-y-5">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer border transition-all ${
                    isMuted
                      ? "bg-rose-950/50 border-rose-500/40 text-rose-300"
                      : "bg-slate-900 border-white/5 hover:bg-slate-850 text-white"
                  }`}
                >
                  <MicOff className="h-4.5 w-4.5" />
                  <span>Mute Mic</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSpeaker(!isSpeaker)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl cursor-pointer border transition-all ${
                    isSpeaker
                      ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                      : "bg-slate-900 border-white/5 hover:bg-slate-850 text-white"
                  }`}
                >
                  <Volume2 className="h-4.5 w-4.5" />
                  <span>Speaker</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast("Simulating numeric key press", "info");
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-900 border border-white/5 hover:bg-slate-850 text-white cursor-pointer transition-all"
                >
                  <Clock className="h-4.5 w-4.5" />
                  <span>Record Memo</span>
                </button>
              </div>

              {/* End call red trigger button */}
              <button
                type="button"
                onClick={terminateCall}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 px-6 rounded-2xl shadow-xl shadow-rose-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <PhoneOff className="h-4.5 w-4.5 fill-white" />
                End Direct Call
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <PhoneCall className="h-4.5 w-4.5" />
              </span>
              {t("Panchayat Emergency Helpline")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                "Initiate direct calls to village administration and maintenance directors instantly.",
              )}
            </p>
            <p className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1 bg-amber-50/50 px-2.5 py-1 rounded-md w-fit">
              📱 {t("This calling feature works better in mobile phone")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReportMode("select")}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
          >
            {t("Back to Options")}
          </button>
        </div>

        {/* Directory Listings */}
        <div className="space-y-3">
          {OFFICIALS_LIST.map((official) => (
            <div
              key={official.id}
              className="border border-slate-150 p-4 rounded-2xl hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={official.avatar}
                  alt={t(official.name)}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                />
                <div>
                  <h3 className="text-xs font-black text-slate-800 font-sans">
                    {t(official.name)}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {t(official.role)}
                  </p>

                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                      official.status === "Available"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                        : official.status === "In Office"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                          : "bg-amber-50 text-amber-700 border border-amber-200/50"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        official.status === "Available"
                          ? "bg-emerald-500"
                          : official.status === "In Office"
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                      }`}
                    />
                    {t(official.status)}
                  </span>
                </div>
              </div>

              {/* Action Call Button */}
              <div className="flex sm:flex-col items-stretch gap-2 shrink-0">
                {/* Simulated Call */}
                <button
                  type="button"
                  onClick={() => initiateHelplineCall(official)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Phone className="h-3.5 w-3.5 fill-slate-950" />
                  {t("Simulate Call")}
                </button>

                {/* Real Tel link */}
                <a
                  href={`tel:${official.phone.replace(/\s+/g, "")}`}
                  onClick={() => {
                    showToast(t("Launching device default dialer..."), "info");
                  }}
                  className="flex-1 bg-slate-900 hover:bg-black text-white font-bold text-[11px] py-2 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 text-center"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  {t("Direct Dialer Link")}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Directory Footer */}
        <div className="bg-amber-50/50 border border-amber-200/40 p-4 rounded-2xl flex items-start gap-2.5">
          <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] text-amber-900 leading-relaxed">
            <b>{t("Emergency Warning:")}</b>{" "}
            {t(
              "If you are calling to report immediate threats (like active live electrical cables sparked by storms, major canal breaches flooding houses), please dial the Sarpanch or Sanitation officer immediately to dispatch emergency response squads.",
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREEN 5: TEXT REPORT FORM (Option 2 & proceeding from option 1)
  // ----------------------------------------------------
  return (
    <div
      id="report-form-container"
      className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 max-w-3xl mx-auto"
    >
      <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-display">
            <Camera className="h-5 w-5 text-indigo-600" />
            Report Community Concern
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit a public maintenance report with active location and
            automated AI categorization.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReportMode("select")}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer"
        >
          Options List
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Step 1: Tell us what is wrong */}
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700 block">
              1. Describe the Issue *
            </label>
            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 animate-pulse text-[9px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>LISTENING</span>
                  <div className="flex items-center gap-0.5 h-2.5 ml-1">
                    {[1, 2, 3, 4, 5].map((bar) => {
                      const multiplier =
                        bar === 1 || bar === 5
                          ? 0.4
                          : bar === 2 || bar === 4
                            ? 0.7
                            : 1.0;
                      const heightVal = Math.max(
                        2,
                        Math.min(10, (audioLevel / 25) * multiplier),
                      );
                      return (
                        <div
                          key={bar}
                          className="w-0.5 bg-rose-500 rounded-full transition-all duration-75"
                          style={{ height: `${heightVal}px` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                className={`flex items-center gap-1.5 text-[10px] font-bold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-700 border-rose-700 text-white shadow-sm"
                    : isTranscribing
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800"
                }`}
              >
                {isTranscribing ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-emerald-600" />
                    <span>Transcribing Voice...</span>
                  </>
                ) : isRecording ? (
                  <>
                    <Square className="h-2.5 w-2.5 fill-white" />
                    <span>Stop & Transcribe</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    <span>Dictate Hands-Free</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              id="report-desc-textarea"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., 'There are 3 major potholes on the Bypass Highway near Ward 4. Motorists are swerving dangerously to avoid them. Needs immediate filling...'"
              className="w-full text-sm border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 p-3.5 rounded-2xl transition-all resize-none font-sans"
            />
            {/* AI Floating Button */}
            <button
              type="button"
              id="ai-categorize-btn"
              onClick={handleAiCategorize}
              disabled={isAiAnalyzing || !description}
              className={`absolute bottom-3 right-3 flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border shadow-sm transition-all cursor-pointer ${
                isAiAnalyzing
                  ? "bg-slate-100 border-slate-200 text-slate-400"
                  : description
                    ? "bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-800 hover:scale-105 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isAiAnalyzing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                  <span>AI Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 text-indigo-600 fill-indigo-200" />
                  <span>AI Pre-Analyze & Route</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Write naturally. Click the <b>AI Pre-Analyze</b> button to
            automatically predict category, assign responsible department, and
            refine title.
          </p>
        </div>

        {/* AI Response Card if success */}
        {aiSuccessMessage && (
          <div className="bg-gradient-to-br from-indigo-50/70 to-slate-50/50 border border-indigo-200/60 p-5 rounded-2xl space-y-3 shadow-inner">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 fill-indigo-200" />
              <h4 className="text-xs font-bold text-slate-800 font-display">
                AI Intelligence Diagnostics Completed!
              </h4>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="h-2.5 w-2.5" /> Routed
              </span>
            </div>

            {aiSummary && (
              <p className="text-xs text-slate-600 leading-normal italic bg-white/70 border border-white p-2.5 rounded-lg">
                "{aiSummary}"
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block font-mono font-bold">
                  ASSIGNED DEPT:
                </span>
                <span className="font-bold text-slate-700">{assignedDept}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-mono font-bold">
                  REFINED TITLE:
                </span>
                <span className="font-bold text-slate-700">{title}</span>
              </div>
            </div>

            {aiActionPlan.length > 0 && (
              <div className="border-t border-slate-200/50 pt-2.5 space-y-1.5">
                <span className="text-slate-500 text-[10px] font-bold block flex items-center gap-1">
                  <Info className="h-3 w-3 text-indigo-500" />
                  AI GENERATED PANCHAYAT REPAIR ACTION PLAN:
                </span>
                <ol className="list-decimal pl-4 text-[11px] text-slate-600 space-y-1">
                  {aiActionPlan.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Custom details (autofilled by AI but editable) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Title / Summary Header
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Refined title (e.g., Roads & Potholes bypass)"
              className="w-full text-sm border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 p-3 rounded-xl font-sans"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IssueCategory)}
              className="w-full text-sm border border-slate-200 p-3 rounded-xl bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              {Object.values(IssueCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Urgency Level
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as IssueUrgency)}
              className="w-full text-sm border border-slate-200 p-3 rounded-xl bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              {Object.values(IssueUrgency).map((urg) => (
                <option key={urg} value={urg}>
                  {urg}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Target Ward Boundary
            </label>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              className="w-full text-sm border border-slate-200 p-3 rounded-xl bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="Ward 1 (Panchayat Center)">
                Ward 1 (Panchayat Center)
              </option>
              <option value="Ward 2 (Market Area)">Ward 2 (Market Area)</option>
              <option value="Ward 3 (School District)">
                Ward 3 (School District)
              </option>
              <option value="Ward 4 (Bypass)">Ward 4 (Bypass)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Specific Landmark Address / Location Description
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter exact shop, post number, or street landmarks..."
              className="w-full text-sm border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 p-3 pl-9 rounded-xl font-sans"
            />
            <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        {/* Anonymous Toggle Option */}
        <div className="flex items-center gap-3 bg-indigo-50/45 border border-indigo-100 p-4 rounded-2xl shadow-xs">
          <input
            type="checkbox"
            id="is-anonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <div
            className="cursor-pointer select-none"
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            <label
              htmlFor="is-anonymous"
              className="text-xs font-black text-slate-800 cursor-pointer flex items-center gap-1"
            >
              🕵️ Report This Concern Anonymously
            </label>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
              When checked, your real name, email, and avatar will be completely
              masked with <b>"Anonymous Citizen"</b> on the public feed.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="border-t border-slate-100 pt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setReportMode("select")}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors py-2.5 px-4 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Go Back
          </button>
          <button
            type="submit"
            id="submit-report-btn"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all shadow-md hover:shadow-indigo-500/10 flex items-center gap-2 cursor-pointer"
          >
            Submit Public Report
          </button>
        </div>
      </form>
    </div>
  );
}
