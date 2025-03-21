"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  createBudget,
  updateBudget,
  deleteBudget,
  initializeDefaultData,
} from "@/lib/redis"

// Inicializar dados padrão
export async function initializeData() {
  try {
    await initializeDefaultData()
    revalidatePath("/")
  } catch (error) {
    console.error("Error initializing data:", error)
  }
}

// Ações para transações
export async function addTransaction(formData: FormData) {
  const description = formData.get("description") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const type = formData.get("type") as "income" | "expense"
  const category = formData.get("category") as string
  const date = formData.get("date") as string
  const notes = (formData.get("notes") as string) || undefined

  if (!description || isNaN(amount) || !type || !category || !date) {
    return { error: "Todos os campos obrigatórios devem ser preenchidos" }
  }

  try {
    await createTransaction({
      description,
      amount,
      type,
      category,
      date,
      notes,
    })

    revalidatePath("/transactions")
    revalidatePath("/")
    redirect("/transactions")
  } catch (error) {
    console.error("Error adding transaction:", error)
    return { error: "Erro ao adicionar transação. Tente novamente." }
  }
}

export async function editTransaction(id: string, formData: FormData) {
  const description = formData.get("description") as string
  const amount = Number.parseFloat(formData.get("amount") as string)
  const type = formData.get("type") as "income" | "expense"
  const category = formData.get("category") as string
  const date = formData.get("date") as string
  const notes = (formData.get("notes") as string) || undefined

  if (!description || isNaN(amount) || !type || !category || !date) {
    return { error: "Todos os campos obrigatórios devem ser preenchidos" }
  }

  try {
    await updateTransaction(id, {
      description,
      amount,
      type,
      category,
      date,
      notes,
    })

    revalidatePath("/transactions")
    revalidatePath("/")
    redirect("/transactions")
  } catch (error) {
    console.error("Error editing transaction:", error)
    return { error: "Erro ao editar transação. Tente novamente." }
  }
}

export async function removeTransaction(id: string) {
  try {
    await deleteTransaction(id)
    revalidatePath("/transactions")
    revalidatePath("/")
  } catch (error) {
    console.error("Error removing transaction:", error)
  }
}

// Ações para orçamentos
export async function addBudget(formData: FormData) {
  const category = formData.get("category") as string
  const limit = Number.parseFloat(formData.get("limit") as string)
  const period = (formData.get("period") as string) || "monthly"

  if (!category || isNaN(limit)) {
    return { error: "Todos os campos obrigatórios devem ser preenchidos" }
  }

  try {
    await createBudget({
      category,
      limit,
      spent: 0,
      period,
    })

    revalidatePath("/budgets")
    revalidatePath("/")
    redirect("/budgets")
  } catch (error) {
    console.error("Error adding budget:", error)
    return { error: "Erro ao adicionar orçamento. Tente novamente." }
  }
}

export async function editBudget(id: string, formData: FormData) {
  const category = formData.get("category") as string
  const limit = Number.parseFloat(formData.get("limit") as string)
  const period = (formData.get("period") as string) || "monthly"

  if (!category || isNaN(limit)) {
    return { error: "Todos os campos obrigatórios devem ser preenchidos" }
  }

  try {
    await updateBudget(id, {
      category,
      limit,
      period,
    })

    revalidatePath("/budgets")
    revalidatePath("/")
    redirect("/budgets")
  } catch (error) {
    console.error("Error editing budget:", error)
    return { error: "Erro ao editar orçamento. Tente novamente." }
  }
}

export async function removeBudget(id: string) {
  try {
    await deleteBudget(id)
    revalidatePath("/budgets")
    revalidatePath("/")
  } catch (error) {
    console.error("Error removing budget:", error)
  }
}

