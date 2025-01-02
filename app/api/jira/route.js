export async function POST(request) {
  try {
    const body = await request.json();
    console.log('1. Request body received:', body);
    
    const { transcription, summary, assignee, squad } = body;
    console.log('2. Parsed values:', { transcription, summary, assignee, squad });
    
    console.log('3. Environment variables present:', {
      hasEmail: !!process.env.NEXT_PUBLIC_JIRA_EMAIL,
      hasToken: !!process.env.NEXT_PUBLIC_JIRA_API_TOKEN,
      hasProjectKey: !!process.env.NEXT_PUBLIC_JIRA_PROJECT_KEY
    });
  
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
          assignee: { name: 'Yaron Sela' },
          labels: ['smart-recorder'],
          customfield_10105: {"value": "Avgen"},
          customfield_10107: {"value": "R&D"}
        }
      })
    });

    const data = await response.json();
    console.log('Jira response:', data);
    
    if (!response.ok) {
      console.error('Jira error:', data);
      throw new Error(data.message || 'Failed to create ticket');
    }

    return Response.json({ url: `https://wsc-sports.atlassian.net/browse/${data.key}` });
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}