import { Redis } from "@upstash/redis"

// Inicializa o cliente Redis usando as variáveis de ambiente
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
})

// Tipos de dados
export interface Transaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  date: string
  notes?: string
  createdAt: number
}

export interface Budget {
  id: string
  category: string
  limit: number
  spent: number
  period: string // 'monthly', 'weekly', etc.
}

export interface Category {
  id: string
  name: string
  type: "income" | "expense" | "both"
}

// Funções de abstração segura para operações Redis
async function safeSmembers(key: string): Promise<string[]> {
  try {
    const result = await redis.smembers(key)
    if (Array.isArray(result)) {
      return result
    }
    return []
  } catch (error) {
    console.error(`Error in safeSmembers for key ${key}:`, error)
    return []
  }
}

// Função alternativa para obter dados de hash
async function getHashFields(key: string, fields: string[]): Promise<Record<string, any>> {
  try {
    const result: Record<string, any> = {}

    // Tentar obter cada campo individualmente
    for (const field of fields) {
      try {
        const value = await redis.hget(key, field)
        if (value !== null && value !== undefined) {
          result[field] = value
        }
      } catch (fieldError) {
        console.error(`Error getting field ${field} from ${key}:`, fieldError)
      }
    }

    return result
  } catch (error) {
    console.error(`Error in getHashFields for key ${key}:`, error)
    return {}
  }
}

// Funções auxiliares para transações
export async function getAllTransactions(): Promise<Transaction[]> {
  try {
    // Obter IDs de transações
    const transactionIds = await safeSmembers("transactions")

    if (transactionIds.length === 0) {
      return []
    }

    // Buscar cada transação individualmente
    const transactions: Transaction[] = []
    for (const id of transactionIds) {
      try {
        // Obter campos específicos da transação
        const transaction = await getHashFields(`transaction:${id}`, [
          "id",
          "description",
          "amount",
          "type",
          "category",
          "date",
          "notes",
          "createdAt",
        ])

        // Se o objeto não estiver vazio, adicionar à lista
        if (Object.keys(transaction).length > 0) {
          // Converter campos numéricos
          const parsedTransaction = {
            ...transaction,
            id: transaction.id || id,
            amount:
              typeof transaction.amount === "string" ? Number.parseFloat(transaction.amount) : transaction.amount || 0,
            createdAt:
              typeof transaction.createdAt === "string"
                ? Number.parseInt(transaction.createdAt)
                : transaction.createdAt || Date.now(),
          } as Transaction

          transactions.push(parsedTransaction)
        }
      } catch (error) {
        console.error(`Error processing transaction ${id}:`, error)
      }
    }

    // Ordenar transações por data
    return transactions.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  } catch (error) {
    console.error("Error getting all transactions:", error)
    return []
  }
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  try {
    // Obter campos específicos da transação
    const transaction = await getHashFields(`transaction:${id}`, [
      "id",
      "description",
      "amount",
      "type",
      "category",
      "date",
      "notes",
      "createdAt",
    ])

    // Se o objeto estiver vazio, retornar null
    if (Object.keys(transaction).length === 0) {
      return null
    }

    // Converter campos numéricos
    return {
      ...transaction,
      id: transaction.id || id,
      amount: typeof transaction.amount === "string" ? Number.parseFloat(transaction.amount) : transaction.amount || 0,
      createdAt:
        typeof transaction.createdAt === "string"
          ? Number.parseInt(transaction.createdAt)
          : transaction.createdAt || Date.now(),
    } as Transaction
  } catch (error) {
    console.error(`Error getting transaction ${id}:`, error)
    return null
  }
}

