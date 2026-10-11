import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Shield, 
  Wrench, 
  UserCheck, 
  DollarSign 
} from 'lucide-react';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = status.toLowerCase();

  // Role Badges
  if (type === 'role') {
    const roleLabels = {
      system_admin: { label: 'Admin', icon: Shield },
      service_advisor: { label: 'Advisor', icon: UserCheck },
      mechanic: { label: 'Mechanic', icon: Wrench },
      customer: { label: 'Customer', icon: UserCheck },
    };
    const roleInfo = roleLabels[normalized] || { label: normalized, icon: Shield };
    const Icon = roleInfo.icon;

    return (
      <span className="badge badge-role">
        <Icon size={12} />
        {roleInfo.label}
      </span>
    );
  }

  // Status & Payment Badges
  const getBadgeConfig = () => {
    switch (normalized) {
      case 'completed':
      case 'paid':
        return { className: 'badge-completed', icon: CheckCircle2, label: normalized };
      case 'in_progress':
      case 'active':
        return { className: 'badge-in_progress', icon: Wrench, label: normalized.replace('_', ' ') };
      case 'pending':
        return { className: 'badge-pending', icon: Clock, label: 'Pending' };
      case 'partial':
        return { className: 'badge-partial', icon: DollarSign, label: 'Partial' };
      case 'unpaid':
      case 'cancelled':
      case 'inactive':
        return { className: 'badge-cancelled', icon: XCircle, label: normalized };
      case 'on_leave':
        return { className: 'badge-pending', icon: AlertCircle, label: 'On Leave' };
      default:
        return { className: 'badge-role', icon: AlertCircle, label: normalized };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  return (
    <span className={`badge ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}
