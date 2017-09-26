const slice = [].slice;

export default function (target) {
  const args = slice.call(arguments, 1);
  let ret = target;
  for (let i = 0; i < args.length; i++) {
    if (ret == null) {
      return ret;
    }
    ret = ret[args[i]];
  }
  return ret;
}