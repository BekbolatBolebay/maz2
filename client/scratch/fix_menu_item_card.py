
import os

file_path = "/home/bekbolat/Жүктемелер/mazirapp-main (Көшірме)/client/components/restaurant/menu-item-card.tsx"

with open(file_path, 'r') as f:
    content = f.read()

import_block = """'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { Plus, Minus, X, ShoppingCart, MapPin, Utensils, Star, Clock, Info, ChevronRight, Share2, Plus as PlusIcon, Users, ChefHat } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n/i18n-context'
import { addToLocalCart, LocalCartItem } from '@/lib/storage/local-storage'
import { Database } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn, isHappyHourActive, getHappyHourDiscountedPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { AuthModal } from '@/components/auth/auth-modal'

"""

idx = content.find("type MenuItem =")
if idx != -1:
    remaining_content = content[idx:]
    with open(file_path, 'w') as f:
        f.write(import_block + remaining_content)
else:
    print("Could not find type MenuItem")
