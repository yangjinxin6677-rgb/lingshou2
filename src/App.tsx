/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRightLeft, 
  ShoppingBag, 
  User, 
  Calendar, 
  Info, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';
import { Item, NPC } from './types';
import { ITEMS, INITIAL_NPCS } from './constants';
import GameWorld from './components/GameWorld';

export default function App() {
  const [playerInventory, setPlayerInventory] = useState<Item[]>([
    { ...ITEMS.GRAIN },
    { ...ITEMS.WOOD }
  ]);
  const [npcs, setNpcs] = useState<NPC[]>(INITIAL_NPCS);
  const [currentNpcId, setCurrentNpcId] = useState<string | null>(null);
  const [day, setDay] = useState(1);
  const [tradesToday, setTradesToday] = useState(0);
  const [message, setMessage] = useState("欢迎来到原始集市。你的目标是换到一把『石斧』来修理房屋。");
  const [history, setHistory] = useState<string[]>(["游戏开始：你带着一些谷物和木材来到了集市。"]);
  const [showIntro, setShowIntro] = useState(true);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');
  const [tradeAnimation, setTradeAnimation] = useState<{ item: Item, npcId: string } | null>(null);

  const currentNpc = useMemo(() => 
    npcs.find(n => n.id === currentNpcId) || null
  , [npcs, currentNpcId]);

  // Handle perishability logic
  useEffect(() => {
    if (day > 1) {
      setPlayerInventory(prev => prev.map(item => {
        if (item.isPerishable && item.freshness !== undefined) {
          const newFreshness = item.freshness - 25;
          return { ...item, freshness: Math.max(0, newFreshness) };
        }
        return item;
      }).filter(item => !(item.isPerishable && (item.freshness || 0) <= 0)));
    }
  }, [day]);

  useEffect(() => {
    if (tradeAnimation) {
      const timer = setTimeout(() => setTradeAnimation(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [tradeAnimation]);

  const handleTrade = (npcItem: Item, playerItem: Item) => {
    if (!currentNpc) return;

    if (tradesToday >= 2) {
      setMessage("你今天已经进行了两次交易，太累了，先休息吧（点击结束今日）。");
      return;
    }

    // Logic: Barter requires "Double Coincidence of Wants"
    // In this simplified game, we check if the NPC wants the specific item or type
    const npcWantsThis = 
      (currentNpc.wants.itemName === playerItem.name) || 
      (currentNpc.wants.itemType === playerItem.type);

    if (npcWantsThis) {
      // Success!
      const newPlayerInv = playerInventory.filter(i => i !== playerItem);
      newPlayerInv.push({ ...npcItem });
      setPlayerInventory(newPlayerInv);

      const newNpcInv = currentNpc.inventory.filter(i => i !== npcItem);
      newNpcInv.push({ ...playerItem });
      
      setNpcs(prev => prev.map(n => n.id === currentNpc.id ? { ...n, inventory: newNpcInv } : n));
      
      setTradesToday(prev => prev + 1);
      setTradeAnimation({ item: npcItem, npcId: currentNpc.id });
      
      const successMsg = `交易成功！你用『${playerItem.name}』换到了『${npcItem.name}』。`;
      setMessage(`${currentNpc.name}：『${currentNpc.dialogue.success}』`);
      setHistory(prev => [successMsg, ...prev]);

      if (npcItem.id === 'axe') {
        setGameStatus('won');
        setMessage("恭喜！你换到了石斧，完成了目标！");
      }
    } else {
      // Failure
      const refusals = currentNpc.dialogue.refusals;
      const refusalMsg = 
        refusals[playerItem.id] || 
        refusals[playerItem.type] || 
        refusals.default;
        
      setMessage(`${currentNpc.name}摇头道：『${refusalMsg}』`);
      setHistory(prev => [`尝试交易失败：${currentNpc.name}不需要你的${playerItem.name}。`, ...prev]);
    }
  };

  const nextDay = () => {
    setDay(prev => prev + 1);
    setTradesToday(0);
    setMessage("新的一天开始了。注意：某些食物可能会变质。");
    setHistory(prev => [`第 ${day + 1} 天开始了。`, ...prev]);
  };

  const resetGame = () => {
    setPlayerInventory([{ ...ITEMS.GRAIN }, { ...ITEMS.WOOD }]);
    setNpcs(INITIAL_NPCS);
    setCurrentNpcId(null);
    setDay(1);
    setTradesToday(0);
    setGameStatus('playing');
    setMessage("欢迎来到原始集市。你的目标是换到一把『石斧』来修理房屋。");
    setHistory(["游戏重新开始。"]);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#5A5A40] mb-3">贸易之初</h1>
          <p className="text-xl italic opacity-75">零售市场的萌芽：物物交换时代</p>
        </div>
        <div className="flex items-center gap-8 bg-white/50 p-6 rounded-3xl border-2 border-[#5A5A40]/10 shadow-sm">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-[#5A5A40]" />
              <span className="font-black text-2xl">第 {day} 天</span>
            </div>
            <div className="text-sm font-bold text-[#5A5A40]/60 mt-1">
              今日剩余交易: <span className={tradesToday >= 2 ? "text-red-500" : "text-green-600"}>{2 - tradesToday}</span> / 2
            </div>
          </div>
          <button 
            onClick={nextDay}
            className="flex items-center gap-2 text-lg font-black text-[#5A5A40] hover:scale-105 transition-transform bg-[#5A5A40]/10 px-4 py-2 rounded-xl"
          >
            <RefreshCw className="w-5 h-5" />
            结束今日
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Market & NPCs */}
        <div className="lg:col-span-8 space-y-6">
          <GameWorld 
            npcs={npcs} 
            currentNpcId={currentNpcId} 
            onInteract={(id) => setCurrentNpcId(id)} 
            tradeAnimation={tradeAnimation}
          >
            {/* Interaction Area (Now inside GameWorld as an overlay) */}
            <AnimatePresence mode="wait">
              {currentNpc && (
                <motion.section
                  key={currentNpc.id}
                  className="w-full flex flex-col bg-transparent overflow-hidden"
                >
                  {/* Header with Close Button - Optimized for bottom panel */}
                  <div className="flex items-center justify-between p-4 md:p-6 border-b-2 border-[#5A5A40]/10 bg-white/80 sticky top-0 z-50">
                    <div className="flex items-center gap-3 md:gap-6">
                      <span className="text-4xl md:text-6xl">{currentNpc.avatar}</span>
                      <div>
                        <h2 className="text-lg md:text-3xl font-serif font-bold">{currentNpc.name}</h2>
                        <p className="text-[#5A5A40] font-bold text-xs md:text-lg">{currentNpc.role}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setCurrentNpcId(null)}
                      className="px-4 py-2 md:px-6 md:py-3 bg-red-500 text-white font-black rounded-xl md:rounded-2xl shadow-lg flex items-center gap-2 active:scale-90 transition-transform"
                    >
                      <span className="text-sm md:text-lg">退出</span>
                      <X className="w-5 h-5 md:w-7 md:h-7" />
                    </button>
                  </div>

                  <div className="p-4 md:p-10 space-y-6 md:space-y-10">
                    <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl relative border-2 border-[#5A5A40]/5 shadow-sm">
                      <p className="italic text-base md:text-3xl leading-relaxed text-gray-800 font-serif">“{currentNpc.dialogue.greeting}”</p>
                      <div className="mt-3 md:mt-6 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#5A5A40]/10 rounded-full text-[8px] md:text-xs font-black uppercase tracking-widest text-[#5A5A40]">需求</span>
                        <p className="text-xs md:text-xl text-[#5A5A40] font-black">{currentNpc.wants.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-lg md:text-2xl font-black flex items-center gap-2 md:gap-4">
                          <ArrowRightLeft className="w-5 h-5 md:w-8 md:h-8 text-[#5A5A40]" />
                          发起交换
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {currentNpc.inventory.map((item, idx) => (
                            <div key={idx} className="flex flex-col gap-4 p-4 md:p-6 bg-white rounded-2xl md:rounded-[2rem] border-2 border-[#5A5A40]/10 shadow-sm">
                              <div className="flex items-center gap-4">
                                <span className="text-3xl md:text-5xl">{item.icon}</span>
                                <div>
                                  <span className="font-black text-base md:text-xl block">{item.name}</span>
                                  <p className="text-xs md:text-base text-gray-500">{item.description}</p>
                                </div>
                              </div>
                              <div className="pt-3 border-t border-dashed border-[#5A5A40]/10">
                                <span className="text-[10px] md:text-sm font-black text-[#5A5A40]/60 uppercase tracking-widest block mb-3">选择你的物品：</span>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4">
                                  {playerInventory.map((pItem, pIdx) => (
                                    <button
                                      key={pIdx}
                                      onClick={() => handleTrade(item, pItem)}
                                      className="text-[10px] md:text-base font-bold p-2 md:p-4 rounded-xl md:rounded-2xl border-2 border-[#5A5A40]/10 hover:bg-[#5A5A40] hover:text-white transition-all flex items-center justify-center gap-1 md:gap-2 active:scale-95"
                                    >
                                      <span>{pItem.icon}</span>
                                      <span className="truncate">{pItem.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-[#5A5A40]/5 p-4 md:p-6 rounded-2xl border-2 border-[#5A5A40]/10">
                          <h3 className="font-black mb-2 flex items-center gap-2 text-sm md:text-lg">
                            <Info className="w-4 h-4 md:w-5 md:h-5 text-[#5A5A40]" />
                            提示
                          </h3>
                          <p className="text-xs md:text-base text-gray-700 leading-relaxed">
                            “{currentNpc.dialogue.hint}”
                          </p>
                        </div>
                        <button 
                          onClick={() => setCurrentNpcId(null)}
                          className="w-full py-4 bg-gray-100 text-gray-500 font-black rounded-2xl active:bg-gray-200 transition-colors text-sm md:text-base"
                        >
                          返回集市
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </GameWorld>
        </div>

        {/* Right Column: Inventory & Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Player Inventory */}
          <section className="card-organic p-8 paper-texture border-4 border-[#5A5A40]/20">
            <h2 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3 text-[#5A5A40]">
              <ShoppingBag className="w-6 h-6" />
              我的背囊
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {playerInventory.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg italic">背囊空空如也...</p>
                </div>
              ) : (
                playerInventory.map((item, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={item.id + idx} 
                    className="item-card-mini flex items-center gap-4 p-4"
                  >
                    <div className="w-16 h-16 bg-[#f5f5f0] rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-lg text-[#5A5A40]">{item.name}</span>
                        {item.isPerishable && (
                          <div className="flex flex-col items-end">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all ${
                                  (item.freshness || 0) > 50 ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${item.freshness}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black opacity-40 mt-1 uppercase">新鲜度</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 italic">{item.description}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* Message Center */}
          <motion.section 
            key={message}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-organic p-8 bg-[#5A5A40] text-white shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70 flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              当前动态
            </h2>
            <p className="text-xl font-serif leading-snug relative z-10">{message}</p>
          </motion.section>

          {/* History Log */}
          <section className="card-organic p-8 overflow-hidden">
            <h2 className="text-lg font-bold uppercase tracking-widest mb-6 text-[#5A5A40]/60">交易日志</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {history.map((log, idx) => (
                <div key={idx} className="text-sm border-l-4 border-[#5A5A40]/20 pl-4 py-2">
                  {log}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Intro Modal */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#f5f5f0] max-w-2xl w-full rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#5A5A40]"></div>
              <h2 className="text-5xl font-serif font-bold text-[#5A5A40] mb-8">欢迎来到物物交换时代</h2>
              <div className="space-y-6 text-gray-700 leading-relaxed mb-10">
                <p className="text-xl">在这个时代，<span className="font-bold">货币尚未发明</span>。人们通过直接交换多余的物品来获取所需。</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="bg-white p-6 rounded-3xl border-2 border-[#5A5A40]/10 shadow-sm">
                    <h3 className="text-xl font-bold text-[#5A5A40] mb-3 flex items-center gap-3">
                      <ArrowRightLeft className="w-6 h-6" /> 欲望的双重巧合
                    </h3>
                    <p className="text-base">你必须找到一个既拥有你想要的东西，又恰好想要你手中物品的人。</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border-2 border-[#5A5A40]/10 shadow-sm">
                    <h3 className="text-xl font-bold text-[#5A5A40] mb-3 flex items-center gap-3">
                      <AlertCircle className="w-6 h-6" /> 价值衡量难题
                    </h3>
                    <p className="text-base">没有统一的价格。一头羊换多少鱼？全靠双方的协商和迫切程度。</p>
                  </div>
                </div>
                <p className="mt-6 text-xl italic text-center bg-[#5A5A40]/5 p-4 rounded-2xl">你的目标：通过一系列巧妙的交换，最终换到一把<span className="font-bold">石斧</span>。</p>
              </div>
              <button 
                onClick={() => setShowIntro(false)}
                className="w-full btn-olive text-xl font-serif py-4"
              >
                进入集市
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Modal */}
      <AnimatePresence>
        {gameStatus === 'won' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white max-w-md w-full rounded-[32px] p-10 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-[#5A5A40] mb-6">目标达成！</h2>
              <p className="text-gray-600 mb-10 text-lg leading-relaxed">
                你成功换到了石斧！通过这次集市之旅，你体验了早期零售市场的艰辛：
                <br /><br />
                <span className="block text-lg text-left bg-[#f5f5f0] p-6 rounded-2xl italic border-l-8 border-[#5A5A40]">
                  “为了换到石斧，你可能经历了：鱼 → 贝壳 → 盐 → 兽皮 → 石斧 的漫长链条。这就是为什么人类最终发明了货币——作为一种通用的交换媒介。”
                </span>
              </p>
              <button 
                onClick={resetGame}
                className="w-full btn-olive flex items-center justify-center gap-2"
              >
                再玩一次
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 pt-8 border-t border-[#5A5A40]/10 text-center text-sm text-[#5A5A40]/40">
        <p>© 原始零售市场模拟器 · 零售史教育系列</p>
      </footer>
    </div>
  );
}
