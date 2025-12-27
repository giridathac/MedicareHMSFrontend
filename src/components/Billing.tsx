import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DollarSign, Search, Plus, FileText, CreditCard, Receipt, Calendar, User, Phone } from 'lucide-react';

export function Billing() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const [bills, setBills] = useState([
    {
      id: 1,
      patientId: 'P001',
      patientName: 'John Doe',
      patientPhone: '+1234567890',
      admissionId: 'ADM001',
      billDate: '2024-01-15',
      totalAmount: 15000,
      paidAmount: 10000,
      pendingAmount: 5000,
      status: 'Partial',
      items: [
        { description: 'Room Charges', amount: 8000, date: '2024-01-10' },
        { description: 'Doctor Consultation', amount: 3000, date: '2024-01-11' },
        { description: 'Laboratory Tests', amount: 2000, date: '2024-01-12' },
        { description: 'Medicines', amount: 2000, date: '2024-01-13' }
      ]
    },
    {
      id: 2,
      patientId: 'P002',
      patientName: 'Jane Smith',
      patientPhone: '+1234567891',
      admissionId: 'ADM002',
      billDate: '2024-01-14',
      totalAmount: 25000,
      paidAmount: 25000,
      pendingAmount: 0,
      status: 'Paid',
      items: [
        { description: 'Surgery Charges', amount: 20000, date: '2024-01-10' },
        { description: 'Anesthesia', amount: 3000, date: '2024-01-10' },
        { description: 'Post-op Care', amount: 2000, date: '2024-01-12' }
      ]
    }
  ]);

  const filteredBills = bills.filter(bill =>
    bill.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.admissionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-scrollable-container">
        <div className="dashboard-header-section">
          <div className="dashboard-header-content">
            <div>
              <h1 className="dashboard-header">Billing Management</h1>
              <p className="dashboard-subheader">Manage patient bills and payments</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  New Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Bill</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="text-center py-8 text-gray-500">
                    Bill creation form will be implemented here
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Total Bills</p>
                <FileText className="size-5 text-blue-600" />
              </div>
              <h3 className="text-gray-900">{bills.length}</h3>
              <p className="text-xs text-gray-500">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <DollarSign className="size-5 text-green-600" />
              </div>
              <h3 className="text-gray-900">₹{bills.reduce((sum, bill) => sum + bill.totalAmount, 0).toLocaleString()}</h3>
              <p className="text-xs text-gray-500">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Paid Amount</p>
                <CreditCard className="size-5 text-purple-600" />
              </div>
              <h3 className="text-gray-900">₹{bills.reduce((sum, bill) => sum + bill.paidAmount, 0).toLocaleString()}</h3>
              <p className="text-xs text-gray-500">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Pending Amount</p>
                <Receipt className="size-5 text-orange-600" />
              </div>
              <h3 className="text-gray-900">₹{bills.reduce((sum, bill) => sum + bill.pendingAmount, 0).toLocaleString()}</h3>
              <p className="text-xs text-gray-500">Outstanding</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="dashboard-search-card">
          <CardContent className="dashboard-search-card-content">
            <div className="dashboard-search-input-wrapper">
              <Search className="dashboard-search-icon" />
              <Input
                placeholder="Search by patient name, ID, or admission ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dashboard-search-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bills List */}
        <Tabs defaultValue="all" className="dashboard-tabs">
          <TabsList>
            <TabsTrigger value="all">All Bills ({filteredBills.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({filteredBills.filter(b => b.status === 'Paid').length})</TabsTrigger>
            <TabsTrigger value="partial">Partial ({filteredBills.filter(b => b.status === 'Partial').length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({filteredBills.filter(b => b.status === 'Pending').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <BillsTable bills={filteredBills} />
          </TabsContent>
          <TabsContent value="paid">
            <BillsTable bills={filteredBills.filter(b => b.status === 'Paid')} />
          </TabsContent>
          <TabsContent value="partial">
            <BillsTable bills={filteredBills.filter(b => b.status === 'Partial')} />
          </TabsContent>
          <TabsContent value="pending">
            <BillsTable bills={filteredBills.filter(b => b.status === 'Pending')} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BillsTable({ bills }: { bills: any[] }) {
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const handleViewDetails = (bill: any) => {
    setSelectedBill(bill);
    setIsDetailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Card className="dashboard-table-card">
        <CardContent className="dashboard-table-card-content">
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr className="dashboard-table-header-row">
                  <th className="dashboard-table-header-cell">Bill ID</th>
                  <th className="dashboard-table-header-cell">Patient</th>
                  <th className="dashboard-table-header-cell">Admission ID</th>
                  <th className="dashboard-table-header-cell">Bill Date</th>
                  <th className="dashboard-table-header-cell">Total Amount</th>
                  <th className="dashboard-table-header-cell">Paid Amount</th>
                  <th className="dashboard-table-header-cell">Pending Amount</th>
                  <th className="dashboard-table-header-cell">Status</th>
                  <th className="dashboard-table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="dashboard-table-empty-cell">
                      No bills found
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="dashboard-table-body-row">
                      <td className="dashboard-table-body-cell dashboard-table-body-cell-primary">
                        #{bill.id}
                      </td>
                      <td className="dashboard-table-body-cell">
                        <div>
                          <div className="font-medium text-gray-900">{bill.patientName}</div>
                          <div className="text-sm text-gray-500">{bill.patientId}</div>
                        </div>
                      </td>
                      <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                        {bill.admissionId}
                      </td>
                      <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                        {bill.billDate}
                      </td>
                      <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                        ₹{bill.totalAmount.toLocaleString()}
                      </td>
                      <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                        ₹{bill.paidAmount.toLocaleString()}
                      </td>
                      <td className="dashboard-table-body-cell dashboard-table-body-cell-secondary">
                        ₹{bill.pendingAmount.toLocaleString()}
                      </td>
                      <td className="dashboard-table-body-cell">
                        <Badge className={getStatusColor(bill.status)}>
                          {bill.status}
                        </Badge>
                      </td>
                      <td className="dashboard-table-body-cell">
                        <div className="dashboard-actions-container">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(bill)}
                          >
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details - #{selectedBill?.id}</DialogTitle>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6 py-4">
              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Patient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Patient Name</Label>
                      <p className="text-gray-900 font-medium">{selectedBill.patientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Patient ID</Label>
                      <p className="text-gray-900 font-medium">{selectedBill.patientId}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Phone</Label>
                      <p className="text-gray-900 font-medium">{selectedBill.patientPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Admission ID</Label>
                      <p className="text-gray-900 font-medium">{selectedBill.admissionId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bill Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bill Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Bill Date</Label>
                      <p className="text-gray-900 font-medium">{selectedBill.billDate}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Total Amount</Label>
                      <p className="text-gray-900 font-medium">₹{selectedBill.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Paid Amount</Label>
                      <p className="text-gray-900 font-medium">₹{selectedBill.paidAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Pending Amount</Label>
                      <p className="text-gray-900 font-medium">₹{selectedBill.pendingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm text-gray-500">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedBill.status)}>
                        {selectedBill.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bill Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bill Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700">Description</th>
                          <th className="text-left py-3 px-4 text-gray-700">Date</th>
                          <th className="text-right py-3 px-4 text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 text-gray-900">{item.description}</td>
                            <td className="py-3 px-4 text-gray-600">{item.date}</td>
                            <td className="py-3 px-4 text-gray-900 text-right">₹{item.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 font-semibold">
                          <td className="py-3 px-4 text-gray-900" colSpan={2}>Total</td>
                          <td className="py-3 px-4 text-gray-900 text-right">₹{selectedBill.totalAmount.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
