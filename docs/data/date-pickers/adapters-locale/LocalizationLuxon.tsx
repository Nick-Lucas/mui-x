import * as React from 'react';
import { DateTime } from 'luxon';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { Unstable_DateField as DateField } from '@mui/x-date-pickers/DateField';
import { Unstable_TimeField as TimeField } from '@mui/x-date-pickers/TimeField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const locales = ['en-us', 'en-gb', 'zh-cn', 'de'];

type LocaleKey = typeof locales[number];

export default function LocalizationLuxon() {
  const [locale, setLocale] = React.useState<LocaleKey>('en-us');

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={locale}>
      <Stack spacing={3} sx={{ width: 300 }}>
        <ToggleButtonGroup
          value={locale}
          exclusive
          fullWidth
          onChange={(event, newLocale) => setLocale(newLocale)}
        >
          {locales.map((localeItem) => (
            <ToggleButton key={localeItem} value={localeItem}>
              {localeItem}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <DateField label="Date" defaultValue={DateTime.fromISO('2022-04-07')} />
        <TimeField
          label="Time"
          defaultValue={DateTime.fromISO('2022-04-07T18:30')}
        />
      </Stack>
    </LocalizationProvider>
  );
}
