export type Screen = 'start' | 'scan' | 'payment' | 'paymentSuccess' | 'staffHelp';

export type RecognitionStatus = 'waiting' | 'scanning' | 'success' | 'partial' | 'error';

export type PaymentStatus = 'idle' | 'processing';

export type StaffHelpReason = 'recognition_error' | 'payment_problem' | 'manual_request' | null;

export type ReceiptChoice = 'print' | 'digital' | null;

export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PredictionItem {
  label: string;
  quantity: number;
  confidence: number;
}

export interface PredictionDebugInfo {
  filename: string | null;
  contentType: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  imageFormat: string | null;
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
