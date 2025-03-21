import Link from "next/link"
import { ArrowDown, ArrowUp, Calendar, Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllTransactions, getAllBudgets } from "@/lib/redis"
import { initializeData } from "@/app/actions"

export default async function ReportsPage() {
  // Inicializar dados padrão se necessário
  await initializeData()

  // Buscar dados do Redis
  const transactions = await getAllTransactions()
  const budgets = await getAllBudgets()

  // Calcular totais
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

  // Agrupar despesas por categoria
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>,
    )

  // Ordenar categorias por valor
  const sortedCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold md:text-2xl">Relatórios</h1>
          <div className="flex items-center gap-2">
            <Select defaultValue="march">
              <SelectTrigger className="w-[180px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="march">Março 2025</SelectItem>
                <SelectItem value="february">Fevereiro 2025</SelectItem>
                <SelectItem value="january">Janeiro 2025</SelectItem>
                <SelectItem value="q1">1º Trimestre 2025</SelectItem>
                <SelectItem value="2025">Ano 2025</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <div className={`rounded-full p-1 ${balance >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                {balance >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? "text-green-500" : "text-red-500"}`}>
                R$ {balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <ArrowUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total de entradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <ArrowDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total de saídas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Economia</CardTitle>
              <div className="rounded-full bg-blue-100 p-1">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Economia / Receita</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Receitas vs Despesas</CardTitle>
                  <CardDescription>Comparação mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full bg-muted/20 rounded-md flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="mb-4 flex justify-center gap-8">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-green-500"></div>
                          <span>Receitas: R$ {totalIncome.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-red-500"></div>
                          <span>Despesas: R$ {totalExpenses.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex h-40 items-end justify-center gap-16">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-24 bg-green-500 rounded-t-md"
                            style={{ height: `${(totalIncome / Math.max(totalIncome, totalExpenses)) * 150}px` }}
                          ></div>
                          <span className="mt-2">Receitas</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div
                            className="w-24 bg-red-500 rounded-t-md"
                            style={{ height: `${(totalExpenses / Math.max(totalIncome, totalExpenses)) * 150}px` }}
                          ></div>
                          <span className="mt-2">Despesas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Principais Despesas</CardTitle>
                  <CardDescription>Top 5 categorias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sortedCategories.map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary"></div>
                          <span>{category}</span>
                        </div>
                        <div className="font-medium">R$ {amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição de gastos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {Object.entries(expensesByCategory).map(([category, amount]) => {
                    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            R$ {amount.toFixed(2)} ({percentage.toFixed(1)}%)
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendências Mensais</CardTitle>
                <CardDescription>Evolução financeira</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full bg-muted/20 rounded-md flex items-center justify-center text-muted-foreground">
                  Gráfico de tendências mensais
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

