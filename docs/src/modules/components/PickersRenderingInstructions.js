/* eslint-disable material-ui/no-hardcoded-labels */
import * as React from 'react';
import HighlightedCode from 'docs/src/modules/components/HighlightedCode';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';

const libraries = {
  dayjs: 'AdapterDayjs',
  'date-fns': 'AdapterDateFns',
  luxon: 'AdapterLuxon',
  moment: 'AdapterMoment',
};

export default function PickersRenderingInstructions() {
  const [licenceType, setLicenceType] = React.useState('community');
  const [libraryUsed, setLibraryUsed] = React.useState('dayjs');

  const handleLicenceTypeChange = (event, nextLicenseType) => {
    if (nextLicenseType !== null) {
      setLicenceType(nextLicenseType);
    }
  };

  const handleLibraryUsedChange = (event) => {
    setLibraryUsed(event.target.value);
  };

  const componentPackage =
    licenceType === 'pro' ? '@mui/x-date-pickers-pro' : '@mui/x-date-pickers';

  const adapterName = libraries[libraryUsed];

  const commandLines = [
    `import { LocalizationProvider } from '${componentPackage}';`,
    `import { ${adapterName} } from '${componentPackage}/${adapterName}'`,
    '',
    'function App({ children }) {',
    '  return (',
    `    <LocalizationProvider dateAdapter={${adapterName}}>`,
    '      {children}',
    '    </LocalizationProvider>',
    '  );',
    '}',
  ].join('\n');

  return (
    <Stack sx={{ width: '100%' }} px={{ xs: 3, sm: 0 }}>
      <Stack direction="row" spacing={2}>
        <ToggleButtonGroup
          value={licenceType}
          exclusive
          onChange={handleLicenceTypeChange}
          size="small"
        >
          <ToggleButton value="community">community</ToggleButton>
          <ToggleButton value="pro">pro</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          size="small"
          label="date-library"
          value={libraryUsed}
          onChange={handleLibraryUsedChange}
          select
        >
          {Object.keys(libraries).map((lib) => (
            <MenuItem value={lib}>{lib}</MenuItem>
          ))}
        </TextField>
      </Stack>
      <HighlightedCode sx={{ width: '100%' }} code={commandLines} language="tsx" />
    </Stack>
  );
}
