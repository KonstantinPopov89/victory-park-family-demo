#!/usr/bin/env python3
"""Fetch CBA's daily reference rates. Invalid/unavailable sources never erase the last snapshot."""
import argparse
import hashlib
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
import json
import math
from pathlib import Path
import sys
import time
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

ENDPOINT = 'https://api.cba.am/exchangerates.asmx'
PUBLIC = 'https://konstantinpopov89.github.io/victory-park-family-demo/family-v6/data/exchange-rates.json'
NS = {'cba': 'http://www.cba.am/'}
SOAP = b'<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ExchangeRatesLatest xmlns="http://www.cba.am/" /></soap:Body></soap:Envelope>'

def validate(value, today=None):
    today = today or datetime.now(ZoneInfo('Asia/Yerevan')).date()
    if not isinstance(value, dict) or value.get('schema_version') != 1 or value.get('source') != 'CBA' or value.get('quote') != 'AMD per 1 currency unit':
        raise ValueError('Unsupported rate snapshot')
    stamp = date.fromisoformat(value['date'])
    if stamp > today or stamp < date(2000, 1, 1):
        raise ValueError('Invalid rate date')
    for code, low, high in [('RUB', 0.01, 1000), ('USD', 50, 3000)]:
        rate = value.get(code)
        if type(rate) not in (int, float) or not math.isfinite(rate) or not low <= rate <= high:
            raise ValueError('Invalid rate: ' + code)
    return value

def parse_cba(raw, today=None):
    if len(raw) > 256_000 or b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
        raise ValueError('Unsupported XML payload')
    tree = ET.fromstring(raw)
    result = tree.find('.//cba:ExchangeRatesLatestResult', NS)
    if result is None:
        raise ValueError('Missing CBA result')
    stamp = result.findtext('cba:CurrentDate', namespaces=NS)
    parsed = {'schema_version': 1, 'source': 'CBA', 'source_url': 'https://www.cba.am/en/',
              'quote': 'AMD per 1 currency unit', 'date': stamp[:10] if stamp else '',
              'retrieved_at': datetime.now(timezone.utc).isoformat(timespec='seconds')}
    for row in result.findall('cba:Rates/cba:ExchangeRate', NS):
        code = row.findtext('cba:ISO', namespaces=NS)
        if code not in ('RUB', 'USD'):
            continue
        if code in parsed:
            raise ValueError('Duplicate currency: ' + code)
        amount = Decimal(row.findtext('cba:Amount', namespaces=NS).replace(',', '.'))
        rate = Decimal(row.findtext('cba:Rate', namespaces=NS).replace(',', '.'))
        if not amount.is_finite() or amount <= 0 or not rate.is_finite():
            raise ValueError('Invalid CBA amount/rate')
        parsed[code] = float(rate / amount)
    return validate(parsed, today)

def request_bytes(request):
    with urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise ValueError('Unexpected HTTP status')
        return response.read(256_001)

def latest():
    request = Request(ENDPOINT, data=SOAP, headers={
        'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '"http://www.cba.am/ExchangeRatesLatest"',
        'User-Agent': 'VictoryPark-Currency/1.0'})
    return parse_cba(request_bytes(request))

def select_snapshot(local, published, fresh):
    # Do not roll back to the repository seed when redeploying the site.
    candidates = [validate(x) for x in (local, published, fresh) if x is not None]
    if not candidates:
        raise ValueError('No valid rate snapshot')
    # A fresh CBA response wins same-day corrections; never mix dates/currencies.
    return max(enumerate(candidates), key=lambda pair: (pair[1]['date'], pair[0]))[1]

def update(target, report_path=None):
    target = Path(target)
    local = validate(json.loads(target.read_text())) if target.exists() else None
    published = fresh = None
    warnings = []
    try:
        published = validate(json.loads(request_bytes(Request(PUBLIC, headers={'Cache-Control':'no-cache', 'User-Agent':'VictoryPark-Currency/1.0'}))))
    except Exception as error:
        warnings.append('Published snapshot unavailable: ' + type(error).__name__)
    for attempt in range(3):
        try:
            fresh = latest()
            break
        except Exception as error:
            warnings.append('CBA attempt failed: ' + type(error).__name__)
            if attempt < 2:
                time.sleep(2 * (attempt + 1))
    chosen = select_snapshot(local, published, fresh)
    # On a failed daily fetch retain the last file and fail the run. This keeps
    # the currently deployed site intact and gives GitHub a visible failure.
    if fresh is None:
        raise RuntimeError('CBA unavailable; last published rates retained. ' + '; '.join(warnings))
    if chosen['date'] != fresh['date']:
        raise RuntimeError('CBA returned older rates; last published rates retained')
    temp = target.with_suffix('.json.tmp')
    target.parent.mkdir(parents=True, exist_ok=True)
    temp.write_text(json.dumps(chosen, ensure_ascii=False, indent=2) + '\n')
    temp.replace(target)
    report = {'status':'PASS', 'date':chosen['date'], 'RUB':chosen['RUB'], 'USD':chosen['USD'],
              'retrieved_at':chosen['retrieved_at'], 'warnings':warnings}
    if report_path:
        Path(report_path).write_text(json.dumps(report, indent=2) + '\n')
    return report

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', type=Path)
    parser.add_argument('--report', type=Path)
    parser.add_argument('--verify-public', metavar='SHA256')
    args = parser.parse_args()
    try:
        if args.verify_public:
            for attempt in range(3):
                raw=request_bytes(Request(PUBLIC,headers={'Cache-Control':'no-cache','User-Agent':'VictoryPark-Currency/1.0'}))
                validate(json.loads(raw))
                if hashlib.sha256(raw).hexdigest()==args.verify_public:
                    print(json.dumps({'status':'PASS','public_sha256':args.verify_public}));return 0
                if attempt<2:time.sleep(10)
            raise RuntimeError('Published currency snapshot differs from verified build')
        if not args.target:
            parser.error('--target or --verify-public is required')
        print(json.dumps(update(args.target, args.report)))
    except (OSError, ValueError, RuntimeError, InvalidOperation, TypeError, AttributeError) as error:
        print('::error::' + str(error), file=sys.stderr)
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(main())
