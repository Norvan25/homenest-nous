// Content generation types
export interface ContentGeneration {
  id: string;
  user_id: string;
  agent_id: string | null;
  agent_version: number | null;
  content_type: 'email' | 'letter' | 'sms' | 'script' | 'other';
  scenario_key: string | null;
  scenario_name: string | null;
  system_prompt_used: string | null;
  user_input: string | null;
  variables: Record<string, any>;
  generated_content: string;
  generated_subject: string | null;
  model_used: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  generation_time_ms: number | null;
  temperature: number | null;
  user_rating: number | null;
  user_thumbs: 'up' | 'down' | null;
  user_edited: boolean;
  edited_content: string | null;
  edit_distance: number | null;
  flagged_for_review: boolean;
  flag_reason: string | null;
  created_at: string;
}

export interface OutreachSend {
  id: string;
  generation_id: string | null;
  user_id: string;
  contact_id: string | null;
  property_id: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_name: string | null;
  channel: 'email' | 'sms' | 'whatsapp' | 'letter' | 'call';
  thread_id: string | null;
  message_id: string | null;
  subject: string | null;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed';
  sent_at: string | null;
  opened_at: string | null;
  open_count: number;
  clicked_at: string | null;
  click_count: number;
  created_at: string;
}

export interface OutreachResponse {
  id: string;
  send_id: string | null;
  thread_id: string | null;
  channel: string;
  from_address: string | null;
  response_text: string | null;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | null;
  sentiment_score: number | null;
  intent: 'interested' | 'not_interested' | 'question' | 'objection' | 'appointment_request' | 'angry' | 'spam' | 'other' | null;
  intent_confidence: number | null;
  key_points: string[] | null;
  objections: string[] | null;
  outcome: string | null;
  suggested_reply: string | null;
  received_at: string;
  created_at: string;
}

export interface ScenarioPerformance {
  scenario_key: string;
  scenario_name: string;
  content_type: string;
  total_generations: number;
  total_sends: number;
  total_responses: number;
  open_rate: number;
  response_rate: number;
  positive_responses: number;
  negative_responses: number;
  avg_rating: number;
  thumbs_up: number;
  thumbs_down: number;
}

// Generation request
export interface GenerateContentRequest {
  contentType: 'email' | 'letter' | 'sms';
  scenarioKey: string;
  scenarioName: string;
  variables: {
    property_address?: string;
    owner_name?: string;
    price?: number;
    dom?: number;
    city?: string;
    beds?: number;
    baths?: number;
    agent_name?: string;
    agent_phone?: string;
    [key: string]: any;
  };
  customInput?: string;
}

// Lead type for email writer
export interface Lead {
  id: string;
  property_id: string;
  contact_name: string;
  email: string;
  property_address: string;
  city: string;
  price: number;
  dom: number;
  beds: number;
  baths: number;
}

// Scenario type
export interface Scenario {
  key: string;
  name: string;
  description: string;
  prompt_template: string;
}
