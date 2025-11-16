'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Trash2, Copy, Check } from 'lucide-react'

interface Wallet {
  id: string
  name: string
  address: string
}

interface WalletsTabProps {
  eventId: string
  wallets: Wallet[]
  onWalletCreated: (wallet: Wallet) => void
  onWalletDeleted: (walletId: string) => void
}

export function WalletsTab({
  eventId,
  wallets: propWallets,
  onWalletCreated,
  onWalletDeleted,
}: WalletsTabProps) {
  const [wallets, setWallets] = useState<Array<Wallet & { createdAt: string; balance: number }>>(
    propWallets.map((w) => ({
      ...w,
      createdAt: 'Nov 15, 2025',
      balance: 25000,
    }))
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [walletName, setWalletName] = useState('')
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  // Sync wallets when propWallets changes
  useEffect(() => {
    setWallets((prevWallets) =>
      propWallets.map((w) => {
        const existing = prevWallets.find((ew) => ew.id === w.id)
        return {
          ...w,
          createdAt: existing?.createdAt || new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          balance: existing?.balance || 0,
        }
      })
    )
  }, [propWallets])

  const handleCreateWallet = () => {
    if (!walletName.trim()) return

    // Generate a mock wallet address (in production, this would be created via API)
    const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`

    const newWallet: Wallet = {
      id: Date.now().toString(),
      name: walletName,
      address: mockAddress,
    }

    const walletWithMeta = {
      ...newWallet,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      balance: 0,
    }

    setWallets([...wallets, walletWithMeta])
    onWalletCreated(newWallet)
    setWalletName('')
    setIsModalOpen(false)
  }

  const handleDeleteWallet = (id: string) => {
    setWallets(wallets.filter((w) => w.id !== id))
    onWalletDeleted(id)
  }

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Wallets</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage wallets for this event. Each wallet can be associated with policy groups.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-green-600 text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Wallet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No wallets created for this event
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Wallet
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">{wallet.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created on {wallet.createdAt}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Wallet Address</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopyAddress(wallet.address)}
                        >
                          {copiedAddress === wallet.address ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-semibold">
                        ${wallet.balance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        USDC
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteWallet(wallet.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
            <DialogDescription>
              Create a new wallet for this event. The wallet will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wallet-name">
                Wallet Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="wallet-name"
                placeholder="e.g., Event Main Wallet"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setWalletName('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWallet}
              disabled={!walletName.trim()}
              className="bg-primary hover:bg-green-600"
            >
              Create Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

