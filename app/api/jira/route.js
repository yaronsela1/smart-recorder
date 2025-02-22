import { db, testFirebase } from '@/utils/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { formatUserStory } from '@/utils/gpt';

export async function POST(request) {
  try {
    // Test Firebase connection
    const firebaseTest = await testFirebase();
    console.log("Firebase connection test:", firebaseTest ? "SUCCESS" : "FAILED");

    const body = await request.json();
    console.log('1. Request body received:', body);
    
    const { transcription, summary, assignee, squad = 'Avgen' } = body;
    console.log('2. Parsed values:', { transcription, summary, assignee, squad });
    
    // New step: Format the transcription into a user story
    console.log('3. Formatting transcription with company context...');
    const formattedStory = await formatUserStory(transcription);
    console.log('4. Formatting complete');
    
    console.log('5. Environment variables present:', {
      hasEmail: !!process.env.NEXT_PUBLIC_JIRA_EMAIL,
      hasToken: !!process.env.NEXT_PUBLIC_JIRA_API_TOKEN,
      hasProjectKey: !!process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY
    });
  
    // Create the ticket with formatted story
    const response = await fetch('https://wsc-sports.atlassian.net/rest/api/2/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${process.env.NEXT_PUBLIC_JIRA_API_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        fields: {
          project: { key: process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY },
          summary: summary,
          description: formattedStory, // Use the formatted story instead of raw transcription
          issuetype: { name: 'Story' },
          labels: ['smart-recorder'],
          customfield_10105: {"value": squad},
          customfield_10107: {"value": "R&D"}
        }
      })
    });

    const data = await response.json();
    console.log('Jira ticket creation response:', data);
    
    if (!response.ok) {
      console.error('Jira error:', data);
      throw new Error(data.message || 'Failed to create ticket');
    }

    // Now update the assignee in a separate call
    console.log('Attempting to set assignee for ticket:', data.key);
    const assigneeResponse = await fetch(`https://wsc-sports.atlassian.net/rest/api/2/issue/${data.key}/assignee`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${process.env.NEXT_PUBLIC_JIRA_API_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: assignee
      })
    });

    if (!assigneeResponse.ok) {
      console.error('Failed to set assignee:', await assigneeResponse.text());
    } else {
      console.log('Successfully set assignee');
    }

    if (!summary.toLowerCase().includes('test')) {
      try {
        const docRef = await addDoc(collection(db, "tickets"), {
          timestamp: new Date(),
          ticketId: data.key,
          summary: summary,
          assignee: assignee,
          squad: squad,
          originalTranscription: transcription, // Store the original transcription for reference
          formattedStory: formattedStory // Store the formatted story for reference
        });
        console.log("Ticket logged to Firebase with ID: ", docRef.id);
      } catch (error) {
        console.error("Error logging to Firebase: ", error);
        // Don't throw the error since the Jira ticket was still created successfully
      }
    }

    return Response.json({ 
      url: `https://wsc-sports.atlassian.net/browse/${data.key}`,
      formattedStory: formattedStory // Return the formatted story in the response
    });
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}