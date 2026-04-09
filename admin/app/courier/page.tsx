'use client'

import React, { useState, useEffect } from 'react'
import { Courier, CourierSession } from '@/components/courier/courier-utils'
import { CourierDashboard } from '@/components/courier/courier-dashboard'
import { CourierLoginForm } from '@/components/courier/courier-login-form'

export default function CourierPage() {
  const [courier, setCourier] = useState<Courier | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const savedSession = localStorage.getItem('courierSession')
    if (savedSession) {
      try {
        const session: CourierSession = JSON.parse(savedSession)
        setCourier(session)
      } catch (error) {
        console.error('Failed to load session:', error)
        localStorage.removeItem('courierSession')
      }
    }
    setIsInitializing(false)
  }, [])

  const handleLoginSuccess = (courierData: Courier) => {
    localStorage.setItem('courierSession', JSON.stringify({
      ...courierData,
      loggedInAt: new Date().toISOString()
    }))
    setCourier(courierData)
  }

  const handleLogout = () => {
    setCourier(null)
    localStorage.removeItem('courierSession')
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!courier) {
    return <CourierLoginForm onLoginSuccess={handleLoginSuccess} />
  }

  return <CourierDashboard initialCourier={courier} onLogout={handleLogout} />
}