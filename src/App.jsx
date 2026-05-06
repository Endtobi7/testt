import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import { Play, Pause, RefreshCw } from 'lucide-react';

// --- 3D Mechanism Component ---
const Mechanism = ({ isPlaying, speed, direction, xPos, onUpdateTelemetry }) => {
  const gearRef = useRef();
  const rackRef = useRef();
  const verticalPlatformRef = useRef();
  
  // Mechanical constants
  const gearRadius = 0.6;
  const maxZ = 3;
  const minZ = 0;

  // Internal state for continuous rotation
  const angleRef = useRef(0);

  useFrame((state, delta) => {
    if (isPlaying) {
      // 1. Calculate Motor / Gear Rotation
      angleRef.current += speed * direction * delta;
      
      // 2. Calculate Rack Vertical (Z) Displacement (z = r * theta)
      // Constrain Z to physical limits
      let zDisplacement = angleRef.current * gearRadius;
      
      if (zDisplacement > maxZ) {
        zDisplacement = maxZ;
        angleRef.current = maxZ / gearRadius;
      } else if (zDisplacement < minZ) {
        zDisplacement = minZ;
        angleRef.current = minZ / gearRadius;
      }

      // Apply transformations
      if (gearRef.current) gearRef.current.rotation.z = angleRef.current;
      if (rackRef.current) rackRef.current.position.y = zDisplacement + 1;
      if (verticalPlatformRef.current) verticalPlatformRef.current.position.y = zDisplacement + 2.5;

      // Update UI Telemetry
      onUpdateTelemetry({
        angle: (angleRef.current * (180 / Math.PI)).toFixed(1),
        z: zDisplacement.toFixed(2),
      });
    }
  });

  return (
    <group position={[xPos, 0, 0]}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[4, 0.5, 3]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      <mesh position={[0.8, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.5, 32]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <mesh ref={gearRef} position={[0.8, 1, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[gearRadius, gearRadius, 0.4, 16]} />
        <meshStandardMaterial color="#ca8a04" wireframe={false} />
        <mesh position={[0.4, 0, 0.21]}>
          <boxGeometry args={[0.2, 0.4, 0.05]} />
          <meshStandardMaterial color="#854d0e" />
        </mesh>
      </mesh>

      <mesh ref={rackRef} position={[0.1, 1, 1]}>
        <boxGeometry args={[0.3, 4, 0.3]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      <mesh position={[-1, 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1, 2, -1]}>
        <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
      </mesh>

      <mesh ref={verticalPlatformRef} position={[-0.45, 2.5, -0.5]}>
        <boxGeometry args={[2.5, 0.2, 2.5]} />
        <meshStandardMaterial color="#0ea5e9" />
      </mesh>
    </group>
  );
};

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [direction, setDirection] = useState(1);
  const [xPos, setXPos] = useState(0);
  const [telemetry, setTelemetry] = useState({ angle: 0, z: 0 });

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800">
      <div className="flex-1 relative">
        <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          
          <Mechanism 
            isPlaying={isPlaying} 
            speed={speed} 
            direction={direction} 
            xPos={xPos} 
            onUpdateTelemetry={setTelemetry}
          />
          
          <Grid infiniteGrid fadeDistance={20} sectionColor="#94a3b8" cellColor="#cbd5e1" />
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4} />
          <Environment preset="city" />
          <OrbitControls makeDefault />
        </Canvas>

        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 w-64">
          <h2 className="font-bold text-slate-800 mb-3 uppercase tracking-wider text-sm">Real-time Telemetry</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Motor Angle:</span>
              <span className="font-semibold">{telemetry.angle}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">X Position:</span>
              <span className="font-semibold">{Number(xPos).toFixed(2)} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Z Height:</span>
              <span className="font-semibold">{telemetry.z} mm</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col shadow-2xl z-10">
        <h1 className="text-xl font-bold mb-6 text-slate-900">Actuator Control</h1>
        
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold transition-colors ${
              isPlaying ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'Pause' : 'Start Motor'}
          </button>
          
          <button 
            onClick={() => setDirection(d => d * -1)}
            className="p-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            title="Reverse Direction"
          >
            <RefreshCw size={18} className={direction < 0 ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label>Motor Speed</label>
              <span className="text-slate-500">{speed} rad/s</span>
            </div>
            <input 
              type="range" 
              min="0.5" max="5" step="0.1" 
              value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label>Linear X-Axis (Base)</label>
              <span className="text-slate-500">{xPos}</span>
            </div>
            <input 
              type="range" 
              min="-3" max="3" step="0.1" 
              value={xPos} 
              onChange={(e) => setXPos(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 leading-relaxed">
            Drag the viewport to orbit. Scroll to zoom. Use the control panel to drive the rack-and-pinion constraints.
          </p>
        </div>
      </div>
    </div>
  );
}