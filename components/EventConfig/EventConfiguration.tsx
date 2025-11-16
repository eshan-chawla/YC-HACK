'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PolicyGroupsTab } from './PolicyGroupsTab'
import { WalletsTab } from './WalletsTab'
import { useState } from 'react'

interface Wallet {
  id: string
  name: string
  address: string
}

interface EventConfigurationProps {
  eventId: string
}

export function EventConfiguration({ eventId }: EventConfigurationProps) {
  // Mock wallets - in production, this would come from props or API
  const [wallets, setWallets] = useState<Wallet[]>([
    {
      id: '1',
      name: 'Event Main Wallet',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    },
  ])

  const handleWalletCreated = (newWallet: Wallet) => {
    setWallets([...wallets, newWallet])
  }

  const handleWalletDeleted = (walletId: string) => {
    setWallets(wallets.filter((w) => w.id !== walletId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Event Configuration</h2>
        <p className="text-muted-foreground mt-1">
          Configure policy groups and wallets for this event
        </p>
      </div>

      <Tabs defaultValue="policies" className="w-full">
        <TabsList>
          <TabsTrigger value="policies">Policy Groups</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="mt-6">
          <PolicyGroupsTab wallets={wallets} />
        </TabsContent>

        <TabsContent value="wallets" className="mt-6">
          <WalletsTab
            eventId={eventId}
            wallets={wallets}
            onWalletCreated={handleWalletCreated}
            onWalletDeleted={handleWalletDeleted}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

