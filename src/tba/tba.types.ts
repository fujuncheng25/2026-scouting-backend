// TBA API Response Types
export interface TBAEvent {
  key: string;
  name: string;
  event_code: string;
  event_type: number;
  event_type_string: string;
  city?: string;
  state_prov?: string;
  country?: string;
  start_date: string;
  end_date: string;
  year: number;
  location_name?: string;
  timezone?: string;
  webcasts?: Array<{
    channel: string;
    date: string;
    type: string;
  }>;
  website?: string;
}

export interface TBATeam {
  team_number: number;
  nickname?: string;
  name: string;
  city?: string;
  state_prov?: string;
  country?: string;
  rookie_year: number;
  school_name?: string;
  website?: string;
}

export interface TBAMatch {
  key: string;
  event_key: string;
  comp_level: 'pr' | 'qm' | 'ef' | 'qf' | 'sf' | 'f';
  match_number: number;
  alliances: {
    red: {
      team_keys: string[];
      score: number;
      surrogate?: boolean;
      dq?: boolean;
    };
    blue: {
      team_keys: string[];
      score: number;
      surrogate?: boolean;
      dq?: boolean;
    };
  };
  score_breakdown?: {
    red: Record<string, any>;
    blue: Record<string, any>;
  };
  time_string?: string;
  time?: number;
  actual_time?: number;
  predicted_time?: number;
  post_result_time?: number;
}

export interface TBAAlliance {
  team_keys: string[];
  score: number;
  surrogate?: boolean;
  dq?: boolean;
}

export type MatchType =
  | 'practice'
  | 'qualification'
  | 'playoff'
  | 'final'
  | 'semifinal'
  | 'quarterfinal'
  | 'eighthfinal';

export interface CompLevelMap {
  [key: string]: MatchType;
}
