import * as React from 'react';
// @ts-ignore Remove once the test utils are typed
import { createRenderer, screen, userEvent, within, act } from '@mui/monorepo/test/utils';
import { expect } from 'chai';
import { getColumnHeaderCell, getColumnValues } from 'test/utils/helperFn';
import { SinonSpy, spy } from 'sinon';
import {
  DataGridPremium,
  DataGridPremiumProps,
  GRID_AGGREGATION_FUNCTIONS,
  GridAggregationFunction,
  GridApi,
  GridRenderCellParams,
  GridGroupNode,
  useGridApiRef,
} from '@mui/x-data-grid-premium';

const isJSDOM = /jsdom/.test(window.navigator.userAgent);

const baselineProps: DataGridPremiumProps = {
  autoHeight: isJSDOM,
  disableVirtualization: true,
  rows: [
    { id: 0, category1: 'Cat A', category2: 'Cat 1' },
    { id: 1, category1: 'Cat A', category2: 'Cat 2' },
    { id: 2, category1: 'Cat A', category2: 'Cat 2' },
    { id: 3, category1: 'Cat A', category2: 'Cat 2' },
    { id: 4, category1: 'Cat A', category2: 'Cat 1' },
    { id: 5, category1: 'Cat B', category2: 'Cat 1' },
  ],
  columns: [
    {
      field: 'id',
      type: 'number',
    },
    {
      field: 'category1',
    },
    {
      field: 'category2',
    },
  ],
};

