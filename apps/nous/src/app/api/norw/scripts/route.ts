import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Gemini API for script generation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface TranscriptEntry {
  role: 'agent' | 'homeowner';
  message: string;
  timestamp: number;
}

interface ScriptGenerationRequest {
  transcript?: TranscriptEntry[];
  analysis?: any; // Claude analysis report
  category: string;
  scenarioId?: string;
  title?: string;
}

// POST - Generate script with Gemini
export async function POST(request: NextRequest) {
  try {
    const body: ScriptGenerationRequest = await request.json();
    const { transcript, analysis, category, scenarioId, title } = body;

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Build the prompt for Gemini
    const prompt = buildScriptPrompt(transcript, analysis, category);

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the generated script
    const script = parseGeneratedScript(generatedText, category, title);

    // Optionally save to database
    if (scenarioId || title) {
      const { data: savedScript, error } = await supabase
        .from('norw_scripts')
        .insert({
          title: script.title,
          category: script.category,
          sections: script.sections,
          scenario_id: scenarioId || null,
          source_type: transcript ? 'simulation' : 'manual',
          is_template: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving script:', error);
      } else {
        script.id = savedScript.id;
      }
    }

    return NextResponse.json({
      success: true,
      script,
    });
  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET - List scripts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isTemplate = searchParams.get('template') === 'true';

    let query = supabase
      .from('norw_scripts')
      .select('*')
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (isTemplate) {
      query = query.eq('is_template', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      scripts: data || [],
    });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function buildScriptPrompt(transcript?: TranscriptEntry[], analysis?: any, category?: string): string {
  let prompt = `You are an expert real estate script writer. Generate a winning sales script based on the following information.

CATEGORY: ${category || 'general'}

`;

  if (analysis) {
    prompt += `ANALYSIS FROM PREVIOUS CONVERSATION:
Score: ${analysis.score}/100

WHAT WORKED WELL:
${analysis.strengths?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}

AREAS FOR IMPROVEMENT:
${analysis.improvements?.map((i: any) => `- ${i.issue}: "${i.suggestion}"`).join('\n') || 'N/A'}

SUMMARY: ${analysis.summary || ''}

`;
  }

  if (transcript && transcript.length > 0) {
    prompt += `TRANSCRIPT TO EXTRACT WINNING LANGUAGE FROM:
${transcript.map(t => `${t.role.toUpperCase()}: ${t.message}`).join('\n')}

`;
  }

  prompt += `Generate a structured sales script with multiple sections. Return in this JSON format:

{
  "title": "<descriptive title for this script>",
  "category": "${category || 'general'}",
  "sections": [
    {
      "title": "<section name, e.g., 'Opening', 'When they say X', 'Handling Price Objection'>",
      "content": "<exact words to say, using [NAME] for personalization>",
      "whyItWorks": "<brief explanation of why this language is effective>"
    }
  ]
}

GUIDELINES:
- Create 4-6 sections covering key moments in the conversation
- Use natural, conversational language
- Include specific phrases for common objections
- Add "Why It Works" explanations to help agents understand the psychology
- Focus on empathy, questions, and value demonstration
- Avoid pushy or salesy language`;

  return prompt;
}

function parseGeneratedScript(text: string, category: string, providedTitle?: string): any {
  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        title: providedTitle || parsed.title,
        category: category || parsed.category,
      };
    }
  } catch (e) {
    console.error('Failed to parse script JSON:', e);
  }

  // Return a default structure if parsing fails
  return {
    title: providedTitle || 'Generated Script',
    category: category || 'general',
    sections: [
      {
        title: 'Script Content',
        content: text,
        whyItWorks: 'Generated from conversation analysis',
      },
    ],
  };
}
