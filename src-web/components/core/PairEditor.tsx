import classNames from 'classnames';
import classnames from 'classnames';
import React, { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { XYCoord } from 'react-dnd';
import { useDrag, useDrop } from 'react-dnd';
import { Helmet } from 'react-helmet-async';
import { v4 as uuid } from 'uuid';
import { DropMarker } from '../DropMarker';
import { Checkbox } from './Checkbox';
import type { GenericCompletionConfig } from './Editor/genericCompletion';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import type { InputProps } from './Input';
import { Input } from './Input';

export type PairEditorProps = {
  pairs: Pair[];
  onChange: (pairs: Pair[]) => void;
  className?: string;
  namePlaceholder?: string;
  valuePlaceholder?: string;
  nameAutocomplete?: GenericCompletionConfig;
  valueAutocomplete?: (name: string) => GenericCompletionConfig | undefined;
  nameValidate?: InputProps['validate'];
  valueValidate?: InputProps['validate'];
};

type Pair = {
  enabled?: boolean;
  name: string;
  value: string;
};

type PairContainer = {
  pair: Pair;
  id: string;
};

export const PairEditor = memo(function PairEditor({
  pairs: originalPairs,
  nameAutocomplete,
  valueAutocomplete,
  namePlaceholder,
  valuePlaceholder,
  nameValidate,
  valueValidate,
  className,
  onChange,
}: PairEditorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pairs, setPairs] = useState<PairContainer[]>(() => {
    // Remove empty headers on initial render
    const nonEmpty = originalPairs.filter((h) => !(h.name === '' && h.value === ''));
    const pairs = nonEmpty.map((pair) => newPairContainer(pair));
    return [...pairs, newPairContainer()];
  });

  const setPairsAndSave = useCallback(
    (fn: (pairs: PairContainer[]) => PairContainer[]) => {
      setPairs((oldPairs) => {
        const pairs = fn(oldPairs).map((p) => p.pair);
        onChange(pairs);
        return fn(oldPairs);
      });
    },
    [onChange],
  );

  const handleMove = useCallback<FormRowProps['onMove']>(
    (id, side) => {
      const dragIndex = pairs.findIndex((r) => r.id === id);
      setHoveredIndex(side === 'above' ? dragIndex : dragIndex + 1);
    },
    [pairs],
  );

  const handleEnd = useCallback<FormRowProps['onEnd']>(
    (id: string) => {
      if (hoveredIndex === null) return;
      setHoveredIndex(null);

      setPairsAndSave((pairs) => {
        const index = pairs.findIndex((p) => p.id === id);
        const pair = pairs[index];
        if (pair === undefined) return pairs;

        const newPairs = pairs.filter((p) => p.id !== id);
        if (hoveredIndex > index) newPairs.splice(hoveredIndex - 1, 0, pair);
        else newPairs.splice(hoveredIndex, 0, pair);
        return newPairs;
      });
    },
    [hoveredIndex],
  );

  const handleChange = useCallback(
    (pair: PairContainer) =>
      setPairsAndSave((pairs) => pairs.map((p) => (pair.id !== p.id ? p : pair))),
    [],
  );

  const handleDelete = useCallback(
    (pair: PairContainer) =>
      setPairsAndSave((oldPairs) => oldPairs.filter((p) => p.id !== pair.id)),
    [],
  );

  const handleFocus = useCallback(
    (pair: PairContainer) => {
      const isLast = pair.id === pairs[pairs.length - 1]?.id;
      if (isLast) {
        setPairs((pairs) => [...pairs, newPairContainer()]);
      }
    },
    [pairs],
  );

  // Ensure there's always at least one pair
  useEffect(() => {
    if (pairs.length === 0) {
      setPairs((pairs) => [...pairs, newPairContainer()]);
    }
  }, [pairs]);

  return (
    <div
      className={classnames(
        className,
        '@container',
        'pb-6 grid',
        // NOTE: Add padding to top so overflow doesn't hide drop marker
        'py-1',
      )}
    >
      {pairs.map((p, i) => {
        const isLast = i === pairs.length - 1;
        return (
          <Fragment key={p.id}>
            {hoveredIndex === i && <DropMarker />}
            <FormRow
              pairContainer={p}
              isLast={isLast}
              nameAutocomplete={nameAutocomplete}
              valueAutocomplete={valueAutocomplete}
              namePlaceholder={namePlaceholder}
              valuePlaceholder={valuePlaceholder}
              nameValidate={nameValidate}
              valueValidate={valueValidate}
              onChange={handleChange}
              onFocus={handleFocus}
              onDelete={isLast ? undefined : handleDelete}
              onEnd={handleEnd}
              onMove={handleMove}
            />
          </Fragment>
        );
      })}
    </div>
  );
});

enum ItemTypes {
  ROW = 'pair-row',
}

