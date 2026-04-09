'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Courier } from './courier-utils'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CourierLoginFormProps {
    onLoginSuccess: (courier: Courier) => void
}

export function CourierLoginForm({ onLoginSuccess }: CourierLoginFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            toast.error(error.message)
            setIsLoading(false)
            return
        }

        const { data: userData, error: userError } = await supabase
            .from('staff_profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

        if (userError || userData.role !== 'courier') {
            toast.error('Доступ масқара! Тек курьерлер кіре алады.')
            await supabase.auth.signOut()
            setIsLoading(false)
            return
        }

        onLoginSuccess(userData)
        setIsLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Курьер панелі</h2>
                    <p className="mt-2 text-sm text-gray-600">Жүйеге кіріңіз</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email адрес"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Құпиясөз"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Кіру'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
