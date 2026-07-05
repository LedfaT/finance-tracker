import { useEffect, useMemo, useState } from "react";

import {
  getTelegramWebApp,
  initializeTelegramWebApp,
  isTelegramMiniApp,
} from "../lib/telegram";
import type { TelegramWebApp } from "../lib/telegram";

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | undefined>(() =>
    getTelegramWebApp()
  );
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const initializedWebApp = initializeTelegramWebApp();

    if (!initializedWebApp) {
      return;
    }

    setWebApp(initializedWebApp);

    const syncState = () => {
      setRevision((currentRevision) => currentRevision + 1);
      setWebApp(getTelegramWebApp());
    };

    initializedWebApp.onEvent("theme_changed", syncState);
    initializedWebApp.onEvent("viewport_changed", syncState);

    return () => {
      initializedWebApp.offEvent("theme_changed", syncState);
      initializedWebApp.offEvent("viewport_changed", syncState);
    };
  }, []);

  return useMemo(
    () => ({
      colorScheme: webApp?.colorScheme,
      isTelegram: isTelegramMiniApp(webApp),
      platform: webApp?.platform,
      revision,
      startParam: webApp?.initDataUnsafe.start_param,
      themeParams: webApp?.themeParams,
      user: webApp?.initDataUnsafe.user,
      version: webApp?.version,
      webApp,
    }),
    [revision, webApp]
  );
};
