
import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sky, Environment, Text, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  HandMetal,
  ShoppingBag
} from 'lucide-react';
import { NPC, Item } from '../types';

interface PlayerProps {
  onInteract: (npcId: string) => void;
  onNearestNpcChange: (npcId: string | null) => void;
  npcs: NPC[];
  virtualKeys: React.MutableRefObject<{ [key: string]: boolean }>;
}

function FallingItem({ item, startPos }: { item: Item, startPos: [number, number, number] }) {
  return (
    <Html position={startPos} center distanceFactor={10}>
      <motion.div
        initial={{ scale: 0, y: 0, opacity: 1 }}
        animate={{ 
          scale: [1, 1.5, 1],
          y: [-100, -300],
          x: [0, 400],
          opacity: [1, 1, 0]
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="flex flex-col items-center pointer-events-none"
      >
        <div className="text-6xl filter drop-shadow-2xl mb-2">{item.icon}</div>
        <div className="bg-[#5A5A40] text-white px-3 py-1 rounded-full text-xs font-black whitespace-nowrap shadow-lg">
          获得 {item.name}
        </div>
      </motion.div>
    </Html>
  );
}

function Player({ onInteract, onNearestNpcChange, npcs, virtualKeys }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const speed = 0.18; // Increased from 0.12 for snappier movement
  const keys = useRef<{ [key: string]: boolean }>({});
  const lastNearestId = useRef<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;

    let dx = 0;
    let dz = 0;

    // Combine physical and virtual keys
    const isUp = keys.current['KeyW'] || keys.current['ArrowUp'] || virtualKeys.current['KeyW'];
    const isDown = keys.current['KeyS'] || keys.current['ArrowDown'] || virtualKeys.current['KeyS'];
    const isLeft = keys.current['KeyA'] || keys.current['ArrowLeft'] || virtualKeys.current['KeyA'];
    const isRight = keys.current['KeyD'] || keys.current['ArrowRight'] || virtualKeys.current['KeyD'];
    const isInteract = keys.current['KeyE'] || virtualKeys.current['KeyE'];

    if (isUp) dz -= speed;
    if (isDown) dz += speed;
    if (isLeft) dx -= speed;
    if (isRight) dx += speed;

    if (dx !== 0 && dz !== 0) {
      dx *= 0.707;
      dz *= 0.707;
    }

    const newX = groupRef.current.position.x + dx;
    const newZ = groupRef.current.position.z + dz;

    if (Math.abs(newX) < 20) groupRef.current.position.x = newX;
    if (Math.abs(newZ) < 20) groupRef.current.position.z = newZ;

    const isMoving = dx !== 0 || dz !== 0;
    const t = state.clock.getElapsedTime();

    if (isMoving) {
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.2);
      
      // Walking animation
      const walkCycle = t * 10;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
      
      groupRef.current.position.y = Math.abs(Math.sin(walkCycle)) * 0.1;
    } else {
      // Idle animation
      const idleCycle = t * 2;
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(idleCycle) * 0.1;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(idleCycle + Math.PI) * 0.1;
      
      groupRef.current.position.y = Math.sin(idleCycle) * 0.05;
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
    }

    state.camera.position.lerp(new THREE.Vector3(newX, 10, newZ + 12), 0.1);
    state.camera.lookAt(newX, 0, newZ);

    // Proximity detection
    let nearestId: string | null = null;
    let minDist = 3.5;

    npcs.forEach(npc => {
      const npcPos = npcPositions[npc.id];
      const dist = Math.sqrt(
        Math.pow(groupRef.current!.position.x - npcPos[0], 2) +
        Math.pow(groupRef.current!.position.z - npcPos[2], 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestId = npc.id;
      }
    });

    if (nearestId !== lastNearestId.current) {
      lastNearestId.current = nearestId;
      onNearestNpcChange(nearestId);
    }

    if (nearestId && isInteract) {
      onInteract(nearestId);
      // Reset virtual interact key to prevent repeated triggers
      virtualKeys.current['KeyE'] = false;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.6, 1.2, 0.4]} />
        <meshStandardMaterial color="#5A5A40" />
      </mesh>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#d2b48c" />
      </mesh>
      {/* Arms */}
      <mesh ref={leftArmRef} position={[-0.4, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshStandardMaterial color="#5A5A40" />
      </mesh>
      <mesh ref={rightArmRef} position={[0.4, 1, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshStandardMaterial color="#5A5A40" />
      </mesh>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.2, 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#3d3d33" />
      </mesh>
      <mesh ref={rightLegRef} position={[0.2, 0.2, 0]} castShadow>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshStandardMaterial color="#3d3d33" />
      </mesh>
    </group>
  );
}

const npcPositions: Record<string, [number, number, number]> = {
  npc1: [-5, 0, -5],
  npc2: [5, 0, -5],
  npc3: [-5, 0, 5],
  npc4: [5, 0, 5],
  npc5: [0, 0, -8],
};

function NpcModel({ npc, isNearest, isCurrent }: { npc: NPC, isNearest: boolean, isCurrent: boolean }) {
  const pos = npcPositions[npc.id];
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const bodyColor = isCurrent ? "#ffcc00" : (
    npc.id === 'npc1' ? "#4a69bd" :
    npc.id === 'npc2' ? "#e55039" :
    npc.id === 'npc3' ? "#78e08f" :
    npc.id === 'npc4' ? "#f6b93b" :
    "#fad390"
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const seed = npc.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offset = seed % 10;

    // Idle animation
    const idleTime = t + offset;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(idleTime * 0.5) * 0.3;
      headRef.current.rotation.x = Math.cos(idleTime * 0.3) * 0.1;
    }
    
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(idleTime * 2) * 0.15;
    if (rightArmRef.current) rightArmRef.current.rotation.x = Math.cos(idleTime * 2) * 0.15;
    
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(idleTime * 2) * 0.05;
      // Occasional waving or shifting
      if (Math.sin(idleTime * 0.2) > 0.8) {
        if (rightArmRef.current) rightArmRef.current.rotation.z = Math.sin(idleTime * 10) * 0.5 + 0.5;
      } else {
        if (rightArmRef.current) rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0, 0.1);
      }
    }
  });

  return (
    <group position={pos}>
      <group ref={bodyRef}>
        {/* Body/Tunic */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <boxGeometry args={[0.7, 1.2, 0.5]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        
        {/* Head */}
        <mesh ref={headRef} position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[0.45, 0.45, 0.45]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>

        {/* Arms */}
        <mesh ref={leftArmRef} position={[-0.45, 1, 0]} castShadow>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.45, 1, 0]} castShadow>
          <boxGeometry args={[0.2, 0.8, 0.2]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>

        {/* Legs */}
        <mesh ref={leftLegRef} position={[-0.2, 0.2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.4, 0.25]} />
          <meshStandardMaterial color="#3d3d33" />
        </mesh>
        <mesh ref={rightLegRef} position={[0.2, 0.2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.4, 0.25]} />
          <meshStandardMaterial color="#3d3d33" />
        </mesh>

        <Text position={[0, 2.4, 0]} fontSize={0.6} color="white">
          {npc.avatar}
        </Text>
        <Text position={[0, 2.0, 0.6]} fontSize={0.25} color="white">
          {npc.name}
        </Text>

        {/* Automatic Dialogue Bubble */}
        {isNearest && !isCurrent && (
          <Html position={[0, 3.2, 0]} center distanceFactor={10}>
            <div className="bg-white px-3 py-2 md:px-6 md:py-4 rounded-xl md:rounded-3xl shadow-2xl border-2 md:border-4 border-[#5A5A40] animate-bounce w-[max-content] max-w-[75vw] sm:max-w-[320px] text-center relative">
              <div className="text-[#5A5A40] font-black text-[12px] md:text-xl mb-0.5 md:mb-2 truncate">{npc.name}</div>
              <div className="text-gray-700 text-[11px] md:text-lg italic leading-tight px-1">“{npc.dialogue.greeting}”</div>
              <div className="text-[8px] md:text-xs text-gray-400 mt-1.5 md:mt-2 font-black uppercase tracking-widest bg-gray-100 py-0.5 md:py-1 rounded-full">点击“交互”开启</div>
              <div className="absolute -bottom-1.5 md:-bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 md:w-6 md:h-6 bg-white border-r-2 md:border-r-4 border-b-2 md:border-b-4 border-[#5A5A40] rotate-45"></div>
            </div>
          </Html>
        )}
      </group>

      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.5, 0.1, 3.5]} />
        <meshStandardMaterial color="#d2b48c" />
      </mesh>
      <mesh position={[-1.6, 1, -1.6]}>
        <cylinderGeometry args={[0.05, 0.05, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[1.6, 1, -1.6]}>
        <cylinderGeometry args={[0.05, 0.05, 2]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0, 2, -0.8]} rotation={[Math.PI / 6, 0, 0]}>
        <boxGeometry args={[3.8, 0.1, 2]} />
        <meshStandardMaterial color="#A0522D" />
      </mesh>
    </group>
  );
}

