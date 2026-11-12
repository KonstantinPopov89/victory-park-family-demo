import copy
from datetime import date
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import update_currency_rates as fx

TODAY = date(2026, 11, 12)
def snapshot(day='2026-11-12', rub=4.3552, usd=360.51):
    return {'schema_version':1, 'source':'CBA', 'source_url':'https://www.cba.am/en/',
            'quote':'AMD per 1 currency unit', 'date':day, 'RUB':rub, 'USD':usd,
            'retrieved_at':'2026-11-12T13:43:00+00:00'}

def xml(day='2026-11-12', rub='4.3552', usd='360.51', rub_amount='1'):
    return f'''<ExchangeRatesLatestResult xmlns="http://www.cba.am/"><CurrentDate>{day}T00:00:00</CurrentDate><Rates><ExchangeRate><ISO>RUB</ISO><Amount>{rub_amount}</Amount><Rate>{rub}</Rate></ExchangeRate><ExchangeRate><ISO>USD</ISO><Amount>1</Amount><Rate>{usd}</Rate></ExchangeRate></Rates></ExchangeRatesLatestResult>'''.encode()

class CurrencyTests(unittest.TestCase):
    def parse(self, payload):
        # Actual responses wrap the result in a SOAP response envelope.
        return fx.parse_cba(b'<root>'+payload+b'</root>', TODAY)

    def test_quote_is_normalized_per_one_unit(self):
        rates=self.parse(xml(rub='435.52',rub_amount='100'))
        self.assertEqual(rates['RUB'],4.3552)
        self.assertEqual(rates['USD'],360.51)
        self.assertEqual(rates['date'],'2026-11-12')

    def test_rejects_partial_pair_invalid_numbers_dates_and_entities(self):
        invalid=[xml(rub='NaN'),xml(rub='0'),xml(rub_amount='0'),xml(usd='Infinity'),
                 xml(day='2026-11-13'),xml(day='2026-02-30'),
                 xml().replace(b'<ISO>USD</ISO>',b'<ISO>EUR</ISO>'),
                 b'<!DOCTYPE x [<!ENTITY bad "bad">]>'+xml(),
                 xml().replace(b'<ISO>USD</ISO>',b'<ISO>RUB</ISO>')]
        for raw in invalid:
            with self.subTest(raw=raw):
                with self.assertRaises((ValueError, ArithmeticError)):
                    self.parse(raw)

    def test_never_rolls_back_to_old_repository_seed(self):
        seed=snapshot('2026-11-10',4.3579,360.43)
        public=snapshot('2026-11-12')
        self.assertEqual(fx.select_snapshot(seed,public,None),public)
        self.assertEqual(fx.select_snapshot(seed,public,seed),public)

    def test_same_day_cba_correction_wins_as_complete_pair(self):
        seed=snapshot()
        corrected=snapshot(rub=4.4,usd=361)
        self.assertEqual(fx.select_snapshot(seed,seed,corrected),corrected)

    def test_weekend_date_remains_actual_rate_date(self):
        friday=snapshot('2026-11-06')
        self.assertEqual(fx.validate(friday,date(2026,11,8))['date'],'2026-11-06')

    def test_failed_fetch_leaves_file_byte_identical(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'rates.json';path.write_text(json.dumps(snapshot()))
            original=path.read_bytes()
            with patch.object(fx,'request_bytes',side_effect=OSError('offline')),patch.object(fx,'time'):
                with self.assertRaises(RuntimeError):fx.update(path)
            self.assertEqual(path.read_bytes(),original)
            self.assertFalse(path.with_suffix('.json.tmp').exists())

    def test_successful_fetch_updates_file_atomically(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'rates.json';path.write_text(json.dumps(snapshot('2026-11-10')))
            fresh=snapshot()
            with patch.object(fx,'request_bytes',return_value=json.dumps(fresh).encode()),patch.object(fx,'latest',return_value=fresh):
                self.assertEqual(fx.update(path)['status'],'PASS')
            self.assertEqual(json.loads(path.read_text()),fresh)

    def test_remote_rollback_fails_without_touching_seed(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'rates.json';path.write_text(json.dumps(snapshot('2026-11-10')))
            original=path.read_bytes()
            with patch.object(fx,'request_bytes',return_value=json.dumps(snapshot()).encode()),patch.object(fx,'latest',return_value=snapshot('2026-11-11')):
                with self.assertRaises(RuntimeError):fx.update(path)
            self.assertEqual(path.read_bytes(),original)

if __name__=='__main__':unittest.main()
