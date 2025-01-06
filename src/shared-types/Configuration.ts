export interface Configuration {
  id: string;
  cabinet: string;
  heartbeat: number;
  screens: Screen[];
  messages: Message[];
}

export interface Screen {
  id: string;
  numCode?: number;
  name?: string;
}

export interface Message {
  id: string;
  text?: string;
  picture?: string;
}
