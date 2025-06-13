/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
   const discountFactor = 1 - (purchase.discount / 100);
   return purchase.sale_price * purchase.quantity * discountFactor;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    let rate;
    if (index === 0) {                  // лидер
        rate = 0.15;
    } else if (index === 1 || index === 2) { // 2-е или 3-е место
        rate = 0.10;
    } else if (index === total - 1) {   // последний
        rate = 0.00;
    } else {                            // все остальные
        rate = 0.05;
    }
    return Number((seller.profit * rate).toFixed(2));
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {

    // —► Блок валидации массивов ---------------------------------
    if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Массив sellers пуст');
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Массив products пуст');
    }
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Массив purchase_records пуст');
}
// ——————————————————————————————————————————————


    const { calculateRevenue, calculateBonus } = options;

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,          // накопленная выручка
        profit: 0,           // накопленная прибыль
        sales_count: 0,      // количество чеков, обслуженных продавцом
        products_sold: {}    // { sku: общее_кол-во_проданных_единиц }
    }));
    // Индекс по продавцам: id → объект статистики
    const sellerIndex = Object.fromEntries(
        sellerStats.map(stat => [stat.id, stat])
    );

    // Индекс по товарам: sku → карточка товара
    const productIndex = Object.fromEntries(
        data.products.map(prod => [prod.sku, prod])
    );

    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        if (!seller) return;
        // Увеличить количество продаж 
        // Увеличить общую сумму всех продаж
        seller.sales_count += 1;                       // +1 обслуженный чек
        seller.revenue     += record.total_amount;     // сумма чека (без скидки)

        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            if (!product) return;                               // артикул не найден — пропуск

            // Себестоимость партии
            const cost = product.purchase_price * item.quantity;

            // Выручка с учётом скидки
            const revenueItem = calculateRevenue(item, product);

            // Прибыль партии
            const profitItem = revenueItem - cost;
            seller.profit += profitItem;                        // накапливаем прибыль продавца

            // Учёт проданных количеств
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;    // +шт.
            // По артикулу товара увеличить его проданное количество у продавца
        });

    });

    sellerStats.sort((a, b) => b.profit - a.profit);

    /*— Шаг 3. Премии и топ-10 товаров —*/
    const totalSellers = sellerStats.length;
    sellerStats.forEach((seller, index) => {
        // премия
        seller.bonus = calculateBonus(index, totalSellers, seller);

        // топ-10 товаров
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))    // [{sku, qty}]
            .sort((a, b) => b.quantity - a.quantity)          // по убыванию qty
            .slice(0, 10);                                    // первые 10
    });

    return sellerStats.map(seller => ({
        seller_id:   seller.id,                    // строка-идентификатор
        name:        seller.name,                  // строка-ФИО
        revenue:     +seller.revenue.toFixed(2),   // число с 2 знаками
        profit:      +seller.profit.toFixed(2),    // число с 2 знаками
        sales_count: seller.sales_count,           // целое
        top_products: seller.top_products,         // массив Top-10 [{sku, quantity}]
        bonus:       +seller.bonus.toFixed(2)      // число с 2 знаками
    }));
    // @TODO: Проверка входных данных

    // @TODO: Проверка наличия опций

    // @TODO: Подготовка промежуточных данных для сбора статистики

    // @TODO: Индексация продавцов и товаров для быстрого доступа

    // @TODO: Расчет выручки и прибыли для каждого продавца

    // @TODO: Сортировка продавцов по прибыли

    // @TODO: Назначение премий на основе ранжирования

    // @TODO: Подготовка итоговой коллекции с нужными полями


}