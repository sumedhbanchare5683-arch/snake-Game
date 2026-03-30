/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Pause } from 'lucide-react';

// Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;
const MIN_SPEED = 50;
const SPEED_INCREMENT = 2;

type Point = { x: number; y: number };

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState<Point>(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Generate random food position not on snake
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  // Handle game restart
  const restartGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
  };

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y === 0) setNextDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y === 0) setNextDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x === 0) setNextDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x === 0) setNextDirection({ x: 1, y: 0 });
          break;
        case ' ':
          if (!gameOver) setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver]);

  // Game Loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + nextDirection.x,
          y: head.y + nextDirection.y,
        };

        // Update current direction to match the one we just used
        setDirection(nextDirection);

        // Check wall collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => {
            const newScore = prev + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('snakeHighScore', newScore.toString());
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
          setSpeed((prev) => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [gameOver, isPaused, food, nextDirection, speed, generateFood, highScore]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = '#ef4444'; // Red
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#22c55e' : '#16a34a'; // Green
      
      // Rounded segments
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const r = cellSize / 4;
      
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, r);
      ctx.fill();

      // Eyes for the head
      if (isHead) {
        ctx.fillStyle = 'white';
        const eyeSize = cellSize / 6;
        const eyeOffset = cellSize / 4;
        
        // Position eyes based on direction
        if (direction.x === 1) { // Right
          ctx.fillRect(x + cellSize - eyeOffset, y + eyeOffset - eyeSize/2, eyeSize, eyeSize);
          ctx.fillRect(x + cellSize - eyeOffset, y + cellSize - eyeOffset - eyeSize/2, eyeSize, eyeSize);
        } else if (direction.x === -1) { // Left
          ctx.fillRect(x + eyeOffset - eyeSize, y + eyeOffset - eyeSize/2, eyeSize, eyeSize);
          ctx.fillRect(x + eyeOffset - eyeSize, y + cellSize - eyeOffset - eyeSize/2, eyeSize, eyeSize);
        } else if (direction.y === -1) { // Up
          ctx.fillRect(x + eyeOffset - eyeSize/2, y + eyeOffset - eyeSize, eyeSize, eyeSize);
          ctx.fillRect(x + cellSize - eyeOffset - eyeSize/2, y + eyeOffset - eyeSize, eyeSize, eyeSize);
        } else if (direction.y === 1) { // Down
          ctx.fillRect(x + eyeOffset - eyeSize/2, y + cellSize - eyeOffset, eyeSize, eyeSize);
          ctx.fillRect(x + cellSize - eyeOffset - eyeSize/2, y + cellSize - eyeOffset, eyeSize, eyeSize);
        }
      }
    });
  }, [snake, food, direction]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-4 font-sans">
      {/* Header / Scoreboard */}
      <div className="w-full max-w-[400px] flex justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-green-500 leading-none">
            Snake
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono mt-1">
            Retro Arcade Classic
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Score</span>
            <span className="text-2xl font-mono font-bold leading-none">{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Best</span>
            <span className="text-2xl font-mono font-bold leading-none text-zinc-400">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="border border-zinc-800 rounded-xl shadow-2xl shadow-green-500/5 bg-[#1a1a1a]"
        />

        {/* Overlays */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-8 text-center"
            >
              <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
              <h2 className="text-3xl font-black uppercase italic mb-2">Game Over</h2>
              <p className="text-zinc-400 mb-6">You scored {score} points!</p>
              <button
                onClick={restartGame}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black px-8 py-3 rounded-full font-bold transition-all active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </motion.div>
          )}

          {isPaused && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl cursor-pointer"
              onClick={() => setIsPaused(false)}
            >
              <div className="bg-white/10 p-6 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
                <Play className="w-12 h-12 fill-white" />
              </div>
              <p className="mt-4 text-sm font-bold uppercase tracking-widest text-white/60 animate-pulse">
                Press Space to Start
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Help */}
      <div className="mt-8 grid grid-cols-2 gap-8 w-full max-w-[400px]">
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Movement</span>
          <div className="flex gap-2">
            <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono border border-zinc-700">WASD</kbd>
            <span className="text-zinc-600">or</span>
            <kbd className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono border border-zinc-700">Arrows</kbd>
          </div>
        </div>
        <div className="space-y-2 text-right">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block">Pause</span>
          <kbd className="px-4 py-1 bg-zinc-800 rounded text-xs font-mono border border-zinc-700 inline-block">Space</kbd>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-12 pb-4 text-[10px] text-zinc-600 uppercase tracking-widest font-medium">
        Built with React & Canvas
      </footer>
    </div>
  );
}
