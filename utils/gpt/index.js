import { companyContext } from '../companyContext';

export async function formatUserStory(transcription) {
  const contextPrompt = `
Company Context:
${companyContext.products}
${companyContext.domains}
${companyContext.terminology}

Original transcription:
${transcription}

Using the company context above, please convert this into a user story format that correctly uses our company's terminology, products, and domain knowledge. Format as:
- Need:  Explanation of the need for this story (3 sentences max).
- Spec: Technical specifications and requirements. Please keep this concise. Only mention things that you are pretty confident that should be part of the spec. This doesn't mean it needs to be short, but it does need to be focused.
If there is UI involved, please mention the components needed and their behaiviour.
- KPIs: Key Performance Indicators (2 maximum).
- Acceptance criteria/DOD: Definition of done and acceptance criteria. This should be short and concise. At the most 3 points that describe from a user perspective what he should be able to experience. For example: a user should be able to enter this page and click this button to get this outcome.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: contextPrompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error('Failed to process transcription with GPT');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}