export interface ChatMessage {
  id: string;
  sender: "human" | "shroom";
  text: string;
  timestamp: string;
}
