# Документация по Серверному Расчёту Доставки

## Архитектура
Модуль расчёта доставки строится на изолированных серверных адаптерах (`server-only`), объединенных единым интерфейсом `ShippingProvider` (`lib/shipping/types.ts`).

Поддерживаемые провайдеры:
1. **СДЭК API v2** (`lib/shipping/cdek.ts`): Поддерживает автоматический запрос OAuth 2.0 токена, кеширование токена и расчет стоимости по тарифной сетке `calculator/tarifflist`.
2. **Почта России API** (`lib/shipping/pochta.ts`): Официальный публичный API тарификатора посылок Почты России (`tariff.pochta.ru`).
3. **Яндекс Доставка B2B** (`lib/shipping/yandex.ts`): Оценивает стоимость курьерской доставки через B2B endpoint `check-price`.
4. **Индивидуальное согласование Telegram** (`lib/shipping/telegram-manual.ts`): Универсальный фоллбек для кастомных заказов.

## Упаковка и Габариты
Перед вызовом внешних служб товары из корзины упаковываются с помощью `buildPackages` (`lib/shipping/package-builder.ts`). Алгоритм учитывает:
- Индивидуальный вес и габариты товара (`weight_grams`, `length_mm`, `width_mm`, `height_mm`).
- Флаг `requires_separate_package` (для крупных или хрупких ваз).
- Вес защитного упаковочного бокса (+100 грамм на посылку).

## Добавление Ключей Провайдеров
Все секретные ключи хранятся в переменном окружении сервера и никогда не отдаются браузеру:
- СДЭК: `CDEK_ENABLED=true`, `CDEK_CLIENT_ID`, `CDEK_CLIENT_SECRET`.
- Почта России: `RUSSIAN_POST_ENABLED=true`, `RUSSIAN_POST_API_TOKEN`.
- Яндекс Доставка: `YANDEX_DELIVERY_ENABLED=true`, `YANDEX_DELIVERY_API_TOKEN`.
