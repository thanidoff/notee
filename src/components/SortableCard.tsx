import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KnowledgeCard } from './KnowledgeCard';
import { KnowledgeCard as IKnowledgeCard } from '@/lib/types';
import { GripHorizontal } from 'lucide-react';

interface Props {
  card: IKnowledgeCard;
}

export function SortableCard({ card }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`relative group h-full cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30' : ''} transition-all duration-200`}
    >
      {/* Visual drag indicator (optional, since the whole card is draggable now) */}
      <div className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-50 transition-opacity z-10 text-slate-400 pointer-events-none">
        <GripHorizontal className="w-5 h-5" />
      </div>
      
      <KnowledgeCard card={card} />
    </div>
  );
}
