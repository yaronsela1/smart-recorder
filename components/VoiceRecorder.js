'use client'
import React, { useState, useRef } from 'react';

const VoiceRecorder = () => {
  // Make sure these state declarations are at the top of your component
  const [summary, setSummary] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const [jiraTicketUrl, setJiraTicketUrl] = useState('');
  const [jiraError, setJiraError] = useState('');
  
  

  const startRecording = async () => {
    try {
      setAudioBlob(null);
      setTranscription('');
      chunksRef.current = [];

      const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      
      if (permissionStatus.state === 'denied') {
        alert('Please reset microphone permissions:\n1. Click the lock/site settings icon in your address bar\n2. Find microphone settings\n3. Reset or Allow permissions\n4. Refresh the page');
        return;
      }

      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      });

      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        await transcribeAudio(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Detailed error:', err);
      alert('Error accessing microphone: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setIsTranscribing(true);
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTranscription(data.text);
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscription('Error transcribing audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const createJiraTicket = async () => {
    if (!transcription) return;
    
    try {
      const response = await fetch('/api/jira', {
        method: 'POST',
        body: JSON.stringify({ transcription, summary }),
        headers: {
          'Content-Type': 'application/json',
        }
      });
  
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data.url;
    } catch (error) {
      console.error('Error creating Jira ticket:', error);
      throw error;
    }
  };
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Voice Recorder</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ticket Summary
        </label>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Add User Story title"
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-4 rounded-full ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isRecording ? 'Stop Recording' : 'Record Spec'}
        </button>
      </div>
      
      {audioBlob && (
        <div className="mt-6">
          <audio controls className="w-full mb-4">
            <source src={URL.createObjectURL(audioBlob)} type="audio/webm" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {isTranscribing && (
        <div className="mt-4 text-center text-gray-600">
          Transcribing...
        </div>
      )}

      {transcription && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-bold mb-2">Transcription:</h3>
          <p className="mb-4 text-gray-900">{transcription}</p>
      
          
          {/* Add these new buttons */}
          <div className="flex space-x-4">
            <button
              onClick={async () => {
                try {
                  const url = await createJiraTicket();
                  setJiraTicketUrl(url);
                  setJiraError('');
                } catch (error) {
                  console.error(error);
                  setJiraError('Failed to create Jira ticket');
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
            >
              Create Jira Ticket
            </button>
          </div>

          {jiraTicketUrl && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-lg">
              <p>Successfully created Jira ticket!</p>
              <a 
                href={jiraTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View ticket
              </a>
            </div>
          )}

          {jiraError && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {jiraError}
            </div>
          )}  
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
