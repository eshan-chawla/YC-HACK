'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AddPolicyGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  wallets: Array<{ id: string; name: string; address: string }>
  onAdd: (policyGroup: PolicyGroupData) => void
}

export interface PolicyGroupData {
  name: string
  initialBudget: number
  walletId: string
  agentPermissions: {
    sendToEmail: boolean
    sendToWallet: boolean
    sendToContacts: boolean
    enableX402Api: boolean
  }
}

export function AddPolicyGroupModal({
  open,
  onOpenChange,
  wallets,
  onAdd,
}: AddPolicyGroupModalProps) {
  const [policyName, setPolicyName] = useState('')
  const [initialBudget, setInitialBudget] = useState('1000.00')
  const [selectedWallet, setSelectedWallet] = useState<string>('')
  const [permissions, setPermissions] = useState({
    sendToEmail: false,
    sendToWallet: false,
    sendToContacts: false,
    enableX402Api: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!policyName.trim() || !selectedWallet || !initialBudget) {
      return
    }

    onAdd({
      name: policyName,
      initialBudget: parseFloat(initialBudget),
      walletId: selectedWallet,
      agentPermissions: permissions,
    })

    // Reset form
    setPolicyName('')
    setInitialBudget('1000.00')
    setSelectedWallet('')
    setPermissions({
      sendToEmail: false,
      sendToWallet: false,
      sendToContacts: false,
      enableX402Api: false,
    })
    
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Policy Group</DialogTitle>
          <DialogDescription>
            Configure a new policy group for this event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Policy Name */}
            <div className="space-y-2">
              <Label htmlFor="policy-name">
                Policy Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="policy-name"
                placeholder="e.g., Daily Spending Limit"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                required
              />
            </div>

            {/* Initial Budget */}
            <div className="space-y-2">
              <Label htmlFor="initial-budget">
                Initial Budget (USDC) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="initial-budget"
                type="number"
                step="0.01"
                min="0"
                value={initialBudget}
                onChange={(e) => setInitialBudget(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Note: you can top up this budget at any time
              </p>
            </div>

            {/* Associated Wallet */}
            <div className="space-y-2">
              <Label htmlFor="wallet">
                Associated Wallet <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedWallet} onValueChange={setSelectedWallet} required>
                <SelectTrigger id="wallet" className="w-full">
                  <SelectValue placeholder="Select a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No wallets available. Create a wallet first.
                    </SelectItem>
                  ) : (
                    wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.address.slice(0, 8)}...{wallet.address.slice(-6)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Agent Permissions */}
            <div className="space-y-4">
              <Label>Agent Permissions</Label>
              
              <div className="space-y-4 pl-1">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="send-to-email"
                    checked={permissions.sendToEmail}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, sendToEmail: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="send-to-email"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Allow agents to send funds to email addresses
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enables escrow payments via email
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="send-to-wallet"
                    checked={permissions.sendToWallet}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, sendToWallet: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="send-to-wallet"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Allow agents to send funds to wallet addresses
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enables direct transfers to any address
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="send-to-contacts"
                    checked={permissions.sendToContacts}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, sendToContacts: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="send-to-contacts"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Allow agents to send to contacts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enables payments to whitelisted contacts only
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="enable-x402-api"
                    checked={permissions.enableX402Api}
                    onCheckedChange={(checked) =>
                      setPermissions({ ...permissions, enableX402Api: checked === true })
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor="enable-x402-api"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Enable x402 API payments
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Approve specific endpoints after policy group creation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-green-600">
              Create Policy Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

