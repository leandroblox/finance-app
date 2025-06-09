import Link from "next/link"
import { ArrowUpRight, CreditCard, DollarSign, PieChart, Plus, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAllTransactions, getAllBudgets } from "@/lib/redis"
import { initializeData } from "@/app/actions"

export default async function Home() {
  try {
    // Inicializar dados padrão se necessário
    await initializeData()

    // Buscar dados do Redis com tratamento de erros
    let transactions = []
    let budgets = []

    try {
      transactions = await getAllTransactions()
    } catch (error) {
      console.error("Error fetching transactions:", error)
      transactions = []
    }

    try {
      budgets = await getAllBudgets()
    } catch (error) {
      console.error("Error fetching budgets:", error)
      budgets = []
    }

    // Calcular totais com verificações de segurança
    const totalIncome = transactions
      .filter((t) => t && t.type === "income")
      .reduce((sum, t) => sum + (typeof t.amount === "number" ? t.amount : 0), 0)

    const totalExpenses = transactions
      .filter((t) => t && t.type === "expense")
      .reduce((sum, t) => sum + (typeof t.amount === "number" ? t.amount : 0), 0)

    const balance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    // Agrupar despesas por categoria com verificações de segurança
    const expensesByCategory = transactions
      .filter((t) => t && t.type === "expense" && t.category)
      .reduce(
        (acc, t) => {
          const category = t.category || "Outros"
          acc[category] = (acc[category] || 0) + (typeof t.amount === "number" ? t.amount : 0)
          return acc
        },
        {} as Record<string, number>,
      )

    // Ordenar categorias por valor
    const sortedCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    // Obter transações recentes
    const recentTransactions = transactions.slice(0, 4)

    return (
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Wallet className="h-6 w-6" />
            <span>FinançasPessoais</span>
          </Link>
          <nav className="ml-auto flex gap-2">
            <Button asChild variant="outline" size="sm" id="nav-transactions">
              <Link href="/transactions">Transações</Link>
            </Button>
            <Button asChild variant="outline" size="sm" id="nav-budgets">
              <Link href="/budgets">Orçamentos</Link>
            </Button>
            <Button asChild variant="outline" size="sm" id="nav-reports">
              <Link href="/reports">Relatórios</Link>
            </Button>
            <Button asChild size="sm" id="nav-new-transaction">
              <Link href="/transactions/new">
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Link>
            </Button>
          </nav>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div id="dashboard-cards" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {balance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Taxa de economia: {savingsRate.toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalIncome.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total de entradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total de saídas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Economia</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
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
              <TabsTrigger value="transactions">Transações Recentes</TabsTrigger>
              <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Visão Geral Financeira</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-[200px] w-full bg-muted/20 rounded-md flex items-center justify-center text-muted-foreground">
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
                              style={{ height: `${(totalIncome / Math.max(totalIncome, totalExpenses, 1)) * 150}px` }}
                            ></div>
                            <span className="mt-2">Receitas</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div
                              className="w-24 bg-red-500 rounded-t-md"
                              style={{ height: `${(totalExpenses / Math.max(totalIncome, totalExpenses, 1)) * 150}px` }}
                            ></div>
                            <span className="mt-2">Despesas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Distribuição de Despesas</CardTitle>
                    <CardDescription>Como você está gastando seu dinheiro</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sortedCategories.map(([category, amount]) => {
                        const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                        return (
                          <div className="space-y-2" key={category}>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center">
                                <span className="h-4 w-4 rounded-full bg-primary mr-2" />
                                <span>{category}</span>
                              </div>
                              <div>R$ {amount.toFixed(2)}</div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                      {sortedCategories.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">Nenhuma despesa registrada.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                  <CardDescription>Você realizou {transactions.length} transações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="grid grid-cols-[1fr_100px] items-center gap-4 rounded-lg border p-4"
                      >
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <div
                          className={`text-right font-medium ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}
                        >
                          {transaction.type === "income" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {recentTransactions.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">Nenhuma transação encontrada.</div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/transactions">Ver todas as transações</Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="budgets" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Orçamentos Mensais</CardTitle>
                  <CardDescription>Acompanhe seus limites de gastos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {budgets.map((budget) => {
                    const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0
                    return (
                      <div className="space-y-2" key={budget.id}>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{budget.category}</div>
                          <div className="text-sm">
                            R$ {budget.spent.toFixed(2)} / R$ {budget.limit.toFixed(2)}
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                  {budgets.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">Nenhum orçamento encontrado.</div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/budgets">Gerenciar orçamentos</Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    )
  } catch (error) {
    console.error("Error rendering Home page:", error)

    // Renderizar uma página de erro simples
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Erro ao carregar dados</h1>
        <p className="text-muted-foreground mb-6">
          Ocorreu um erro ao carregar os dados da aplicação. Por favor, tente novamente mais tarde.
        </p>
        <Button asChild>
          <Link href="/">Tentar novamente</Link>
        </Button>
      </div>
    )
  }
}

