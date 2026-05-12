import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { PaymentScreen } from './screens/PaymentScreen';
import { ReferenceCaptureScreen } from './screens/ReferenceCaptureScreen';
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

const adminReferenceCapturePath = '/admin/reference-capture';

const getClientRoute = () => {
  const hashRoute = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (hashRoute) {
    return hashRoute;
  }

  if (window.location.pathname.endsWith(adminReferenceCapturePath)) {
    return adminReferenceCapturePath;
  }

  return '/';
};

const getScreenFromLocation = (): Screen => (getClientRoute() === adminReferenceCapturePath ? 'referenceCapture' : 'start');

const navigateTo = (path: string) => {
  const isGitHubPages = window.location.hostname.endsWith('github.io');

  if (isGitHubPages) {
    const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
    const nextUrl = path === '/' ? basePath : `${basePath}#${path}`;
    if (`${window.location.pathname}${window.location.hash}` !== nextUrl) {
      window.history.pushState({}, '', nextUrl);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    return;
  }

  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

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
  uncertainItems: [],
  unresolvedCount: 0,
  debug: null,
});

const isEmptyPlatformMessage = (message: string | null | undefined) =>
  typeof message === 'string' && message.startsWith('На платформі не виявлено товарів');

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(getScreenFromLocation);
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

  useEffect(() => {
    const handlePopState = () => {
      setCurrentScreen(getScreenFromLocation());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
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

  const normalizePredictionItems = (prediction: PredictionResponse): PredictionItem[] => prediction.items;

  const mergeRecognizedItemsIntoCart = (predictionItems: PredictionItem[]) => {
    setCartItems((previousItems) => {
      const nextItems = previousItems.map((item) => ({ ...item }));

      predictionItems.forEach((predictionItem) => {
        const existingItem = nextItems.find((item) => item.productId === predictionItem.label);
        if (existingItem) {
          existingItem.name = predictionItem.name;
          existingItem.price = predictionItem.price;
          existingItem.quantity += predictionItem.quantity;
          return;
        }

        nextItems.push({
          id: predictionItem.label,
          productId: predictionItem.label,
          name: predictionItem.name,
          price: predictionItem.price,
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
        throw new Error('Попередній перегляд камери недоступний.');
      }

      const frameBlob = await captureVideoFrame(videoElement);
      const prediction = await sendFrameForPrediction(frameBlob);
      const predictionItems = normalizePredictionItems(prediction);

      if (predictionItems.length > 0) {
        mergeRecognizedItemsIntoCart(predictionItems);
      }

      setLastPrediction(prediction);

      if (predictionItems.length > 0) {
        setRecognitionStatus('success');
      } else if (!prediction.detected && prediction.uncertainItems.length > 0) {
        setRecognitionStatus('uncertain');
      } else if (!prediction.detected && isEmptyPlatformMessage(prediction.message)) {
        setRecognitionStatus('empty');
      } else if (!prediction.detected) {
        setRecognitionStatus('error');
      } else {
        setRecognitionStatus('success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не вдалося отримати відповідь від сервера.';
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

      {currentScreen === 'referenceCapture' && (
        <ReferenceCaptureScreen
          cameraVideoRef={cameraVideoRef}
          onBack={() => {
            navigateTo('/');
            setCurrentScreen('start');
          }}
        />
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