export default function GameWorld({ npcs, currentNpcId, onInteract, tradeAnimation, children }: { npcs: NPC[], currentNpcId: string | null, onInteract: (id: string) => void, tradeAnimation?: { item: Item, npcId: string } | null, children?: React.ReactNode }) {
  const [nearestNpcId, setNearestNpcId] = useState<string | null>(null);
  const virtualKeys = useRef<{ [key: string]: boolean }>({});

  const handleMobileControl = (key: string, active: boolean) => {
    virtualKeys.current[key] = active;
  };

  const animationPos = useMemo(() => {
    if (!tradeAnimation) return null;
    return npcPositions[tradeAnimation.npcId];
  }, [tradeAnimation]);

  return (
    <div className="w-full h-[450px] md:h-[600px] rounded-3xl overflow-hidden border-4 border-[#5A5A40] shadow-2xl relative touch-none">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 15, 20]} fov={50} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
        
        <Sky sunPosition={[100, 50, 100]} turbidity={0.1} rayleigh={0.5} />
        {/* 移除外部 Environment 预设，改用增强的光照，防止国内加载 HDR 资源超时 */}
        <ambientLight intensity={1.5} />
        <directionalLight 
          position={[10, 20, 10]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 10, -10]} intensity={1} color="#fffbe6" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#e8e8d8" />
        </mesh>

        {npcs.map(npc => (
          <NpcModel 
            key={npc.id} 
            npc={npc} 
            isNearest={nearestNpcId === npc.id}
            isCurrent={currentNpcId === npc.id} 
          />
        ))}

        <Player 
          onInteract={onInteract} 
          onNearestNpcChange={setNearestNpcId}
          npcs={npcs} 
          virtualKeys={virtualKeys}
        />

        {tradeAnimation && animationPos && (
          <FallingItem item={tradeAnimation.item} startPos={[animationPos[0], 2, animationPos[2]]} />
        )}

        {[...Array(10)].map((_, i) => (
          <mesh key={i} position={[Math.sin(i) * 15, 1.5, Math.cos(i) * 15]}>
            <coneGeometry args={[1, 3, 8]} />
            <meshStandardMaterial color="#2d5a27" />
          </mesh>
        ))}
      </Canvas>

      {/* On-screen Controls Overlay (Always visible for accessibility) */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col items-center gap-2">
        <button 
          onPointerDown={() => handleMobileControl('KeyW', true)}
          onPointerUp={() => handleMobileControl('KeyW', false)}
          onPointerLeave={() => handleMobileControl('KeyW', false)}
          className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white active:bg-[#5A5A40] active:scale-90 transition-all shadow-2xl border border-white/20"
        >
          <ChevronUp className="w-8 h-8" />
        </button>
        <div className="flex gap-2">
          <button 
            onPointerDown={() => handleMobileControl('KeyA', true)}
            onPointerUp={() => handleMobileControl('KeyA', false)}
            onPointerLeave={() => handleMobileControl('KeyA', false)}
            className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white active:bg-[#5A5A40] active:scale-90 transition-all shadow-2xl border border-white/20"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onPointerDown={() => handleMobileControl('KeyS', true)}
            onPointerUp={() => handleMobileControl('KeyS', false)}
            onPointerLeave={() => handleMobileControl('KeyS', false)}
            className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white active:bg-[#5A5A40] active:scale-90 transition-all shadow-2xl border border-white/20"
          >
            <ChevronDown className="w-8 h-8" />
          </button>
          <button 
            onPointerDown={() => handleMobileControl('KeyD', true)}
            onPointerUp={() => handleMobileControl('KeyD', false)}
            onPointerLeave={() => handleMobileControl('KeyD', false)}
            className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white active:bg-[#5A5A40] active:scale-90 transition-all shadow-2xl border border-white/20"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Interaction Button (Always visible) */}
      <div className="absolute bottom-6 left-6 z-30">
        <button 
          onPointerDown={() => handleMobileControl('KeyE', true)}
          onPointerUp={() => handleMobileControl('KeyE', false)}
          className="w-20 h-20 md:w-24 md:h-24 bg-[#5A5A40] rounded-full flex flex-col items-center justify-center text-white shadow-2xl border-4 border-white/30 active:scale-90 transition-all"
        >
          <HandMetal className="w-8 h-8 md:w-10 md:h-10 mb-1" />
          <span className="text-[10px] md:text-xs font-black uppercase">交互</span>
        </button>
      </div>

      {/* Overlay for Trading UI - Redesigned as a bottom-docked panel for mobile */}
      <AnimatePresence>
        {children && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-4 border-[#5A5A40] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] max-h-[85%] overflow-hidden flex flex-col rounded-t-[2.5rem]"
          >
            <div className="w-full overflow-y-auto custom-scrollbar flex-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 left-4 bg-black/50 text-white p-3 rounded-xl text-sm font-bold pointer-events-none z-10">
        控制：WASD 移动 | 靠近 NPC 自动开启对话
      </div>
    </div>
  );
}
