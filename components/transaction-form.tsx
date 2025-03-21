"use client"

import type React from "react"

import { useState } from "react"
import { Save } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { addTransaction, editTransaction } from "@/app/actions"
import type { Category, Transaction } from "@/lib/redis"

interface TransactionFormProps {
  categories: Category[]
  transaction?: Transaction
  isEditing?: boolean
}

export function TransactionForm({ categories, transaction, isEditing = false }: TransactionFormProps) {
  const router = useRouter()
  const [type, setType] = useState(transaction?.type || "expense")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both")
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (isEditing && transaction) {
        await editTransaction(transaction.id, formData)
      } else {
        await addTransaction(formData)
      }
      router.push("/transactions")
    } catch (err) {
      console.error("Erro ao salvar transação:", err)
      setError("Ocorreu um erro ao salvar a transação. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Tipo de Transação</Label>
            <RadioGroup
              defaultValue={transaction?.type || "expense"}
              className="grid grid-cols-2 gap-4 pt-2"
              name="type"
              onValueChange={setType}
            >
              <div>
                <RadioGroupItem value="expense" id="expense" className="peer sr-only" />
                <Label
                  htmlFor="expense"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span>Despesa</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="income" id="income" className="peer sr-only" />
                <Label
                  htmlFor="income"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <span>Receita</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Supermercado, Salário, etc."
              defaultValue={transaction?.description}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              placeholder="0,00"
              step="0.01"
              min="0"
              defaultValue={transaction?.amount}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={transaction?.date || new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" defaultValue={transaction?.category}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {type === "expense"
                  ? expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  : incomeCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Adicione detalhes sobre esta transação"
              defaultValue={transaction?.notes}
            />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/transactions">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Transação" : "Salvar Transação"}
        </Button>
      </CardFooter>
    </form>
  )
}

