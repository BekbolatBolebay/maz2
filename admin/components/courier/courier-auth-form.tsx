'use client'

import React from 'react'
import { CourierLoginForm } from './courier-login-form'
import { Courier } from './courier-utils'

export function CourierAuthForm() {
    const handleSuccess = (courier: Courier) => {
        localStorage.setItem('courierSession', JSON.stringify({
            ...courier,
            loggedInAt: new Date().toISOString()
        }))
        window.location.href = '/courier'
    }

    return <CourierLoginForm onLoginSuccess={handleSuccess} />
}
