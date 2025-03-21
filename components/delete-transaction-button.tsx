"use client"

import { useState } from "react"
import { Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { removeTransaction } from "@/app/actions"

interface DeleteTransactionButtonProps {
  id: string
}

export function DeleteTransactionButton({ id }: DeleteTransactionButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await removeTransaction(id)
    } catch (error) {
      console.error("Erro ao excluir transação:", error)
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

