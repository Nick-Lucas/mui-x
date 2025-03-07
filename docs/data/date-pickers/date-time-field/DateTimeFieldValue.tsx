import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import Stack from '@mui/material/Stack';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Unstable_DateTimeField as DateTimeField } from '@mui/x-date-pickers/DateTimeField';

export default function DateTimeFieldValue() {
  const [value, setValue] = React.useState<Dayjs | null>(dayjs('2022-04-07T15:30'));

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack
        spacing={{ xs: 4, xl: 2 }}
        direction={{ xs: 'column', xl: 'row' }}
        sx={{ '& > *': { width: 300 } }}
      >
        <DateTimeField
          label="Uncontrolled field"
          defaultValue={dayjs('2022-04-07T15:30')}
        />
        <DateTimeField
          label="Controlled field"
          value={value}
          onChange={(newValue) => setValue(newValue)}
        />
      </Stack>
    </LocalizationProvider>
  );
}
