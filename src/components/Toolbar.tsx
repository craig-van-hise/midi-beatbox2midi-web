import React from 'react';
import { MousePointer2, Pencil, X, Lock, Volume2 } from 'lucide-react';
import { clsx } from 'clsx';

export type Tool = 'pointer' | 'pencil' | 'eraser' | 'lock';

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, setActiveTool }) => {
  const tools: { id: Tool; icon: any; label: string }[] = [
    { id: 'pointer', icon: MousePointer2, label: 'Select' },
    { id: 'pencil', icon: Pencil, label: 'Add' },
    { id: 'eraser', icon: X, label: 'Remove' },
    { id: 'lock', icon: Lock, label: 'Lock' },
  ];

  return (
    <div className="flex gap-1 p-1 bg-slate-200 rounded-lg self-start">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={clsx(
            'p-2 rounded-md transition-all',
            activeTool === tool.id
              ? 'bg-white text-hit-blue shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-white hover:bg-opacity-50'
          )}
          title={tool.label}
        >
          <tool.icon size={18} />
        </button>
      ))}
    </div>
  );
};
