import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import Typography from '@mui/material/Typography';
import { SlotComponentProps } from '@mui/base';
import { useSlotProps } from '@mui/base/utils';
import { styled, useTheme, useThemeProps } from '@mui/material/styles';
import {
  unstable_composeClasses as composeClasses,
  unstable_useControlled as useControlled,
} from '@mui/utils';
import clsx from 'clsx';
import { PickersDay, PickersDayProps } from '../PickersDay/PickersDay';
import { useUtils, useNow, useLocaleText } from '../internals/hooks/useUtils';
import { PickerOnChangeFn } from '../internals/hooks/useViews';
import { DAY_SIZE, DAY_MARGIN } from '../internals/constants/dimensions';
import { PickerSelectionState } from '../internals/hooks/usePickerState';
import {
  PickersSlideTransition,
  SlideDirection,
  SlideTransitionProps,
} from './PickersSlideTransition';
import {
  BaseDateValidationProps,
  DayValidationProps,
  MonthValidationProps,
  YearValidationProps,
} from '../internals/hooks/validation/models';
import { useIsDateDisabled } from '../internals/hooks/validation/useDateValidation';
import { findClosestEnabledDate } from '../internals/utils/date-utils';
import { DayCalendarClasses, getDayCalendarUtilityClass } from './dayCalendarClasses';

export interface DayCalendarSlotsComponent<TDate> {
  /**
   * Custom component for day.
   * Check the [PickersDay](https://mui.com/x/api/date-pickers/pickers-day/) component.
   * @default PickersDay
   */
  Day?: React.ElementType<PickersDayProps<TDate>>;
}

export interface DayCalendarSlotsComponentsProps<TDate> {
  day?: SlotComponentProps<
    typeof PickersDay,
    {},
    DayCalendarProps<TDate> & { day: TDate; selected: boolean }
  >;
}

export interface ExportedDayCalendarProps<TDate>
  extends Pick<PickersDayProps<TDate>, 'disableHighlightToday' | 'showDaysOutsideCurrentMonth'> {
  /**
   * If `true` renders `LoadingComponent` in calendar instead of calendar view.
   * Can be used to preload information and show it in calendar.
   * @default false
   */
  loading?: boolean;
  /**
   * Component displaying when passed `loading` true.
   * @returns {React.ReactNode} The node to render when loading.
   * @default () => "..."
   */
  renderLoading?: () => React.ReactNode;
  /**
   * Formats the day of week displayed in the calendar header.
   * @param {string} day The day of week provided by the adapter's method `getWeekdays`.
   * @returns {string} The name to display.
   * @default (day) => day.charAt(0).toUpperCase()
   */
  dayOfWeekFormatter?: (day: string) => string;
  /**
   * If `true`, the week number will be display in the calendar.
   */
  displayWeekNumber?: boolean;
  /**
   * Calendar will show more weeks in order to match this value.
   * Put it to 6 for having fix number of week in Gregorian calendars
   * @default undefined
   */
  fixedWeekNumber?: number;
}

export interface DayCalendarProps<TDate>
  extends ExportedDayCalendarProps<TDate>,
    DayValidationProps<TDate>,
    MonthValidationProps<TDate>,
    YearValidationProps<TDate>,
    Required<BaseDateValidationProps<TDate>> {
  autoFocus?: boolean;
  className?: string;
  currentMonth: TDate;
  selectedDays: (TDate | null)[];
  onSelectedDaysChange: PickerOnChangeFn<TDate>;
  disabled?: boolean;
  focusedDay: TDate | null;
  isMonthSwitchingAnimating: boolean;
  onFocusedDayChange: (newFocusedDay: TDate) => void;
  onMonthSwitchingAnimationEnd: () => void;
  readOnly?: boolean;
  reduceAnimations: boolean;
  slideDirection: SlideDirection;
  TransitionProps?: Partial<SlideTransitionProps>;
  hasFocus?: boolean;
  onFocusedViewChange?: (newHasFocus: boolean) => void;
  gridLabelId?: string;
  classes?: Partial<DayCalendarClasses>;
  components?: DayCalendarSlotsComponent<TDate>;
  componentsProps?: DayCalendarSlotsComponentsProps<TDate>;
}

