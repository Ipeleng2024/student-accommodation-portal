function formatMoney(n) {
  return 'R' + String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function lowestPrice(properties) {
  const prices = [];
  (properties || []).forEach((p) => {
    (p.roomTypes || []).forEach((t) => {
      const price = Number(t.priceMonthly);
      if (Number.isFinite(price) && price > 0) prices.push(price);
    });
  });
  return prices.length > 0 ? Math.min(...prices) : null;
}