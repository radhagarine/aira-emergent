'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, CreditCard, DollarSign, TrendingUp, Clock, CheckCircle, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { toast } from 'sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Transaction {
  id: string
  date: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  status: 'completed' | 'pending' | 'failed'
}

export default function FundsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [balance, setBalance] = useState(0)
  const [balanceINR, setBalanceINR] = useState(0)
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false)
  const [showAddCardDialog, setShowAddCardDialog] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'INR'>('USD')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch wallet balance and transactions
  const fetchWalletData = async () => {
    if (!user) {
      // If the user session isn't ready yet, don't block the UI
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch wallet balance
      const walletResponse = await fetch('/api/wallet/balance', {
        credentials: 'include',
      })
      if (walletResponse.ok) {
        const walletData = await walletResponse.json()
        setBalance(walletData.balance_usd || 0)
        setBalanceINR(walletData.balance_inr || 0)
      }

      // Fetch transactions
      const transactionsResponse = await fetch('/api/wallet/transactions', {
        credentials: 'include',
      })
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      toast.error('Failed to load wallet data')
    } finally {
      setLoading(false)
    }
  }

  // Load wallet data on mount
  useEffect(() => {
    fetchWalletData()
  }, [user])

  // Handle payment success/cancel from URL params
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')

    if (success === 'true' && sessionId) {
      toast.success('Payment Successful!', {
        description: 'Your wallet has been topped up successfully.',
      })
      // Refresh wallet data
      fetchWalletData()
      // Clear URL params
      router.replace('/dashboard/funds')
    }

    if (canceled === 'true') {
      toast.error('Payment Canceled', {
        description: 'Your payment was canceled. No charges were made.',
      })
      // Clear URL params
      router.replace('/dashboard/funds')
    }
  }, [searchParams, router])

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
    setShowAddFundsDialog(true)
  }

  const handleAddCard = () => {
    setShowAddCardDialog(true)
  }

  const handleCardInputChange = (field: string, value: string) => {
    // Format card number
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
      if (value.length > 19) return
    }
    // Format expiry date
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '')
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4)
      }
      if (value.length > 5) return
    }
    // Format CVV
    if (field === 'cvv' && value.length > 3) return

    setCardDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveCard = () => {
    console.log('Card saved:', cardDetails)
    setShowAddCardDialog(false)
    setCardDetails({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' })
  }

  const handleConfirmPayment = async () => {
    console.log('=== Payment Flow Started ===')
    console.log('User:', user?.id)
    console.log('Selected Amount:', selectedAmount)
    console.log('Custom Amount:', customAmount)
    console.log('Currency:', selectedCurrency)

    if (!user) {
      console.error('No user found - authentication required')
      toast.error('Authentication Required', {
        description: 'Please sign in to add funds.',
      })
      return
    }

    const amount = selectedAmount || parseFloat(customAmount)

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount)
      toast.error('Invalid Amount', {
        description: 'Please enter a valid amount.',
      })
      return
    }

    console.log('Processing payment for amount:', amount, selectedCurrency)
    setIsProcessing(true)

    try {
      console.log('Calling API: /api/payment/create-checkout-session')

      // Add timeout to prevent infinite hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: selectedCurrency,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log('API Response Status:', response.status)

      const data = await response.json()
      console.log('API Response Data:', data)

      if (!response.ok) {
        console.error('API Error:', data)
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('Redirecting to Stripe:', data.url)
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('=== Payment Error ===')
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
      console.error('Error message:', error)

      let errorMessage = 'Failed to process payment'

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - please try again'
        } else {
          errorMessage = error.message
        }
      }

      toast.error('Payment Error', {
        description: errorMessage,
      })
      setIsProcessing(false)
      setShowAddFundsDialog(false)
      setSelectedAmount(null)
      setCustomAmount('')
    }
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

      {/* Add Funds Dialog */}
      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Select an amount or enter a custom amount to add to your wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Amount</Label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 25, 50, 100, 250, 500].map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    onClick={() => {
                      setSelectedAmount(amount)
                      setCustomAmount('')
                    }}
                    className={selectedAmount === amount ? "bg-red-800 hover:bg-red-900" : ""}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom Amount</Label>
              <Input
                id="custom-amount"
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setSelectedAmount(null)
                }}
                min="1"
                step="0.01"
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={selectedCurrency === 'USD' ? 'default' : 'outline'}
                  onClick={() => setSelectedCurrency('USD')}
                  className={selectedCurrency === 'USD' ? 'bg-red-800 hover:bg-red-900' : ''}
                  disabled={isProcessing}
                >
                  USD ($)
                </Button>
                <Button
                  type="button"
                  variant={selectedCurrency === 'INR' ? 'default' : 'outline'}
                  onClick={() => setSelectedCurrency('INR')}
                  className={selectedCurrency === 'INR' ? 'bg-red-800 hover:bg-red-900' : ''}
                  disabled={isProcessing}
                >
                  INR (₹)
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
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
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowAddFundsDialog(false)
                  handleAddCard()
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Card
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddFundsDialog(false)
                setSelectedAmount(null)
                setCustomAmount('')
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-900 text-white"
              onClick={handleConfirmPayment}
              disabled={(!selectedAmount && !customAmount) || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Enter your card details to add a new payment method
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                maxLength={19}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input
                id="card-name"
                placeholder="John Doe"
                value={cardDetails.cardName}
                onChange={(e) => handleCardInputChange('cardName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  placeholder="MM/YY"
                  value={cardDetails.expiryDate}
                  onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                  maxLength={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCardDialog(false)
                setCardDetails({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-800 hover:bg-red-900 text-white"
              onClick={handleSaveCard}
              disabled={!cardDetails.cardNumber || !cardDetails.cardName || !cardDetails.expiryDate || !cardDetails.cvv}
            >
              Save Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