const useUtilityClasses = (ownerState: DayCalendarProps<any>) => {
  const { classes } = ownerState;
  const slots = {
    header: ['header'],
    weekDayLabel: ['weekDayLabel'],
    loadingContainer: ['loadingContainer'],
    slideTransition: ['slideTransition'],
    monthContainer: ['monthContainer'],
    weekContainer: ['weekContainer'],
    weekNumberLabel: ['weekNumberLabel'],
    weekNumber: ['weekNumber'],
  };

  return composeClasses(slots, getDayCalendarUtilityClass, classes);
};

const defaultDayOfWeekFormatter = (day: string) => day.charAt(0).toUpperCase();

const weeksContainerHeight = (DAY_SIZE + DAY_MARGIN * 2) * 6;

const PickersCalendarDayHeader = styled('div', {
  name: 'MuiDayCalendar',
  slot: 'Header',
  overridesResolver: (_, styles) => styles.header,
})({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const PickersCalendarWeekDayLabel = styled(Typography, {
  name: 'MuiDayCalendar',
  slot: 'WeekDayLabel',
  overridesResolver: (_, styles) => styles.weekDayLabel,
})(({ theme }) => ({
  width: 36,
  height: 40,
  margin: '0 2px',
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: (theme.vars || theme).palette.text.secondary,
}));

const PickersCalendarWeekNumberLabel = styled(Typography, {
  name: 'MuiDayPicker',
  slot: 'WeekNumberLabel',
  overridesResolver: (_, styles) => styles.weekNumberLabel,
})(({ theme }) => ({
  width: 36,
  height: 40,
  margin: '0 2px',
  textAlign: 'center',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  color: theme.palette.text.disabled,
}));

const PickersCalendarWeekNumber = styled(Typography, {
  name: 'MuiDayPicker',
  slot: 'WeekNumber',
  overridesResolver: (_, styles) => styles.weekNumber,
})(({ theme }) => ({
  ...theme.typography.caption,
  width: DAY_SIZE,
  height: DAY_SIZE,
  padding: 0,
  margin: `0 ${DAY_MARGIN}px`,
  color: theme.palette.text.disabled,
  fontSize: '0.75rem',
  alignItems: 'center',
  justifyContent: 'center',
  display: 'inline-flex',
}));

const PickersCalendarLoadingContainer = styled('div', {
  name: 'MuiDayCalendar',
  slot: 'LoadingContainer',
  overridesResolver: (_, styles) => styles.loadingContainer,
})({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: weeksContainerHeight,
});

const PickersCalendarSlideTransition = styled(PickersSlideTransition, {
  name: 'MuiDayCalendar',
  slot: 'SlideTransition',
  overridesResolver: (_, styles) => styles.slideTransition,
})({
  minHeight: weeksContainerHeight,
});

const PickersCalendarWeekContainer = styled('div', {
  name: 'MuiDayCalendar',
  slot: 'MonthContainer',
  overridesResolver: (_, styles) => styles.monthContainer,
})({ overflow: 'hidden' });

const PickersCalendarWeek = styled('div', {
  name: 'MuiDayCalendar',
  slot: 'WeekContainer',
  overridesResolver: (_, styles) => styles.weekContainer,
})({
  margin: `${DAY_MARGIN}px 0`,
  display: 'flex',
  justifyContent: 'center',
});

function WrappedDay<TDate extends unknown>({
  parentProps,
  day,
  focusableDay,
  selectedDays,
  onFocus,
  onBlur,
  onKeyDown,
  onDaySelect,
  isDateDisabled,
  currentMonthNumber,
  isViewFocused,
}: Pick<PickersDayProps<TDate>, 'onFocus' | 'onBlur' | 'onKeyDown' | 'onDaySelect'> & {
  parentProps: DayCalendarProps<TDate>;
  day: TDate;
  focusableDay: TDate | null;
  selectedDays: TDate[];
  isDateDisabled: (date: TDate | null) => boolean;
  currentMonthNumber: number;
  isViewFocused: boolean;
}) {
  const utils = useUtils<TDate>();
  const now = useNow<TDate>();

  const {
    disabled,
    disableHighlightToday,
    isMonthSwitchingAnimating,
    showDaysOutsideCurrentMonth,
    components,
    componentsProps,
  } = parentProps;

  const isFocusableDay = focusableDay !== null && utils.isSameDay(day, focusableDay);
  const isSelected = selectedDays.some((selectedDay) => utils.isSameDay(selectedDay, day));
  const isToday = utils.isSameDay(day, now);

  const Day = components?.Day ?? PickersDay;
  // We don't want to pass to ownerState down, to avoid re-rendering all the day whenever a prop changes.
  const { ownerState: dayOwnerState, ...dayProps } = useSlotProps({
    elementType: Day,
    externalSlotProps: componentsProps?.day,
    additionalProps: {
      disableHighlightToday,
      onKeyDown,
      onFocus,
      onBlur,
      onDaySelect,
      showDaysOutsideCurrentMonth,
      role: 'gridcell',
      isAnimating: isMonthSwitchingAnimating,
      // it is used in date range dragging logic by accessing `dataset.timestamp`
      'data-timestamp': utils.toJsDate(day).valueOf(),
    },
    ownerState: { ...parentProps, day, selected: isSelected },
  });

  const isDisabled = React.useMemo(
    () => disabled || isDateDisabled(day),
    [disabled, isDateDisabled, day],
  );

  return (
    <Day
      {...dayProps}
      day={day}
      disabled={isDisabled}
      autoFocus={isViewFocused && isFocusableDay}
      today={isToday}
      outsideCurrentMonth={utils.getMonth(day) !== currentMonthNumber}
      selected={isSelected}
      tabIndex={isFocusableDay ? 0 : -1}
      aria-selected={isSelected}
      aria-current={isToday ? 'date' : undefined}
    />
  );
}

/**
 * @ignore - do not document.
 */
export function DayCalendar<TDate>(inProps: DayCalendarProps<TDate>) {
  const now = useNow<TDate>();
  const utils = useUtils<TDate>();
  const props = useThemeProps({ props: inProps, name: 'MuiDayCalendar' });
  const classes = useUtilityClasses(props);
  const theme = useTheme();

  const {
    onFocusedDayChange,
    className,
    currentMonth,
    selectedDays,
    focusedDay,
    loading,
    onSelectedDaysChange,
    onMonthSwitchingAnimationEnd,
    readOnly,
    reduceAnimations,
    renderLoading = () => <span data-mui-test="loading-progress">...</span>,
    slideDirection,
    TransitionProps,
    disablePast,
    disableFuture,
    minDate,
    maxDate,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    dayOfWeekFormatter = defaultDayOfWeekFormatter,
    hasFocus,
    onFocusedViewChange,
    gridLabelId,
    displayWeekNumber,
    fixedWeekNumber,
    autoFocus,
  } = props;

  const isDateDisabled = useIsDateDisabled({
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
  });

  const localeText = useLocaleText<TDate>();

  const [internalHasFocus, setInternalHasFocus] = useControlled({
    name: 'DayCalendar',
    state: 'hasFocus',
    controlled: hasFocus,
    default: autoFocus ?? false,
  });

  const [internalFocusedDay, setInternalFocusedDay] = React.useState<TDate>(
    () => focusedDay || now,
  );

  const handleDaySelect = useEventCallback(
    (day: TDate, isFinish: PickerSelectionState = 'finish') => {
      if (readOnly) {
        return;
      }

      onSelectedDaysChange(day, isFinish);
    },
  );

  const focusDay = (day: TDate) => {
    if (!isDateDisabled(day)) {
      onFocusedDayChange(day);
      setInternalFocusedDay(day);

      onFocusedViewChange?.(true);
      setInternalHasFocus(true);
    }
  };

  const handleKeyDown = useEventCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, day: TDate) => {
      switch (event.key) {
        case 'ArrowUp':
          focusDay(utils.addDays(day, -7));
          event.preventDefault();
          break;
        case 'ArrowDown':
          focusDay(utils.addDays(day, 7));
          event.preventDefault();
          break;
        case 'ArrowLeft': {
          const newFocusedDayDefault = utils.addDays(day, theme.direction === 'ltr' ? -1 : 1);
          const nextAvailableMonth =
            theme.direction === 'ltr' ? utils.getPreviousMonth(day) : utils.getNextMonth(day);

          const closestDayToFocus = findClosestEnabledDate({
            utils,
            date: newFocusedDayDefault,
            minDate:
              theme.direction === 'ltr'
                ? utils.startOfMonth(nextAvailableMonth)
                : newFocusedDayDefault,
            maxDate:
              theme.direction === 'ltr'
                ? newFocusedDayDefault
                : utils.endOfMonth(nextAvailableMonth),
            isDateDisabled,
          });
          focusDay(closestDayToFocus || newFocusedDayDefault);
          event.preventDefault();
          break;
        }
        case 'ArrowRight': {
          const newFocusedDayDefault = utils.addDays(day, theme.direction === 'ltr' ? 1 : -1);
          const nextAvailableMonth =
            theme.direction === 'ltr' ? utils.getNextMonth(day) : utils.getPreviousMonth(day);

          const closestDayToFocus = findClosestEnabledDate({
            utils,
            date: newFocusedDayDefault,
            minDate:
              theme.direction === 'ltr'
                ? newFocusedDayDefault
                : utils.startOfMonth(nextAvailableMonth),
            maxDate:
              theme.direction === 'ltr'
                ? utils.endOfMonth(nextAvailableMonth)
                : newFocusedDayDefault,
            isDateDisabled,
          });
          focusDay(closestDayToFocus || newFocusedDayDefault);
          event.preventDefault();
          break;
        }
        case 'Home':
          focusDay(utils.startOfWeek(day));
          event.preventDefault();
          break;
        case 'End':
          focusDay(utils.endOfWeek(day));
          event.preventDefault();
          break;
        case 'PageUp':
          focusDay(utils.getNextMonth(day));
          event.preventDefault();
          break;
        case 'PageDown':
          focusDay(utils.getPreviousMonth(day));
          event.preventDefault();
          break;
        default:
          break;
      }
    },
  );

  const handleFocus = useEventCallback((event: React.FocusEvent<HTMLButtonElement>, day: TDate) =>
    focusDay(day),
  );
  const handleBlur = useEventCallback((event: React.FocusEvent<HTMLButtonElement>, day: TDate) => {
    if (internalHasFocus && utils.isSameDay(internalFocusedDay, day)) {
      onFocusedViewChange?.(false);
    }
  });

  const currentMonthNumber = utils.getMonth(currentMonth);
  const validSelectedDays = React.useMemo(
    () => selectedDays.filter((day): day is TDate => !!day).map((day) => utils.startOfDay(day)),
    [utils, selectedDays],
  );

  // need a new ref whenever the `key` of the transition changes: http://reactcommunity.org/react-transition-group/transition/#Transition-prop-nodeRef.
  const transitionKey = currentMonthNumber;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const slideNodeRef = React.useMemo(() => React.createRef<HTMLDivElement>(), [transitionKey]);
  const startOfCurrentWeek = utils.startOfWeek(now);

  const focusableDay = React.useMemo<TDate | null>(() => {
    const startOfMonth = utils.startOfMonth(currentMonth);
    const endOfMonth = utils.endOfMonth(currentMonth);
    if (
      isDateDisabled(internalFocusedDay) ||
      utils.isAfterDay(internalFocusedDay, endOfMonth) ||
      utils.isBeforeDay(internalFocusedDay, startOfMonth)
    ) {
      return findClosestEnabledDate({
        utils,
        date: internalFocusedDay,
        minDate: startOfMonth,
        maxDate: endOfMonth,
        disablePast,
        disableFuture,
        isDateDisabled,
      });
    }
    return internalFocusedDay;
  }, [currentMonth, disableFuture, disablePast, internalFocusedDay, isDateDisabled, utils]);

  const weeksToDisplay = React.useMemo(() => {
    const toDisplay = utils.getWeekArray(currentMonth);
    let nextMonth = utils.addMonths(currentMonth, 1);
    while (fixedWeekNumber && toDisplay.length < fixedWeekNumber) {
      const additionalWeeks = utils.getWeekArray(nextMonth);
      const hasCommonWeek = utils.isSameDay(
        toDisplay[toDisplay.length - 1][0],
        additionalWeeks[0][0],
      );

      additionalWeeks.slice(hasCommonWeek ? 1 : 0).forEach((week) => {
        if (toDisplay.length < fixedWeekNumber) {
          toDisplay.push(week);
        }
      });

      nextMonth = utils.addMonths(nextMonth, 1);
    }
    return toDisplay;
  }, [currentMonth, fixedWeekNumber, utils]);

  return (
    <div role="grid" aria-labelledby={gridLabelId}>
      <PickersCalendarDayHeader role="row" className={classes.header}>
        {displayWeekNumber && (
          <PickersCalendarWeekNumberLabel
            variant="caption"
            role="columnheader"
            aria-label={localeText.calendarWeekNumberHeaderLabel}
            className={classes.weekNumberLabel}
          >
            {localeText.calendarWeekNumberHeaderText}
          </PickersCalendarWeekNumberLabel>
        )}
        {utils.getWeekdays().map((day, i) => (
          <PickersCalendarWeekDayLabel
            key={day + i.toString()}
            variant="caption"
            role="columnheader"
            aria-label={utils.format(utils.addDays(startOfCurrentWeek, i), 'weekday')}
            className={classes.weekDayLabel}
          >
            {dayOfWeekFormatter?.(day) ?? day}
          </PickersCalendarWeekDayLabel>
        ))}
      </PickersCalendarDayHeader>

      {loading ? (
        <PickersCalendarLoadingContainer className={classes.loadingContainer}>
          {renderLoading()}
        </PickersCalendarLoadingContainer>
      ) : (
        <PickersCalendarSlideTransition
          transKey={transitionKey}
          onExited={onMonthSwitchingAnimationEnd}
          reduceAnimations={reduceAnimations}
          slideDirection={slideDirection}
          className={clsx(className, classes.slideTransition)}
          {...TransitionProps}
          nodeRef={slideNodeRef}
        >
          <PickersCalendarWeekContainer
            data-mui-test="pickers-calendar"
            ref={slideNodeRef}
            role="rowgroup"
            className={classes.monthContainer}
          >
            {weeksToDisplay.map((week) => (
              <PickersCalendarWeek
                role="row"
                key={`week-${week[0]}`}
                className={classes.weekContainer}
              >
                {displayWeekNumber && (
                  <PickersCalendarWeekNumber
                    className={classes.weekNumber}
                    role="rowheader"
                    aria-label={localeText.calendarWeekNumberAriaLabelText(
                      utils.getWeekNumber(week[0]),
                    )}
                  >
                    {localeText.calendarWeekNumberText(utils.getWeekNumber(week[0]))}
                  </PickersCalendarWeekNumber>
                )}
                {week.map((day) => (
                  <WrappedDay
                    key={(day as any).toString()}
                    parentProps={props}
                    day={day}
                    selectedDays={validSelectedDays}
                    focusableDay={focusableDay}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onDaySelect={handleDaySelect}
                    isDateDisabled={isDateDisabled}
                    currentMonthNumber={currentMonthNumber}
                    isViewFocused={internalHasFocus}
                  />
                ))}
              </PickersCalendarWeek>
            ))}
          </PickersCalendarWeekContainer>
        </PickersCalendarSlideTransition>
      )}
    </div>
  );
}
