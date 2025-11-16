'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { AddPolicyGroupModal, PolicyGroupData } from './AddPolicyGroupModal'

interface PolicyGroup extends PolicyGroupData {
  id: string
  createdAt: string
  currentBalance: number
}

interface PolicyGroupsTabProps {
  wallets: Array<{ id: string; name: string; address: string }>
}

export function PolicyGroupsTab({ wallets }: PolicyGroupsTabProps) {
  const [policyGroups, setPolicyGroups] = useState<PolicyGroup[]>([
    {
      id: '1',
      name: 'Q4 Offsite Standard',
      initialBudget: 10000,
      currentBalance: 7500,
      walletId: wallets[0]?.id || '',
      createdAt: 'Nov 15, 2025',
      agentPermissions: {
        sendToEmail: true,
        sendToWallet: true,
        sendToContacts: false,
        enableX402Api: false,
      },
    },
  ])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleAddPolicyGroup = (data: PolicyGroupData) => {
    const newPolicyGroup: PolicyGroup = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      currentBalance: data.initialBudget,
    }
    setPolicyGroups([...policyGroups, newPolicyGroup])
  }

  const handleDeletePolicyGroup = (id: string) => {
    setPolicyGroups(policyGroups.filter((pg) => pg.id !== id))
  }

  const getWalletName = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    return wallet ? wallet.name : 'Unknown Wallet'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Policy Groups</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage policy groups and agent permissions for this event
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-green-600 text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Policy Group
        </Button>
      </div>

      {policyGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No policy groups configured for this event
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Policy Group
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {policyGroups.map((policyGroup) => (
            <Card key={policyGroup.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">{policyGroup.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created on {policyGroup.createdAt}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Initial Budget</p>
                      <p className="font-semibold">
                        ${policyGroup.initialBudget.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        USDC
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                      <p className="font-semibold">
                        ${policyGroup.currentBalance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        USDC
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Associated Wallet</p>
                      <p className="font-semibold">{getWalletName(policyGroup.walletId)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Active
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Agent Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {policyGroup.agentPermissions.sendToEmail && (
                        <span className="px-2 py-1 rounded-md text-xs bg-muted">
                          Email Payments
                        </span>
                      )}
                      {policyGroup.agentPermissions.sendToWallet && (
                        <span className="px-2 py-1 rounded-md text-xs bg-muted">
                          Wallet Transfers
                        </span>
                      )}
                      {policyGroup.agentPermissions.sendToContacts && (
                        <span className="px-2 py-1 rounded-md text-xs bg-muted">
                          Contact Payments
                        </span>
                      )}
                      {policyGroup.agentPermissions.enableX402Api && (
                        <span className="px-2 py-1 rounded-md text-xs bg-muted">
                          x402 API
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 ml-4">
                  <Button variant="ghost" size="icon">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePolicyGroup(policyGroup.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddPolicyGroupModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        wallets={wallets}
        onAdd={handleAddPolicyGroup}
      />
    </div>
  )
}

