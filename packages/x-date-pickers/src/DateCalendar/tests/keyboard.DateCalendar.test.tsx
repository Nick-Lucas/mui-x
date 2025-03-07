import * as React from 'react';
import { expect } from 'chai';
import { act, fireEvent, screen } from '@mui/monorepo/test/utils';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { adapterToUse, createPickerRenderer } from 'test/utils/pickers-utils';

describe('<DateCalendar /> keyboard interactions', () => {
  const { render, clock } = createPickerRenderer({ clock: 'fake' });

  describe('Calendar keyboard navigation', () => {
    it('can autofocus selected day on mount', () => {
      render(<DateCalendar defaultValue={adapterToUse.date(new Date(2020, 7, 13))} autoFocus />);

      expect(screen.getByRole('gridcell', { name: '13' })).toHaveFocus();
    });

    [
      { key: 'End', expectFocusedDay: '15' },
      { key: 'Home', expectFocusedDay: '9' },
      { key: 'ArrowLeft', expectFocusedDay: '12' },
      { key: 'ArrowUp', expectFocusedDay: '6' },
      { key: 'ArrowRight', expectFocusedDay: '14' },
      { key: 'ArrowDown', expectFocusedDay: '20' },
    ].forEach(({ key, expectFocusedDay }) => {
      it(key, () => {
        render(<DateCalendar defaultValue={adapterToUse.date(new Date(2020, 7, 13))} />);

        act(() => screen.getByText('13').focus());
        // Don't care about what's focused.
        // eslint-disable-next-line material-ui/disallow-active-element-as-key-event-target
        fireEvent.keyDown(document.activeElement!, { key });

        // Based on column header, screen reader should pronounce <Day Number> <Week Day>
        // But `toHaveAccessibleName` does not do the link between column header and cell value, so we only get <day number> in test
        expect(document.activeElement).toHaveAccessibleName(expectFocusedDay);
      });
    });

    it('should manage a sequence of keyboard interactions', () => {
      render(<DateCalendar defaultValue={adapterToUse.date(new Date(2020, 7, 13))} />);

      act(() => screen.getByText('13').focus());
      const interactions = [
        { key: 'End', expectFocusedDay: '15' },
        { key: 'ArrowLeft', expectFocusedDay: '14' },
        { key: 'ArrowUp', expectFocusedDay: '7' },
        { key: 'Home', expectFocusedDay: '2' },
        { key: 'ArrowDown', expectFocusedDay: '9' },
      ];
      interactions.forEach(({ key, expectFocusedDay }) => {
        // Don't care about what's focused.
        // eslint-disable-next-line material-ui/disallow-active-element-as-key-event-target
        fireEvent.keyDown(document.activeElement!, { key });

        // Based on column header, screen reader should pronounce <Day Number> <Week Day>
        // But `toHaveAccessibleName` does not do the link between column header and cell value, so we only get <day number> in test
        expect(document.activeElement).toHaveAccessibleName(expectFocusedDay);
      });
    });

    [
      // Switch between months
      { initialDay: 1, key: 'ArrowLeft', expectFocusedDay: '31' },
      { initialDay: 5, key: 'ArrowUp', expectFocusedDay: '29' },
      { initialDay: 31, key: 'ArrowRight', expectFocusedDay: '1' },
      { initialDay: 30, key: 'ArrowDown', expectFocusedDay: '6' },
      // Switch between weeks
      { initialDay: 10, key: 'ArrowLeft', expectFocusedDay: '9' },
      { initialDay: 9, key: 'ArrowRight', expectFocusedDay: '10' },
    ].forEach(({ initialDay, key, expectFocusedDay }) => {
      it(key, () => {
        render(<DateCalendar defaultValue={adapterToUse.date(new Date(2020, 7, initialDay))} />);

        act(() => screen.getByText(`${initialDay}`).focus());
        // Don't care about what's focused.
        // eslint-disable-next-line material-ui/disallow-active-element-as-key-event-target
        fireEvent.keyDown(document.activeElement!, { key });

        clock.runToLast();
        // Based on column header, screen reader should pronounce <Day Number> <Week Day>
        // But `toHaveAccessibleName` does not do the link between column header and cell value, so we only get <day number> in test
        expect(document.activeElement).toHaveAccessibleName(expectFocusedDay);
      });
    });

    describe('navigation with disabled dates', () => {
      const disabledDates = [
        adapterToUse.date(new Date(2020, 0, 10)),
        // month extremities
        adapterToUse.date(new Date(2019, 11, 31)),
        adapterToUse.date(new Date(2020, 0, 1)),
        adapterToUse.date(new Date(2020, 0, 2)),
        adapterToUse.date(new Date(2020, 0, 31)),
        adapterToUse.date(new Date(2020, 1, 1)),
      ];
      [
        { initialDay: 11, key: 'ArrowLeft', expectFocusedDay: '9' },
        { initialDay: 9, key: 'ArrowRight', expectFocusedDay: '11' },
        // Switch between months
        { initialDay: 3, key: 'ArrowLeft', expectFocusedDay: '30' },
        { initialDay: 30, key: 'ArrowRight', expectFocusedDay: '2' },
      ].forEach(({ initialDay, key, expectFocusedDay }) => {
        it(key, () => {
          render(
            <DateCalendar
              defaultValue={adapterToUse.date(new Date(2020, 0, initialDay))}
              shouldDisableDate={(date) =>
                disabledDates.some((disabled) => adapterToUse.isSameDay(date, disabled))
              }
            />,
          );

          act(() => screen.getByText(`${initialDay}`).focus());
          // Don't care about what's focused.
          // eslint-disable-next-line material-ui/disallow-active-element-as-key-event-target
          fireEvent.keyDown(document.activeElement!, { key });

          clock.runToLast();
          // Based on column header, screen reader should pronounce <Day Number> <Week Day>
          // But `toHaveAccessibleName` does not do the link between column header and cell value, so we only get <day number> in test
          expect(document.activeElement).toHaveAccessibleName(expectFocusedDay);
        });
      });
    });
  });
});
