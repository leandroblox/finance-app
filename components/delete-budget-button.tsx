"use client"

import { useState } from "react"
import { Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { removeBudget } from "@/app/actions"

interface DeleteBudgetButtonProps {
  id: string
}

export function DeleteBudgetButton({ id }: DeleteBudgetButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await removeBudget(id)
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
      <Trash className="h-4 w-4" />
    </Button>
  )
}

