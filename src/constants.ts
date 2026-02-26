
import { Item } from './types';

export const ITEMS: Record<string, Item> = {
  FISH: { id: 'fish', name: '鲜鱼', type: 'food', icon: '🐟', description: '刚从河里打捞上来的，不快点吃掉会坏。', baseValue: 10, isPerishable: true, freshness: 100 },
  GRAIN: { id: 'grain', name: '谷物', type: 'food', icon: '🌾', description: '干燥的麦子，可以存放很久。', baseValue: 15 },
  SALT: { id: 'salt', name: '粗盐', type: 'material', icon: '🧂', description: '珍贵的调味品，也是保存食物的关键。', baseValue: 25 },
  SKIN: { id: 'skin', name: '兽皮', type: 'material', icon: '🧥', description: '厚实的鹿皮，适合做衣服。', baseValue: 30 },
  AXE: { id: 'axe', name: '石斧', type: 'tool', icon: '🪓', description: '锋利的石斧，砍柴打猎必备。', baseValue: 50 },
  POT: { id: 'pot', name: '陶罐', type: 'tool', icon: '🏺', description: '用来盛水或储存粮食。', baseValue: 20 },
  BERRIES: { id: 'berries', name: '野果', type: 'food', icon: '🍓', description: '酸甜可口，但不经放。', baseValue: 5, isPerishable: true, freshness: 100 },
  HERBS: { id: 'herbs', name: '草药', type: 'material', icon: '🌿', description: '能治愈伤口的植物。', baseValue: 35 },
  SHELL: { id: 'shell', name: '精美贝壳', type: 'luxury', icon: '🐚', description: '来自远方的海边，非常罕见。', baseValue: 40 },
  WOOD: { id: 'wood', name: '木材', type: 'material', icon: '🪵', description: '坚实的木头，盖房子用。', baseValue: 12 },
};

export const INITIAL_NPCS = [
  {
    id: 'npc1',
    name: '老渔夫',
    role: '捕鱼者',
    avatar: '👴',
    inventory: [ { ...ITEMS.FISH }, { ...ITEMS.FISH } ],
    wants: { itemName: '木材', description: '我需要一些木材来加固我的渔船。' },
    dialogue: {
      greeting: '嘿，年轻人！今天的鱼很肥美，想要换点吗？',
      refusals: {
        default: '这东西对我没用，我只想要一些结实的木材。',
        food: '我自己就有吃不完的鱼，不需要更多的食物。',
        tool: '这些工具太精细了，我这粗人只会用木头修船。',
        grain: '谷物虽然好，但我现在更担心我的船漏水。'
      },
      success: '太好了！这些木材正是我需要的，这些鱼归你了。',
      hint: '听说那个采果子的姑娘最近想吃鱼想得发疯。'
    }
  },
  {
    id: 'npc2',
    name: '织女',
    role: '手工艺人',
    avatar: '👩',
    inventory: [ { ...ITEMS.SKIN }, { ...ITEMS.POT } ],
    wants: { itemName: '粗盐', description: '我需要盐来处理这些刚剥下来的皮毛。' },
    dialogue: {
      greeting: '你好，我这里有上好的兽皮和陶罐。',
      refusals: {
        default: '抱歉，没有盐的话，我没法处理更多的皮毛。',
        material: '这些材料虽然不错，但现在最缺的是盐。',
        food: '我不缺吃的，我需要盐来保存这些皮毛。',
        wood: '木头？我这儿可不是木材厂，去问问渔夫吧。'
      },
      success: '这正是急需的盐！拿走这块兽皮吧。',
      hint: '盐商通常在集市中心，他总是想要一些稀罕的贝壳。'
    }
  },
  {
    id: 'npc3',
    name: '猎人',
    role: '狩猎者',
    avatar: '🏹',
    inventory: [ { ...ITEMS.AXE }, { ...ITEMS.HERBS } ],
    wants: { itemName: '兽皮', description: '冬天快到了，我需要更多的兽皮来做冬衣。' },
    dialogue: {
      greeting: '看我这把石斧，磨得非常锋利。',
      refusals: {
        default: '我不需要这个。给我兽皮，我就把斧头给你。',
        tool: '我自己就是做工具的好手，我只想要兽皮。',
        luxury: '这些亮晶晶的东西在森林里可救不了我的命。',
        berries: '野果？那是小孩子吃的，猎人需要厚实的兽皮。'
      },
      success: '好厚实的皮毛！成交。',
      hint: '织女那里有很多兽皮，但她最近好像在愁没有盐。'
    }
  },
  {
    id: 'npc4',
    name: '盐商',
    role: '旅行商人',
    avatar: '👳',
    inventory: [ { ...ITEMS.SALT }, { ...ITEMS.GRAIN } ],
    wants: { itemName: '精美贝壳', description: '我喜欢收集来自大海的贝壳，那能卖个好价钱。' },
    dialogue: {
      greeting: '我从远方带来了珍贵的盐和谷物。',
      refusals: {
        default: '这些普通的东西打动不了我。你有贝壳吗？',
        material: '这些粗糙的材料随处可见，我只想要精致的贝壳。',
        food: '我带了足够的干粮，不需要你的食物。',
        grain: '我这儿多的是谷物，你该去看看谁肚子饿了。'
      },
      success: '多么美丽的贝壳！这些盐是你的了。',
      hint: '那个采果子的姑娘前几天在河边捡到了一个漂亮的贝壳。'
    }
  },
  {
    id: 'npc5',
    name: '采果姑娘',
    role: '采集者',
    avatar: '👧',
    inventory: [ { ...ITEMS.SHELL }, { ...ITEMS.BERRIES } ],
    wants: { itemName: '鲜鱼', description: '我已经吃了一个星期的野果了，好想吃顿烤鱼。' },
    dialogue: {
      greeting: '看我捡到了什么！一个亮晶晶的东西。',
      refusals: {
        default: '我不想要这个，我肚子好饿，想吃鱼。',
        luxury: '这贝壳已经够漂亮了，我不需要更多装饰，我只想填饱肚子。',
        material: '这些硬邦邦的东西又不能吃，快给我带条鱼来吧。',
        berries: '我自己就能采到最好的野果，换点新鲜的吧！'
      },
      success: '哇！好新鲜的鱼！这个贝壳送给你了。',
      hint: '老渔夫那里肯定有很多鱼，但他最近在找木材修船。'
    }
  }
];
