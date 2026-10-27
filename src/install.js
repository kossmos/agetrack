/** @param {HTMLButtonElement} installButton */
export function setupInstall(installButton) {
    // Добавление функциональности установки PWA
    /** @type {(Event & {prompt: () => Promise<void>, userChoice: Promise<{outcome: string}>}) | null} */
    let deferredPrompt = null;

    // Скрываем кнопку, если приложение уже запущено как установленное PWA
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in navigator && navigator.standalone) === true;
    if (isStandalone) {
        installButton.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        // Предотвращаем стандартное всплывающее окно установки
        e.preventDefault();
        // Сохраняем событие для использования позже
        deferredPrompt = /** @type {NonNullable<typeof deferredPrompt>} */ (e);
    });

    // Обработчик события при успешной установке
    window.addEventListener('appinstalled', () => {
        console.log('Приложение успешно установлено');
        installButton.style.display = 'none';
        // Можно показать сообщение о успешной установке
        alert('Приложение успешно установлено!');
    });

    // Обработчик клика по кнопке установки
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Показываем диалог установки
            await deferredPrompt.prompt();
            // Ожидаем результат
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Результат установки: ${outcome}`);
            // Обнуляем сохраненное событие
            deferredPrompt = null;

            if (outcome === 'accepted') {
                installButton.style.display = 'none';
            }
        } else {
            // Если deferredPrompt не доступен, предлагаем инструкции по установке
            let message;

            // Определяем браузер и устройство
            const userAgent = navigator.userAgent.toLowerCase();
            const isIOS = /iphone|ipad|ipod/.test(userAgent);
            const isAndroid = /android/.test(userAgent);
            const isSafari = /safari/.test(userAgent);
            const isChrome = /chrome/.test(userAgent);

            if (isIOS && isSafari) {
                message =
                    'Для установки на iOS: нажмите кнопку "Поделиться" внизу экрана, затем "На экран «Домой»"';
            } else if (isAndroid && isChrome) {
                message =
                    'Для установки на Android: нажмите на три точки в правом верхнем углу, затем "Установить приложение"';
            } else {
                message =
                    'Для установки: откройте сайт в Chrome или Safari на мобильном устройстве';
            }

            alert(message);
        }
    });
}
