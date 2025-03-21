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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addBudget, editBudget } from "@/app/actions"
import type { Budget, Category } from "@/lib/redis"

interface BudgetFormProps {
  categories: Category[]
  budget?: Budget
  isEditing?: boolean
}

export function BudgetForm({ categories, budget, isEditing = false }: BudgetFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (isEditing && budget) {
        await editBudget(budget.id, formData)
      } else {
        await addBudget(formData)
      }
      router.push("/budgets")
    } catch (err) {
      console.error("Erro ao salvar orçamento:", err)
      setError("Ocorreu um erro ao salvar o orçamento. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Select name="category" defaultValue={budget?.category}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="limit">Limite (R$)</Label>
            <Input
              id="limit"
              name="limit"
              type="number"
              placeholder="0,00"
              step="0.01"
              min="0"
              defaultValue={budget?.limit}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="period">Período</Label>
            <Select name="period" defaultValue={budget?.period || "monthly"}>
              <SelectTrigger id="period">
                <SelectValue placeholder="Selecione um período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/budgets">Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Orçamento" : "Salvar Orçamento"}
        </Button>
      </CardFooter>
    </form>
  )
}

