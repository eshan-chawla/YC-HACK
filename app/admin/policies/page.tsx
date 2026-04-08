'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, ShieldCheck, Plane, Building2, Car, Coffee } from 'lucide-react'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PoliciesPage() {
  const policies = useQuery(api.policies.list) ?? []
  const createPolicy = useMutation(api.policies.create)
  const updatePolicy = useMutation(api.policies.update)
  const removePolicy = useMutation(api.policies.remove)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<Id<'policies'> | null>(null)
  const [deleteId, setDeleteId] = useState<Id<'policies'> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    maxBudget: '',
    airlines: '',
    hotels: '',
    mealAllowance: '',
    groundTransport: '',
  })

  const editingPolicy = editingId ? policies.find((p) => p._id === editingId) : null

  const openCreate = () => {
    setEditingId(null)
    setForm({
      name: '',
      description: '',
      maxBudget: '',
      airlines: '',
      hotels: '',
      mealAllowance: '',
      groundTransport: '',
    })
    setModalOpen(true)
  }

  const openEdit = (p: (typeof policies)[0]) => {
    setEditingId(p._id)
    setForm({
      name: p.name,
      description: p.description ?? '',
      maxBudget: String(p.maxBudget),
      airlines: p.airlines.join(', '),
      hotels: p.hotels.join(', '),
      mealAllowance: String(p.mealAllowance),
      groundTransport: String(p.groundTransport),
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const maxBudget = parseFloat(form.maxBudget) || 0
      const mealAllowance = parseFloat(form.mealAllowance) || 0
      const groundTransport = parseFloat(form.groundTransport) || 0
      const airlines = form.airlines.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      const hotels = form.hotels.split(/[,;]/).map((s) => s.trim()).filter(Boolean)

      if (editingId) {
        await updatePolicy({
          id: editingId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          maxBudget,
          airlines: airlines.length ? airlines : undefined,
          hotels: hotels.length ? hotels : undefined,
          mealAllowance,
          groundTransport,
        })
      } else {
        await createPolicy({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          maxBudget,
          airlines: airlines.length ? airlines : [],
          hotels: hotels.length ? hotels : [],
          mealAllowance,
          groundTransport,
        })
      }
      setModalOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await removePolicy({ id: deleteId })
      setDeleteId(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <AppShell role="admin">
      <div className="space-y-8 max-w-5xl">
        <PageHeader
          title="Travel Policies"
          description="Create and manage policy templates to automate booking compliance"
          actions={
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-10 shadow-lg shadow-emerald-500/10"
              onClick={openCreate}
            >
              <Plus className="w-4 h-4" />
              New Policy
            </Button>
          }
        />

        {policies.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-foreground font-medium mb-1">No policies yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create a travel policy template to apply to events.</p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> New Policy
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {policies.map((policy, index) => (
              <motion.div
                key={policy._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-0 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border/60 group">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-foreground">{policy.name}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{policy.description ?? '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 px-3 font-bold text-[10px] uppercase tracking-widest rounded-lg"
                          onClick={() => openEdit(policy)}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 px-3 font-bold text-[10px] uppercase tracking-widest rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setDeleteId(policy._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border/60">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Plane className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Airlines</p>
                          <p className="text-sm font-bold">{policy.airlines.length} Allowed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hotels</p>
                          <p className="text-sm font-bold">{policy.hotels.length} Preferred</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meals</p>
                          <p className="text-sm font-bold">${policy.mealAllowance}/day</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transport</p>
                          <p className="text-sm font-bold">${policy.groundTransport} Max</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 px-6 py-3 border-t border-border/60 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                    <span>Created {formatDate(policy.createdAt)}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Policy' : 'New Policy'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Domestic-Standard"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label>Max budget per trip ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.maxBudget}
                  onChange={(e) => setForm((f) => ({ ...f, maxBudget: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Airlines (comma-separated)</Label>
                <Input
                  value={form.airlines}
                  onChange={(e) => setForm((f) => ({ ...f, airlines: e.target.value }))}
                  placeholder="United, Delta, American"
                />
              </div>
              <div className="grid gap-2">
                <Label>Hotels (comma-separated)</Label>
                <Input
                  value={form.hotels}
                  onChange={(e) => setForm((f) => ({ ...f, hotels: e.target.value }))}
                  placeholder="Marriott, Hyatt"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Meal allowance ($/day)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.mealAllowance}
                    onChange={(e) => setForm((f) => ({ ...f, mealAllowance: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Ground transport max ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.groundTransport}
                    onChange={(e) => setForm((f) => ({ ...f, groundTransport: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {editingId ? 'Save' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete policy?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. The policy will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  )
}
