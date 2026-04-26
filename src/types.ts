export type Screen = 'start' | 'scan' | 'payment' | 'paymentSuccess' | 'staffHelp';

export type RecognitionStatus = 'waiting' | 'scanning' | 'success' | 'partial' | 'error';

export type PaymentStatus = 'idle' | 'processing';

export type StaffHelpReason = 'recognition_error' | 'payment_problem' | 'manual_request' | null;

export type ReceiptChoice = 'print' | 'digital' | null;

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PredictionItem {
  objectId: number;
  label: string;
  name: string;
  price: number;
  quantity: number;
  confidence: number;
}

export interface PredictionDebugInfo {
  runId: number | null;
  filename: string | null;
  contentType: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  imageFormat: string | null;
  algorithmName: string | null;
  algorithmVersion: string | null;
}

export interface PredictionResponse {
  detected: boolean;
  label: string | null;
  confidence: number;
  message: string;
  items: PredictionItem[];
  unresolvedCount: number;
  debug: PredictionDebugInfo | null;
}
