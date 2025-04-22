export type Thread = {
  content_html: string | TrustedHTML;
  id: number;
  title: string;
  content: string;
  username: string;
  user_id: string;
  created_at: string;
  reputation?: number;
  is_sticky: boolean;
  category_slug: string;
  category_name: string;
  is_private: boolean;
};
  
export type Reply = {
  content_html: string | TrustedHTML;
  edited: boolean;
  id: number;
  thread_id: number;
  parent_id: number | null;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  children?: Reply[];
  deleted?: boolean;
};

export interface CommentType {
  id: number;
  content: string;
  content_html?: string;
  user_id: string;
  username: string;
  created_at: string;
  edited?: boolean;
  deleted?: boolean;
  reactions?: Record<string, number>;
  parent_id?: number | null;
}

export interface PlayerMainStats {
  username: string;
  player_kills: number;
  deaths: number;
  ticks_played: number;
  mob_kills: number;
  blocks_mined: number;
  blocks_placed: number;
  fish_caught: number;
  animals_bred: number;
  raid_wins: number;
  beds_slept: number;
  villager_trades: number;
  items_broken: number;
  items_crafted: number;
  walk_cm: number;
  swim_cm: number;
  climb_cm: number;
  fly_cm: number;
  fall_cm: number;
  aviate_cm: number;
  players_killed_entity: number;
}

export interface PlayerSkillStats {
  username: string;
  skill_name: string;
  level: number;
  current_xp: number;
  xp_to_level: number;
}

export interface PlayerJobStats {
  username: string;
  job_name: string;
  level: number;
  xp: number;
}

export interface PlayerTeamStats {
  username: string;
  team_name: string;
  team_level: number;
  team_members: number;
}

export interface PlayerBalanceStats {
  username: string;
  balance: number;
}

export interface PlayerXPStats {
  username: string;
  total_xp_bottled: number;
}

export interface PlayerShopStats {
  username: string;
  shops_owned: number;
  total_profits: number;
}

export interface PlayerFishStats {
  username: string;
  legendary_fish_caught: number;
  largest_fish: number;
}

export interface PlayerPlotStats {
  username: string;
  plots_owned: number;
  plots_merged: number;
}

export interface LeaderboardResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
}
