'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { TrackingView } from '@/components/courier/tracking-view'

export default function CourierTrackingPage() {
  const params = useParams()
  const token = params.token as string

  return <TrackingView token={token} />
}