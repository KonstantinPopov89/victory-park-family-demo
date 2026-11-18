// The add-on is a separate order. Refer to the ticket the family actually chose
// in history, even when more recently issued tickets exist on this device.
export function originalOrder(record, state) {
  if (!state.additionalTo) return null;
  return record?.orders.find(order => order.id === state.additionalTo &&
    order.phase === 'issued' && order.sessionId === state.sessionId) || null;
}

const messages = {
  ru: {
    question:'Сколько билетов добавить?', count:'Добавляемые гости', total:'К оплате за добавляемых гостей',
    title:'Докупка билетов', seats:'Места для добавляемых гостей', previous:'Открыть исходный билет',
    help:'Укажите только тех, для кого докупаете билеты.', edit:'Изменить количество',
    origin:(id,n)=>'Исходный заказ '+id+' · уже оплачено мест: '+n,
    adjacent:'Ранее купленные и новые места идут подряд в одном ряду.',
    different:'Новые места и места исходного заказа находятся в разных рядах.',
    gap:'Места в одном ряду, но между ними есть промежутки.',
    mixed:'Места распределены по нескольким рядам. Сверьте номера для вашей компании.',
    noSeats:'Без закреплённых кресел.'
  },
  en: {
    question:'How many tickets would you like to add?', count:'Additional guests', total:'Total for additional guests',
    title:'Add tickets', seats:'Seats for additional guests', previous:'Open the original ticket',
    help:'Count only the guests you are adding.', edit:'Change quantity',
    origin:(id,n)=>'Original order '+id+' · places already paid for: '+n,
    adjacent:'Your original and new seats are together in one row.',
    different:'The new seats are in a different row from the original seats.',
    gap:'All seats are in the same row, with gaps between them.',
    mixed:'The seats span several rows. Check the numbers for your group.',
    noSeats:'No assigned seats.'
  },
  hy: {
    question:'Քանի՞ տոմս եք ավելացնում։', count:'Ավելացվող հյուրեր', total:'Վճարման գումարը նոր հյուրերի համար',
    title:'Ավելացնել տոմսեր', seats:'Նոր հյուրերի նստատեղերը', previous:'Բացել սկզբնական տոմսը',
    help:'Նշեք միայն այն հյուրերին, որոնց համար նոր տոմս եք գնում։', edit:'Փոխել քանակը',
    origin:(id,n)=>'Սկզբնական պատվեր '+id+' · արդեն վճարված տեղերի քանակը՝ '+n,
    adjacent:'Նախկին և նոր նստատեղերը նույն շարքում են՝ իրար կողքի։',
    different:'Նոր նստատեղերը սկզբնական պատվերի նստատեղերից տարբեր շարքում են։',
    gap:'Բոլոր նստատեղերը նույն շարքում են, բայց իրարից հեռու են։',
    mixed:'Նստատեղերը մի քանի շարքում են։ Ստուգեք ձեր խմբի նստատեղերի համարները։',
    noSeats:'Առանց ամրագրված նստատեղերի։'
  }
};

function seatRelation(original, added) {
  const all = [...original, ...added];
  if (all.every(seat => seat[0] === all[0][0])) {
    const columns = all.map(seat => Number(seat.slice(1))).sort((a,b) => a-b);
    return columns.every((column,i) => !i || column === columns[i-1]+1) ? 'adjacent' : 'gap';
  }
  const rows = new Set(original.map(seat => seat[0]));
  const newRow = added[0][0];
  return !rows.has(newRow) && added.every(seat => seat[0] === newRow) ? 'different' : 'mixed';
}

export function additionalView(record, state, seatText) {
  const original = originalOrder(record,state);
  if (!original) return null;
  const copy = messages[state.lang] || messages.ru;
  const placement = original.seats.length && state.qty === state.seats.length
    ? copy[seatRelation(original.seats,state.seats)] : '';
  return {...copy,
    original:copy.origin(original.id,original.qty)+' · '+(original.seats.length ? seatText(original.seats) : copy.noSeats),
    previousLabel:copy.previous+' '+original.id, placement
  };
}
