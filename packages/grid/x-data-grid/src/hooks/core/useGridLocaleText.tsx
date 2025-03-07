import * as React from 'react';
import { GridPrivateApiCommon } from '../../models/api/gridApiCommon';
import { GridLocaleTextApi } from '../../models/api/gridLocaleTextApi';
import { useGridApiMethod } from '../utils/useGridApiMethod';
import { DataGridProcessedProps } from '../../models/props/DataGridProps';

export const useGridLocaleText = (
  apiRef: React.MutableRefObject<GridPrivateApiCommon>,
  props: Pick<DataGridProcessedProps, 'localeText'>,
): void => {
  const getLocaleText = React.useCallback<GridLocaleTextApi['getLocaleText']>(
    (key) => {
      if (props.localeText[key] == null) {
        throw new Error(`Missing translation for key ${key}.`);
      }
      return props.localeText[key];
    },
    [props.localeText],
  );

  const localeTextApi: GridLocaleTextApi = {
    getLocaleText,
  };

  useGridApiMethod(apiRef, localeTextApi, 'public');
};
