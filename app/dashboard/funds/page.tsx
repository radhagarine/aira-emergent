'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: string
  date: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
}

export default function FundsPage() {
  const [balance, setBalance] = useState(0.96)
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2025-09-23T10:30:00Z',
      type: 'credit',
      amount: 50.00,
      description: 'Account top-up via Credit Card',
      status: 'completed'
    },
    {
      id: '2',
      date: '2025-09-22T15:45:00Z',
      type: 'debit',
      amount: 5.00,
      description: 'Phone number purchase - +1 (555) 123-4567',
      status: 'completed'
    },
    {
      id: '3',
      date: '2025-09-21T09:20:00Z',
      type: 'debit',
      amount: 44.04,
      description: 'Monthly phone number rental charges',
      status: 'completed'
    }
  ])
  const [loading, setLoading] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">Completed</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleAddFunds = () => {
    // TODO: Implement payment gateway integration
    console.log('Add funds clicked')
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet & Funds</h1>
          <p className="text-muted-foreground">
            Manage your account balance and transaction history
          </p>
        </div>
        <Button
          onClick={handleAddFunds}
          className="bg-red-800 hover:bg-red-900 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Funds
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">${balance.toFixed(2)}</div>
            <p className="text-xs text-red-700 dark:text-red-300">
              Ready to use
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$49.04</div>
            <p className="text-xs text-muted-foreground">
              Total spent
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Top-up</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$50.00</div>
            <p className="text-xs text-muted-foreground">
              Yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Transaction History</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Recent account activity and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-700">
                  <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Date</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Description</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Amount</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow className="border-b border-gray-200 dark:border-gray-700">
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground dark:text-gray-400">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <TableCell className="text-gray-700 dark:text-gray-300">
                        {formatDate(transaction.date)}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell className={`font-semibold ${
                        transaction.type === 'credit'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Add Funds</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Top up your account balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="text-sm" onClick={handleAddFunds}>$10</Button>
              <Button variant="outline" className="text-sm" onClick={handleAddFunds}>$25</Button>
              <Button variant="outline" className="text-sm" onClick={handleAddFunds}>$50</Button>
            </div>
            <Button
              className="w-full bg-red-800 hover:bg-red-900 text-white"
              onClick={handleAddFunds}
            >
              Custom Amount
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-gray-100">Payment Methods</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Manage your payment options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">•••• •••• •••• 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
              <Badge variant="secondary">Primary</Badge>
            </div>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}