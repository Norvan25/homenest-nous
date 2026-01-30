'use client';

import { Phone, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

interface QueueItemListProps {
  items: Array<{
    id: string;
    phone_number: string;
    contact_name: string;
    property_address: string;
    status: string;
    position: number;
  }>;
}

export function QueueItemList({ items }: QueueItemListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'calling':
        return <Loader2 size={14} className="text-cyan-400 animate-spin" />;
      case 'failed':
      case 'no_answer':
        return <XCircle size={14} className="text-red-400" />;
      case 'voicemail_left':
        return <Clock size={14} className="text-amber-400" />;
      default:
        return <Phone size={14} className="text-white/40" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10';
      case 'calling':
        return 'bg-cyan-500/10';
      case 'failed':
      case 'no_answer':
        return 'bg-red-500/10';
      default:
        return '';
    }
  };

  return (
    <div className="divide-y divide-white/5">
      {items.map((item) => (
        <div
          key={item.id}
          className={`px-4 py-3 flex items-center gap-3 ${getStatusBg(item.status)}`}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs text-white/60">
            {item.position}
          </div>
          {getStatusIcon(item.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{item.phone_number}</span>
              <span className="text-white/40 text-sm truncate">{item.contact_name}</span>
            </div>
            <div className="text-xs text-white/40 truncate">{item.property_address}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