export async function createTransaction(transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
  const id = crypto.randomUUID()
  const createdAt = Date.now()

  const newTransaction = {
    ...transaction,
    id,
    createdAt,
    amount: Number(transaction.amount),
  }

  try {
    // Armazenar cada campo individualmente
    for (const [key, value] of Object.entries(newTransaction)) {
      await redis.hset(`transaction:${id}`, key, value)
    }

    await redis.sadd("transactions", id)

    // Atualizar o orçamento correspondente
    if (transaction.type === "expense") {
      await updateBudgetSpent(transaction.category, Number(transaction.amount))
    }

    return newTransaction
  } catch (error) {
    console.error("Error creating transaction:", error)
    throw error
  }
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | null> {
  try {
    const transaction = await getTransaction(id)

    if (!transaction) return null

    const updatedTransaction = {
      ...transaction,
      ...data,
      amount: data.amount ? Number(data.amount) : transaction.amount,
    }

    // Atualizar cada campo individualmente
    for (const [key, value] of Object.entries(updatedTransaction)) {
      await redis.hset(`transaction:${id}`, key, value)
    }

    return updatedTransaction
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error)
    return null
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  try {
    const transaction = await getTransaction(id)

    if (!transaction) return false

    await redis.del(`transaction:${id}`)
    await redis.srem("transactions", id)

    // Se for uma despesa, atualizar o orçamento correspondente
    if (transaction.type === "expense") {
      await updateBudgetSpent(transaction.category, -Number(transaction.amount))
    }

    return true
  } catch (error) {
    console.error(`Error deleting transaction ${id}:`, error)
    return false
  }
}

// Funções auxiliares para orçamentos
export async function getAllBudgets(): Promise<Budget[]> {
  try {
    // Obter IDs de orçamentos
    const budgetIds = await safeSmembers("budgets")

    if (budgetIds.length === 0) {
      return []
    }

    // Buscar cada orçamento individualmente
    const budgets: Budget[] = []

    for (const id of budgetIds) {
      try {
        // Obter campos específicos do orçamento
        const budget = await getHashFields(`budget:${id}`, ["id", "category", "limit", "spent", "period"])

        // Se o objeto não estiver vazio, adicionar à lista
        if (Object.keys(budget).length > 0) {
          // Criar um objeto de orçamento com valores padrão
          budgets.push({
            id: budget.id || id,
            category: budget.category || "Outros",
            limit:
              typeof budget.limit === "string"
                ? Number.parseFloat(budget.limit)
                : typeof budget.limit === "number"
                  ? budget.limit
                  : 0,
            spent:
              typeof budget.spent === "string"
                ? Number.parseFloat(budget.spent)
                : typeof budget.spent === "number"
                  ? budget.spent
                  : 0,
            period: budget.period || "monthly",
          })
        }
      } catch (error) {
        console.error(`Error processing budget ${id}:`, error)
      }
    }

    return budgets
  } catch (error) {
    console.error("Error getting all budgets:", error)
    return []
  }
}

export async function getBudget(id: string): Promise<Budget | null> {
  try {
    // Obter campos específicos do orçamento
    const budget = await getHashFields(`budget:${id}`, ["id", "category", "limit", "spent", "period"])

    // Se o objeto estiver vazio, retornar null
    if (Object.keys(budget).length === 0) {
      return null
    }

    // Criar um objeto de orçamento com valores padrão
    return {
      id: budget.id || id,
      category: budget.category || "Outros",
      limit:
        typeof budget.limit === "string"
          ? Number.parseFloat(budget.limit)
          : typeof budget.limit === "number"
            ? budget.limit
            : 0,
      spent:
        typeof budget.spent === "string"
          ? Number.parseFloat(budget.spent)
          : typeof budget.spent === "number"
            ? budget.spent
            : 0,
      period: budget.period || "monthly",
    }
  } catch (error) {
    console.error(`Error getting budget ${id}:`, error)
    return null
  }
}

export async function getBudgetByCategory(category: string): Promise<Budget | null> {
  try {
    // Obter IDs de orçamentos
    const budgetIds = await safeSmembers("budgets")

    if (budgetIds.length === 0) {
      return null
    }

    // Buscar cada orçamento e verificar a categoria
    for (const id of budgetIds) {
      try {
        // Obter campos específicos do orçamento
        const budget = await getHashFields(`budget:${id}`, ["id", "category", "limit", "spent", "period"])

        // Se o objeto não estiver vazio e a categoria corresponder
        if (Object.keys(budget).length > 0 && budget.category === category) {
          // Criar um objeto de orçamento com valores padrão
          return {
            id: budget.id || id,
            category: budget.category,
            limit:
              typeof budget.limit === "string"
                ? Number.parseFloat(budget.limit)
                : typeof budget.limit === "number"
                  ? budget.limit
                  : 0,
            spent:
              typeof budget.spent === "string"
                ? Number.parseFloat(budget.spent)
                : typeof budget.spent === "number"
                  ? budget.spent
                  : 0,
            period: budget.period || "monthly",
          }
        }
      } catch (error) {
        console.error(`Error processing budget ${id} for category ${category}:`, error)
      }
    }

    return null
  } catch (error) {
    console.error(`Error getting budget by category ${category}:`, error)
    return null
  }
}

export async function createBudget(budget: Omit<Budget, "id">): Promise<Budget> {
  try {
    const id = crypto.randomUUID()

    const newBudget = {
      ...budget,
      id,
      limit: Number(budget.limit),
      spent: Number(budget.spent || 0),
    }

    // Armazenar cada campo individualmente
    for (const [key, value] of Object.entries(newBudget)) {
      await redis.hset(`budget:${id}`, key, value)
    }

    await redis.sadd("budgets", id)

    return newBudget
  } catch (error) {
    console.error("Error creating budget:", error)
    throw error
  }
}

export async function updateBudget(id: string, data: Partial<Budget>): Promise<Budget | null> {
  try {
    const budget = await getBudget(id)

    if (!budget) return null

    const updatedBudget = {
      ...budget,
      ...data,
      limit: data.limit ? Number(data.limit) : budget.limit,
      spent: data.spent !== undefined ? Number(data.spent) : budget.spent,
    }

    // Atualizar cada campo individualmente
    for (const [key, value] of Object.entries(updatedBudget)) {
      await redis.hset(`budget:${id}`, key, value)
    }

    return updatedBudget
  } catch (error) {
    console.error(`Error updating budget ${id}:`, error)
    return null
  }
}

export async function updateBudgetSpent(category: string, amount: number): Promise<Budget | null> {
  try {
    const budget = await getBudgetByCategory(category)

    if (!budget) return null

    const updatedBudget = {
      ...budget,
      spent: Number(budget.spent) + amount,
    }

    // Atualizar cada campo individualmente
    for (const [key, value] of Object.entries(updatedBudget)) {
      await redis.hset(`budget:${budget.id}`, key, value)
    }

    return updatedBudget
  } catch (error) {
    console.error(`Error updating budget spent for category ${category}:`, error)
    return null
  }
}

export async function deleteBudget(id: string): Promise<boolean> {
  try {
    // Verificar se o orçamento existe
    const budget = await getBudget(id)
    if (!budget) return false

    await redis.del(`budget:${id}`)
    await redis.srem("budgets", id)

    return true
  } catch (error) {
    console.error(`Error deleting budget ${id}:`, error)
    return false
  }
}

// Funções auxiliares para categorias
export async function getAllCategories(): Promise<Category[]> {
  try {
    // Obter IDs de categorias
    const categoryIds = await safeSmembers("categories")

    if (categoryIds.length === 0) {
      return []
    }

    // Buscar cada categoria individualmente
    const categories: Category[] = []
    for (const id of categoryIds) {
      try {
        // Obter campos específicos da categoria
        const category = await getHashFields(`category:${id}`, ["id", "name", "type"])

        // Se o objeto não estiver vazio, adicionar à lista
        if (Object.keys(category).length > 0) {
          categories.push({
            id: category.id || id,
            name: category.name || "Outros",
            type: category.type || "both",
          } as Category)
        }
      } catch (error) {
        console.error(`Error processing category ${id}:`, error)
      }
    }

    return categories
  } catch (error) {
    console.error("Error getting all categories:", error)
    return []
  }
}

export async function createCategory(category: Omit<Category, "id">): Promise<Category> {
  try {
    const id = crypto.randomUUID()

    const newCategory = {
      ...category,
      id,
    }

    // Armazenar cada campo individualmente
    for (const [key, value] of Object.entries(newCategory)) {
      await redis.hset(`category:${id}`, key, value)
    }

    await redis.sadd("categories", id)

    return newCategory
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}

// Função para inicializar dados padrão
export async function initializeDefaultData() {
  try {
    // Verificar se já existem categorias
    const existingCategories = await getAllCategories()

    if (existingCategories.length === 0) {
      console.log("Initializing default data...")

      // Criar categorias padrão
      const defaultCategories = [
        { name: "Alimentação", type: "expense" as const },
        { name: "Moradia", type: "expense" as const },
        { name: "Transporte", type: "expense" as const },
        { name: "Utilidades", type: "expense" as const },
        { name: "Lazer", type: "expense" as const },
        { name: "Saúde", type: "expense" as const },
        { name: "Educação", type: "expense" as const },
        { name: "Compras", type: "expense" as const },
        { name: "Salário", type: "income" as const },
        { name: "Freelance", type: "income" as const },
        { name: "Investimentos", type: "income" as const },
        { name: "Outros", type: "both" as const },
      ]

      for (const category of defaultCategories) {
        await createCategory(category)
      }

      // Criar orçamentos padrão
      const defaultBudgets = [
        { category: "Alimentação", limit: 600, spent: 450, period: "monthly" },
        { category: "Moradia", limit: 800, spent: 800, period: "monthly" },
        { category: "Transporte", limit: 300, spent: 200, period: "monthly" },
        { category: "Utilidades", limit: 400, spent: 280, period: "monthly" },
        { category: "Lazer", limit: 200, spent: 200, period: "monthly" },
        { category: "Compras", limit: 300, spent: 150, period: "monthly" },
      ]

      for (const budget of defaultBudgets) {
        // Garantir que o orçamento tenha a propriedade 'category'
        const correctedBudget = {
          category: budget.category || (budget as any).name || "Outros",
          limit: budget.limit,
          spent: budget.spent,
          period: budget.period,
        }
        await createBudget(correctedBudget)
      }

      // Criar transações de exemplo
      const defaultTransactions = [
        {
          description: "Supermercado",
          amount: 150,
          type: "expense" as const,
          category: "Alimentação",
          date: "2025-03-15",
          notes: "Compras da semana",
        },
        { description: "Salário", amount: 3200, type: "income" as const, category: "Salário", date: "2025-03-10" },
        { description: "Aluguel", amount: 800, type: "expense" as const, category: "Moradia", date: "2025-03-05" },
        { description: "Freelance", amount: 1500, type: "income" as const, category: "Freelance", date: "2025-03-03" },
        {
          description: "Restaurante",
          amount: 120,
          type: "expense" as const,
          category: "Alimentação",
          date: "2025-02-28",
        },
        {
          description: "Conta de Luz",
          amount: 180,
          type: "expense" as const,
          category: "Utilidades",
          date: "2025-02-25",
        },
        { description: "Internet", amount: 100, type: "expense" as const, category: "Utilidades", date: "2025-02-20" },
        {
          description: "Supermercado",
          amount: 180,
          type: "expense" as const,
          category: "Alimentação",
          date: "2025-02-15",
        },
        { description: "Salário", amount: 3200, type: "income" as const, category: "Salário", date: "2025-02-10" },
        { description: "Aluguel", amount: 800, type: "expense" as const, category: "Moradia", date: "2025-02-05" },
      ]

      for (const transaction of defaultTransactions) {
        await createTransaction(transaction)
      }

      console.log("Default data initialized successfully!")
    }
  } catch (error) {
    console.error("Error initializing default data:", error)
  }
}

