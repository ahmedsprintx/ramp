// "use client"

// import { Mic, MicOff } from 'lucide-react';
// import React, { useState, useEffect, useCallback } from 'react';

// const SpeechToText = ({ onChange }: { onChange: (transcript: string) => void }) => {
//     const [isListening, setIsListening] = useState(false);
//     const [recognition, setRecognition] = useState<any | null>(null);
//     const [transcript, setTranscript] = useState('');

//     const updateTranscript = useCallback((newText: string) => {
//         setTranscript(prev => {
//             const updated = prev + ' ' + newText;
//             onChange(updated.trim());
//             return updated;
//         });
//     }, [onChange]);

//     useEffect(() => {
//         if (typeof window !== 'undefined') {
//             const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
//             if (SpeechRecognition) {
//                 const recognitionInstance: any = new SpeechRecognition();
//                 recognitionInstance.continuous = true;
//                 recognitionInstance.interimResults = true;

//                 recognitionInstance.onresult = (event: any) => {
//                     let currentTranscript = '';
//                     for (let i = event.resultIndex; i < event.results.length; i++) {
//                         if (event.results[i].isFinal) {
//                             updateTranscript(event.results[i][0].transcript);
//                         } else {
//                             currentTranscript += event.results[i][0].transcript;
//                         }
//                     }
//                     if (currentTranscript) {
//                         onChange(transcript + ' ' + currentTranscript);
//                     }
//                 };

//                 recognitionInstance.onend = () => {
//                     if (isListening) {
//                         recognitionInstance.start();
//                     }
//                 };

//                 setRecognition(recognitionInstance);
//             }
//         }
//     }, [isListening, transcript, onChange, updateTranscript]);

//     const toggleListening = () => {
//         if (recognition) {
//             if (isListening) {
//                 recognition.stop();
//             } else {
//                 setTranscript('')
//                 recognition.start();
//             }
//             setIsListening(!isListening);
//         }
//     };

//     return (
//         <div className="space-y-4">
//             <button
//                 onClick={toggleListening}
//                 className={`${isListening ? 'bg-red-500 hover:bg-red-600 ' : 'bg-blue-500 hover:bg-blue-600'} p-2 rounded-full`}
//                 disabled={!recognition}
//             >
//                 {recognition
//                     ? (isListening ? <MicOff /> : <Mic />)
//                     : 'Speech Recognition Not Supported'
//                 }
//             </button>
//         </div>
//     );
// };

// export default SpeechToText;

// import { Mic, MicOff } from 'lucide-react';
// import React, { useEffect } from 'react';
// import useSpeechToText from 'react-hook-speech-to-text';

// export default function SpeechComp({ onChange }: any) {
//   const {
//     error,
//     interimResult,
//     isRecording,
//     results,
//     startSpeechToText,
//     stopSpeechToText,
//   } = useSpeechToText({
//     continuous: true,
//     useLegacyResults: false
//   });

//   useEffect(() => {
//     onChange((results[results?.length - 1] as any)?.transcript)
//   }, [results])

//   if (error) return <p>Web Speech API is not available in this browser 🤷‍</p>;

//   return (
//     <div>
//       <button className='p-[10px] mb-[10px] rounded-full bg-[#ED3735]' onClick={isRecording ? stopSpeechToText : startSpeechToText}>
//         {isRecording ? <MicOff className='h-[24px] w-[24px]' /> : <Mic className='h-[24px] w-[24px]' />}
//       </button>
//     </div>
//   );
// }

import React from "react";

const Speech = () => {
  return <></>;
};

export default Speech;
