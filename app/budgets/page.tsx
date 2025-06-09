import Link from "next/link"
import { Edit, Plus, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllBudgets } from "@/lib/redis"
import { initializeData } from "@/app/actions"
import { DeleteBudgetButton } from "@/components/delete-budget-button"

export default async function BudgetsPage() {
  // Inicializar dados padrão se necessário
  await initializeData()

  // Buscar orçamentos do Redis
  const budgets = await getAllBudgets()

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
            <Link href="/reports">Relatórios</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/api/export/budgets">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/budgets/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold md:text-2xl">Orçamentos</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {budgets.map((budget) => {
            const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0
            const remaining = budget.limit - budget.spent
            return (
              <Card key={budget.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{budget.category}</CardTitle>
                  <CardDescription>
                    R$ {budget.spent.toFixed(2)} / R$ {budget.limit.toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={percentage} className="h-2" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <div>{percentage.toFixed(0)}% utilizado</div>
                    <div>Restante: R$ {remaining.toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {budgets.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="py-6 text-center text-muted-foreground">
                Nenhum orçamento encontrado. Crie seu primeiro orçamento!
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Todos os Orçamentos</CardTitle>
            <CardDescription>Gerencie seus limites de gastos mensais.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Gasto</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => {
                  const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0
                  const remaining = budget.limit - budget.spent
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.category}</TableCell>
                      <TableCell>R$ {budget.limit.toFixed(2)}</TableCell>
                      <TableCell>R$ {budget.spent.toFixed(2)}</TableCell>
                      <TableCell>R$ {remaining.toFixed(2)}</TableCell>
                      <TableCell className="w-[200px]">
                        <Progress value={percentage} className="h-2" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/budgets/edit/${budget.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteBudgetButton id={budget.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {budgets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum orçamento encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

