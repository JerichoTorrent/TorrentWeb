export type Thread = {
    id: number;
    title: string;
    content: string;
    username: string;
    created_at: string;
    user_id: string;
  };
  
  export type Reply = {
    id: number;
    thread_id: number;
    parent_id: number | null;
    user_id: string;
    username: string;
    content: string;
    created_at: string;
    children?: Reply[];
  };