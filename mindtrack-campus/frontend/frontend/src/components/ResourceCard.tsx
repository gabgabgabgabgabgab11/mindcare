import React from 'react';
import { Card } from './Card';

interface ResourceCardProps {
  title: string;
  category: string;
  description: string;
  contact: string;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ title, category, description, contact }) => {
  return (
    <Card className="flex flex-col h-full justify-between gap-4">
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{title}</h3>
          <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider whitespace-nowrap">
            {category.replace('-', ' ')}
          </span>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      
      <div className="pt-3 border-t border-gray-100 mt-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Contact / Location</p>
        <p className="text-sm font-medium text-blue-700">{contact}</p>
      </div>
    </Card>
  );
};