
export type ItemType = 'food' | 'tool' | 'luxury' | 'material';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  icon: string;
  description: string;
  baseValue: number; // For internal logic, but hidden from player
  isPerishable?: boolean;
  freshness?: number; // 0 to 100
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  avatar: string;
  inventory: Item[];
  wants: {
    itemType?: ItemType;
    itemName?: string;
    description: string;
  };
  dialogue: {
    greeting: string;
    refusals: {
      default: string;
      [key: string]: string; // Specific messages for certain items or types
    };
    success: string;
    hint: string;
  };
}

export interface TradeState {
  playerInventory: Item[];
  npcs: NPC[];
  currentNpcId: string | null;
  day: number;
  goal: string;
  message: string;
  history: string[];
}
