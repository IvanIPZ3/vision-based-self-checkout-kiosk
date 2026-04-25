import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { mockProducts } from './data/mockProducts';
import { PaymentScreen } from './screens/PaymentScreen';
import { ScanScreen } from './screens/ScanScreen';
import { StaffHelpScreen } from './screens/StaffHelpScreen';
import { StartScreen } from './screens/StartScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { sendFrameForPrediction } from './services/predictionApi';
import type {
  CartItem,
  PaymentStatus,
  PredictionItem,
  PredictionResponse,
  ReceiptChoice,
  RecognitionStatus,
  Screen,
  StaffHelpReason,
} from './types';
import { captureVideoFrame } from './utils/captureVideoFrame';

type NonHelpScreen = Exclude<Screen, 'staffHelp'>;

const productMap = new Map(mockProducts.map((product) => [product.id, product]));

const clearTimeoutIfPresent = (timeoutRef: MutableRefObject<number | null>) => {
  if (timeoutRef.current) {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
};

const buildErrorPrediction = (message: string): PredictionResponse => ({
  detected: false,
  label: null,
  confidence: 0,
  message,
  items: [],
  unresolvedCount: 0,
  debug: null,
});

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('start');
  const [returnScreen, setReturnScreen] = useState<NonHelpScreen>('start');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>('waiting');
  const [lastPrediction, setLastPrediction] = useState<PredictionResponse | null>(null);
  const [staffHelpReason, setStaffHelpReason] = useState<StaffHelpReason>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [receiptChoice, setReceiptChoice] = useState<ReceiptChoice>(null);

  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionResetTimeoutRef = useRef<number | null>(null);
  const paymentTimeoutRef = useRef<number | null>(null);

  const totalAmount = useMemo(
    () => cartItems.reduce((accumulator, item) => accumulator + item.price * item.quantity, 0),
    [cartItems],
  );

  useEffect(() => {
    return () => {
      clearTimeoutIfPresent(recognitionResetTimeoutRef);
      clearTimeoutIfPresent(paymentTimeoutRef);
    };
  }, []);

  const clearRecognitionTimers = () => {
    clearTimeoutIfPresent(recognitionResetTimeoutRef);
  };

  const handleOpenStaffHelp = (reason: Exclude<StaffHelpReason, null>) => {
    clearRecognitionTimers();

    if (currentScreen === 'payment' && paymentStatus === 'processing') {
      clearTimeoutIfPresent(paymentTimeoutRef);
      setPaymentStatus('idle');
    }

    if (currentScreen !== 'staffHelp') {
      setReturnScreen(currentScreen as NonHelpScreen);
    }

    setStaffHelpReason(reason);
    setCurrentScreen('staffHelp');
  };

  const handleBackFromStaffHelp = () => {
    setCurrentScreen(returnScreen);
  };

  const handleStartShopping = () => {
    setCurrentScreen('scan');
    setRecognitionStatus('waiting');
    setLastPrediction(null);
    setReceiptChoice(null);
  };

  const normalizePredictionItems = (prediction: PredictionResponse): PredictionItem[] => {
    if (prediction.items.length > 0) {
      return prediction.items;
    }

    if (prediction.label) {
      return [
        {
          label: prediction.label,
          quantity: 1,
          confidence: prediction.confidence,
        },
      ];
    }

    return [];
  };

  const mergeRecognizedItemsIntoCart = (predictionItems: PredictionItem[]) => {
    setCartItems((previousItems) => {
      const nextItems = previousItems.map((item) => ({ ...item }));

      predictionItems.forEach((predictionItem) => {
        const product = productMap.get(predictionItem.label);
        if (!product) {
          return;
        }

        const existingItem = nextItems.find((item) => item.productId === product.id);
        if (existingItem) {
          existingItem.quantity += predictionItem.quantity;
          return;
        }

        nextItems.push({
          id: product.id,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: predictionItem.quantity,
        });
      });

      return nextItems;
    });
  };

  const handleStartScan = async () => {
    if (recognitionStatus === 'scanning') {
      return;
    }

    clearRecognitionTimers();
    setRecognitionStatus('scanning');
    setLastPrediction(null);

    try {
      const videoElement = cameraVideoRef.current;
      if (!videoElement) {
        throw new Error('Camera preview is unavailable.');
      }

      const frameBlob = await captureVideoFrame(videoElement);
      const prediction = await sendFrameForPrediction(frameBlob);
      const predictionItems = normalizePredictionItems(prediction);

      if (predictionItems.length > 0) {
        mergeRecognizedItemsIntoCart(predictionItems);
      }

      setLastPrediction(prediction);

      if (!prediction.detected) {
        setRecognitionStatus('error');
      } else if (prediction.unresolvedCount > 0) {
        setRecognitionStatus('partial');
      } else {
        setRecognitionStatus('success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Prediction request failed.';
      setLastPrediction(buildErrorPrediction(message));
      setRecognitionStatus('error');
    }

    recognitionResetTimeoutRef.current = window.setTimeout(() => {
      setRecognitionStatus('waiting');
    }, 2600);
  };

  const handleDeleteSelectedItem = () => {
    if (!selectedItemId) {
      return;
    }

    setCartItems((previousItems) => previousItems.filter((item) => item.id !== selectedItemId));
    setSelectedItemId(null);
  };

  const handleClearCart = () => {
    setCartItems([]);
    setSelectedItemId(null);
    setLastPrediction(null);
    setRecognitionStatus('waiting');
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      return;
    }

    setCurrentScreen('payment');
    setPaymentStatus('idle');
  };

  const handlePayByCard = () => {
    setPaymentStatus('processing');
    clearTimeoutIfPresent(paymentTimeoutRef);

    paymentTimeoutRef.current = window.setTimeout(() => {
      setPaymentStatus('idle');
      setCurrentScreen('paymentSuccess');
    }, 2600);
  };

  const handleFinishCheckout = () => {
    clearRecognitionTimers();
    clearTimeoutIfPresent(paymentTimeoutRef);
    setCurrentScreen('start');
    setReturnScreen('start');
    setCartItems([]);
    setSelectedItemId(null);
    setRecognitionStatus('waiting');
    setLastPrediction(null);
    setStaffHelpReason(null);
    setPaymentStatus('idle');
    setReceiptChoice(null);
  };

  return (
    <main className="h-screen w-screen overflow-y-auto overflow-x-hidden p-3 text-slate-100 lg:p-5">
      {currentScreen === 'start' && (
        <StartScreen onStart={handleStartShopping} onRequestStaff={() => handleOpenStaffHelp('manual_request')} />
      )}

      {currentScreen === 'scan' && (
        <ScanScreen
          recognitionStatus={recognitionStatus}
          cartItems={cartItems}
          selectedItemId={selectedItemId}
          total={totalAmount}
          lastPrediction={lastPrediction}
          cameraVideoRef={cameraVideoRef}
          onSelectItem={setSelectedItemId}
          onDeleteSelected={handleDeleteSelectedItem}
          onClearCart={handleClearCart}
          onCheckout={handleProceedToPayment}
          onRequestStaff={handleOpenStaffHelp}
          onStartScan={handleStartScan}
        />
      )}

      {currentScreen === 'payment' && (
        <PaymentScreen
          total={totalAmount}
          paymentStatus={paymentStatus}
          onPayByCard={handlePayByCard}
          onBackToCart={() => setCurrentScreen('scan')}
          onRequestStaff={() => handleOpenStaffHelp('payment_problem')}
        />
      )}

      {currentScreen === 'paymentSuccess' && (
        <SuccessScreen
          total={totalAmount}
          receiptChoice={receiptChoice}
          onReceiptChoice={setReceiptChoice}
          onFinish={handleFinishCheckout}
        />
      )}

      {currentScreen === 'staffHelp' && <StaffHelpScreen reason={staffHelpReason} onBack={handleBackFromStaffHelp} />}
    </main>
  );
};

export default App;
