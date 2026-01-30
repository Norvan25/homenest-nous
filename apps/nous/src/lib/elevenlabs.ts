const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface Agent {
  agent_id: string;
  name: string;
  conversation_config: ConversationConfig;
}

interface ConversationConfig {
  agent: {
    prompt: {
      prompt: string;
    };
    first_message: string;
    language: string;
  };
  tts: {
    voice_id: string;
  };
}

interface CreateAgentPayload {
  name: string;
  prompt: string;
  firstMessage: string;
  voiceId: string;
  language?: string;
}

interface ConversationResponse {
  conversation_id: string;
  status: string;
  transcript?: TranscriptEntry[];
  analysis?: {
    summary?: string;
    outcome?: string;
  };
}

interface TranscriptEntry {
  role: 'agent' | 'user';
  message: string;
  timestamp: number;
}

class ElevenLabsService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${ELEVENLABS_API_URL}${endpoint}`;
    console.log(`[ElevenLabs] Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const responseText = await response.text();
    console.log(`[ElevenLabs] Response status: ${response.status}`);
    console.log(`[ElevenLabs] Response body: ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} - ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return responseText as T;
    }
  }

  async createAgent(payload: CreateAgentPayload): Promise<Agent> {
    return this.request<Agent>('/convai/agents/create', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        conversation_config: {
          agent: {
            prompt: {
              prompt: payload.prompt,
            },
            first_message: payload.firstMessage,
            language: payload.language || 'en',
          },
          tts: {
            voice_id: payload.voiceId,
          },
        },
      }),
    });
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>(`/convai/agents/${agentId}`);
  }

  async listAgents(): Promise<{ agents: Agent[] }> {
    return this.request<{ agents: Agent[] }>('/convai/agents');
  }

  async updateAgent(agentId: string, payload: Partial<CreateAgentPayload>): Promise<Agent> {
    const updateBody: Record<string, unknown> = {};
    if (payload.name) updateBody.name = payload.name;
    if (payload.prompt || payload.firstMessage || payload.voiceId) {
      updateBody.conversation_config = {
        agent: {
          ...(payload.prompt && { prompt: { prompt: payload.prompt } }),
          ...(payload.firstMessage && { first_message: payload.firstMessage }),
        },
        ...(payload.voiceId && { tts: { voice_id: payload.voiceId } }),
      };
    }
    return this.request<Agent>(`/convai/agents/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateBody),
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/convai/agents/${agentId}`, { method: 'DELETE' });
  }

  /**
   * Initiate an outbound phone call
   * Requires: Phone number configured in ElevenLabs dashboard
   */
  async initiateCall(
    agentId: string,
    phoneNumber: string,
    metadata?: Record<string, string>,
    dynamicVariables?: Record<string, string>
  ): Promise<{ conversation_id: string }> {
    // Format phone to E.164
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
    
    if (!phoneNumberId) {
      throw new Error('ELEVENLABS_PHONE_NUMBER_ID not configured. Get it from ElevenLabs dashboard.');
    }
    
    console.log(`[ElevenLabs] Initiating call to ${formattedPhone} with agent ${agentId}, phone_number_id ${phoneNumberId}`);
    
    // Build request body with correct parameter names (from 422 error)
    const requestBody: Record<string, any> = {
      agent_id: agentId,
      agent_phone_number_id: phoneNumberId,
      to_number: formattedPhone,
    };
    
    // Add dynamic variables for personalization
    if (dynamicVariables && Object.keys(dynamicVariables).length > 0) {
      requestBody.conversation_initiation_client_data = {
        dynamic_variables: dynamicVariables
      };
    }

    console.log(`[ElevenLabs] Request body:`, JSON.stringify(requestBody, null, 2));
    
    // Outbound call endpoint
    return this.request<{ conversation_id: string }>(
      '/convai/twilio/outbound_call',
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );
  }

  /**
   * Alternative: Get signed URL for web-based conversation
   * Use this if phone calling is not available
   */
  async getSignedUrl(agentId: string): Promise<{ signed_url: string }> {
    return this.request<{ signed_url: string }>(
      `/convai/conversation/get_signed_url?agent_id=${agentId}`
    );
  }

  async getConversation(conversationId: string): Promise<ConversationResponse> {
    return this.request<ConversationResponse>(`/convai/conversations/${conversationId}`);
  }

  async listConversations(agentId: string, limit = 20): Promise<{ conversations: ConversationResponse[] }> {
    return this.request<{ conversations: ConversationResponse[] }>(
      `/convai/conversations?agent_id=${agentId}&page_size=${limit}`
    );
  }

  async listVoices(): Promise<{ voices: Array<{ voice_id: string; name: string }> }> {
    return this.request<{ voices: Array<{ voice_id: string; name: string }> }>('/voices');
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // If 10 digits, assume US and add +1
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // If 11 digits starting with 1, add +
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    // Return with + if not already there
    return phone.startsWith('+') ? phone : `+${digits}`;
  }
}

let elevenlabsInstance: ElevenLabsService | null = null;

export function getElevenLabs(): ElevenLabsService {
  if (!elevenlabsInstance) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }
    elevenlabsInstance = new ElevenLabsService(apiKey);
  }
  return elevenlabsInstance;
}

export type { Agent, ConversationResponse, CreateAgentPayload, TranscriptEntry };
