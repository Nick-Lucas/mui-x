import * as React from 'react';
import { expect } from 'chai';
import TextField from '@mui/material/TextField';
import { act, fireEvent, screen } from '@mui/monorepo/test/utils';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { adapterToUse, createPickerRenderer } from 'test/utils/pickers-utils';
import { DateView } from '../internals/models/views';

describe('<StaticDatePicker /> keyboard interactions', () => {
  const { render, clock } = createPickerRenderer({ clock: 'fake' });

  describe('Calendar keyboard navigation', () => {
    it('can autofocus selected day on mount', () => {
      render(
        <StaticDatePicker
          autoFocus
          displayStaticWrapperAs="desktop"
          value={adapterToUse.date(new Date(2020, 7, 13))}
          onChange={() => {}}
          renderInput={(params) => <TextField placeholder="10/10/2018" {...params} />}
        />,
      );

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
        render(
          <StaticDatePicker
            autoFocus
            displayStaticWrapperAs="desktop"
            value={adapterToUse.date(new Date(2020, 7, 13))}
            onChange={() => {}}
            renderInput={(params) => <TextField placeholder="10/10/2018" {...params} />}
          />,
        );

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
        render(
          <StaticDatePicker
            autoFocus
            displayStaticWrapperAs="desktop"
            value={adapterToUse.date(new Date(2020, 7, initialDay))}
            onChange={() => {}}
            renderInput={(params) => <TextField placeholder="10/10/2018" {...params} />}
          />,
        );

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

  it("doesn't allow to select disabled date from keyboard", async () => {
    render(
      <StaticDatePicker
        autoFocus
        displayStaticWrapperAs="desktop"
        value={adapterToUse.date(new Date(2020, 7, 13))}
        minDate={adapterToUse.date(new Date(2020, 7, 13))}
        onChange={() => {}}
        renderInput={(params) => <TextField {...params} />}
      />,
    );

    expect(document.activeElement).toHaveAccessibleName('13');

    for (let i = 0; i < 3; i += 1) {
      // Don't care about what's focused.
      // eslint-disable-next-line material-ui/disallow-active-element-as-key-event-target
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
    }

    // leaves focus on the same date
    expect(document.activeElement).toHaveAccessibleName('13');
  });

  describe('YearCalendar keyboard navigation', () => {
    [
      { key: 'ArrowLeft', expectFocusedYear: '2019' },
      { key: 'ArrowUp', expectFocusedYear: '2016' },
      { key: 'ArrowRight', expectFocusedYear: '2021' },
      { key: 'ArrowDown', expectFocusedYear: '2024' },
    ].forEach(({ key, expectFocusedYear }) => {
      it(key, () => {
        render(
          <StaticDatePicker
            openTo="year"
            reduceAnimations
            displayStaticWrapperAs="desktop"
            value={adapterToUse.date(new Date(2020, 7, 13))}
            onChange={() => {}}
            renderInput={(params) => <TextField {...params} />}
          />,
        );

        const year = screen.getByText('2020', { selector: 'button' });
        act(() => year.focus());
        fireEvent.keyDown(year, { key });

        expect(document.activeElement).to.have.text(expectFocusedYear);
      });
    });
  });
  describe('MonthCalendar keyboard navigation', () => {
    [
      { key: 'ArrowLeft', expectFocusedMonth: 'Jul' },
      { key: 'ArrowUp', expectFocusedMonth: 'May' },
      { key: 'ArrowRight', expectFocusedMonth: 'Sep' },
      { key: 'ArrowDown', expectFocusedMonth: 'Nov' },
    ].forEach(({ key, expectFocusedMonth }) => {
      it(key, () => {
        render(
          <StaticDatePicker
            openTo="month"
            views={['month']}
            reduceAnimations
            displayStaticWrapperAs="desktop"
            value={adapterToUse.date(new Date(2020, 7, 13))}
            onChange={() => {}}
            renderInput={(params) => <TextField {...params} />}
          />,
        );

        const aug = screen.getByText('Aug', { selector: 'button' });
        act(() => aug.focus());
        fireEvent.keyDown(aug, { key });

        expect(document.activeElement).to.have.text(expectFocusedMonth);
      });
    });
  });

  describe('DayCalendar keyboard navigation', () => {
    [
      { key: 'ArrowLeft', expectFocusedDay: '12' },
      { key: 'ArrowUp', expectFocusedDay: '6' },
      { key: 'ArrowRight', expectFocusedDay: '14' },
      { key: 'ArrowDown', expectFocusedDay: '20' },
    ].forEach(({ key, expectFocusedDay }) => {
      it(key, () => {
        render(
          <StaticDatePicker
            openTo="day"
            reduceAnimations
            displayStaticWrapperAs="desktop"
            value={adapterToUse.date(new Date(2020, 7, 13))}
            onChange={() => {}}
            renderInput={(params) => <TextField {...params} />}
          />,
        );

        const startDay = screen.getByText('13', { selector: 'button' });
        act(() => startDay.focus());
        fireEvent.keyDown(startDay, { key });

        expect(document.activeElement).to.have.text(expectFocusedDay);
      });
    });
  });

  const viewsToTest: { view: DateView; textSelector: string }[] = [
    { view: 'day', textSelector: '13' },
    { view: 'month', textSelector: 'Aug' },
    { view: 'year', textSelector: '2020' },
  ];
  viewsToTest.forEach(({ view, textSelector }) => {
    it(`should have one element with tabIndex=0 for view ${view}`, () => {
      render(
        <StaticDatePicker
          openTo={view}
          views={[view]}
          reduceAnimations
          displayStaticWrapperAs="desktop"
          value={adapterToUse.date(new Date(2020, 7, 13))}
          onChange={() => {}}
          renderInput={(params) => <TextField {...params} />}
        />,
      );

      const selectedButton = screen.getByText(textSelector, { selector: 'button' });
      expect(selectedButton).to.have.attribute('tabindex', '0');
    });
  });

  it(`should have one element with tabIndex=0 for day view even if not in current month`, () => {
    render(
      <StaticDatePicker
        openTo="day"
        reduceAnimations
        displayStaticWrapperAs="desktop"
        value={adapterToUse.date(new Date(2020, 7, 13))}
        onChange={() => {}}
        renderInput={(params) => <TextField {...params} />}
      />,
    );

    fireEvent.click(screen.getByTitle('Next month'));
    const day13 = screen.getByText('13', { selector: 'button' });
    const day1 = screen.getByText('1', { selector: 'button' });
    expect(day1).to.have.attribute('tabindex', '0');
    expect(day13).to.have.attribute('tabindex', '-1');
  });
});
