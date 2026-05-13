import { useEffect, useMemo, useState, type RefObject } from 'react';
import { AppButton } from '../components/AppButton';
import { CameraPreview } from '../components/CameraPreview';
import {
  createReferenceObject,
  fetchReferenceObjects,
  saveReferenceCapture,
} from '../services/referenceLibraryApi';
import type {
  ReferenceCaptureResponse,
  ReferenceObject,
  ReferenceObjectCreateInput,
} from '../types';
import { captureVideoFrame } from '../utils/captureVideoFrame';

interface ReferenceCaptureScreenProps {
  cameraVideoRef: RefObject<HTMLVideoElement | null>;
  onBack: () => void;
}

const adminPasswordStorageKey = 'reference-admin-password';

const formatPriceInputToMinor = (priceInput: string): number | null => {
  const normalizedPrice = priceInput.trim().replace(',', '.');
  if (!normalizedPrice) {
    return null;
  }

  const parsedPrice = Number(normalizedPrice);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return null;
  }

  return Math.round(parsedPrice * 100);
};

const sortReferenceObjects = (items: ReferenceObject[]) => {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, 'uk'));
};

export const ReferenceCaptureScreen = ({ cameraVideoRef, onBack }: ReferenceCaptureScreenProps) => {
  const [adminPassword, setAdminPassword] = useState(() => sessionStorage.getItem(adminPasswordStorageKey) ?? '');
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [objects, setObjects] = useState<ReferenceObject[]>([]);
  const [selectedObjectLabel, setSelectedObjectLabel] = useState('');
  const [selectedViewGroup, setSelectedViewGroup] = useState<'front' | 'back'>('front');
  const [isLoadingObjects, setIsLoadingObjects] = useState(true);

  const [newBookName, setNewBookName] = useState('');
  const [newBookPrice, setNewBookPrice] = useState('');
  const [newBookDescription, setNewBookDescription] = useState('');
  const [isCreatingObject, setIsCreatingObject] = useState(false);
  const [createObjectError, setCreateObjectError] = useState<string | null>(null);
  const [createObjectSuccess, setCreateObjectSuccess] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedCapture, setLastSavedCapture] = useState<ReferenceCaptureResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadObjects = async () => {
      if (!adminPassword) {
        setIsLoadingObjects(false);
        setObjects([]);
        return;
      }

      setIsLoadingObjects(true);
      setLoadError(null);

      try {
        const activeObjects = sortReferenceObjects(await fetchReferenceObjects(adminPassword));
        if (!isMounted) {
          return;
        }

        setObjects(activeObjects);
        setSelectedObjectLabel((previousLabel) => {
          if (previousLabel && activeObjects.some((item) => item.label === previousLabel)) {
            return previousLabel;
          }

          return activeObjects[0]?.label ?? '';
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        sessionStorage.removeItem(adminPasswordStorageKey);
        setAdminPassword('');
        setAuthError(error instanceof Error ? error.message : 'Не вдалося підтвердити пароль адміністратора.');
        setLoadError(null);
      } finally {
        if (isMounted) {
          setIsLoadingObjects(false);
        }
      }
    };

    void loadObjects();

    return () => {
      isMounted = false;
    };
  }, [adminPassword]);

  const handleAuthenticate = async () => {
    const trimmedPassword = passwordInput.trim();
    if (!trimmedPassword) {
      setAuthError('Введіть пароль адміністратора.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      await fetchReferenceObjects(trimmedPassword);
      sessionStorage.setItem(adminPasswordStorageKey, trimmedPassword);
      setAdminPassword(trimmedPassword);
      setPasswordInput('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не вдалося підтвердити пароль адміністратора.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(adminPasswordStorageKey);
    setAdminPassword('');
    setPasswordInput('');
    setAuthError(null);
    setLoadError(null);
    setSaveError(null);
    setCreateObjectError(null);
    setCreateObjectSuccess(null);
    setLastSavedCapture(null);
    setObjects([]);
    setSelectedObjectLabel('');
    setSelectedViewGroup('front');
  };

  const handleCreateObject = async () => {
    const normalizedName = newBookName.trim();
    if (!normalizedName) {
      setCreateObjectError('Вкажіть назву книги.');
      return;
    }

    const priceMinor = formatPriceInputToMinor(newBookPrice);
    if (priceMinor === null) {
      setCreateObjectError('Вкажіть коректну ціну у гривнях, наприклад 450 або 450.00.');
      return;
    }

    setIsCreatingObject(true);
    setCreateObjectError(null);
    setCreateObjectSuccess(null);

    const payload: ReferenceObjectCreateInput = {
      name: normalizedName,
      priceMinor,
      description: newBookDescription.trim() || null,
    };

    try {
      const response = await createReferenceObject(adminPassword, payload);
      setObjects((previousObjects) => sortReferenceObjects([...previousObjects, response.item]));
      setSelectedObjectLabel(response.item.label);
      setSelectedViewGroup('front');
      setNewBookName('');
      setNewBookPrice('');
      setNewBookDescription('');
      setCreateObjectSuccess(response.message);
      setLastSavedCapture(null);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : 'Не вдалося додати книгу до каталогу.';
      if (nextError === 'Невірний пароль адміністратора.') {
        handleLogout();
        setAuthError(nextError);
        return;
      }

      setCreateObjectError(nextError);
    } finally {
      setIsCreatingObject(false);
    }
  };

  const handleSaveCapture = async () => {
    const videoElement = cameraVideoRef.current;
    if (!videoElement) {
      setSaveError('Попередній перегляд камери недоступний.');
      return;
    }

    if (!selectedObjectLabel) {
      setSaveError('Оберіть книгу, для якої потрібно зберегти еталонний кадр.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const frameBlob = await captureVideoFrame(videoElement);
      const savedCapture = await saveReferenceCapture(adminPassword, selectedObjectLabel, selectedViewGroup, frameBlob);
      setLastSavedCapture(savedCapture);
      setCreateObjectSuccess(null);
    } catch (error) {
      const nextError = error instanceof Error ? error.message : 'Не вдалося зберегти еталонне зображення.';
      if (nextError === 'Невірний пароль адміністратора.') {
        handleLogout();
        setAuthError(nextError);
        return;
      }

      setSaveError(nextError);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedObject = useMemo(
    () => objects.find((item) => item.label === selectedObjectLabel) ?? null,
    [objects, selectedObjectLabel],
  );

  if (!adminPassword) {
    return (
      <section className="kiosk-shell mx-auto grid min-h-[720px] w-full max-w-3xl grid-cols-1 gap-4 px-5 py-5">
        <div className="panel flex flex-col gap-5 p-7">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Адміністративний доступ</p>
            <h1 className="mt-2 text-4xl font-display font-bold text-white">Вхід до керування еталонними кадрами</h1>
            <p className="mt-4 text-lg font-semibold leading-relaxed text-slate-300">
              Цей розділ використовується для додавання нових книг до каталогу та збереження еталонних кадрів із тієї ж
              вебкамери, з якою працює система розпізнавання.
            </p>
          </div>

          <div className="field-shell">
            <p className="field-label">Пароль адміністратора</p>
            <input
              className="field-input"
              type="password"
              value={passwordInput}
              onChange={(event) => setPasswordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleAuthenticate();
                }
              }}
              placeholder="Введіть пароль"
              autoComplete="current-password"
            />
            <p className="field-note">Пароль перевіряється на backend перед завантаженням каталогу книг.</p>
          </div>

          {authError && <div className="capture-status-card border-kiosk-danger text-lg font-semibold text-red-200">{authError}</div>}

          <div className="grid gap-3 sm:grid-cols-2">
            <AppButton variant="primary" size="md" fullWidth onClick={handleAuthenticate} disabled={isAuthenticating}>
              {isAuthenticating ? 'Перевірка пароля...' : 'Увійти'}
            </AppButton>
            <AppButton variant="ghost" size="md" fullWidth onClick={onBack}>
              Повернутися назад
            </AppButton>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="kiosk-shell mx-auto grid min-h-[920px] w-full max-w-7xl grid-cols-12 gap-4 px-5 py-5">
      <div className="col-span-12 panel flex flex-col p-7 xl:col-span-7">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">Локальний режим підготовки еталонів</p>
          <h1 className="mt-2 text-5xl font-display font-bold text-white">Каталог книг та еталонні кадри</h1>
          <p className="mt-4 max-w-4xl text-xl font-semibold leading-relaxed text-slate-300">
            Додайте нову книгу до бази, виберіть її зі списку та одразу збережіть front/back кадри в активний набір
            розпізнавання.
          </p>
        </div>

        <div className="platform-stage mt-7 xl:grid-cols-1">
          <div className="platform-shell platform-portrait platform-preview-shell mx-auto p-5 sm:p-6">
            <CameraPreview videoRef={cameraVideoRef} />
            <div className="camera-corner camera-corner-tl" />
            <div className="camera-corner camera-corner-tr" />
            <div className="camera-corner camera-corner-bl" />
            <div className="camera-corner camera-corner-br" />
          </div>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-5">
        <div className="panel flex h-full flex-col gap-4 p-7">
          <div className="field-shell">
            <p className="field-label">Нова книга в каталозі</p>
            <div className="mt-3 grid gap-3">
              <input
                className="field-input mt-0 min-h-[56px]"
                type="text"
                value={newBookName}
                onChange={(event) => setNewBookName(event.target.value)}
                placeholder="Наприклад: Книга — Місто"
              />
              <input
                className="field-input mt-0 min-h-[56px]"
                type="text"
                inputMode="decimal"
                value={newBookPrice}
                onChange={(event) => setNewBookPrice(event.target.value)}
                placeholder="Ціна, грн"
              />
              <textarea
                className="field-textarea"
                value={newBookDescription}
                onChange={(event) => setNewBookDescription(event.target.value)}
                placeholder="Короткий опис або видання (необов'язково)"
                rows={4}
              />
            </div>
            <p className="field-note">
              Після додавання книга з'явиться в БД, для неї автоматично створяться папки front/back, і її можна буде
              відразу знімати як еталон.
            </p>
            <div className="mt-4">
              <AppButton
                variant="primary"
                size="md"
                fullWidth
                onClick={handleCreateObject}
                disabled={isCreatingObject || isLoadingObjects}
              >
                {isCreatingObject ? 'Додавання книги...' : 'Додати книгу до каталогу'}
              </AppButton>
            </div>
          </div>

          {createObjectError && (
            <div className="capture-status-card border-kiosk-danger text-lg font-semibold text-red-200">{createObjectError}</div>
          )}

          {createObjectSuccess && (
            <div className="capture-status-card border-kiosk-success text-lg font-semibold text-emerald-100">
              {createObjectSuccess}
            </div>
          )}

          <div className="field-shell">
            <p className="field-label">Книга з каталогу</p>
            <select
              className="field-select"
              value={selectedObjectLabel}
              onChange={(event) => {
                setSelectedObjectLabel(event.target.value);
                setSaveError(null);
              }}
              disabled={isLoadingObjects || objects.length === 0}
            >
              {objects.length === 0 && <option value="">Немає доступних книг</option>}
              {objects.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="field-note">Backend збереже кадр у папку вибраної книги та автоматично синхронізує БД.</p>
          </div>

          {selectedObject && (
            <div className="capture-status-card border-slate-700/80">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200/85">Поточна книга</p>
              <p className="mt-3 text-2xl font-display font-bold text-white">{selectedObject.name}</p>
              <p className="mt-2 text-lg font-semibold text-slate-300">{selectedObject.price.toFixed(2)} грн</p>
              {selectedObject.description && <p className="mt-3 text-sm font-semibold text-slate-400">{selectedObject.description}</p>}
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Label: {selectedObject.label} | Джерело: {selectedObject.catalogSource}
              </p>
            </div>
          )}

          <div className="field-shell">
            <p className="field-label">Сторона обкладинки</p>
            <select
              className="field-select"
              value={selectedViewGroup}
              onChange={(event) => setSelectedViewGroup(event.target.value as 'front' | 'back')}
            >
              <option value="front">Передня обкладинка</option>
              <option value="back">Задня обкладинка</option>
            </select>
            <p className="field-note">Для стабільності збережіть кілька кадрів для front і окремо кілька кадрів для back.</p>
          </div>

          <div className="panel-alt rounded-2xl p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200/85">Рекомендований порядок</p>
            <div className="mt-4 grid gap-3">
              <div className="platform-tip">
                <span className="platform-tip-index">1</span>
                <p>Додайте книгу до каталогу або оберіть уже наявну.</p>
              </div>
              <div className="platform-tip">
                <span className="platform-tip-index">2</span>
                <p>Вирівняйте книгу так, як вона лежатиме під час демонстрації на вашій платформі.</p>
              </div>
              <div className="platform-tip">
                <span className="platform-tip-index">3</span>
                <p>Збережіть 3–6 кадрів для front і 3–6 кадрів для back у тих самих домашніх умовах.</p>
              </div>
            </div>
          </div>

          {loadError && <div className="capture-status-card border-kiosk-danger text-lg font-semibold text-red-200">{loadError}</div>}
          {saveError && <div className="capture-status-card border-kiosk-danger text-lg font-semibold text-red-200">{saveError}</div>}

          {lastSavedCapture && (
            <div className="capture-status-card border-kiosk-success">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-kiosk-success">Останній збережений кадр</p>
              <p className="mt-3 text-2xl font-display font-bold text-slate-100">{lastSavedCapture.objectName}</p>
              <p className="mt-2 text-lg font-semibold text-slate-300">
                {lastSavedCapture.viewGroup === 'front' ? 'Передня обкладинка' : 'Задня обкладинка'}
              </p>
              <p className="mt-3 break-all text-sm font-semibold text-slate-400">{lastSavedCapture.savedPath}</p>
              <p className="mt-2 text-sm font-semibold text-slate-400">
                {lastSavedCapture.width}x{lastSavedCapture.height} | {lastSavedCapture.imageFormat} | активних еталонів:{' '}
                {lastSavedCapture.syncActive}
              </p>
            </div>
          )}

          <div className="mt-auto grid gap-3">
            <AppButton
              variant="success"
              size="lg"
              fullWidth
              onClick={handleSaveCapture}
              disabled={isLoadingObjects || isSaving || !selectedObjectLabel}
            >
              {isSaving ? 'Збереження кадру...' : 'Зберегти кадр як еталон'}
            </AppButton>
            <AppButton variant="secondary" size="md" fullWidth onClick={handleLogout}>
              Вийти з адмінки
            </AppButton>
            <AppButton variant="ghost" size="md" fullWidth onClick={onBack}>
              Повернутися на стартовий екран
            </AppButton>
          </div>
        </div>
      </div>
    </section>
  );
};
