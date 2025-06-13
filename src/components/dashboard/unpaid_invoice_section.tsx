import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "../ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useEffect, useState } from "react"
import { fetchInvoicesFromSupabase } from "@/data/supabase_data_source"
import type { SupabaseInvoiceRaw } from "@/data/types";
import { formatToVND } from "@/utils/currency_utils";
import { Skeleton } from "@/components/ui/skeleton";
  
export function UnpaidInvoiceSection() {
  const [loading, setLoading] = useState(true)

    const [unpaidInvoices, setUnpaidInvoices] = useState<SupabaseInvoiceRaw[]>([]);
    useEffect(() => {
      async function fetchUnpaidInvoices() {
        const allInvoices = await fetchInvoicesFromSupabase();
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const filtered = allInvoices.filter(inv => {
          const issue = new Date(inv.issue_date);
          return inv.status !== 'paid' && issue.getMonth() === thisMonth && issue.getFullYear() === thisYear;
        });
        setUnpaidInvoices(filtered);
        setLoading(false)
      }
      fetchUnpaidInvoices();
    }, [])


    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Unpaid Invoices</CardTitle>
          <CardDescription>Unpaid invoices for this month</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {loading ? (
            <Skeleton className="h-full w-full" />
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Room</TableHead>
                <TableHead>Building</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unpaidInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.apartments?.unit_number}</TableCell>
                  <TableCell>{invoice.buildings?.name.split(' ').map(word => word[0]).join('')}</TableCell>
                  <TableCell className="text-right">{formatToVND(invoice.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    )
}
  