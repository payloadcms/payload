/* eslint-disable no-use-before-define */
/* eslint-disable consistent-return */
import wrappy from 'wrappy';
import asap from 'asap';

type Reduce = (er: boolean, result: unknown) => void;
type Callback = (last: unknown, next: unknown) => void;

const ensureFutureTick = wrappy((cb: Callback) => {
  let sync = true;
  asap(() => {
    sync = false;
  });

  return function safe(...args: unknown[]) {
    if (sync) {
      asap(() => {
        cb.apply(this, args);
      });
    } else { cb.apply(this, args); }
  };
});

function some(list: unknown[], predicate: (item: unknown, reduce: Reduce) => void, cb: Callback): void {
  const array = slice(list);
  let index = 0;
  const { length } = array;
  const hecomes = ensureFutureTick(cb);


  const reduce: Reduce = (er, result) => {
    if (er) return hecomes(er, false);
    if (result) return hecomes(null, result);

    index += 1;
    map();
  };

  map();

  function map() {
    if (index >= length) return hecomes(null, false);

    predicate(array[index], reduce);
  }
}

function slice(args: unknown[]) {
  const l = args.length;
  const a = [];
  let i: number;
  for (i = 0; i < l; i += 1) a[i] = args[i];
  return a;
}

export default some;
