export interface ScanBatchItem {
  productId: string;
  quantity: number;
}

export interface ScanBatch {
  outcome: 'success' | 'partial' | 'error';
  recognizedItems: ScanBatchItem[];
  unresolvedCount: number;
}

export const mockScanBatches: ScanBatch[] = [
  {
    outcome: 'success',
    recognizedItems: [
      { productId: 'milk', quantity: 1 },
      { productId: 'bread', quantity: 1 },
      { productId: 'apples', quantity: 2 },
    ],
    unresolvedCount: 0,
  },
  {
    outcome: 'partial',
    recognizedItems: [
      { productId: 'milk', quantity: 1 },
      { productId: 'apples', quantity: 1 },
    ],
    unresolvedCount: 1,
  },
  {
    outcome: 'error',
    recognizedItems: [],
    unresolvedCount: 2,
  },
  {
    outcome: 'success',
    recognizedItems: [
      { productId: 'bread', quantity: 2 },
      { productId: 'milk', quantity: 1 },
    ],
    unresolvedCount: 0,
  },
];
