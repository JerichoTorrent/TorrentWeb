export type Thread = {
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
};
  
export type Reply = {
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