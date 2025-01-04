export async function POST(request) {
  try {
    const body = await request.json();
    console.log('1. Request body received:', body);
    
    const { transcription, summary, assignee, squad = 'Avgen' } = body;
    console.log('2. Parsed values:', { transcription, summary, assignee, squad });
    
    console.log('3. Environment variables present:', {
      hasEmail: !!process.env.NEXT_PUBLIC_JIRA_EMAIL,
      hasToken: !!process.env.NEXT_PUBLIC_JIRA_API_TOKEN,
      hasProjectKey: !!process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY
    });
  
    // First create the ticket
    const response = await fetch('https://wsc-sports.atlassian.net/rest/api/2/issue', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_JIRA_EMAIL}:${process.env.NEXT_PUBLIC_JIRA_API_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY },
          summary: summary,
          description: transcription,
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

    return Response.json({ url: `https://wsc-sports.atlassian.net/browse/${data.key}` });
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}