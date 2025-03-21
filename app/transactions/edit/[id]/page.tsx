import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAllCategories, getTransaction } from "@/lib/redis"
import { initializeData } from "@/app/actions"
import { TransactionForm } from "@/components/transaction-form"

interface EditTransactionPageProps {
  params: {
    id: string
  }
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  // Inicializar dados padrão se necessário
  await initializeData()

  // Buscar transação e categorias do Redis
  const transaction = await getTransaction(params.id)
  const categories = await getAllCategories()

  if (!transaction) {
    notFound()
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span>FinançasPessoais</span>
        </Link>
        <nav className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/transactions">Transações</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/budgets">Orçamentos</Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold md:text-2xl">Editar Transação</h1>
        </div>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Detalhes da Transação</CardTitle>
            <CardDescription>Edite os detalhes da transação.</CardDescription>
          </CardHeader>
          <TransactionForm categories={categories} transaction={transaction} isEditing={true} />
        </Card>
      </main>
    </div>
  )
}

