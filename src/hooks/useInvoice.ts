import { useQuery } from '@tanstack/react-query';
import { getInvoice } from '@/lib/api/pos';

export function useInvoice(tableRef: string) {
  return useQuery({ queryKey: ['invoice', tableRef], queryFn: () => getInvoice(tableRef) });
}
