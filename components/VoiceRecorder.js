'use client'
import React, { useState, useRef } from 'react';

const VoiceRecorder = () => {
  // Make sure these state declarations are at the top of your component
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [apiKey, setApiKey] = useState('');  // This line must be present
  const [copySuccess, setCopySuccess] = useState('');
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
    if (!apiKey) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    try {
      setIsTranscribing(true);
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
    
const downloadTranscription = () => {
    const element = document.createElement('a');
    const file = new Blob([transcription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `transcription-${new Date().toISOString()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed to copy');
      console.error('Failed to copy text: ', err);
    }
  };

  const createJiraTicket = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return 'https://wsc-sports.atlassian.net/browse/WSC-123';
  };

  /*const createJiraTicket = async () => {
    if (!transcription) return;
    
    try {
      // We'll update these values later with environment variables
      const JIRA_EMAIL = 'your-email@wsc-sports.com';
      const JIRA_API_TOKEN = 'your-api-token';
      const PROJECT_KEY = 'WSC'; // Placeholder
  
      const response = await fetch('https://wsc-sports.atlassian.net/rest/api/2/issue', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            project: {
              key: PROJECT_KEY
            },
            summary: transcription,
            description: transcription,
            issuetype: {
              name: 'Story'
            },
            assignee: {
              name: 'Yaron Sela'
            },
            labels: ['smart-recorder']
          }
        })
      });
  
      if (!response.ok) {
        throw new Error('Failed to create Jira ticket');
      }
  
      const data = await response.json();
      return `https://wsc-sports.atlassian.net/browse/${data.key}`;
    } catch (error) {
      console.error('Error creating Jira ticket:', error);
      throw error;
    }*/
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Voice Recorder</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          OpenAI API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
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
          {isRecording ? 'Stop Recording' : 'Start Recording'}
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
              onClick={downloadTranscription}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Download as Text
            </button>
            
            <button
              onClick={copyToClipboard}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {copySuccess || 'Copy to Clipboard'}
            </button>

            <button
              onClick={async () => {
                try {
                  const url = await createJiraTicket();
                  setJiraTicketUrl(url);
                  setJiraError('');
                } catch (err) {
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