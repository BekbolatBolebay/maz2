'use client'

import { Shield, User, Star, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'admin' | 'manager' | 'staff' | 'user'

interface RoleBadgeProps {
  role: Role | string | null
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (!role) return null

  const config = {
    admin: {
      label: 'Админ',
      icon: Shield,
      colors: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      shadow: 'shadow-amber-500/10'
    },
    manager: {
      label: 'Менеджер',
      icon: Star,
      colors: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      shadow: 'shadow-indigo-500/10'
    },
    staff: {
      label: 'Персонал',
      icon: Briefcase,
      colors: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      shadow: 'shadow-emerald-500/10'
    },
    user: {
      label: 'Клиент',
      icon: User,
      colors: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
      shadow: 'shadow-slate-500/10'
    }
  }

  const current = config[role as Role] || config.user
  const Icon = current.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-sm transition-all duration-300",
      current.colors,
      current.shadow,
      className
    )}>
      <Icon className="w-3 h-3" />
      <span>{current.label}</span>
      
      {role === 'admin' && (
        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />
      )}
    </div>
  )
}
