import React from 'react';
import { Cpu } from 'lucide-react';

const RFIDBadge = ({ uid, type }) => {
  if (!uid) {
    return <span className="text-xs text-slate-500 font-mono italic">No Tag Bound</span>;
  }

  const isBook = type === 'BOOK_TAG' || uid.startsWith('TAG');

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-medium border ${
      isBook 
        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
    }`}>
      <Cpu className="w-3 h-3 opacity-80" />
      <span>{uid}</span>
    </div>
  );
};

export default RFIDBadge;
