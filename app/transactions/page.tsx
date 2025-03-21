import Link from "next/link"
import { ArrowUpDown, ChevronDown, Filter, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAllTransactions } from "@/lib/redis"
import { initializeData } from "@/app/actions"
import { DeleteTransactionButton } from "@/components/delete-transaction-button"

export default async function TransactionsPage() {
  // Inicializar dados padrão se necessário
  await initializeData()

  // Buscar transações do Redis
  const transactions = await getAllTransactions()

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
            <Link href="/budgets">Orçamentos</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/reports">Relatórios</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold md:text-2xl">Transações</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Todas as Transações</CardTitle>
            <CardDescription>Gerencie suas transações financeiras.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Input placeholder="Buscar transações..." className="h-9 w-full sm:w-[300px]" />
                <Button variant="outline" size="sm" className="h-9 gap-1">
                  <Filter className="h-4 w-4" />
                  Filtrar
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="h-9 w-full sm:w-[150px]">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="march">
                  <SelectTrigger className="h-9 w-full sm:w-[150px]">
                    <SelectValue placeholder="Selecionar mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="march">Março 2025</SelectItem>
                    <SelectItem value="february">Fevereiro 2025</SelectItem>
                    <SelectItem value="january">Janeiro 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">
                      <Button variant="ghost" className="flex items-center gap-1 p-0">
                        Data
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {new Date(transaction.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell
                        className={`text-right ${transaction.type === "income" ? "text-green-500" : "text-red-500"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"}R$ {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/transactions/edit/${transaction.id}`}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-pencil"
                              >
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              </svg>
                            </Link>
                          </Button>
                          <DeleteTransactionButton id={transaction.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Nenhuma transação encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