type FormRowProps = {
  pairContainer: PairContainer;
  onMove: (id: string, side: 'above' | 'below') => void;
  onEnd: (id: string) => void;
  onChange: (pair: PairContainer) => void;
  onDelete?: (pair: PairContainer) => void;
  onFocus?: (pair: PairContainer) => void;
  isLast?: boolean;
} & Pick<
  PairEditorProps,
  | 'nameAutocomplete'
  | 'valueAutocomplete'
  | 'namePlaceholder'
  | 'valuePlaceholder'
  | 'nameValidate'
  | 'valueValidate'
>;

const FormRow = memo(function FormRow({
  pairContainer,
  onChange,
  onDelete,
  onFocus,
  onMove,
  onEnd,
  isLast,
  nameAutocomplete,
  valueAutocomplete,
  namePlaceholder,
  valuePlaceholder,
  nameValidate,
  valueValidate,
}: FormRowProps) {
  const { id } = pairContainer;
  const ref = useRef<HTMLDivElement>(null);

  const handleChangeEnabled = useMemo(
    () => (enabled: boolean) => onChange({ id, pair: { ...pairContainer.pair, enabled } }),
    [onChange, pairContainer.pair.name, pairContainer.pair.value],
  );

  const handleChangeName = useMemo(
    () => (name: string) => onChange({ id, pair: { ...pairContainer.pair, name } }),
    [onChange, pairContainer.pair.value, pairContainer.pair.enabled],
  );

  const handleChangeValue = useMemo(
    () => (value: string) => onChange({ id, pair: { ...pairContainer.pair, value } }),
    [onChange, pairContainer.pair.name, pairContainer.pair.enabled],
  );

  const handleFocus = useCallback(() => onFocus?.(pairContainer), [onFocus, pairContainer]);
  const handleDelete = useCallback(() => onDelete?.(pairContainer), [onDelete, pairContainer]);

  const [, connectDrop] = useDrop<PairContainer>(
    {
      accept: ItemTypes.ROW,
      hover: (item, monitor) => {
        if (!ref.current) return;
        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const clientOffset = monitor.getClientOffset();
        const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
        onMove(pairContainer.id, hoverClientY < hoverMiddleY ? 'above' : 'below');
      },
    },
    [onMove],
  );

  const [, connectDrag] = useDrag(
    {
      type: ItemTypes.ROW,
      item: () => pairContainer,
      collect: (m) => ({ isDragging: m.isDragging() }),
      end: () => onEnd(pairContainer.id),
    },
    [pairContainer, onEnd],
  );

  connectDrag(ref);
  connectDrop(ref);

  return (
    <div
      ref={ref}
      className={classnames(
        'pb-2 group grid grid-cols-[auto_auto_minmax(0,1fr)_auto]',
        'grid-rows-1 items-center',
        !pairContainer.pair.enabled && 'opacity-60',
      )}
    >
      {!isLast ? (
        <div
          className={classnames(
            'py-2 h-7 w-3 flex items-center',
            'justify-center opacity-0 hover:opacity-100',
          )}
        >
          <Icon icon="drag" className="pointer-events-none" />
        </div>
      ) : (
        <span className="w-3" />
      )}
      <Checkbox
        disabled={isLast}
        checked={isLast ? false : !!pairContainer.pair.enabled}
        className={classnames('mr-2', isLast && '!opacity-disabled')}
        onChange={handleChangeEnabled}
      />
      <div
        className={classNames(
          'grid items-center',
          '@xs:gap-2 @xs:!grid-rows-1 @xs:!grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
          'gap-0.5 grid-cols-1 grid-rows-2',
        )}
      >
        <Input
          hideLabel
          size="sm"
          require={!isLast && !!pairContainer.pair.enabled && !!pairContainer.pair.value}
          validate={nameValidate}
          useTemplating
          containerClassName={classnames(isLast && 'border-dashed')}
          defaultValue={pairContainer.pair.name}
          label="Name"
          name="name"
          onChange={handleChangeName}
          onFocus={handleFocus}
          placeholder={namePlaceholder ?? 'name'}
          autocomplete={nameAutocomplete}
        />
        <Input
          hideLabel
          size="sm"
          containerClassName={classnames(isLast && 'border-dashed')}
          validate={valueValidate}
          defaultValue={pairContainer.pair.value}
          label="Value"
          name="value"
          onChange={handleChangeValue}
          onFocus={handleFocus}
          placeholder={valuePlaceholder ?? 'value'}
          useTemplating
          autocomplete={valueAutocomplete?.(pairContainer.pair.name)}
        />
      </div>
      <IconButton
        aria-hidden={!onDelete}
        disabled={!onDelete}
        color="custom"
        icon={onDelete ? 'trash' : 'empty'}
        size="sm"
        title="Delete header"
        onClick={handleDelete}
        className="ml-0.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      />
    </div>
  );
});

const newPairContainer = (pair?: Pair): PairContainer => {
  return { pair: pair ?? { name: '', value: '', enabled: true }, id: uuid() };
};