describe('<DataGridPremium /> - Aggregation', () => {
  const { render, clock } = createRenderer({ clock: 'fake' });

  let apiRef: React.MutableRefObject<GridApi>;

  function Test(props: Partial<DataGridPremiumProps>) {
    apiRef = useGridApiRef();

    return (
      <div style={{ width: 300, height: 300 }}>
        <DataGridPremium {...baselineProps} apiRef={apiRef} {...props} />
      </div>
    );
  }

  describe('Setting aggregation model', () => {
    describe('initialState: aggregation.model', () => {
      it('should allow to initialize aggregation', () => {
        render(<Test initialState={{ aggregation: { model: { id: 'max' } } }} />);
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);
      });

      it('should not react to initial state updates', () => {
        const { setProps } = render(
          <Test initialState={{ aggregation: { model: { id: 'max' } } }} />,
        );
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);

        setProps({ initialState: { aggregation: { model: { id: 'min' } } } });
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);
      });
    });

    describe('prop: aggregationModel', () => {
      it('should not call onAggregationModelChange on initialisation or on aggregationModel prop change', () => {
        const onAggregationModelChange = spy();

        const { setProps } = render(
          <Test
            aggregationModel={{ id: 'max' }}
            onAggregationModelChange={onAggregationModelChange}
          />,
        );

        expect(onAggregationModelChange.callCount).to.equal(0);
        setProps({ id: 'min' });

        expect(onAggregationModelChange.callCount).to.equal(0);
      });

      it('should allow to update the aggregation model from the outside', () => {
        const { setProps } = render(<Test aggregationModel={{ id: 'max' }} />);
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);
        setProps({ aggregationModel: { id: 'min' } });
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '0' /* Agg */]);
        setProps({ aggregationModel: {} });
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);
      });

      it('should ignore aggregation rule that do not match any column', () => {
        render(
          <Test
            initialState={{
              aggregation: { model: { id: 'max', idBis: 'max' } },
            }}
          />,
        );
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);
      });

      it('should ignore aggregation rule with colDef.aggregable = false', () => {
        render(
          <Test
            columns={[
              {
                field: 'id',
                type: 'number',
              },
              {
                field: 'idBis',
                type: 'number',
                valueGetter: (params) => params.row.id,
                aggregable: false,
              },
            ]}
            initialState={{
              aggregation: { model: { id: 'max', idBis: 'max' } },
            }}
          />,
        );
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);
        expect(getColumnValues(1)).to.deep.equal(['0', '1', '2', '3', '4', '5', '' /* Agg */]);
      });

      it('should ignore aggregation rules with invalid aggregation functions', () => {
        render(<Test initialState={{ aggregation: { model: { id: 'mux' } } }} />);
        expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);
      });

      it('should correctly restore the column when changing from aggregated to non-aggregated', () => {
        const { setProps } = render(<Test aggregationModel={{ id: 'max' }} />);
        expect(getColumnHeaderCell(0, 0).textContent).to.equal('idmax');
        setProps({ aggregationModel: {} });
        expect(getColumnHeaderCell(0, 0).textContent).to.equal('id');
      });
    });
  });

  describe('Row Grouping', () => {
    it('should aggregate on the grouping row and on the global footer', () => {
      render(
        <Test
          initialState={{
            rowGrouping: { model: ['category1'] },
            aggregation: { model: { id: 'max' } },
          }}
          defaultGroupingExpansionDepth={-1}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal([
        '4' /* Agg "Cat A" */,
        '0',
        '1',
        '2',
        '3',
        '4',
        '5' /* Agg "Cat B" */,
        '5',
        '5' /* Agg root */,
      ]);
    });

    describe('prop: getAggregationPosition', () => {
      it('should not aggregate groups if props.getAggregationPosition returns null', () => {
        render(
          <Test
            initialState={{
              rowGrouping: { model: ['category1'] },
              aggregation: { model: { id: 'max' } },
            }}
            defaultGroupingExpansionDepth={-1}
            getAggregationPosition={(group) => (group?.groupingKey === 'Cat A' ? 'inline' : null)}
          />,
        );
        expect(getColumnValues(1)).to.deep.equal([
          '4' /* Agg "Cat A" */,
          '0',
          '1',
          '2',
          '3',
          '4',
          '',
          '5',
        ]);
      });

      it('should react to props.getAggregationPosition update', () => {
        const { setProps } = render(
          <Test
            initialState={{
              rowGrouping: { model: ['category1'] },
              aggregation: { model: { id: 'max' } },
            }}
            defaultGroupingExpansionDepth={-1}
            // Only group "Cat A" aggregated inline
            getAggregationPosition={(group) => (group?.groupingKey === 'Cat A' ? 'inline' : null)}
          />,
        );
        expect(getColumnValues(1)).to.deep.equal([
          '4' /* Agg "Cat A" */,
          '0',
          '1',
          '2',
          '3',
          '4',
          '',
          '5',
        ]);

        // All groups aggregated inline except the root
        setProps({
          getAggregationPosition: (group: GridGroupNode) => (group.depth === -1 ? null : 'inline'),
        });
        expect(getColumnValues(1)).to.deep.equal([
          '4' /* Agg "Cat A" */,
          '0',
          '1',
          '2',
          '3',
          '4',
          '5' /* Agg "Cat B" */,
          '5',
        ]);

        // All groups aggregated in footer except the root
        setProps({
          getAggregationPosition: (group: GridGroupNode) => (group.depth === -1 ? null : 'footer'),
        });
        expect(getColumnValues(1)).to.deep.equal([
          '',
          '0',
          '1',
          '2',
          '3',
          '4',
          '4' /* Agg "Cat A" */,
          '',
          '5',
          '5' /* Agg "Cat B" */,
        ]);

        // All groups aggregated on footer
        setProps({ getAggregationPosition: () => 'footer' });
        expect(getColumnValues(1)).to.deep.equal([
          '',
          '0',
          '1',
          '2',
          '3',
          '4',
          '4' /* Agg "Cat A" */,
          '',
          '5',
          '5' /* Agg "Cat B" */,
          '5' /* Agg root */,
        ]);

        // 0 group aggregated
        setProps({ getAggregationPosition: () => null });
        expect(getColumnValues(1)).to.deep.equal(['', '0', '1', '2', '3', '4', '', '5']);
      });
    });
  });

  describe('Tree Data', () => {
    function TreeDataTest(props: Omit<DataGridPremiumProps, 'columns'>) {
      return (
        <Test
          treeData
          defaultGroupingExpansionDepth={-1}
          columns={[
            {
              field: 'value',
              headerName: 'Value',
              type: 'number',
            },
          ]}
          getTreeDataPath={(row) => row.hierarchy}
          getRowId={(row) => row.hierarchy.join('/')}
          groupingColDef={{ headerName: 'Files', width: 350 }}
          getAggregationPosition={(rowNode) => (rowNode != null ? 'inline' : null)}
          initialState={{
            aggregation: {
              model: {
                value: 'sum',
              },
            },
          }}
          {...props}
        />
      );
    }

    it('should use aggregated values instead of provided values on data groups', () => {
      render(
        <TreeDataTest
          rows={[
            {
              hierarchy: ['A'],
              value: 10,
            },
            {
              hierarchy: ['A', 'A'],
              value: 1,
            },
            {
              hierarchy: ['A', 'B'],
              value: 2,
            },
          ]}
        />,
      );

      expect(getColumnValues(1)).to.deep.equal(['3' /* Agg "A" */, '1', '2']);
    });

    it('should only aggregate based on leaves', () => {
      render(
        <TreeDataTest
          rows={[
            {
              hierarchy: ['A'],
              value: 2,
            },
            {
              hierarchy: ['A', 'A'],
              value: 2,
            },
            {
              hierarchy: ['A', 'A', 'A'],
              value: 1,
            },
            {
              hierarchy: ['A', 'A', 'B'],
              value: 1,
            },
          ]}
        />,
      );

      expect(getColumnValues(1)).to.deep.equal(['2' /* Agg "A" */, '2' /* Agg "A.A" */, '1', '1']);
    });
  });

  describe('Column Menu', () => {
    it('should render select on aggregable column', () => {
      render(<Test />);

      act(() => apiRef.current.showColumnMenu('id'));
      clock.runToLast();

      expect(screen.queryByLabelText('Aggregation')).not.to.equal(null);
    });

    it('should update the aggregation when changing "Aggregation" select value', () => {
      render(<Test />);

      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);

      act(() => apiRef.current.showColumnMenu('id'));
      clock.runToLast();
      userEvent.mousePress(screen.queryByLabelText('Aggregation'));
      userEvent.mousePress(
        within(
          screen.getByRole('listbox', {
            name: 'Aggregation',
          }),
        ).getByText('max'),
      );

      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);
    });
  });

  describe('prop: aggregatedRows', () => {
    it('should aggregate based on the filtered rows if props.aggregatedRows is not defined', () => {
      render(
        <Test
          initialState={{
            filter: {
              filterModel: { items: [{ field: 'id', operator: '<', value: 4 }] },
            },
            aggregation: { model: { id: 'max' } },
          }}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '3' /* Agg */]);
    });

    it('should aggregate based on the filtered rows if props.aggregatedRows = "filtered"', () => {
      render(
        <Test
          initialState={{
            filter: {
              filterModel: { items: [{ field: 'id', operator: '<', value: 4 }] },
            },
            aggregation: { model: { id: 'max' } },
          }}
          aggregationRowsScope="filtered"
        />,
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '3' /* Agg */]);
    });

    it('should aggregate based on all the rows if props.aggregatedRows = "all"', () => {
      render(
        <Test
          initialState={{
            filter: {
              filterModel: { items: [{ field: 'id', operator: '<', value: 4 }] },
            },
            aggregation: { model: { id: 'max' } },
          }}
          aggregationRowsScope="all"
        />,
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '5' /* Agg */]);
    });
  });

  describe('prop: aggregationFunctions', () => {
    it('should ignore aggregation rules not present in props.aggregationFunctions', () => {
      render(
        <Test
          initialState={{ aggregation: { model: { id: 'max' } } }}
          aggregationFunctions={{
            min: GRID_AGGREGATION_FUNCTIONS.min,
          }}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);
    });

    it('should react to props.aggregationFunctions update', () => {
      const { setProps } = render(
        <Test
          initialState={{ aggregation: { model: { id: 'max' } } }}
          aggregationFunctions={{
            min: GRID_AGGREGATION_FUNCTIONS.min,
          }}
        />,
      );

      // 'max' is not in props.aggregationFunctions
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);

      setProps({
        aggregationFunctions: {
          min: GRID_AGGREGATION_FUNCTIONS.min,
          max: GRID_AGGREGATION_FUNCTIONS.max,
        },
      });
      // 'max' is in props.aggregationFunctions
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);

      const customMax: GridAggregationFunction = {
        ...GRID_AGGREGATION_FUNCTIONS.max,
        apply: (params) => `Agg: ${GRID_AGGREGATION_FUNCTIONS.max.apply(params) as number}`,
      };
      setProps({ aggregationFunctions: { min: GRID_AGGREGATION_FUNCTIONS.min, max: customMax } });
      // 'max' is in props.aggregationFunctions but has changed
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', 'Agg: 5' /* Agg */]);
    });
  });

  describe('colDef: aggregable', () => {
    it('should not aggregate if colDef.aggregable = false', () => {
      render(
        <Test
          initialState={{ aggregation: { model: { id: 'max' } } }}
          columns={[
            {
              field: 'id',
              type: 'number',
              aggregable: false,
            },
          ]}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);
    });

    it('should not render column menu select if colDef.aggregable = false', () => {
      render(
        <Test
          initialState={{ aggregation: { model: { id: 'max' } } }}
          columns={[
            {
              field: 'id',
              type: 'number',
              aggregable: false,
            },
          ]}
        />,
      );

      act(() => apiRef.current.showColumnMenu('id'));
      clock.runToLast();

      expect(screen.queryAllByLabelText('Aggregation')).to.have.length(0);
    });
  });

  describe('colDef: availableAggregationFunctions', () => {
    it('should ignore aggregation rules not present in props.aggregationFunctions', () => {
      render(
        <Test
          initialState={{ aggregation: { model: { id: 'max' } } }}
          columns={[
            {
              field: 'id',
              type: 'number',
              availableAggregationFunctions: ['min'],
            },
          ]}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);
    });

    it('should react to colDef.availableAggregationFunctions update', () => {
      render(
        <Test
          initialState={{ aggregation: { model: { id: 'max' } } }}
          columns={[
            {
              field: 'id',
              type: 'number',
              availableAggregationFunctions: ['min'],
            },
          ]}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5']);

      act(() =>
        apiRef.current.updateColumns([
          { field: 'id', availableAggregationFunctions: ['min', 'max'] },
        ]),
      );
      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '5' /* Agg */]);
    });
  });

  describe('colDef: valueFormatter', () => {
    it('should use the column valueFormatter for aggregation function without custom valueFormatter', () => {
      const customAggregationFunction: GridAggregationFunction = {
        apply: () => 'Agg value',
      };

      render(
        <Test
          initialState={{ aggregation: { model: { id: 'custom' } } }}
          aggregationFunctions={{ custom: customAggregationFunction }}
          columns={[
            {
              field: 'id',
              type: 'number',
              valueFormatter: (params) => `- ${params.value}`,
            },
          ]}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal([
        '- 0',
        '- 1',
        '- 2',
        '- 3',
        '- 4',
        '- 5',
        '- Agg value' /* Agg */,
      ]);
    });

    it('should use the aggregation function valueFormatter if defined', () => {
      const customAggregationFunction: GridAggregationFunction = {
        apply: () => 'Agg value',
        valueFormatter: (params) => `+ ${params.value}`,
      };

      render(
        <Test
          initialState={{ aggregation: { model: { id: 'custom' } } }}
          aggregationFunctions={{ custom: customAggregationFunction }}
          columns={[
            {
              field: 'id',
              type: 'number',
              valueFormatter: (params) => `- ${params.value}`,
            },
          ]}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal([
        '- 0',
        '- 1',
        '- 2',
        '- 3',
        '- 4',
        '- 5',
        '+ Agg value' /* Agg */,
      ]);
    });
  });

  describe('colDef: renderCell', () => {
    it('should use the column renderCell', () => {
      const customAggregationFunction: GridAggregationFunction = {
        apply: () => 'Agg value',
      };

      render(
        <Test
          initialState={{ aggregation: { model: { id: 'custom' } } }}
          aggregationFunctions={{ custom: customAggregationFunction }}
          columns={[
            {
              field: 'id',
              type: 'number',
              renderCell: (params) => `- ${params.value}`,
            },
          ]}
        />,
      );
      expect(getColumnValues(0)).to.deep.equal([
        '- 0',
        '- 1',
        '- 2',
        '- 3',
        '- 4',
        '- 5',
        '- Agg value' /* Agg */,
      ]);
    });

    it('should pass aggregation meta with `hasCellUnit: true` if the aggregation function have no hasCellUnit property ', () => {
      const renderCell: SinonSpy<[GridRenderCellParams]> = spy((params) => `- ${params.value}`);

      const customAggregationFunction: GridAggregationFunction = {
        apply: () => 'Agg value',
      };

      render(
        <Test
          initialState={{ aggregation: { model: { id: 'custom' } } }}
          aggregationFunctions={{ custom: customAggregationFunction }}
          columns={[
            {
              field: 'id',
              type: 'number',
              renderCell,
            },
          ]}
        />,
      );

      const callForAggCell = renderCell
        .getCalls()
        .find((call) => call.firstArg.rowNode.type === 'pinnedRow');
      expect(callForAggCell!.firstArg.aggregation.hasCellUnit).to.equal(true);
    });

    it('should pass aggregation meta with `hasCellUnit: false` if the aggregation function have `hasCellUnit: false` ', () => {
      const renderCell: SinonSpy<[GridRenderCellParams]> = spy((params) => `- ${params.value}`);

      const customAggregationFunction: GridAggregationFunction = {
        apply: () => 'Agg value',
        hasCellUnit: false,
      };

      render(
        <Test
          initialState={{ aggregation: { model: { id: 'custom' } } }}
          aggregationFunctions={{ custom: customAggregationFunction }}
          columns={[
            {
              field: 'id',
              type: 'number',
              renderCell,
            },
          ]}
        />,
      );

      const callForAggCell = renderCell
        .getCalls()
        .find((call) => call.firstArg.rowNode.type === 'pinnedRow');
      expect(callForAggCell!.firstArg.aggregation.hasCellUnit).to.equal(false);
    });
  });

  describe('filter', () => {
    it('should not filter-out the aggregated cells', () => {
      render(
        <Test
          initialState={{
            aggregation: { model: { id: 'sum' } },
            filter: {
              filterModel: {
                items: [{ field: 'id', operator: '!=', value: 15 }],
              },
            },
          }}
        />,
      );

      expect(getColumnValues(0)).to.deep.equal(['0', '1', '2', '3', '4', '5', '15' /* Agg */]);
    });
  });

  describe('sorting', () => {
    it('should always render top level footer below the other rows', () => {
      render(
        <Test
          initialState={{
            aggregation: { model: { id: 'sum' } },
            sorting: {
              sortModel: [{ field: 'id', sort: 'desc' }],
            },
          }}
        />,
      );

      expect(getColumnValues(0)).to.deep.equal(['5', '4', '3', '2', '1', '0', '15' /* Agg */]);
    });

    it('should always render group footers below the other rows', () => {
      render(
        <Test
          initialState={{
            rowGrouping: { model: ['category1'] },
            aggregation: { model: { id: 'max' } },
            sorting: {
              sortModel: [{ field: 'id', sort: 'desc' }],
            },
          }}
          defaultGroupingExpansionDepth={-1}
          getAggregationPosition={(group) => (group.depth === -1 ? null : 'footer')}
        />,
      );
      expect(getColumnValues(1)).to.deep.equal([
        '',
        '4',
        '3',
        '2',
        '1',
        '0',
        '4' /* Agg "Cat A" */,
        '',
        '5',
        '5' /* Agg "Cat B" */,
      ]);
    });
  });
});
